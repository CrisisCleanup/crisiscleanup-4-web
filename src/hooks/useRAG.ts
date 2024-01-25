import createDebug from 'debug';
import { useWebSockets } from '@/hooks/useWebSockets';
import { createAxiosCasingTransform, generateUUID } from '@/utils/helpers';
import { useAxios } from '@vueuse/integrations/useAxios';
import type { InjectionKey, Ref } from 'vue';
import { ref } from 'vue';
import { getAndToastErrorMessage, getErrorMessage } from '@/utils/errors';
import { useToast } from 'vue-toastification';
import {
  injectLocal,
  provideLocal,
  tryOnScopeDispose,
  useTimeoutFn,
} from '@vueuse/core';
import type { ToastID } from 'vue-toastification/dist/types/types';
import type { CCUFileItem } from '@/models/types';
import type { CamelCasedProperties } from 'type-fest';
import axios from 'axios';
import moment from 'moment';

const debug = createDebug('@ccu:hooks:useRAG');

type RAGSocketMessageType = 'rag.conversation' | 'rag.document' | 'rag.error';

interface RAGSocketMessage<T> {
  type: RAGSocketMessageType;
  message: T;
}

interface BaseRAGSocketConversationMessageBody {
  collectionId: string;
  conversationId: string;
}

interface RAGSocketQuestionMessageBody
  extends BaseRAGSocketConversationMessageBody {
  question: string;
  fileIds?: number[];
}

interface RAGSocketAnswerMessageBody
  extends BaseRAGSocketConversationMessageBody {
  messageId: string;
  answer: string;
  status: 'pending' | 'in_progress' | 'error' | 'finish';
}

type RAGSocketConversationMessageBody =
  | RAGSocketQuestionMessageBody
  | RAGSocketAnswerMessageBody;

interface RAGSocketDocumentMessageBody {
  fileId: string;
  fileName: string;
  messageType: 'start' | 'update' | 'error' | 'end';
  message: string;
  timestamp: string;
}

interface RAGSocketConversationMessage
  extends RAGSocketMessage<RAGSocketConversationMessageBody> {
  type: 'rag.conversation';
}

interface RAGSocketDocumentMessage
  extends RAGSocketMessage<RAGSocketDocumentMessageBody> {
  type: 'rag.document';
}

interface RAGSocketErrorMessage extends RAGSocketMessage<string> {
  type: 'rag.error';
}

type AnyRAGSocketMessage =
  | RAGSocketDocumentMessage
  | RAGSocketConversationMessage;

type AnyRAGSocketMessageOrError = AnyRAGSocketMessage | RAGSocketErrorMessage;

interface RAGEntry {
  messageId: string;
  actor: 'user' | 'aarongpt';
  content: string;
  collectionId: string;
  conversationId: string;
  tools?: Record<string, ToolMessage[]>;
}

interface DocumentMetadata {
  [key: string]: string | number;
  source: string;
  filename: string;
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

interface ToolMessage {
  request: Record<string, unknown>;
  response: Message & { toolCallId: string };
  content: string;
  documents: Document[];
}

interface Message {
  additionalKwargs: Record<string, unknown>;
  content: string;
  example: boolean;
  type: 'human' | 'ai' | 'tool';
  tools?: Record<string, ToolMessage[]>;
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
  files?: Array<CamelCasedProperties<CCUFileItem>>;
}

interface CollectionResponse extends PaginatedResponse<Collection> {}

export type {
  Collection as RAGCollection,
  Document as RAGDocument,
  RAGEntry,
  ToolMessage as RAGToolMessage,
};

export const useRAGUpload = (uploadCollectionId?: Ref<string | undefined>) => {
  const collectionId =
    uploadCollectionId ?? ref<string>(uploadCollectionId ?? '');
  const uploadedDocuments = ref<RAGUploadResponse[]>([]);
  const toast = useToast();

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

  const uploader = axios.create(
    createAxiosCasingTransform({
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  );

  const uploadFile = (fileData: Blob) => {
    if (!collectionId.value) {
      const err = new Error('No collection ID provided');
      getAndToastErrorMessage(err);
      throw err;
    }
    const formData = new FormData();
    formData.append('file', fileData);
    debug('uploading file');
    return uploader
      .post(`/rag_collections/${collectionId.value}/upload`, formData)
      .then(() =>
        collectionState.execute(`/rag_collections/${collectionId.value}`),
      );
  };

  const deleteFile = (...fileId: number[]) => {
    return Promise.allSettled(
      fileId.map((id) =>
        uploader.delete(`/rag_collections/${collectionId.value}/upload`, {
          params: {
            file_id: id,
          },
        }),
      ),
    ).finally(() =>
      collectionState
        .execute(`/rag_collections/${collectionId.value}`)
        .catch(getErrorMessage),
    );
  };

  const activeToastIds = reactive<
    Record<ToastID, RAGSocketDocumentMessageBody>
  >({});

  const updateActivateToasts = (
    value?: Record<ToastID, RAGSocketDocumentMessageBody>,
  ) => {
    value ??= activeToastIds;
    console.log('updating activat toasts:', value);
    for (const [toastId, message] of Object.entries(value)) {
      handleDocumentMessage(message);
    }
  };

  watch(activeToastIds, (newValue) => updateActivateToasts(newValue));
  useTimeoutFn(updateActivateToasts, 500);

  function handleDocumentMessage(message: RAGSocketDocumentMessageBody) {
    debug('Received document message: %o', message);
    const toastId: ToastID = String(message.fileId);
    const timeAgo = moment(message.timestamp).fromNow();
    switch (message.messageType) {
      case 'start': {
        toast.info(
          `Starting document processing: ${message.fileName} (${timeAgo})`,
          {
            id: toastId,
            timeout: false,
          },
        );
        break;
      }
      case 'update': {
        toast.info(`${message.fileName}: ${message.message} (${timeAgo})`, {
          id: toastId,
          timeout: false,
        });
        break;
      }
      case 'error': {
        toast.error(`${message.fileName}: ${message.message}`, {
          id: toastId,
          timeout: false,
        });
        delete activeToastIds[toastId];
        break;
      }
      case 'end': {
        toast.success(`Document processing complete: ${message.fileName}`, {
          id: toastId,
          timeout: 10_000,
        });
        collectionState
          .execute(`/rag_collections/${collectionId.value}`)
          .then(() => debug('refetched collections'))
          .catch(getErrorMessage);
        delete activeToastIds[toastId];
        break;
      }
    }
  }

  const { message } = useRAGWebSocket();
  const documentMessage = computed(() =>
    message.value?.type === 'rag.document' ? message.value.message : undefined,
  );
  whenever(documentMessage, (newValue) => {
    const toastId = String(newValue.fileId);
    activeToastIds[toastId] = newValue;
  });

  return {
    deleteFile,
    uploadFile,
    uploadedDocuments: readonly(uploadedDocuments),
    collectionDocuments: computed(
      () => collectionState.data.value?.files?.sort?.((a, b) => b.id - a.id),
    ),
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

  const fetchConversations = async () => {
    return await conversationsState
      .execute(`/rag_collections/${collectionId.value}/conversations`)
      .catch(getErrorMessage);
  };

  whenever(currentConversationId, async (newValue) => {
    const hasConvo = Boolean(
      conversationsState.data.value?.conversations?.find?.(
        (convo) => convo.conversationId === newValue,
      ),
    );
    if (!hasConvo) {
      await fetchConversations();
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
      ...(message.tools ? { tools: message.tools } : {}),
    }));
  });

  return {
    currentConversationEntries,
    currentConversation,
    conversations: readonly(conversationsState.data),
    isLoading: readonly(conversationsState.isLoading),
    fetchConversations,
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

export const RAGWebSocketInjectKey: InjectionKey<{
  socket: ReturnType<typeof useWebSockets>;
  message: Readonly<Ref<AnyRAGSocketMessage | undefined>>;
}> = Symbol('RAGWebSocket');

/**
 * Provide new or inject existing rag websocket state.
 */
export const useRAGWebSocket = () => {
  let state = injectLocal(RAGWebSocketInjectKey);
  // probably should accept an error callback or something really
  const toast = useToast();
  if (!state) {
    const message = ref<AnyRAGSocketMessage | undefined>(undefined);
    const socket = useWebSockets<AnyRAGSocketMessageOrError>(
      '/ws/rag',
      'rag',
      (data) => {
        debug('Received data from websocket %o', data);
        if (data.type === 'rag.error') {
          const err = new Error(data.message);
          toast.error(getErrorMessage(err));
        } else {
          message.value = data;
        }
      },
    );
    state = {
      socket,
      message: readonly(message) as Readonly<
        Ref<AnyRAGSocketMessage | undefined>
      >,
    };
    provideLocal(RAGWebSocketInjectKey, state);
  }
  return state;
};

export const useRAG = (
  collectionId: Ref<string>,
  conversationId: Ref<string>,
  conversationHistory?: Ref<RAGEntry[]>,
) => {
  const history = ref<RAGEntry[]>(conversationHistory?.value ?? []);
  const latestMessage = computed(() => history.value.at(-1));
  const latestMessageId = computed(() => latestMessage.value?.messageId);
  const streamingMessage = ref<boolean>(false);
  if (conversationHistory) {
    whenever(conversationHistory, (newValue) => {
      history.value = newValue ?? [];
    });
  }

  function handleConversationMessage(data: RAGSocketConversationMessageBody) {
    if ('question' in data) {
      throw new Error('Unexpected question message received');
    }
    const {
      answer: content,
      messageId,
      collectionId,
      conversationId,
      status,
    } = data;
    let answer = content;
    if (latestMessageId.value === messageId) {
      streamingMessage.value = true;
      debug('appending latest message chunk: %s (%s)', messageId, answer);
      const newHistory = history.value.slice(0, -1);
      const newLatest = latestMessage.value!;

      if (status === 'finish') {
        streamingMessage.value = false;
      } else {
        if (status === 'error') {
          answer = `**Error:** _${answer}_`;
        }
        // update latest answer with new content.
        newLatest.content = answer;
        history.value = [...newHistory, newLatest];
      }
    } else {
      streamingMessage.value = true;
      debug('pushing new message chunk: %s (%s)', messageId, answer);
      history.value.push({
        messageId,
        collectionId,
        conversationId,
        actor: 'aarongpt',
        content: answer,
      });
    }
  }

  const { message, socket } = useRAGWebSocket();

  const conversationMessage = computed(() =>
    message.value?.type === 'rag.conversation'
      ? message.value.message
      : undefined,
  );
  whenever(conversationMessage, (newValue) =>
    handleConversationMessage(newValue),
  );

  const submitQuestion = (value: string, fileIds?: number[]) => {
    if (!value) return;
    const convoId = conversationId.value ?? generateUUID();
    history.value.push({
      messageId: generateUUID(),
      actor: 'user',
      content: value,
      collectionId: collectionId.value,
      conversationId: convoId,
    });
    const payload: RAGSocketConversationMessage = {
      type: 'rag.conversation',
      message: {
        question: value,
        collectionId: collectionId.value,
        conversationId: convoId,
        ...(fileIds && { fileIds }),
      },
    };
    socket.send(payload);
  };

  return {
    submitQuestion,
    history: readonly(history),
    latestMessage: latestMessage,
    isStreamingMessage: readonly(streamingMessage),
  };
};
