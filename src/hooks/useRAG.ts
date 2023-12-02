import createDebug from 'debug';
import { useWebSockets } from '@/hooks/useWebSockets';
import { generateUUID } from '@/utils/helpers';

const debug = createDebug('@ccu:hooks:useRAG');

interface RAGEntry {
  messageId: string;
  actor: 'user' | 'aarongpt';
  content: string;
}

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
