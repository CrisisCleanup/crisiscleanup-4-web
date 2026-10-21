import axios from 'axios';
import type { Message } from '@/models/types';

export interface ChatSubmission {
  uuid: string;
  content: string;
  is_urgent: boolean;
  parent_message_id?: number;
}

interface ChatDeliveryOptions {
  userId: Readonly<Ref<number | undefined>>;
  groupId: Readonly<Ref<number | string>>;
  sendToSocket: (message: ChatSubmission) => boolean;
  onMessage: (message: Message) => void;
}

export const ChatDeliveryKey: InjectionKey<ReturnType<typeof useChatDelivery>> =
  Symbol('ChatDelivery');

export function useChatDelivery(options: ChatDeliveryOptions) {
  const waiting = new Map<string, (message: Message) => void>();
  const listeners = new Set<(message: Message) => void>();
  const confirmations = new Map<string, Message>();
  const receivedIds = new Set<number>();
  const receivedUuids = new Set<string>();
  const cancellations = new Set<() => void>();
  let disposed = false;

  function confirm(message: Message) {
    if (!message.id) return;
    if (message.uuid) {
      confirmations.set(message.uuid, message);
      waiting.get(message.uuid)?.(message);
    }
    for (const listener of listeners) listener(message);
    for (const reply of message.replies ?? []) confirm(reply);
  }

  function receive(message: Message) {
    if (!message.id) return;
    confirm(message);
    if (
      receivedIds.has(message.id) ||
      (message.uuid && receivedUuids.has(message.uuid))
    )
      return;
    receivedIds.add(message.id);
    if (message.uuid) receivedUuids.add(message.uuid);
    options.onMessage(message);
  }

  function onConfirmed(listener: (message: Message) => void) {
    listeners.add(listener);
    for (const message of confirmations.values()) listener(message);
    return () => listeners.delete(listener);
  }

  async function send(submission: ChatSubmission): Promise<Message> {
    const userId = options.userId.value;
    const groupId = options.groupId.value;
    if (!userId || disposed) throw new Error('Chat is not available.');
    let acknowledge!: (message: Message) => void;
    const confirmation = new Promise<Message>((resolve) => {
      acknowledge = resolve;
    });
    waiting.set(submission.uuid, acknowledge);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let requestTimer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    let cancel!: () => void;
    const interrupted = new Promise<never>((_resolve, reject) => {
      cancel = () => {
        controller.abort();
        reject(new Error('Chat delivery could not be confirmed.'));
      };
    });
    cancellations.add(cancel);
    const stopIdentityWatch = watch([options.userId, options.groupId], cancel, {
      flush: 'sync',
    });

    try {
      let sent = false;
      try {
        sent = options.sendToSocket(submission);
      } catch (error) {
        console.error('Chat socket send failed', error);
      }
      if (sent) {
        const deadline = new Promise<void>((resolve) => {
          timer = setTimeout(() => resolve(), 5000);
        });
        const message = await Promise.race([
          confirmation,
          deadline,
          interrupted,
        ]);
        if (message) return message;
      }
      if (
        disposed ||
        options.userId.value !== userId ||
        options.groupId.value !== groupId
      ) {
        throw new Error('Chat changed before delivery was confirmed.');
      }
      requestTimer = setTimeout(cancel, 15_000);
      const request = axios
        .post<Message>(
          `${import.meta.env.VITE_APP_API_BASE_URL}/chat_messages`,
          {
            uuid: submission.uuid,
            content: submission.content,
            is_urgent: submission.is_urgent,
            message_group: groupId,
            parent_message: submission.parent_message_id,
          },
          { timeout: 15_000, signal: controller.signal },
        )
        .then(({ data }) => {
          if (!data.id || data.uuid !== submission.uuid) {
            throw new Error('Chat delivery was not confirmed.');
          }
          if (
            !disposed &&
            !controller.signal.aborted &&
            options.userId.value === userId &&
            options.groupId.value === groupId
          )
            receive(data);
          return data;
        });
      return await Promise.race([request, confirmation, interrupted]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      if (requestTimer !== undefined) clearTimeout(requestTimer);
      controller.abort();
      stopIdentityWatch();
      waiting.delete(submission.uuid);
      cancellations.delete(cancel);
    }
  }

  onScopeDispose(() => {
    disposed = true;
    for (const cancel of cancellations) cancel();
    listeners.clear();
  });

  return {
    userId: options.userId,
    groupId: options.groupId,
    send,
    receive,
    confirm,
    onConfirmed,
  };
}
