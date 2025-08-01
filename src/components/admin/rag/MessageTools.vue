<script setup lang="ts">
import { defineProps, ref, computed } from 'vue';
import { type RAGDocument, type RAGEntry, type RAGToolMessage } from '@/hooks';
import BaseText from '@/components/BaseText.vue';
const props = defineProps<{
  entry: RAGEntry;
}>();

const messageTools = computed<Record<string, RAGToolMessage[]>>(
  () => props.entry.tools ?? {},
);
const messageDocuments = computed<RAGDocument[]>(() =>
  Object.values(messageTools.value)
    .flatMap((toolMessage) => {
      return toolMessage as RAGToolMessage;
    })
    .flatMap((i) => i.documents ?? []),
);
const documentNames = computed(() => [
  ...new Set(messageDocuments.value.map((doc) => doc?.metadata?.filename)),
]);
const currentDocument = ref(documentNames.value[0]);
const selectedDocuments = computed(() =>
  messageDocuments.value.filter(
    (doc) => doc.metadata.filename === currentDocument.value,
  ),
);
</script>

<template>
  <div class="grid grid-cols-3">
    <div>
      <div v-for="(docName, idx) in documentNames" :key="docName">
        <div
          class="py-2 border-2 border-t-0 hover:bg-crisiscleanup-light-grey transition-all cursor-pointer"
          :class="{
            'border-t-2': idx === 0,
            'bg-crisiscleanup-light-grey': docName === currentDocument,
          }"
          @click="() => (currentDocument = docName)"
        >
          <BaseText variant="h4" class="pl-1 font-display">{{
            docName
          }}</BaseText>
        </div>
      </div>
    </div>
    <div class="overflow-y-auto col-span-2">
      <div
        v-for="doc in selectedDocuments"
        :key="doc.metadata.elementId"
        class="px-1"
      >
        <BaseText variant="h3" class="pl-1 font-display">{{
          doc.metadata.elementId ?? doc.metadata.filename
        }}</BaseText>
        <div class="pl-1">
          <BaseText variant="h4">Content</BaseText>
          <BaseText variant="bodyxsm" class="pl-3 pt-1">
            {{ doc.pageContent }}
          </BaseText>
          <BaseText variant="h4">Metadata</BaseText>
          <BaseText
            v-for="[key, value] in Object.entries(doc.metadata)"
            :key="doc.metadata.filename + key"
            variant="bodyxsm"
            class="pl-3"
          >
            {{ key }}: {{ value }}
          </BaseText>
        </div>
        <br />
      </div>
    </div>
  </div>
</template>
