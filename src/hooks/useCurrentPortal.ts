import { computed } from 'vue';
import { store } from '@/store';
import type { Portal } from '@/models/types';

export default function useCurrentPortal() {
  const portal = computed(() => {
    return store.getters['enums/portal'] as Portal | undefined;
  });
  return { portal };
}
