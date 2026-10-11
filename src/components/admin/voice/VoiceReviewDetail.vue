<template>
  <div class="text-sm" data-testid="testVoiceReviewDetail">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        class="font-semibold underline"
        @click="emit('back')"
      >
        ← {{ t('~~All calls') }}
      </button>
      <div class="flex flex-wrap items-center gap-2">
        <a
          v-if="caseHref"
          :href="caseHref"
          target="_blank"
          rel="noopener"
          class="rounded border border-crisiscleanup-dark-100 px-2 py-1 text-xs font-semibold"
          data-testid="testVoiceReviewOpenCase"
        >
          {{
            t('~~Edit case {number}', { number: review?.worksite?.case_number })
          }}
          ↗
        </a>
        <BaseButton
          v-if="openSimple.length > 0"
          variant="solid"
          size="small"
          data-testid="testVoiceReviewApplySimple"
          :action="applySimple"
          :text="t('~~Accept {n} suggested fixes', { n: openSimple.length })"
          :alt="t('~~Accept {n} suggested fixes', { n: openSimple.length })"
        />
      </div>
    </div>

    <Spinner v-if="!review" />
    <div v-else class="grid gap-4" :class="{ 'lg:grid-cols-2': showForm }">
      <div class="min-w-0">
        <audio
          v-if="review.audio_url"
          controls
          preload="none"
          class="mb-3 w-full"
          :src="review.audio_url"
          data-testid="testVoiceReviewAudio"
        />
        <p v-else class="mb-3 text-crisiscleanup-dark-300">
          {{ t('~~No recording was saved for this call.') }}
        </p>

        <dl class="mb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt class="text-crisiscleanup-dark-300">{{ t('~~Case') }}</dt>
          <dd>{{ review.worksite?.case_number ?? t('~~No case') }}</dd>
          <dt class="text-crisiscleanup-dark-300">{{ t('~~Call') }}</dt>
          <dd>{{ review.session.call_id }} · {{ review.session.status }}</dd>
          <dt class="text-crisiscleanup-dark-300">{{ t('~~Reviewer') }}</dt>
          <dd>{{ review.model || '—' }}</dd>
          <dt class="text-crisiscleanup-dark-300">{{ t('~~Summary') }}</dt>
          <dd data-testid="testVoiceReviewSummary">
            {{ review.summary || review.error || '—' }}
          </dd>
        </dl>

        <PaneEmpty
          v-if="review.corrections.length === 0"
          :title="t('~~No issues found')"
          :description="t('~~The case matches what the caller said.')"
        />

        <section v-for="group in groups" :key="group.title" class="mb-4">
          <h3
            class="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
          >
            {{ group.title }}
          </h3>
          <VoiceCorrectionCard
            v-for="correction in group.items"
            :key="correction.id"
            :correction="correction"
            :case-href="caseHref"
            :problem="problems[correction.id]"
            :can-use-in-form="canUseInForm(correction)"
            :in-form="usedInForm.has(correction.id)"
            :can-create-case="canCreateCase(correction)"
            @act="
              (action: CorrectionAction, value?: unknown) =>
                act(correction, action, value)
            "
            @use="useInForm(correction)"
            @create="startNewCase(correction)"
          />
        </section>

        <details>
          <summary class="cursor-pointer font-semibold">
            {{ t('~~Transcript') }}
          </summary>
          <pre
            class="mt-2 max-h-[45vh] overflow-auto whitespace-pre-wrap rounded bg-crisiscleanup-grey-100/40 p-3 text-xs"
            >{{ review.transcript || t('~~(no transcript saved)') }}</pre
          >
        </details>
      </div>

      <div v-if="showForm" class="min-w-0">
        <label
          v-if="newCase && !review.incident_id"
          class="mb-2 flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ t('~~Disaster for the new case') }}
          <select
            v-model="newCase.incidentId"
            class="mt-1 rounded border p-1.5 text-sm normal-case text-black"
            data-testid="testVoiceReviewNewCaseIncident"
          >
            <option
              v-for="incident in incidents"
              :key="incident.id"
              :value="Number(incident.id)"
            >
              {{ incident.name }}
            </option>
          </select>
        </label>
        <div
          v-if="newCase"
          class="mb-2 flex items-center justify-between rounded bg-crisiscleanup-yellow-100 p-2"
        >
          <span>{{
            t('~~New case from this call. Check it, then save.')
          }}</span>
          <button type="button" class="underline" @click="newCase = undefined">
            {{ t('actions.cancel', 'Cancel') }}
          </button>
        </div>
        <VoiceReviewCaseForm
          v-if="formIncidentId"
          ref="caseForm"
          :key="
            newCase
              ? `new-${newCase.incidentId}`
              : `case-${review.worksite?.id}`
          "
          :incident-id="formIncidentId"
          :worksite-id="newCase ? undefined : review.worksite?.id"
          :missed-case="newCase?.details"
          @saved="onCaseSaved"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { useToast } from 'vue-toastification';
import PaneEmpty from '@/components/phone/foundation/PaneEmpty.vue';
import VoiceCorrectionCard from './VoiceCorrectionCard.vue';
import VoiceReviewCaseForm from './VoiceReviewCaseForm.vue';
import Incident from '@/models/Incident';
import {
  caseUrl,
  formChanges,
  missedCaseDetails,
  voiceReviewUrl,
  type MissedCaseDetails,
  type CorrectionAction,
  type VoiceCorrection,
  type VoiceReviewWithTranscript,
} from '@/hooks/voice/voiceReviews';
import { getErrorMessage } from '@/utils/errors';

const props = defineProps<{ reviewId: number }>();
const emit = defineEmits<{ back: [] }>();

const { t } = useI18n();
const $toasted = useToast();
const router = useRouter();

const review = ref<VoiceReviewWithTranscript>();
// Why an apply did not go through, shown on the correction itself.
const problems = ref<Record<number, string>>({});

// The case editor opens in a new tab, so the review stays in place.
const caseHref = computed(() => {
  const path = review.value && caseUrl(review.value);
  return path ? router.resolve(path).href : undefined;
});
const openSimple = computed(
  () =>
    review.value?.corrections.filter(
      (c: VoiceCorrection) => c.simple && c.status === 'open',
    ) ?? [],
);
const groups = computed(() => {
  const corrections: VoiceCorrection[] = review.value?.corrections ?? [];
  return [
    {
      title: t('~~Contact fixes: accept or edit'),
      items: corrections.filter((c) => c.simple),
    },
    {
      title: t('~~Suggestions: edit the case'),
      items: corrections.filter((c) => !c.simple),
    },
  ].filter((group) => group.items.length > 0);
});

const caseForm = ref<InstanceType<typeof VoiceReviewCaseForm>>();
// Suggestions put in the case form; marked fixed when the case saves.
const usedInForm = ref(new Set<number>());
// A case being made from a missed-case suggestion.
const newCase = ref<{
  correctionId: number;
  incidentId?: number;
  details?: MissedCaseDetails;
}>();

const incidents = computed(() => Incident.query().orderBy('id', 'desc').get());
const formIncidentId = computed(
  () => newCase.value?.incidentId ?? review.value?.incident_id ?? undefined,
);
const showForm = computed(
  () => Boolean(review.value?.worksite) || Boolean(newCase.value),
);

function canUseInForm(correction: VoiceCorrection) {
  return (
    Boolean(review.value?.worksite) &&
    !newCase.value &&
    correction.status === 'open' &&
    formChanges(
      correction,
      correction.suggested_value,
      caseForm.value?.formFields ?? [],
    ) !== undefined
  );
}

function canCreateCase(correction: VoiceCorrection) {
  return (
    correction.kind === 'missed_case' &&
    correction.status === 'open' &&
    !review.value?.worksite
  );
}

async function useInForm(correction: VoiceCorrection) {
  const changes = formChanges(
    correction,
    correction.suggested_value,
    caseForm.value?.formFields ?? [],
  );
  if (!changes || !caseForm.value) return;
  await caseForm.value.applyChanges(changes, correction.kind === 'address');
  usedInForm.value = new Set(usedInForm.value).add(correction.id);
}

function startNewCase(correction: VoiceCorrection) {
  newCase.value = {
    correctionId: correction.id,
    incidentId: review.value?.incident_id ?? undefined,
    details: missedCaseDetails(correction),
  };
}

async function onCaseSaved(worksite: { id: number }) {
  try {
    if (newCase.value) {
      await axios.post(
        voiceReviewUrl(`corrections/${newCase.value.correctionId}/link_case`),
        { worksite_id: worksite.id },
      );
      newCase.value = undefined;
    } else {
      const open = new Set(
        review.value?.corrections
          .filter((c: VoiceCorrection) => c.status === 'open')
          .map((c: VoiceCorrection) => c.id),
      );
      await Promise.all(
        [...usedInForm.value]
          .filter((id) => open.has(id))
          .map((id) => axios.post(voiceReviewUrl(`corrections/${id}/resolve`))),
      );
    }
    usedInForm.value = new Set();
    await load();
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

/** The API changed the case; show the saved values in the form. */
function reloadCaseForm() {
  usedInForm.value = new Set();
  caseForm.value?.reload();
}

async function load() {
  try {
    const { data } = await axios.get<VoiceReviewWithTranscript>(
      voiceReviewUrl(String(props.reviewId)),
    );
    review.value = data;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

async function act(
  correction: VoiceCorrection,
  action: CorrectionAction,
  value?: unknown,
) {
  try {
    const { data } = await axios.post<VoiceCorrection>(
      voiceReviewUrl(`corrections/${correction.id}/${action}`),
      value === undefined ? {} : { value },
    );
    Object.assign(correction, data);
    delete problems.value[correction.id];
    if (action === 'apply') reloadCaseForm();
  } catch (error) {
    problems.value[correction.id] = getErrorMessage(error);
  }
}

async function applySimple() {
  try {
    const { data } = await axios.post<
      VoiceReviewWithTranscript & { results: Record<string, string> }
    >(voiceReviewUrl(`${props.reviewId}/apply_simple`));
    const { results, ...detail } = data;
    review.value = detail;
    reloadCaseForm();
    problems.value = Object.fromEntries(
      Object.entries(results)
        .filter(([, result]) => result !== 'applied')
        .map(([id, result]) => [Number(id), result]),
    );
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

watch(() => props.reviewId, load, { immediate: true });
</script>
