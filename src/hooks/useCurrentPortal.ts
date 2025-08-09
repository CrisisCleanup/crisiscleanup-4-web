import { computed } from 'vue';
import { useStore } from 'vuex';
import type { Portal } from '@/models/types';

export default function useCurrentPortal() {
  const store = useStore();
  const portal = computed(() => {
    const portalValue: unknown = store.getters['enums/portal'];
    return portalValue as Portal | undefined;
  });
  return { portal };
}
