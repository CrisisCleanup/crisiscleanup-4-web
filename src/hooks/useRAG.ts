import createDebug from 'debug';
import { useWebSockets } from '@/hooks/useWebSockets';
import { createAxiosCasingTransform, generateUUID } from '@/utils/helpers';
import { useAxios } from '@vueuse/integrations/useAxios';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { getErrorMessage } from '@/utils/errors';

const debug = createDebug('@ccu:hooks:useRAG');

interface RAGEntry {
  messageId: string;
  actor: 'user' | 'aarongpt';
  content: string;
  collectionId: string;
  conversationId: string;
}

interface DocumentMetadata {
  [key: string]: string | number;
  source: string;
}

interface Document {
  pageContent: string;
  type: string;
  metadata: DocumentMetadata;
}

interface RAGUploadResponse {
  documents: Document[];
  documentIds: string[];
}

interface Conversation {
  collectionId: string;
  conversationId: string;
  messages: Message[];
  title: string;
}

interface Message {
  additionalKwargs: Record<string, unknown>;
  content: string;
  example: boolean;
  type: 'human' | 'ai';
}

interface ConversationsResponse {
  conversations: Conversation[];
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<T>;
}

interface Collection {
  cmetadata: null | Record<string, unknown>;
  name: string;
  uuid: string;
  files?: Array<Record<string, string | null>>;
}

interface CollectionResponse extends PaginatedResponse<Collection> {}

export type { Collection as RAGCollection, Document as RAGDocument };

export const useRAGUpload = (uploadCollectionId?: Ref<string | undefined>) => {
  const collectionId =
    uploadCollectionId ?? ref<string>(uploadCollectionId ?? '');
  const uploadedDocuments = ref<RAGUploadResponse[]>([]);

  const collectionState = useAxios<Collection>(
    `/rag_collections/${collectionId.value}`,
    createAxiosCasingTransform(),
    {
      immediate: Boolean(collectionId.value),
      resetOnExecute: false,
    },
  );
  whenever(
    () => collectionId.value,
    (newValue) =>
      collectionState
        .execute(`/rag_collections/${newValue}`)
        .catch(getErrorMessage),
  );

  const uploadState = useAxios<RAGUploadResponse>(
    `/rag_collections/${collectionId.value}/upload`,
    createAxiosCasingTransform({
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
    {
      immediate: false,
      resetOnExecute: true,
    },
  );

  const uploadFile = (fileData: Blob) => {
    if (!collectionId.value)
      return getErrorMessage(new Error('No collection ID provided'));
    const formData = new FormData();
    formData.append('file', fileData);
    return uploadState.execute(
      `/rag_collections/${collectionId.value}/upload`,
      {
        method: 'POST',
        data: formData,
      },
    );
  };

  whenever(
    () => uploadState.data.value,
    (data) => {
      if (!data) return;
      debug('pushing new uploaded document: %o', data);
      uploadedDocuments.value.push(data);
    },
  );

  return {
    uploadFile,
    isLoading: readonly(uploadState.isLoading),
    uploadedDocuments: readonly(uploadedDocuments),
    collectionDocuments: computed(() => collectionState.data.value?.files),
    isDocumentsLoading: readonly(collectionState.isLoading),
  };
};

export const useRAGConversations = (
  collectionId: Ref<string | undefined>,
  currentConversationId: Ref<string | undefined>,
) => {
  const conversationsState = useAxios<ConversationsResponse>(
    `/rag_collections/${collectionId.value}/conversations`,
    createAxiosCasingTransform(),
    { immediate: Boolean(collectionId.value), resetOnExecute: false },
  );

  whenever(collectionId, async (newValue, oldValue) => {
    if (newValue !== oldValue) {
      await conversationsState
        .execute(`/rag_collections/${newValue}/conversations`)
        .catch(getErrorMessage);
    }
  });

  whenever(currentConversationId, async (newValue) => {
    const hasConvo = Boolean(
      conversationsState.data.value?.conversations?.find?.(
        (convo) => convo.conversationId === newValue,
      ),
    );
    if (!hasConvo) {
      await conversationsState
        .execute(`/rag_collections/${collectionId.value}/conversations`)
        .catch(getErrorMessage);
    }
  });

  const currentConversation = computed(
    () =>
      currentConversationId.value &&
      conversationsState.data.value?.conversations?.find?.(
        (convo) => convo.conversationId === currentConversationId.value,
      ),
  );

  const currentConversationEntries = computed<RAGEntry[]>(() => {
    if (!currentConversation.value) return [];
    const { conversationId, collectionId, title, messages } =
      currentConversation.value;
    const msgId = generateUUID();
    return messages.map((message) => ({
      conversationId,
      collectionId,
      content: message.content,
      actor: message.type === 'human' ? 'user' : 'aarongpt',
      messageId: msgId,
    }));
  });

  return {
    currentConversationEntries,
    currentConversation,
    conversations: readonly(conversationsState.data),
    isLoading: readonly(conversationsState.isLoading),
  };
};

export const useRAGCollections = () => {
  const collectionsState = useAxios<CollectionResponse>(
    '/rag_collections',
    createAxiosCasingTransform(),
    { immediate: true, resetOnExecute: false },
  );

  const collections = computed(
    () => collectionsState.data.value?.results ?? [],
  );

  return {
    collectionsState,
    collections,
  };
};

export const useRAG = (
  collectionId: Ref<string>,
  conversationId: Ref<string>,
  conversationHistory?: Ref<RAGEntry[]>,
) => {
  const history = ref<RAGEntry[]>(conversationHistory?.value ?? []);
  const latestMessage = computed(() => history.value.at(-1));
  const latestMessageId = computed(() => latestMessage.value?.messageId);
  if (conversationHistory) {
    whenever(conversationHistory, (newValue) => {
      history.value = newValue ?? [];
    });
  }

  const socket = useWebSockets<{
    answer: string;
    message_id: string;
    collection_id: string;
    conversation_id: string;
  }>('/ws/rag', 'rag', (data) => {
    debug('Received data from websocket %o', data);
    const { answer, message_id, collection_id, conversation_id } = data;
    if (latestMessageId.value === message_id) {
      debug('appending latest message chunk: %s (%s)', message_id, answer);
      const newHistory = history.value.slice(0, -1);
      const newLatest = latestMessage.value!;
      newLatest.content += answer;
      history.value = [...newHistory, newLatest];
    } else {
      debug('pushing new message chunk: %s (%s)', message_id, answer);
      history.value.push({
        messageId: message_id,
        actor: 'aarongpt',
        content: answer,
        collectionId: collection_id,
        conversationId: conversation_id,
      });
    }
  });

  const submitQuestion = (value: string) => {
    if (!value) return;
    const convoId = conversationId.value ?? generateUUID();
    history.value.push({
      messageId: generateUUID(),
      actor: 'user',
      content: value,
      collectionId: collectionId.value,
      conversationId: convoId,
    });
    socket.send({
      question: value,
      collection_id: collectionId.value,
      conversation_id: convoId,
    });
  };

  return {
    submitQuestion,
    history: readonly(history),
  };
};
