<script setup lang="ts">
import BaseText from '@/components/BaseText.vue';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import AccordionItem from '@/components/accordion/AccordionItem.vue';
import type { CCUDocumentFileItem, RAGDocumentsFileBranch } from '@/hooks';

const props = defineProps<{
  branch: RAGDocumentsFileBranch;
  activeFileIds: Set<number>;
  search: string;
  showMoveAction?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle', fileId: number, toActive?: boolean): void;
  (e: 'move', file: CCUDocumentFileItem): void;
}>();

const isFileActive = (file: CCUDocumentFileItem) =>
  props.activeFileIds.has(file.id);

const matchesSearch = (text: string) =>
  props.search === '' ||
  text.toLowerCase().includes(props.search.toLowerCase());

const shouldShowChild = (b: RAGDocumentsFileBranch): boolean =>
  matchesSearch(b.name) ||
  b.branches.some(shouldShowChild) ||
  b.files.some((f) => matchesSearch(f.filenameOriginal));

const isBranchAllActive = computed<boolean>(() => {
  const walk = (b: RAGDocumentsFileBranch): boolean =>
    b.files.every(isFileActive) && b.branches.every(walk);
  return walk(props.branch);
});

const setBranch = (b: RAGDocumentsFileBranch, active: boolean) => {
  for (const file of b.files) emit('toggle', file.id, active);
  for (const child of b.branches) setBranch(child, active);
};

const toggleBranch = () => setBranch(props.branch, !isBranchAllActive.value);

const isRoot = computed(() => props.branch.name === '');
</script>

<template>
  <component
    :is="isRoot ? 'div' : AccordionItem"
    :class="[
      'font-h4 text-h4 text-crisiscleanup-dark-400',
      !isRoot && 'rag__accordion',
    ]"
    :name="branch.name"
  >
    <template v-if="!isRoot" #name>
      <BaseCheckbox
        :model-value="isBranchAllActive"
        @update:model-value="toggleBranch"
      >
        <ccu-icon
          linked
          type="folder"
          fa
          icon-classes="fa-light"
          size="sm"
          with-text
        >
          <BaseText
            variant="h4"
            class="pl-1 text-left text-crisiscleanup-dark-500 font-bold truncate text-ellipsis"
          >
            {{ branch.name }}
          </BaseText>
        </ccu-icon>
      </BaseCheckbox>
    </template>

    <template #default>
      <FilesTreeBranch
        v-for="child in branch.branches"
        v-show="shouldShowChild(child)"
        :key="child.name"
        :branch="child"
        :active-file-ids="activeFileIds"
        :search="search"
        :show-move-action="showMoveAction"
        @toggle="(id: number, to?: boolean) => emit('toggle', id, to)"
        @move="(f: CCUDocumentFileItem) => emit('move', f)"
      />
      <div
        v-for="file in branch.files"
        v-show="
          matchesSearch(file.filenameOriginal) || matchesSearch(branch.name)
        "
        :key="`fileitem-${file.id}`"
        class="border-2 border-transparent border-b-crisiscleanup-light-smoke py-1 pl-1 hover:bg-crisiscleanup-light-grey transition-all cursor-pointer flex items-center justify-between"
        :title="file.filenameOriginal"
        @click="emit('toggle', file.id)"
      >
        <BaseCheckbox
          :model-value="isFileActive(file)"
          @update:model-value="emit('toggle', file.id)"
        >
          <BaseText variant="h4" class="pl-1 text-left truncate text-ellipsis">
            {{ file.filenameOriginal }}
          </BaseText>
        </BaseCheckbox>
        <button
          v-if="showMoveAction"
          type="button"
          class="opacity-0 group-hover:opacity-100 hover:opacity-100 px-2 text-xs text-crisiscleanup-dark-400 hover:text-crisiscleanup-dark-500"
          :title="$t('adminRAG.move_to_folder')"
          @click.stop="emit('move', file)"
        >
          <ccu-icon type="up" size="xs" />
        </button>
      </div>
    </template>
  </component>
</template>
