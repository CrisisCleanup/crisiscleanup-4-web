<script setup lang="ts">
import BaseInput from '@/components/BaseInput.vue';
import BaseText from '@/components/BaseText.vue';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import FilesTreeBranch from './FilesTreeBranch.vue';
import type { CCUDocumentFileItem, RAGDocumentsFileBranch } from '@/hooks';

const props = defineProps<{
  documentsTree: RAGDocumentsFileBranch[];
  activeFileIds: Set<number>;
  totalCount: number;
  showMoveAction?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle', fileId: number, toActive?: boolean): void;
  (e: 'select-all', allSelected: boolean): void;
  (e: 'move', file: CCUDocumentFileItem): void;
}>();

const search = defineModel<string>('search', { default: '' });

const isAllSelected = computed(
  () => props.activeFileIds.size === props.totalCount && props.totalCount > 0,
);
</script>

<template>
  <div class="ccu-files-tree">
    <BaseInput v-model="search" :placeholder="$t('actions.search')" />
    <div
      class="border-2 border-transparent border-b-crisiscleanup-light-smoke py-1 pl-1"
    >
      <BaseCheckbox
        :model-value="isAllSelected"
        @update:model-value="(v: boolean) => emit('select-all', v)"
      >
        <BaseText variant="h4" class="pl-1 text-left truncate text-ellipsis">
          {{ $t('~~Select all') }}
        </BaseText>
      </BaseCheckbox>
    </div>
    <FilesTreeBranch
      v-for="branch in documentsTree"
      :key="branch.name"
      :branch="branch"
      :active-file-ids="activeFileIds"
      :search="search"
      :show-move-action="showMoveAction"
      @toggle="(id: number, to?: boolean) => emit('toggle', id, to)"
      @move="(f: CCUDocumentFileItem) => emit('move', f)"
    />
  </div>
</template>

<style scoped>
:deep(.rag__accordion button) {
  @apply border-2 border-transparent border-b-crisiscleanup-light-smoke py-1 pl-1 pr-1 hover:bg-crisiscleanup-light-grey transition-colors cursor-pointer;
}
</style>
