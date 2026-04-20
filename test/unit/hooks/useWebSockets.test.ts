import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { effectScope, ref } from 'vue';
import type { useWebSockets as UseWebSocketsType } from '@/hooks/useWebSockets';

vi.mock('@/hooks/useAuth', () => ({
  useAuthStore: () => ({ currentAccessToken: ref('test-token') }),
}));

interface MockSocket {
  url: string;
  readyState: number;
  listeners: Record<string, Array<(e: any) => void>>;
  close: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  addEventListener: (event: string, cb: (e: any) => void) => void;
  dispatch: (event: string, payload?: any) => void;
}

const sockets: MockSocket[] = [];

function installWebSocketMock() {
  sockets.length = 0;
  const WebSocketMock = vi.fn((url: string) => {
    const s: MockSocket = {
      url,
      readyState: 0,
      listeners: {},
      close: vi.fn(() => {
        s.readyState = 3;
      }),
      send: vi.fn(),
      addEventListener(event, cb) {
        (s.listeners[event] ||= []).push(cb);
      },
      dispatch(event, payload) {
        for (const cb of s.listeners[event] ?? []) cb(payload);
      },
    };
    sockets.push(s);
    return s as unknown as WebSocket;
  });
  (WebSocketMock as any).CONNECTING = 0;
  (WebSocketMock as any).OPEN = 1;
  (WebSocketMock as any).CLOSING = 2;
  (WebSocketMock as any).CLOSED = 3;
  (globalThis as any).WebSocket = WebSocketMock;
}

describe('useWebSockets', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    installWebSocketMock();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('closes the socket and cancels pending reconnect on scope dispose', async () => {
    const { useWebSockets } = await import('@/hooks/useWebSockets');
    const scope = effectScope();
    scope.run(() => {
      useWebSockets('/ws/test', 'test', () => {});
    });

    expect(sockets).toHaveLength(1);
    // simulate abnormal close → schedules a reconnect
    sockets[0].dispatch('close', { code: 1006 });
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    scope.stop();

    expect(sockets[0].close).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not reconnect on non-recoverable close codes', async () => {
    const { useWebSockets } = await import('@/hooks/useWebSockets');
    const scope = effectScope();
    scope.run(() => {
      useWebSockets('/ws/test', 'test', () => {});
    });

    expect(sockets).toHaveLength(1);
    sockets[0].dispatch('close', { code: 1000 });

    vi.runAllTimers();
    expect(sockets).toHaveLength(1);
    scope.stop();
  });

  it('reconnects after an abnormal close with exponential backoff', async () => {
    const { useWebSockets } = await import('@/hooks/useWebSockets');
    const scope = effectScope();
    scope.run(() => {
      useWebSockets('/ws/test', 'test', () => {});
    });

    sockets[0].dispatch('close', { code: 1006 });
    // base delay is 1000ms with 0 jitter via mocked Math.random
    vi.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(2);

    sockets[1].dispatch('close', { code: 1006 });
    // second attempt: 2000ms
    vi.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(2);
    vi.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(3);

    scope.stop();
  });

  it('resets backoff attempts on successful open', async () => {
    const { useWebSockets } = await import('@/hooks/useWebSockets');
    const scope = effectScope();
    scope.run(() => {
      useWebSockets('/ws/test', 'test', () => {});
    });

    // fail, reconnect; fail again to advance backoff
    sockets[0].dispatch('close', { code: 1006 });
    vi.advanceTimersByTime(1000);
    sockets[1].dispatch('close', { code: 1006 });
    vi.advanceTimersByTime(2000);
    expect(sockets).toHaveLength(3);

    // now open successfully → attempt resets
    sockets[2].dispatch('open');
    sockets[2].dispatch('close', { code: 1006 });
    vi.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(4);

    scope.stop();
  });

  it('explicit close() stops reconnects and clears pending timer', async () => {
    const { useWebSockets } = await import('@/hooks/useWebSockets');
    const scope = effectScope();
    let handle!: ReturnType<typeof UseWebSocketsType>;
    scope.run(() => {
      handle = useWebSockets('/ws/test', 'test', () => {});
    });

    sockets[0].dispatch('close', { code: 1006 });
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    handle.close();
    expect(vi.getTimerCount()).toBe(0);

    vi.runAllTimers();
    expect(sockets).toHaveLength(1);

    scope.stop();
  });
});
