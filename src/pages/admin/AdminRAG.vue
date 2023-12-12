<script lang="ts" setup>
import { ref } from 'vue';
import { useRAG, useRAGCollections, useRAGUpload } from '@/hooks';
import { whenever } from '@vueuse/core';
import BaseInput from '@/components/BaseInput.vue';
import MarkdownRenderer from '@/components/MarkdownRender.vue';
import { getErrorMessage } from '@/utils/errors';
import DragDrop from '@/components/DragDrop.vue';
import TitledCard from '@/components/cards/TitledCard.vue';
import BaseText from '@/components/BaseText.vue';

const question = ref<string>('');
const { history, submitQuestion } = useRAG();
const { collections } = useRAGCollections();
// todo: collection selection
const collection = computed(
  () => collections.value?.find?.((c) => c.name === 'crisiscleanup'),
);
const collectionDocs = computed(() => collection.value?.files);
const { uploadFile, uploadedDocuments, isLoading } = useRAGUpload(
  collection?.value?.uuid,
);

const uploadsQueue = ref<Blob[]>([]);
whenever(uploadsQueue, async (newValue) => {
  if (!newValue || newValue.length === 0) return;
  await uploadFiles(newValue)
    .catch(getErrorMessage)
    .finally(() => {
      uploadsQueue.value = [];
    });
});

const uploadFiles = async (fileList: Blob[]) =>
  await Promise.all(fileList.map(uploadFile));
</script>

<template>
  <div class="rag grid grid-cols-2 gap-2 h-full overflow-x-visible">
    <div class="col-span-2">
      <BaseText variant="h1">
        {{ collection?.name?.toUpperCase() }}
      </BaseText>
    </div>
    <TitledCard title="Chat">
      <div class="rag--chat">
        <template v-for="h in history" :key="`${h.actor}:${h.content}`">
          <BaseText variant="h3">{{ h.actor.toUpperCase() }}:</BaseText>
          <MarkdownRenderer class="pl-2 overflow-y-auto" :source="h.content" />
          <br />
        </template>
      </div>

      <div class="flex items-end col-span-2 self-end">
        <BaseInput
          v-model="question"
          placeholder="Ask a question"
          class="w-full"
          @keyup.enter="() => submitQuestion(question)"
        />
      </div>
    </TitledCard>

    <div class="flex flex-col">
      <TitledCard title="Files">
        <DragDrop
          class="border bg-white"
          :choose-title="$t('dragDrop.choose_files')"
          :drag-title="$t('fileUpload.select_file_upload')"
          @files="(files) => (uploadsQueue = files)"
        >
          <template v-if="uploadsQueue.length > 0">
            <spinner />
          </template>
        </DragDrop>
        <template v-for="doc in collectionDocs" :key="doc.filename">
          <BaseText variant="body">{{ doc.filename_original }}</BaseText>
        </template>
        <template v-for="doc in uploadedDocuments">
          <BaseText v-for="docId in doc.documentIds" :key="docId">{{
            docId
          }}</BaseText>
        </template>
      </TitledCard>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.rag {
  grid-template-columns: 1fr 0.25fr;
  grid-template-rows: auto 1fr;
}

:deep(.card) {
  @apply flex flex-col;
}

:deep(.card .body) {
  flex-grow: 1;
}

:deep(.card .body--inner) {
  @apply inline-grid grid-rows-2 w-full p-3;
  grid-template-rows: 1fr auto;
  grid-template-columns: 1fr;
}
</style>
