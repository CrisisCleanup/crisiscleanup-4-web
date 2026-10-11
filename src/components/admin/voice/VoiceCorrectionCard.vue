<template>
  <div
    class="mb-2 rounded border border-crisiscleanup-grey-100 p-3"
    :class="{ 'opacity-60': correction.status !== 'open' }"
    data-testid="testVoiceCorrection"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="font-semibold">
        {{ t(KIND_LABELS[correction.kind] ?? correction.kind) }}
        <span
          v-if="correction.field && !correction.simple"
          class="font-normal text-crisiscleanup-dark-300"
        >
          · {{ correction.field }}
        </span>
        <span class="ml-2 text-xs font-normal text-crisiscleanup-dark-300">
          {{ t('~~{n}% sure', { n: Math.round(correction.confidence * 100) }) }}
        </span>
      </div>

      <div v-if="correction.status !== 'open'" class="text-xs font-semibold">
        {{ t(STATUS_LABELS[correction.status] ?? correction.status) }}
      </div>
      <div v-else-if="editing" class="flex gap-2">
        <BaseButton
          variant="solid"
          size="small"
          data-testid="testVoiceCorrectionApplyEdit"
          :action="applyEdit"
          :text="t('~~Apply edit')"
          :alt="t('~~Apply edit')"
        />
        <BaseButton
          variant="outline"
          size="small"
          :action="() => (editing = false)"
          :text="t('actions.cancel', 'Cancel')"
          :alt="t('actions.cancel', 'Cancel')"
        />
      </div>
      <div v-else class="flex flex-wrap gap-2">
        <BaseButton
          v-if="canUseInForm && !inForm"
          variant="outline"
          size="small"
          data-testid="testVoiceCorrectionUseInForm"
          :action="() => emit('use')"
          :text="t('~~Use in form')"
          :alt="t('~~Use in form')"
        />
        <BaseButton
          v-if="canCreateCase"
          variant="solid"
          size="small"
          data-testid="testVoiceCorrectionCreateCase"
          :action="() => emit('create')"
          :text="t('~~Create case')"
          :alt="t('~~Create case')"
        />
        <template v-if="correction.simple">
          <BaseButton
            variant="solid"
            size="small"
            data-testid="testVoiceCorrectionApply"
            :action="() => emit('act', 'apply')"
            :text="t('~~Accept')"
            :alt="t('~~Accept')"
          />
          <BaseButton
            variant="outline"
            size="small"
            data-testid="testVoiceCorrectionEdit"
            :action="startEdit"
            :text="t('~~Edit')"
            :alt="t('~~Edit')"
          />
        </template>
        <template v-else>
          <a
            v-if="caseHref"
            :href="caseHref"
            target="_blank"
            rel="noopener"
            class="rounded border border-crisiscleanup-dark-100 px-2 py-1 text-xs font-semibold"
            data-testid="testVoiceCorrectionOpenCase"
          >
            {{ t('~~Edit case') }} ↗
          </a>
          <BaseButton
            variant="outline"
            size="small"
            data-testid="testVoiceCorrectionResolve"
            :action="() => emit('act', 'resolve')"
            :text="t('~~Mark fixed')"
            :alt="t('~~Mark fixed')"
          />
        </template>
        <BaseButton
          variant="outline"
          size="small"
          data-testid="testVoiceCorrectionDismiss"
          :action="() => emit('act', 'dismiss')"
          :text="t('~~Dismiss')"
          :alt="t('~~Dismiss')"
        />
      </div>
    </div>

    <div class="mt-2 grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1">
      <span class="text-crisiscleanup-dark-300">{{ t('~~Before') }}</span>
      <span data-testid="testVoiceCorrectionBefore">
        {{ formatValue(correction.before_value ?? correction.current_value) }}
      </span>
      <span class="text-crisiscleanup-dark-300">
        {{ correction.status === 'applied' ? t('~~After') : t('~~Suggested') }}
      </span>
      <div v-if="editing" class="flex flex-col gap-1">
        <template v-if="isAddress">
          <input
            v-for="part in ADDRESS_PARTS"
            :key="part"
            v-model="addressDraft[part]"
            :placeholder="part"
            class="rounded border p-1"
            :data-testid="`testVoiceCorrectionInput-${part}`"
          />
        </template>
        <textarea
          v-else-if="correction.kind === 'note'"
          v-model="draft"
          rows="3"
          class="rounded border p-1"
          data-testid="testVoiceCorrectionInput"
        />
        <input
          v-else
          v-model="draft"
          class="rounded border p-1"
          data-testid="testVoiceCorrectionInput"
        />
      </div>
      <span v-else class="font-semibold" data-testid="testVoiceCorrectionAfter">
        {{ afterText }}
      </span>
    </div>

    <p
      v-if="inForm && correction.status === 'open'"
      class="mt-2 font-semibold text-crisiscleanup-green-900"
      data-testid="testVoiceCorrectionInForm"
    >
      {{ t('~~In the form. Check it, then save the case.') }}
    </p>
    <p
      v-else-if="
        !correction.simple && !canUseInForm && correction.status === 'open'
      "
      class="mt-2 text-crisiscleanup-dark-300"
    >
      {{
        t(
          '~~This is a suggestion. Open the case, make the change, then mark it fixed.',
        )
      }}
    </p>
    <p v-if="correction.reason" class="mt-2">{{ correction.reason }}</p>
    <blockquote
      v-if="correction.evidence"
      class="mt-1 border-l-2 border-crisiscleanup-grey-300 pl-2 italic text-crisiscleanup-dark-300"
    >
      {{ correction.evidence }}
    </blockquote>
    <p
      v-if="problem"
      class="mt-2 text-crisiscleanup-red-700"
      data-testid="testVoiceCorrectionProblem"
    >
      {{ problem }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  ADDRESS_PARTS,
  KIND_LABELS,
  formatValue,
  type CorrectionAction,
  type VoiceCorrection,
} from '@/hooks/voice/voiceReviews';

const props = defineProps<{
  correction: VoiceCorrection;
  caseHref?: string;
  problem?: string;
  /** The case form next to the review can hold this suggestion. */
  canUseInForm?: boolean;
  /** The suggestion is in the case form, not saved yet. */
  inForm?: boolean;
  canCreateCase?: boolean;
}>();
const emit = defineEmits<{
  act: [action: CorrectionAction, value?: unknown];
  use: [];
  create: [];
}>();

const { t } = useI18n();

const STATUS_LABELS: Record<string, string> = {
  applied: '~~Applied',
  resolved: '~~Fixed by hand',
  dismissed: '~~Dismissed',
};

// A work type suggestion is "add" or "remove"; show it with the work type.
const afterText = computed(() => {
  const { kind, field, applied_value, suggested_value } = props.correction;
  const value = formatValue(applied_value ?? suggested_value);
  if (kind !== 'work_type') return value;
  const verb = value === 'remove' ? t('~~Remove') : t('~~Add');
  return `${verb} ${field}`;
});

const editing = ref(false);
const draft = ref('');
const addressDraft = ref<Record<string, string>>({});
const isAddress = computed(() => props.correction.kind === 'address');

function startEdit() {
  const value = props.correction.suggested_value;
  // Copy, so an edit does not change the suggestion shown elsewhere.
  if (isAddress.value) {
    addressDraft.value = { ...(value as Record<string, string>) };
  } else {
    draft.value = typeof value === 'string' ? value : '';
  }
  editing.value = true;
}

function applyEdit() {
  emit('act', 'apply', isAddress.value ? addressDraft.value : draft.value);
}

watch(
  () => props.correction.status,
  () => (editing.value = false),
);
</script>
