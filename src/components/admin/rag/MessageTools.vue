<script setup lang="ts">
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

const showDebug = computed(() => Boolean(import.meta.env?.DEV));
const hasTokens = computed(
  () =>
    props.entry.promptTokens !== undefined ||
    props.entry.cachedPromptTokens !== undefined ||
    props.entry.promptCacheHit !== undefined,
);
</script>

<template>
  <div class="flex flex-col h-full">
    <header class="px-3 py-2 border-b border-crisiscleanup-light-smoke">
      <BaseText variant="h3" class="font-display font-bold">
        {{ $t('~~Sources & search trace') }}
      </BaseText>
    </header>
    <div class="grid grid-cols-3 flex-1 overflow-hidden">
      <div class="overflow-y-auto border-r border-crisiscleanup-light-smoke">
        <div v-for="(docName, idx) in documentNames" :key="docName">
          <div
            class="py-2 border-2 border-t-0 hover:bg-crisiscleanup-light-grey transition-all cursor-pointer"
            :class="{
              'border-t-2': idx === 0,
              'bg-crisiscleanup-light-grey': docName === currentDocument,
            }"
            @click="() => (currentDocument = docName)"
          >
            <BaseText variant="h4" class="pl-1 font-display">
              {{ docName }}
            </BaseText>
          </div>
        </div>
      </div>
      <div class="overflow-y-auto col-span-2">
        <div
          v-for="doc in selectedDocuments"
          :key="doc.metadata.elementId"
          class="px-1 pt-2"
        >
          <BaseText variant="h3" class="pl-1 font-display">
            {{ doc.metadata.elementId ?? doc.metadata.filename }}
          </BaseText>
          <div class="pl-1">
            <BaseText variant="h4">{{ $t('~~Content') }}</BaseText>
            <BaseText variant="bodyxsm" class="pl-3 pt-1">
              {{ doc.pageContent }}
            </BaseText>
            <BaseText variant="h4">{{ $t('~~Metadata') }}</BaseText>
            <BaseText
              v-for="[key, value] in Object.entries(doc.metadata)"
              :key="doc.metadata.filename + key"
              variant="bodyxsm"
              class="pl-3"
            >
              {{ key }}: {{ value }}
            </BaseText>
          </div>
        </div>
      </div>
    </div>
    <footer
      v-if="showDebug && hasTokens"
      class="px-3 py-2 border-t border-crisiscleanup-light-smoke bg-crisiscleanup-light-grey text-[11px] text-crisiscleanup-grey-900 flex gap-4"
    >
      <span>
        <strong>{{ $t('~~prompt') }}</strong>
        {{ entry.promptTokens ?? '—' }}
      </span>
      <span>
        <strong>{{ $t('~~cached') }}</strong>
        {{ entry.cachedPromptTokens ?? '—' }}
      </span>
      <span>
        <strong>{{ $t('~~cache hit') }}</strong>
        {{ entry.promptCacheHit === undefined ? '—' : entry.promptCacheHit }}
      </span>
    </footer>
  </div>
</template>
