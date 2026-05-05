<script setup lang="ts">
import BaseInput from '@/components/BaseInput.vue';

const props = defineProps<{
  disabled: boolean;
  activeFileCount: number;
  totalFileCount: number;
}>();

const emit = defineEmits<{
  (e: 'submit', value: string): void;
  (e: 'toggle-scope'): void;
}>();

const { t } = useI18n();
const draft = ref('');

const onSubmit = () => {
  const v = draft.value.trim();
  if (!v || props.disabled) return;
  emit('submit', v);
  draft.value = '';
};
</script>

<template>
  <div class="ccu-rag-composer border-t-2 border-slate-200 bg-white px-4 py-3">
    <div class="flex items-end gap-2 mx-auto max-w-3xl">
      <button
        type="button"
        class="flex-shrink-0 inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors text-sm text-slate-600"
        :title="t('~~Scope to specific files')"
        @click="emit('toggle-scope')"
      >
        <ccu-icon type="attachment" size="xs" />
        <span v-if="totalFileCount > 0" class="tabular-nums">
          {{ activeFileCount }}/{{ totalFileCount }}
        </span>
        <span v-else>{{ $t('~~Files') }}</span>
      </button>
      <BaseInput
        v-model="draft"
        :placeholder="
          disabled
            ? t('adminRAG.performing_witchcraft')
            : t('adminRAG.ask_question')
        "
        :disabled="disabled"
        class="flex-1 ccu-rag-composer__input"
        @keyup.enter="onSubmit"
      />
      <button
        type="button"
        class="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="disabled || draft.trim().length === 0"
        :title="t('~~Send')"
        @click="onSubmit"
      >
        <ccu-icon type="up" size="sm" icon-classes="invert" />
      </button>
    </div>
  </div>
</template>

<style scoped>
:deep(.ccu-rag-composer__input input) {
  @apply rounded-xl;
}
</style>
