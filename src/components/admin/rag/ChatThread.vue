<script setup lang="ts">
import type { RAGEntry } from '@/hooks';
import ChatBubble from './ChatBubble.vue';

const props = defineProps<{
  history: readonly RAGEntry[];
  isStreaming?: boolean;
}>();

defineEmits<{
  (e: 'open-sources', entry: RAGEntry): void;
  (e: 'new'): void;
}>();

const { t } = useI18n();

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

const showRetrievingIndicator = computed(() => {
  if (!props.isStreaming) return false;
  const last = props.history.at(-1);
  // Pre-stream: latest is an assistant entry with no content yet.
  return Boolean(last && last.actor !== 'user' && !last.content);
});

const suggestions = computed<string[]>(() => [
  t('~~How do I create a new incident?'),
  t('~~Summarize the volunteer onboarding process.'),
  t('~~What are the privacy requirements for survivor records?'),
]);
</script>

<template>
  <div ref="scrollEl" class="ccu-rag-thread flex-1 overflow-y-auto bg-slate-50">
    <div class="mx-auto max-w-3xl px-4 py-6">
      <div
        v-if="history.length === 0"
        class="h-full min-h-[40vh] flex items-center justify-center"
      >
        <div class="text-center max-w-md">
          <div
            class="mx-auto mb-4 w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center"
          >
            <ccu-icon type="active" size="lg" class="opacity-60" />
          </div>
          <h2 class="text-base font-semibold text-slate-900">
            {{ $t('~~Start a new conversation') }}
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            {{
              $t(
                '~~Ask questions about your collection. Responses cite the documents they came from.',
              )
            }}
          </p>
          <ul class="mt-5 space-y-1.5 text-left">
            <li
              v-for="s in suggestions"
              :key="s"
              class="px-3 py-2 rounded-md bg-white border border-slate-200 text-sm text-slate-700"
            >
              {{ s }}
            </li>
          </ul>
          <p class="mt-4 text-xs text-slate-400">
            {{ $t('~~Type your question below to begin.') }}
          </p>
        </div>
      </div>

      <ChatBubble
        v-for="entry in history"
        :key="entry.messageId"
        :entry="entry"
        @open-sources="(e: RAGEntry) => $emit('open-sources', e)"
      />

      <div
        v-if="showRetrievingIndicator"
        class="flex items-center gap-2 text-xs text-slate-500 px-1 -mt-2 mb-4"
        aria-live="polite"
      >
        <span class="inline-flex items-end gap-0.5">
          <span
            class="w-1 h-1 rounded-full bg-crisiscleanup-yellow-500 animate-bounce"
            style="animation-delay: 0ms"
          />
          <span
            class="w-1 h-1 rounded-full bg-crisiscleanup-yellow-500 animate-bounce"
            style="animation-delay: 120ms"
          />
          <span
            class="w-1 h-1 rounded-full bg-crisiscleanup-yellow-500 animate-bounce"
            style="animation-delay: 240ms"
          />
        </span>
        {{ $t('~~Searching documents…') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.ccu-rag-thread {
  scroll-behavior: smooth;
}
</style>
