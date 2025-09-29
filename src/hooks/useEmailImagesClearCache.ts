import { ref, readonly } from 'vue';
import { whenever } from '@vueuse/core';
import { useToast } from 'vue-toastification';
import { useApi } from '@/hooks/useApi';
import { getErrorMessage } from '@/utils/errors';

interface ClearCacheResponse {
  cleared_count: number;
  message?: string;
}

export function useEmailImagesClearCache() {
  const $toast = useToast();
  const api = useApi();
  const isClearing = ref(false);

  const clearEmailImagesCache =
    async (): Promise<ClearCacheResponse | null> => {
      if (isClearing.value) {
        return null;
      }

      isClearing.value = true;

      try {
        const { data, error, isFinished } = api<ClearCacheResponse>(
          '/admins/email-images',
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        // Wait for the request to complete
        await new Promise<void>((resolve) => {
          const unwatch = whenever(isFinished, () => {
            unwatch();
            resolve();
          });
        });

        if (error.value) {
          const errorMessage = getErrorMessage(error.value);
          $toast.error(`Failed to clear email images cache: ${errorMessage}`);
          return null;
        }

        if (data.value) {
          const clearedCount = data.value.cleared_count;
          $toast.success(
            `Email images cache cleared successfully! ${clearedCount} entries removed.`,
          );
          return data.value;
        }

        return null;
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        $toast.error(`Error clearing email images cache: ${errorMessage}`);
        return null;
      } finally {
        isClearing.value = false;
      }
    };

  return {
    clearEmailImagesCache,
    isClearing: readonly(isClearing),
  };
}
