import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatDelivery, type ChatSubmission } from '@/hooks/useChatDelivery';
import { useChatDraft } from '@/hooks/useChatDraft';
import type { Message } from '@/models/types';

function setup() {
  const scope = effectScope();
  const userId = ref<number | undefined>(99);
  const groupId = ref(1);
  const sendToSocket = vi.fn().mockReturnValue(false);
  const received: Message[] = [];
  const delivery = scope.run(() =>
    useChatDelivery({
      userId,
      groupId,
      sendToSocket,
      onMessage: (m) => received.push(m),
    }),
  )!;
  const draft = scope.run(() => useChatDraft(delivery))!;
  return { scope, userId, groupId, sendToSocket, received, delivery, draft };
}

function saved(uuid: string, content = 'Hello'): Message {
  return {
    id: 10,
    uuid,
    content,
    created_by: 99,
    message_group: 1,
    timestamp: 1,
    full_name: 'Volunteer',
    created_at: '2026-10-21T12:00:00Z',
    is_urgent: false,
    is_favorite: false,
    profile_picture_file: '',
    parent_message: null,
  };
}

describe('chat delivery and saved drafts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('uses the API when the socket is closed and clears only a confirmed draft', async () => {
    const state = setup();
    let resolve!: (value: { data: Message }) => void;
    const post = vi.spyOn(axios, 'post').mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    state.draft.content.value = 'Hello';
    const result = state.draft.send();
    expect(state.draft.content.value).toBe('Hello');
    expect(state.draft.isSending.value).toBe(true);
    const payload = post.mock.calls[0][1] as ChatSubmission;
    resolve({ data: saved(payload.uuid) });
    expect(await result).toBe(true);
    expect(state.draft.content.value).toBe('');
    expect(state.received).toHaveLength(1);
    state.scope.stop();
  });

  it('retries a lost acknowledgement over HTTP with the same UUID and deduplicates the receipt', async () => {
    const state = setup();
    state.sendToSocket.mockReturnValue(true);
    const post = vi
      .spyOn(axios, 'post')
      .mockImplementation(async (_url, data) => ({
        data: saved((data as ChatSubmission).uuid),
      }));
    state.draft.content.value = 'Hello';
    const result = state.draft.send();
    expect(post).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);
    expect(await result).toBe(true);
    expect((post.mock.calls[0][1] as ChatSubmission).uuid).toBe(
      state.sendToSocket.mock.calls[0][0].uuid,
    );
    state.delivery.receive(
      saved((post.mock.calls[0][1] as ChatSubmission).uuid),
    );
    expect(state.received).toHaveLength(1);
    state.scope.stop();
  });

  it('preserves a newer edit when the original message is confirmed', async () => {
    const state = setup();
    state.sendToSocket.mockReturnValue(true);
    state.draft.content.value = 'Hello';
    const result = state.draft.send();
    state.draft.content.value = 'Another message';
    state.delivery.receive(saved(state.sendToSocket.mock.calls[0][0].uuid));
    expect(await result).toBe(true);
    expect(state.draft.content.value).toBe('Another message');
    state.scope.stop();
  });

  it('retains a failed submission UUID across refresh and login while isolating other users', async () => {
    const post = vi
      .spyOn(axios, 'post')
      .mockRejectedValue(new Error('offline'));
    const original = setup();
    original.draft.content.value = 'Hello';
    expect(await original.draft.send()).toBe(false);
    const uuid = (post.mock.calls[0][1] as ChatSubmission).uuid;
    original.userId.value = undefined;
    expect(original.draft.content.value).toBe('');
    original.userId.value = 100;
    expect(original.draft.content.value).toBe('');
    original.scope.stop();
    const restored = setup();
    expect(restored.draft.content.value).toBe('Hello');
    post.mockImplementation(async (_url, data) => ({
      data: saved((data as ChatSubmission).uuid),
    }));
    expect(await restored.draft.send()).toBe(true);
    expect((post.mock.calls[1][1] as ChatSubmission).uuid).toBe(uuid);
    expect(restored.draft.content.value).toBe('');
    restored.scope.stop();
  });

  it('keeps reply drafts separate and retains them when delivery fails', async () => {
    const state = setup();
    const reply = state.scope.run(() => useChatDraft(state.delivery, ref(22)))!;
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('offline'));
    state.draft.content.value = 'New message';
    reply.content.value = 'Reply';
    expect(await reply.send()).toBe(false);
    expect(reply.content.value).toBe('Reply');
    expect(state.draft.content.value).toBe('New message');
    state.scope.stop();
    const restored = setup();
    const restoredReply = restored.scope.run(() =>
      useChatDraft(restored.delivery, ref(22)),
    )!;
    expect(restoredReply.content.value).toBe('Reply');
    expect(restored.draft.content.value).toBe('New message');
    restored.scope.stop();
  });

  it('ignores overlapping sends and clears a failed draft on a late acknowledgement', async () => {
    const state = setup();
    state.sendToSocket.mockReturnValue(true);
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('offline'));
    state.draft.content.value = 'Hello';
    const first = state.draft.send();
    expect(await state.draft.send()).toBe(false);
    expect(state.sendToSocket).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(await first).toBe(false);
    expect(state.draft.content.value).toBe('Hello');
    state.delivery.receive(saved(state.sendToSocket.mock.calls[0][0].uuid));
    expect(state.draft.content.value).toBe('');
    state.scope.stop();
  });

  it('bounds an API call that never settles and keeps the draft for retry', async () => {
    const state = setup();
    const post = vi
      .spyOn(axios, 'post')
      .mockImplementation(() => new Promise(() => {}));
    state.draft.content.value = 'Hello';
    const result = state.draft.send();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await result).toBe(false);
    expect(post.mock.calls[0][2]?.signal?.aborted).toBe(true);
    expect(state.draft.content.value).toBe('Hello');
    expect(state.draft.isSending.value).toBe(false);
    state.scope.stop();
  });

  it('aborts delivery when the user changes and ignores a late API response', async () => {
    const state = setup();
    let resolve!: (value: { data: Message }) => void;
    const post = vi.spyOn(axios, 'post').mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    state.draft.content.value = 'Hello';
    const result = state.draft.send();
    const uuid = (post.mock.calls[0][1] as ChatSubmission).uuid;
    state.userId.value = 100;
    state.draft.content.value = 'Other user draft';
    expect(await result).toBe(false);
    expect(post.mock.calls[0][2]?.signal?.aborted).toBe(true);
    resolve({ data: saved(uuid) });
    await Promise.resolve();
    expect(state.received).toHaveLength(0);
    expect(state.draft.content.value).toBe('Other user draft');
    state.userId.value = 99;
    expect(state.draft.content.value).toBe('Hello');
    state.scope.stop();
  });

  it('keeps a draft edited in another compose view when an earlier send is confirmed', async () => {
    const state = setup();
    const second = state.scope.run(() => useChatDraft(state.delivery))!;
    state.sendToSocket.mockReturnValue(true);
    state.draft.content.value = 'Hello';
    const result = state.draft.send();
    expect(second.content.value).toBe('Hello');
    second.content.value = 'Newer draft';
    state.delivery.receive(saved(state.sendToSocket.mock.calls[0][0].uuid));
    expect(await result).toBe(true);
    expect(state.draft.content.value).toBe('Newer draft');
    expect(second.content.value).toBe('Newer draft');
    state.scope.stop();
  });

  it('restores draft text but discards a malformed saved submission', async () => {
    localStorage.setItem(
      'ccu:chat-draft:v1:99:1:new',
      JSON.stringify({
        content: 'Hello',
        urgent: false,
        submission: { uuid: 'broken', content: 'Hello', is_urgent: false },
      }),
    );
    const state = setup();
    const post = vi
      .spyOn(axios, 'post')
      .mockImplementation(async (_url, data) => ({
        data: saved((data as ChatSubmission).uuid),
      }));
    expect(state.draft.content.value).toBe('Hello');
    expect(await state.draft.send()).toBe(true);
    expect((post.mock.calls[0][1] as ChatSubmission).uuid).toMatch(
      /^[\da-f]{8}-/i,
    );
    state.scope.stop();
  });

  it('clears a restored reply already present in fetched history before the reply editor mounts', async () => {
    const original = setup();
    const reply = original.scope.run(() =>
      useChatDraft(original.delivery, ref(22)),
    )!;
    const post = vi
      .spyOn(axios, 'post')
      .mockRejectedValue(new Error('lost response'));
    reply.content.value = 'Hello';
    expect(await reply.send()).toBe(false);
    const uuid = (post.mock.calls[0][1] as ChatSubmission).uuid;
    original.scope.stop();
    const restored = setup();
    restored.delivery.confirm({
      ...saved('parent'),
      id: 22,
      replies: [{ ...saved(uuid), parent_message: 22 }],
    });
    const restoredReply = restored.scope.run(() =>
      useChatDraft(restored.delivery, ref(22)),
    )!;
    expect(restoredReply.content.value).toBe('');
    restored.scope.stop();
  });
});
