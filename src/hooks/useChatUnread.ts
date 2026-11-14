import { effectScope, ref, watch, type Ref } from 'vue';
import { debounce } from 'lodash-es';
import axios from 'axios';
import useCurrentUser from '@/hooks/useCurrentUser';
import { useWebSockets } from '@/hooks/useWebSockets';
import type { Message } from '@/models/types';

export function useChatUnread(
  chatId: Ref<number | undefined>,
  isOpen: Ref<boolean>,
) {
  const { userStates, updateUserStates, currentUser } = useCurrentUser();
  const unreadCount = ref(0);
  const urgentCount = ref(0);
  let lastSeen: string | undefined;

  watch(
    [chatId, isOpen],
    ([id, open], [previousId, wasOpen], onCleanup) => {
      unreadCount.value = 0;
      urgentCount.value = 0;
      if (id !== previousId) lastSeen = undefined;
      if (!id) return;
      if (open || (wasOpen && id === previousId)) {
        lastSeen = new Date().toISOString();
        void updateUserStates({ chat_last_seen: lastSeen });
      }
      if (open) return;

      let disposed = false;
      let revision = 0;
      const controller = new AbortController();
      const refresh = async () => {
        const requestRevision = ++revision;
        const params = {
          message_group: id,
          limit: 1,
          created_at__gte: lastSeen ?? userStates.value?.chat_last_seen,
        };
        try {
          const [normal, urgent] = await Promise.all(
            [false, true].map((isUrgent) =>
              axios.get<{ count: number }>(
                `${import.meta.env.VITE_APP_API_BASE_URL}/chat_messages`,
                {
                  params: { ...params, is_urgent: isUrgent },
                  signal: controller.signal,
                },
              ),
            ),
          );
          if (!disposed && requestRevision === revision) {
            unreadCount.value = normal.data.count ?? 0;
            urgentCount.value = urgent.data.count ?? 0;
          }
        } catch (error) {
          if (!disposed)
            console.error('Failed to refresh unread chat counts', error);
        }
      };
      const scheduleRefresh = debounce(() => void refresh(), 300, {
        maxWait: 2000,
      });
      // The connection has a watcher of its own, and `close` stops it. In a
      // scope of its own, that watcher is not in the scope of the component.
      // Without this, a cleanup that runs while Vue stops the component
      // takes a watcher out of the list that Vue is going through, and the
      // unmount throws.
      const connectionScope = effectScope(true);
      const connection = connectionScope.run(() =>
        useWebSockets<Message>(
          `/ws/chat/${id}`,
          'chat unread',
          (message) => {
            if (message.created_by !== currentUser.value?.id) scheduleRefresh();
          },
          scheduleRefresh,
        ),
      );
      scheduleRefresh();
      onCleanup(() => {
        disposed = true;
        scheduleRefresh.cancel();
        connection?.close();
        connectionScope.stop();
        controller.abort();
      });
    },
    { immediate: true },
  );

  return { unreadCount, urgentCount };
}
