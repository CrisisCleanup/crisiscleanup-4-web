import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { effectScope } from 'vue';
import type { useWebSockets as UseWebSocketsType } from '@/hooks/useWebSockets';

const currentAccessToken = ref<string | undefined>('test-token');

vi.mock('@/hooks/useAuth', () => ({
  useAuthStore: () => ({ currentAccessToken }),
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
    vi.spyOn(console, 'error').mockImplementation(() => {});
    currentAccessToken.value = 'test-token';
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

  it.each([1008, 4401, 4403])(
    'does not retry a rejected connection (%s) with the same token',
    async (code) => {
      const { useWebSockets } = await import('@/hooks/useWebSockets');
      const scope = effectScope();
      scope.run(() => {
        useWebSockets('/ws/test', 'test', () => {});
      });

      expect(sockets).toHaveLength(1);
      sockets[0].dispatch('close', { code });

      vi.runAllTimers();
      expect(sockets).toHaveLength(1);
      scope.stop();
    },
  );

  it.each([1000, 1001])(
    'can send after the server closes with %s',
    async (code) => {
      const { useWebSockets } = await import('@/hooks/useWebSockets');
      const scope = effectScope();
      const handle = scope.run(() =>
        useWebSockets('/ws/test', 'test', () => {}),
      )!;

      sockets[0].readyState = WebSocket.CLOSED;
      sockets[0].dispatch('close', { code });
      vi.advanceTimersByTime(1000);

      expect(sockets).toHaveLength(2);
      sockets[1].readyState = WebSocket.OPEN;
      sockets[1].dispatch('open');
      expect(handle.send({ content: 'Recovered' })).toBe(true);
      expect(sockets[1].send).toHaveBeenCalledWith('{"content":"Recovered"}');
      scope.stop();
    },
  );

  it('recovers a rejected connection when the login token changes', async () => {
    const { useWebSockets } = await import('@/hooks/useWebSockets');
    const scope = effectScope();
    scope.run(() => useWebSockets('/ws/test', 'test', () => {}));
    sockets[0].readyState = WebSocket.CLOSED;
    sockets[0].dispatch('close', { code: 4401 });

    currentAccessToken.value = 'renewed-token';
    await nextTick();

    expect(sockets).toHaveLength(2);
    expect(sockets[1].url).toContain('bearer=renewed-token');
    scope.stop();
  });

  it('ignores late events from a socket replaced after token refresh', async () => {
    const { useWebSockets } = await import('@/hooks/useWebSockets');
    const scope = effectScope();
    const received: object[] = [];
    scope.run(() =>
      useWebSockets('/ws/test', 'test', (data) => {
        received.push(data);
      }),
    );
    sockets[0].dispatch('close', { code: 1006 });

    currentAccessToken.value = 'renewed-token';
    await nextTick();
    expect(sockets).toHaveLength(2);
    sockets[0].dispatch('close', { code: 1000 });
    sockets[0].dispatch('message', { data: '{"content":"old"}' });
    sockets[1].dispatch('message', { data: '{"content":"current"}' });
    vi.runAllTimers();

    expect(sockets).toHaveLength(2);
    expect(received).toEqual([{ content: 'current' }]);
    scope.stop();
  });

  it('waits for login and does not reconnect after explicit close', async () => {
    const { useWebSockets } = await import('@/hooks/useWebSockets');
    const scope = effectScope();
    const handle = scope.run(() =>
      useWebSockets('/ws/test', 'test', () => {}),
    )!;
    currentAccessToken.value = undefined;
    await nextTick();
    sockets[0].dispatch('close', { code: 1000 });
    vi.runAllTimers();
    expect(sockets).toHaveLength(1);

    currentAccessToken.value = 'signed-in-again';
    await nextTick();
    expect(sockets).toHaveLength(2);
    handle.close();
    currentAccessToken.value = 'another-token';
    await nextTick();
    expect(sockets).toHaveLength(2);
    scope.stop();
  });

  it('waits for a token when mounted during session renewal', async () => {
    const { useWebSockets } = await import('@/hooks/useWebSockets');
    currentAccessToken.value = undefined;
    const scope = effectScope();
    const handle = scope.run(() =>
      useWebSockets('/ws/test', 'test', () => {}),
    )!;
    expect(sockets).toHaveLength(0);
    expect(handle.send({ content: 'Waiting for login' })).toBe(false);

    currentAccessToken.value = 'renewed-token';
    await nextTick();
    expect(sockets).toHaveLength(1);
    sockets[0].readyState = WebSocket.OPEN;
    expect(handle.send({ content: 'Ready' })).toBe(true);
    scope.stop();
    expect(sockets[0].close).toHaveBeenCalledOnce();
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

  it('only sends when the socket is open', async () => {
    const { useWebSockets } = await import('@/hooks/useWebSockets');
    const scope = effectScope();
    let handle!: ReturnType<typeof UseWebSocketsType>;
    scope.run(() => {
      handle = useWebSockets('/ws/test', 'test', () => {});
    });

    expect(handle.send({ hello: 'world' })).toBe(false);
    expect(sockets[0].send).not.toHaveBeenCalled();

    sockets[0].readyState = (globalThis as any).WebSocket.OPEN;
    expect(handle.send({ hello: 'world' })).toBe(true);
    expect(sockets[0].send).toHaveBeenCalledWith('{"hello":"world"}');

    scope.stop();
  });
  it('reports a failed send when the connection closes during send', async () => {
    const { useWebSockets } = await import('@/hooks/useWebSockets');
    const scope = effectScope();
    const handle = scope.run(() =>
      useWebSockets('/ws/test', 'test', () => {}),
    )!;
    sockets[0].readyState = WebSocket.OPEN;
    sockets[0].send.mockImplementation(() => {
      throw new Error('Connection closed');
    });

    expect(handle.send({ content: 'Keep this draft' })).toBe(false);
    scope.stop();
  });
});
