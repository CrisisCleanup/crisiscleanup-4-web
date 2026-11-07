import { effectScope, ref, nextTick } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useChatUnread } from '@/hooks/useChatUnread';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  socket: vi.fn(),
  updateStates: vi.fn(),
}));
vi.mock('axios', () => ({ default: { get: mocks.api } }));
vi.mock('@/hooks/useWebSockets', () => ({ useWebSockets: mocks.socket }));
vi.mock('@/hooks/useCurrentUser', () => ({
  default: () => ({
    currentUser: ref({ id: 42 }),
    userStates: ref({ chat_last_seen: '2026-11-01T00:00:00Z' }),
    updateUserStates: mocks.updateStates,
  }),
}));

describe('useChatUnread', () => {
  let scope: ReturnType<typeof effectScope>;
  const chatId = ref<number | undefined>(1);
  const isOpen = ref(false);
  const close = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    chatId.value = 1;
    isOpen.value = false;
    scope = effectScope();
    mocks.socket.mockReturnValue({ close });
    mocks.api.mockImplementation((_url, options) => ({
      data: { count: options.params.is_urgent ? 2 : 5 },
    }));
  });
  afterEach(() => {
    scope.stop();
    vi.useRealTimers();
  });

  it('fetches counts on connection and groups incoming bursts without polling', async () => {
    const counts = scope.run(() => useChatUnread(chatId, isOpen))!;
    const { 2: message, 3: connected } = mocks.socket.mock.calls[0];
    connected();
    await vi.advanceTimersByTimeAsync(300);
    expect(counts.unreadCount.value).toBe(5);
    expect(counts.urgentCount.value).toBe(2);
    expect(mocks.api).toHaveBeenCalledTimes(2);
    message({ created_by: 42 });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(mocks.api).toHaveBeenCalledTimes(2);
    for (let i = 0; i < 20; i++) message({ created_by: 7 });
    await vi.advanceTimersByTimeAsync(300);
    expect(mocks.api).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.api).toHaveBeenCalledTimes(4);
    connected();
    await vi.advanceTimersByTimeAsync(300);
    expect(mocks.api).toHaveBeenCalledTimes(6);
  });

  it('closes the background socket and clears counts while chat is open', async () => {
    const counts = scope.run(() => useChatUnread(chatId, isOpen))!;
    mocks.socket.mock.calls[0][3]();
    await vi.advanceTimersByTimeAsync(300);
    isOpen.value = true;
    await nextTick();
    expect(close).toHaveBeenCalledTimes(1);
    expect(counts.unreadCount.value).toBe(0);
    expect(counts.urgentCount.value).toBe(0);
    expect(mocks.socket).toHaveBeenCalledTimes(1);
    isOpen.value = false;
    await nextTick();
    expect(mocks.socket).toHaveBeenCalledTimes(2);
    mocks.socket.mock.calls[1][3]();
    await vi.advanceTimersByTimeAsync(300);
    expect(mocks.api.mock.calls[2][1].params.created_at__gte).toBe(
      mocks.updateStates.mock.calls.at(-1)![0].chat_last_seen,
    );
  });

  it('ignores a stale response after switching chats and aborts pending requests', async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    mocks.api.mockImplementation(async () => {
      await pending;
      return { data: { count: 99 } };
    });
    const counts = scope.run(() => useChatUnread(chatId, isOpen))!;
    mocks.socket.mock.calls[0][3]();
    await vi.advanceTimersByTimeAsync(300);
    chatId.value = 2;
    await nextTick();
    expect(mocks.api.mock.calls[0][1].signal.aborted).toBe(true);
    expect(close).toHaveBeenCalled();
    finish();
    await flushPromises();
    expect(counts.unreadCount.value).toBe(0);
    expect(mocks.socket.mock.calls[1][0]).toBe('/ws/chat/2');
  });

  it('does not connect without a chat and cancels queued refresh on unmount', async () => {
    chatId.value = undefined;
    scope.run(() => useChatUnread(chatId, isOpen));
    expect(mocks.socket).not.toHaveBeenCalled();
    chatId.value = 1;
    await nextTick();
    mocks.socket.mock.calls[0][3]();
    scope.stop();
    await vi.advanceTimersByTimeAsync(300);
    expect(mocks.api).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
