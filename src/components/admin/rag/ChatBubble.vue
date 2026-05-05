<script setup lang="ts">
import MarkdownRenderer from '@/components/MarkdownRender.vue';
import type { RAGEntry } from '@/hooks';
import { useTypewriter } from '@/hooks/rag/useTypewriter';

const props = defineProps<{
  entry: RAGEntry;
}>();

defineEmits<{
  (e: 'open-sources', entry: RAGEntry): void;
}>();

const { t } = useI18n();

const isUser = computed(() => props.entry.actor === 'user');
const status = computed(() => props.entry.status ?? 'finish');

const isThinking = computed(
  () =>
    !isUser.value &&
    (status.value === 'pending' || status.value === 'in_progress'),
);
const isErrored = computed(
  () =>
    !isUser.value && (status.value === 'error' || status.value === 'rejected'),
);

const sourceText = toRef(() => (isThinking.value ? '' : props.entry.content));
const { visible: typedContent, isAnimating } = useTypewriter(sourceText);

const hasSources = computed(
  () =>
    !isUser.value &&
    props.entry.tools &&
    Object.keys(props.entry.tools).length > 0,
);
</script>

<template>
  <div
    class="flex w-full mb-4"
    :class="isUser ? 'justify-end' : 'justify-start'"
  >
    <div
      class="rounded-2xl px-4 py-3 max-w-[78%]"
      :class="
        isUser
          ? 'bg-slate-900 text-white shadow-sm'
          : isErrored
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
      "
    >
      <!-- Thinking placeholder for in_progress / pending -->
      <div
        v-if="isThinking"
        class="flex items-center gap-2 text-sm text-crisiscleanup-grey-900"
        aria-live="polite"
      >
        <span class="inline-flex items-end gap-0.5">
          <span
            class="w-1 h-1 rounded-full bg-primary-dark animate-bounce"
            style="animation-delay: 0ms"
          />
          <span
            class="w-1 h-1 rounded-full bg-primary-dark animate-bounce"
            style="animation-delay: 120ms"
          />
          <span
            class="w-1 h-1 rounded-full bg-primary-dark animate-bounce"
            style="animation-delay: 240ms"
          />
        </span>
        {{ $t('~~Thinking…') }}
      </div>

      <!-- User: plain text. Agent: markdown with typewriter. -->
      <template v-else>
        <div v-if="isUser" class="whitespace-pre-wrap break-words">
          {{ entry.content }}
        </div>
        <div v-else class="ccu-rag-bubble break-words">
          <MarkdownRenderer :source="typedContent" />
          <span
            v-if="isAnimating"
            class="ml-0.5 inline-block w-[2px] h-[1em] align-text-bottom bg-crisiscleanup-grey-900 animate-pulse"
            aria-hidden="true"
          />
        </div>
      </template>

      <!-- Footer: sources, step-cap warning, error retry hint -->
      <div
        v-if="!isUser && (hasSources || entry.stepCapHit)"
        class="flex items-center gap-3 mt-2 pt-2 border-t border-slate-200 text-xs"
      >
        <button
          v-if="hasSources"
          type="button"
          class="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900"
          :title="t('~~Sources & search trace')"
          @click="$emit('open-sources', entry)"
        >
          <ccu-icon type="info" size="xs" />
          {{ $t('~~Sources') }}
        </button>
        <span
          v-if="entry.stepCapHit"
          class="inline-flex items-center gap-1 text-amber-700"
        >
          <ccu-icon type="warning" size="xs" />
          {{ $t('~~Stopped at step limit') }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.ccu-rag-bubble p:first-child) {
  margin-top: 0;
}
:deep(.ccu-rag-bubble p:last-child) {
  margin-bottom: 0;
}
</style>
