import createDebug from 'debug';
import { useWebSockets } from '@/hooks/useWebSockets';
import { createAxiosCasingTransform, generateUUID } from '@/utils/helpers';
import { useAxios } from '@vueuse/integrations/useAxios';
import type { FunctionalComponent, InjectionKey, Ref } from 'vue';
import { computed, ref } from 'vue';
import { getAndToastErrorMessage, getErrorMessage } from '@/utils/errors';
import { TYPE as ToastType, useToast } from 'vue-toastification';
import { injectLocal, provideLocal, useIntervalFn } from '@vueuse/core';
import type {
  ToastContent,
  ToastID,
} from 'vue-toastification/dist/types/types';
import type { CCUFileItem } from '@/models/types';
import type { CamelCasedProperties } from 'type-fest';
import axios from 'axios';
import moment from 'moment';
import defu from 'defu';

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

interface RAGSocketDocumentCallbackMessageBody {
  fileId: string;
  fileName: string;
  messageType: 'start' | 'update' | 'error' | 'end';
  message: string;
  timestamp: string;
  startTimestamp: string;
}

interface BaseRAGSocketDocumentActionMessageBody {
  action: 'callback' | 'cancel';
}

interface RAGSocketDocumentCancelActionMessageBody
  extends BaseRAGSocketDocumentActionMessageBody {
  action: 'cancel';
  fileId: string;
}

interface RAGSocketDocumentCallbackActionMessageBody
  extends RAGSocketDocumentCallbackMessageBody {
  action: 'callback';
}

type RAGSocketDocumentActionMessageBody =
  | RAGSocketDocumentCancelActionMessageBody
  | RAGSocketDocumentCallbackActionMessageBody;

type RAGSocketDocumentMessageBody =
  | RAGSocketDocumentCallbackMessageBody
  | RAGSocketDocumentActionMessageBody;

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
  actor: 'user' | 'aarongpt' | string;
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
  createdAt: string;
  updatedAt: string;
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

interface CCUDocumentFileItemAttr {
  [key: string]: string;
  virtualPath: string;
}

interface CCUDocumentFileItem extends CamelCasedProperties<CCUFileItem> {
  attr: null | CCUDocumentFileItemAttr;
}

interface DocumentFileBranch {
  name: string;
  branches: DocumentFileBranch[];
  files: CCUDocumentFileItem[];
}

interface Collection {
  cmetadata: null | Record<string, unknown>;
  name: string;
  uuid: string;
  files?: Array<CCUDocumentFileItem>;
}

type CollectionResponse = PaginatedResponse<Collection>;

interface UseRAGOptions {
  aiActorName: string;
  userActorName: string;
  showToolMessages: boolean;
}

export type {
  Collection as RAGCollection,
  Document as RAGDocument,
  RAGEntry,
  ToolMessage as RAGToolMessage,
  CCUDocumentFileItem,
  DocumentFileBranch as RAGDocumentsFileBranch,
  UseRAGOptions,
};

const RAGToastMessage: FunctionalComponent<{
  title: string;
  content: string;
  timestamp: string;
  startTimestamp: string;
}> = (props, context) => {
  const timestamp = computed(() => moment(props.timestamp));
  const startTimestamp = computed(() => moment(props.startTimestamp));

  const getElapsedMinutes = () =>
    moment().diff(startTimestamp.value, 'minutes');
  const getElapsedSeconds = () =>
    moment().diff(startTimestamp.value, 'seconds') % 60;
  const getLastUpdate = () => timestamp.value.fromNow();

  const elapsed = reactive({
    minutes: getElapsedMinutes(),
    seconds: getElapsedSeconds(),
    lastUpdate: getLastUpdate(),
  });

  useIntervalFn(
    () => {
      elapsed.minutes = getElapsedMinutes();
      elapsed.seconds = getElapsedSeconds();
      elapsed.lastUpdate = getLastUpdate();
    },
    1000,
    { immediate: true, immediateCallback: true },
  );

  return (
    <div class={'flex flex-col'}>
      <div>
        <base-text class={'text-white'} variant={'h1'} bold>
          {props.title}
        </base-text>
        <base-text variant={'h3'} className={'text-white pb-1'} semiBold>
          {props.content}
        </base-text>
      </div>
      <div class={'pt-1'}>
        <base-text class={'text-crisiscleanup-smoke'} variant={'bodysm'}>
          <span class={'font-bold'}>Updated: </span>
          {timestamp.value.format('h:mm:ssa')}
          <i>{` (${elapsed.lastUpdate})`}</i>
        </base-text>
        <base-text class={'text-crisiscleanup-smoke'} variant={'bodysm'}>
          <span class={'font-bold'}>Elapsed: </span>
          {elapsed.minutes}m {elapsed.seconds}s
        </base-text>
      </div>
      <div class={'pt-1'}>
        <base-button
          icon={'cancel'}
          icon-size={'sm'}
          text={'Cancel'}
          action={() => context.emit('cancel')}
          variant={'text'}
          class={'float-right'}
        />
      </div>
    </div>
  );
};

RAGToastMessage.props = {
  title: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
  startTimestamp: { type: String, required: true },
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

  const client = axios.create(createAxiosCasingTransform());

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

  const updateFile = async (
    documentFile: CCUDocumentFileItem,
    attr: Partial<CCUDocumentFileItemAttr>,
  ) => {
    const newAttr = defu(attr, documentFile.attr);
    const result = await client
      .patch(`/files/${documentFile.id}`, { attr: newAttr })
      .catch(getAndToastErrorMessage);
    debug('updated file: %o', { newAttrs: newAttr, result: result });
  };

  const activeToastIds = reactive<
    Record<ToastID, RAGSocketDocumentCallbackMessageBody>
  >({});

  function handleDocumentMessage(
    message: RAGSocketDocumentCallbackMessageBody,
    toastId: ToastID,
  ) {
    debug('Received document message: %o', message);
    let content: string = message.message;
    const timeout: boolean | number = false;
    let toastType = ToastType.INFO;
    switch (message.messageType) {
      case 'start': {
        content = `Starting document processing`;
        break;
      }
      case 'update': {
        break;
      }
      case 'error': {
        toastType = ToastType.ERROR;
        delete activeToastIds[toastId];
        break;
      }
      case 'end': {
        toastType = ToastType.SUCCESS;
        content = `Finished: ${message.message}`;
        collectionState
          .execute(`/rag_collections/${collectionId.value}`)
          .then(() => debug('refetched collections'))
          .catch(getErrorMessage)
          .finally(() => {
            delete activeToastIds[toastId];
          });
        break;
      }
    }

    const toastContent: ToastContent = {
      id: toastId,
      component: RAGToastMessage,
      type: toastType,
      timeout: timeout,
      props: {
        title: message.fileName,
        content,
        timestamp: message.timestamp,
        startTimestamp: message.startTimestamp,
      },
      listeners: {
        cancel: () => cancelUpload(message.fileId),
        'close-toast': () => delete activeToastIds[toastId],
      },
    };

    debug('toast content: %o', toastContent);

    toast(toastContent, {
      timeout,
      type: toastType,
      id: toastId,
      closeOnClick: false,
      draggable: false,
    });

    activeToastIds[toastId] = message;
  }

  const { message, socket } = useRAGWebSocket();

  const cancelUpload = async (fileId: string) => {
    const message: RAGSocketMessage<RAGSocketDocumentCancelActionMessageBody> =
      {
        type: 'rag.document',
        message: {
          action: 'cancel',
          fileId,
        },
      };
    debug('cancelling upload: %o', message);
    socket.send(message);
  };

  const documentMessage = computed(() =>
    message.value?.type === 'rag.document' ? message.value.message : undefined,
  );
  whenever(documentMessage, (newValue) => {
    handleDocumentMessage(newValue, newValue.fileId);
  });

  const collectionDocuments = computed(() =>
    collectionState.data.value?.files?.sort?.((a, b) =>
      a.filenameOriginal.localeCompare(b.filenameOriginal),
    ),
  );

  const documentsTree = computed(() => {
    const branches: DocumentFileBranch[] = [];

    for (const file of collectionDocuments.value ?? []) {
      const path = file.attr?.virtualPath ?? '';
      const pathParts = path.split('/');
      let currentBranch = branches;
      let currentPath: string[] = [];
      for (const dir of pathParts) {
        currentPath = [...currentPath, dir];
        const docsAtPath = (collectionDocuments.value ?? []).filter(
          (doc) => (doc.attr?.virtualPath ?? '') === currentPath.join('/'),
        );
        const existing = currentBranch.find((b) => b.name === dir);
        if (existing) {
          currentBranch = existing.branches;
          existing.files = docsAtPath;
        } else {
          const newBranch: DocumentFileBranch = {
            name: dir,
            branches: [],
            files: [],
          };
          currentBranch.push(newBranch);
          currentBranch = newBranch.branches;
          newBranch.files = docsAtPath;
        }
      }
    }
    return branches.sort((a, b) => a.name.localeCompare(b.name));
  });

  return {
    deleteFile,
    uploadFile,
    updateFile,
    cancelUpload,
    uploadedDocuments: readonly(uploadedDocuments),
    collectionDocuments,
    isDocumentsLoading: readonly(collectionState.isLoading),
    documentsTree,
  };
};

export const useRAGConversations = (
  collectionId: Ref<string | undefined>,
  currentConversationId: Ref<string | undefined>,
  options: Partial<UseRAGOptions>,
) => {
  const client = axios.create(createAxiosCasingTransform());
  const conversationsState = useAxios<ConversationsResponse>(
    `/rag_collections/${collectionId.value}/conversations`,
    client,
    { immediate: Boolean(collectionId.value), resetOnExecute: false },
  );
  options = defu(options, {
    aiActorName: 'aarongpt',
    userActorName: 'user',
    showToolMessages: true,
  });

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

  const deleteConversation = async (conversationId: string) => {
    try {
      await client.delete(
        `/rag_collections/${collectionId.value}/conversations`,
        {
          params: { conversation_id: conversationId },
        },
      );
    } catch (error) {
      debug('Error deleting conversation: %o', error);
      return getErrorMessage(error);
    }
    await fetchConversations();
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
      actor:
        message.type === 'human'
          ? (options.userActorName ?? 'user')
          : (options.aiActorName ?? 'aarongpt'),
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
    deleteConversation,
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
  options?: UseRAGOptions,
) => {
  const history = ref<RAGEntry[]>(conversationHistory?.value ?? []);
  const latestMessage = computed(() => history.value.at(-1));
  const latestMessageId = computed(() => latestMessage.value?.messageId);
  const streamingMessage = ref<boolean>(false);
  options = defu(options, {
    aiActorName: 'aarongpt',
    userActorName: 'user',
    showToolMessages: true,
  });
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
    const isTool = answer
      .replaceAll('\n', '')
      .toLowerCase()
      .startsWith('invoking:');
    if (latestMessageId.value === messageId) {
      if (isTool && !(options.showToolMessages ?? true)) {
        debug('Skipping tool message: %s', answer);
        return;
      }
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
        actor: options.aiActorName ?? 'aarongpt',
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
