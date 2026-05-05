<script setup lang="ts">
import type { RAGEntry } from '@/hooks';
import ChatBubble from './ChatBubble.vue';

const props = defineProps<{
  history: readonly RAGEntry[];
}>();

defineEmits<{
  (e: 'open-sources', entry: RAGEntry): void;
}>();

const scrollEl = ref<HTMLElement | null>(null);

const stickToBottom = async () => {
  await nextTick();
  const el = scrollEl.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
};

watch(
  () => props.history.length,
  () => stickToBottom(),
  { immediate: true },
);

// Re-scroll when the latest entry's content grows (typewriter / streamed reveal).
watch(
  () => props.history.at(-1)?.content,
  () => stickToBottom(),
);
</script>

<template>
  <div ref="scrollEl" class="ccu-rag-thread flex-1 overflow-y-auto bg-slate-50">
    <div class="mx-auto max-w-3xl px-4 py-6">
      <div
        v-if="history.length === 0"
        class="h-full min-h-[40vh] flex items-center justify-center"
      >
        <div class="text-center text-slate-500">
          <ccu-icon type="active" size="xl" class="mx-auto opacity-30" />
          <p class="mt-3 text-sm">{{ $t('~~Ask anything to get started.') }}</p>
        </div>
      </div>
      <ChatBubble
        v-for="entry in history"
        :key="entry.messageId"
        :entry="entry"
        @open-sources="(e: RAGEntry) => $emit('open-sources', e)"
      />
    </div>
  </div>
</template>

<style scoped>
.ccu-rag-thread {
  scroll-behavior: smooth;
}
</style>
