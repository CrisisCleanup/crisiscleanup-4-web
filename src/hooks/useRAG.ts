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
  files: Array<Record<string, string | null>>;
}

interface CollectionResponse extends PaginatedResponse<Collection> {}

export const useRAGUpload = (uploadCollectionId?: Ref<string | undefined>) => {
  const collectionId =
    uploadCollectionId ?? ref<string>(uploadCollectionId ?? '');
  const uploadedDocuments = ref<RAGUploadResponse[]>([]);

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
    isLoading: uploadState.isLoading,
    uploadedDocuments: readonly(uploadedDocuments),
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

export const useRAG = () => {
  const history = ref<RAGEntry[]>([]);
  const latestMessage = computed(() => history.value.at(-1));
  const latestMessageId = computed(() => latestMessage.value?.messageId);

  const socket = useWebSockets<{ answer: string; message_id: string }>(
    '/ws/rag',
    'rag',
    (data) => {
      debug('Received data from websocket %o', data);
      const { answer, message_id } = data;
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
        });
      }
    },
  );

  const submitQuestion = (value: string) => {
    if (!value) return;
    history.value.push({
      messageId: generateUUID(),
      actor: 'user',
      content: value,
    });
    socket.send({
      question: value,
    });
  };

  return {
    submitQuestion,
    history: readonly(history),
  };
};
