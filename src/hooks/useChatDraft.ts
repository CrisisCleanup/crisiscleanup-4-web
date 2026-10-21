import { generateUUID } from '@/utils/helpers';
import type { ChatSubmission, useChatDelivery } from '@/hooks/useChatDelivery';

interface ChatDraft {
  content: string;
  urgent: boolean;
  submission?: ChatSubmission;
}

function readSubmission(
  value: unknown,
  parentId: number | undefined,
): ChatSubmission | undefined {
  if (
    !value ||
    typeof value !== 'object' ||
    !('uuid' in value) ||
    typeof value.uuid !== 'string' ||
    !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value.uuid) ||
    !('content' in value) ||
    typeof value.content !== 'string' ||
    !('is_urgent' in value) ||
    typeof value.is_urgent !== 'boolean'
  )
    return;
  const parent =
    'parent_message_id' in value ? value.parent_message_id : undefined;
  if (parent !== parentId) return;
  return {
    uuid: value.uuid,
    content: value.content,
    is_urgent: value.is_urgent,
    parent_message_id: parentId,
  };
}

export function useChatDraft(
  delivery: ReturnType<typeof useChatDelivery>,
  parentId: Readonly<Ref<number | undefined>> = ref(undefined),
) {
  const key = computed(() =>
    delivery.userId.value
      ? `ccu:chat-draft:v1:${delivery.userId.value}:${delivery.groupId.value}:${parentId.value ?? 'new'}`
      : undefined,
  );
  const draft = ref<ChatDraft>({ content: '', urgent: false });
  const isSending = ref(false);
  const error = ref(false);
  const storageError = ref(false);
  let loading = false;
  let disposed = false;
  const sender = {};

  function restore(storageKey: string | undefined) {
    loading = true;
    draft.value = { content: '', urgent: false };
    error.value = false;
    try {
      const stored = storageKey && localStorage.getItem(storageKey);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (
          parsed &&
          typeof parsed === 'object' &&
          'content' in parsed &&
          typeof parsed.content === 'string' &&
          'urgent' in parsed &&
          typeof parsed.urgent === 'boolean'
        ) {
          draft.value = {
            content: parsed.content,
            urgent: parsed.urgent,
            submission: readSubmission(
              'submission' in parsed ? parsed.submission : undefined,
              parentId.value,
            ),
          };
        }
      }
      storageError.value = false;
    } catch (error_) {
      storageError.value = true;
      console.error('Could not restore the chat draft', error_);
    } finally {
      loading = false;
    }
  }

  watch(key, restore, { immediate: true, flush: 'sync' });

  watch(
    draft,
    (value: ChatDraft) => {
      if (loading || !key.value) return;
      try {
        if (value.content || value.submission) {
          localStorage.setItem(key.value, JSON.stringify(value));
        } else {
          localStorage.removeItem(key.value);
        }
        storageError.value = false;
        window.dispatchEvent(
          new CustomEvent('ccu:chat-draft-change', {
            detail: { key: key.value, sender },
          }),
        );
      } catch (error_) {
        storageError.value = true;
        console.error('Could not save the chat draft', error_);
      }
    },
    { deep: true, flush: 'sync' },
  );

  function onStorage(event: StorageEvent) {
    if (event.key === key.value) restore(key.value);
  }
  function onDraftChange(event: Event) {
    const detail = (event as CustomEvent<{ key: string; sender: object }>)
      .detail;
    if (detail.key === key.value && detail.sender !== sender)
      restore(key.value);
  }
  window.addEventListener('storage', onStorage);
  window.addEventListener('ccu:chat-draft-change', onDraftChange);

  const stop = delivery.onConfirmed((message) => {
    const submission = draft.value.submission;
    if (
      !submission ||
      message.uuid !== submission.uuid ||
      message.created_by !== delivery.userId.value
    )
      return;
    draft.value =
      draft.value.content === submission.content &&
      draft.value.urgent === submission.is_urgent
        ? { content: '', urgent: false }
        : { ...draft.value, submission: undefined };
    error.value = false;
  });

  async function send(): Promise<boolean> {
    if (isSending.value || !draft.value.content || !key.value) return false;
    const storageKey = key.value;
    const previous = draft.value.submission;
    const submission: ChatSubmission =
      previous &&
      previous.content === draft.value.content &&
      previous.is_urgent === draft.value.urgent
        ? previous
        : {
            uuid: generateUUID(),
            content: draft.value.content,
            is_urgent: draft.value.urgent,
            parent_message_id: parentId.value,
          };
    draft.value.submission = submission;
    isSending.value = true;
    error.value = false;
    try {
      await delivery.send(submission);
      return !disposed && key.value === storageKey;
    } catch (error_) {
      if (!disposed && key.value === storageKey) error.value = true;
      console.error('Chat delivery failed', error_);
      return false;
    } finally {
      isSending.value = false;
    }
  }

  onScopeDispose(() => {
    disposed = true;
    stop();
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('ccu:chat-draft-change', onDraftChange);
  });

  return {
    content: computed({
      get: () => draft.value.content,
      set: (value: string) => {
        draft.value.content = value;
      },
    }),
    urgent: computed({
      get: () => draft.value.urgent,
      set: (value: boolean) => {
        draft.value.urgent = value;
      },
    }),
    isSending,
    error,
    storageError,
    send,
  };
}
