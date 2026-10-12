<template>
  <form
    class="flex flex-wrap items-end gap-2"
    data-testid="testVoiceAutoFix"
    @submit.prevent
  >
    <label
      class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
    >
      {{ t('~~Run automatic fixes since') }}
      <input
        v-model="since"
        type="date"
        class="mt-1 min-h-[40px] rounded border p-1 text-sm normal-case text-black"
        data-testid="testVoiceAutoFixSince"
        @change="preview = undefined"
      />
    </label>
    <BaseButton
      variant="outline"
      size="small"
      class="max-md:!min-h-[40px]"
      data-testid="testVoiceAutoFixPreview"
      :action="runPreview"
      :text="t('~~Preview')"
      :alt="t('~~Preview')"
    />
    <template v-if="preview">
      <span data-testid="testVoiceAutoFixCounts">
        {{
          t(
            '~~{reviews} reviews checked: {applied} fixes to apply, {linked} missed cases to link.',
            preview,
          )
        }}
      </span>
      <BaseButton
        v-if="preview.applied + preview.linked > 0"
        variant="solid"
        size="small"
        class="max-md:!min-h-[40px]"
        data-testid="testVoiceAutoFixApply"
        :action="apply"
        :text="t('~~Apply {n} fixes', { n: preview.applied + preview.linked })"
        :alt="t('~~Apply {n} fixes', { n: preview.applied + preview.linked })"
      />
    </template>
  </form>
</template>

<script setup lang="ts">
import axios from 'axios';
import { useToast } from 'vue-toastification';
import useDialogs from '@/hooks/useDialogs';
import { getErrorMessage } from '@/utils/errors';
import moment from '@/utils/dates';
import { voiceReviewUrl, type AutoFixResult } from '@/hooks/voice/voiceReviews';

const emit = defineEmits<{ done: [] }>();

const { t } = useI18n();
const $toasted = useToast();
const { confirm: confirmDialog } = useDialogs();

const since = ref(moment().subtract(7, 'day').format('YYYY-MM-DD'));
// What the dry run found; applying always follows one.
const preview = ref<AutoFixResult>();

async function run(dryRun: boolean) {
  try {
    const { data } = await axios.post<AutoFixResult>(
      voiceReviewUrl('auto_fix'),
      { since: since.value, dry_run: dryRun },
    );
    return data;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

async function runPreview() {
  preview.value = await run(true);
}

async function apply() {
  if (!preview.value) return;
  const { applied, linked } = preview.value;
  const answer = await confirmDialog({
    title: t('~~Run automatic fixes'),
    content: t(
      '~~Apply {applied} fixes and link {linked} missed cases? Each one shows as Auto in the Call Auditor, and you can undo it there.',
      { applied, linked },
    ),
    actions: {
      no: { text: t('actions.cancel'), type: 'outline' },
      yes: { text: t('~~Apply fixes'), type: 'solid' },
    },
  });
  if (answer !== 'yes') return;
  const result = await run(false);
  if (!result) return;
  $toasted.success(
    t('~~Applied {applied} fixes and linked {linked} missed cases.', {
      applied: result.applied,
      linked: result.linked,
    }),
  );
  preview.value = undefined;
  emit('done');
}
</script>
