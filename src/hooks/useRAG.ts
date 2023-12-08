import createDebug from 'debug';
import { useWebSockets } from '@/hooks/useWebSockets';
import { generateUUID, toCamelCase } from '@/utils/helpers';
import { useAxios } from '@vueuse/integrations/useAxios';
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import _ from 'lodash';

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

export const useRAGUpload = () => {
  const uploadedDocuments = ref<RAGUploadResponse[]>([]);

  const uploadState = useAxios<RAGUploadResponse>(
    '/rag_file_upload',
    {
      ...(<AxiosRequestConfig>axios.defaults),
      headers: {
        ...(<AxiosRequestConfig['headers']>axios.defaults.headers),
        'Content-Type': 'multipart/form-data',
      },
      baseURL: import.meta.env.VITE_APP_API_BASE_URL,
      transformResponse: [
        ..._.castArray(axios.defaults.transformResponse ?? []),
        (data: string | RAGUploadResponse) =>
          toCamelCase<string | RAGUploadResponse>(
            typeof data === 'string' ? JSON.parse(data) : <object>data,
          ),
      ],
    },
    {
      immediate: false,
      resetOnExecute: true,
    },
  );

  const uploadFile = (fileData: Blob) => {
    const formData = new FormData();
    formData.append('file', fileData);
    return uploadState.execute(undefined, {
      method: 'POST',
      data: formData,
    });
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
