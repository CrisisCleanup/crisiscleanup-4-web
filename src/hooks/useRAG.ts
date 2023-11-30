import createDebug from 'debug';
import { useAxios } from '@vueuse/integrations/useAxios';

const debug = createDebug('@ccu:hooks:useRAG');

interface RAGEntry {
  actor: 'user' | 'assistant';
  content: string;
}

export const useRAG = () => {
  const history = ref<RAGEntry[]>([]);

  const ragState = useAxios<RAGQuery>(
    '/rag_basic_faq',
    {
      method: 'POST',
      baseURL: import.meta.env.VITE_APP_API_BASE_URL,
    },
    {
      immediate: false,
      resetOnExecute: true,
    },
  );

  const submitQuestion = (value: string) => {
    if (!value) return;
    history.value.push({
      actor: 'user',
      content: value,
    });
    return ragState.execute(undefined, {
      data: {
        question: value,
      },
    });
  };

  whenever(ragState.data, (newValue) => {
    if (!newValue) return;
    debug('Pushing new value to history %o', newValue);
    history.value.push({
      actor: 'assistant',
      content: newValue.answer,
    });
  });

  return {
    submitQuestion,
    history: readonly(history),
    ragState,
    loading: ragState.isLoading,
  };
};
