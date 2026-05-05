<script setup lang="ts">
import FilesTree from './FilesTree.vue';
import type { RAGDocumentsFileBranch } from '@/hooks';

defineProps<{
  open: boolean;
  documentsTree: RAGDocumentsFileBranch[];
  activeFileIds: Set<number>;
  totalCount: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle', fileId: number, toActive?: boolean): void;
  (e: 'select-all', allSelected: boolean): void;
}>();

const search = ref('');
</script>

<template>
  <transition name="ccu-rag-drawer">
    <div
      v-if="open"
      class="absolute inset-0 z-30 flex"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex-1 bg-black/30" @click="emit('close')" />
      <aside
        class="w-[360px] max-w-[90vw] h-full bg-white shadow-xl flex flex-col"
      >
        <header
          class="px-4 py-3 border-b border-crisiscleanup-light-smoke flex items-center justify-between"
        >
          <div>
            <h3 class="font-display text-base font-bold">
              {{ $t('~~File scope') }}
            </h3>
            <p class="text-xs text-crisiscleanup-grey-900">
              {{ $t('~~Limit retrieval to the selected files.') }}
            </p>
          </div>
          <button
            type="button"
            class="p-1 rounded hover:bg-crisiscleanup-light-grey"
            :title="$t('actions.close')"
            @click="emit('close')"
          >
            <ccu-icon type="cancel" size="sm" />
          </button>
        </header>
        <div class="flex-1 overflow-y-auto px-3 py-2">
          <FilesTree
            v-model:search="search"
            :documents-tree="documentsTree"
            :active-file-ids="activeFileIds"
            :total-count="totalCount"
            @toggle="(id: number, to?: boolean) => emit('toggle', id, to)"
            @select-all="(v: boolean) => emit('select-all', v)"
          />
        </div>
      </aside>
    </div>
  </transition>
</template>

<style scoped>
.ccu-rag-drawer-enter-active,
.ccu-rag-drawer-leave-active {
  transition: opacity 200ms ease-out;
}
.ccu-rag-drawer-enter-from,
.ccu-rag-drawer-leave-to {
  opacity: 0;
}
.ccu-rag-drawer-enter-active aside,
.ccu-rag-drawer-leave-active aside {
  transition: transform 200ms ease-out;
}
.ccu-rag-drawer-enter-from aside,
.ccu-rag-drawer-leave-to aside {
  transform: translateX(100%);
}
</style>
