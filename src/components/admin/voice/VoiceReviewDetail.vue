<template>
  <div class="text-sm" data-testid="testVoiceReviewDetail">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        class="font-semibold underline max-md:min-h-[40px]"
        @click="emit('back')"
      >
        ← {{ t('~~All calls') }}
      </button>
      <div class="flex flex-wrap items-center gap-2">
        <BaseButton
          v-if="review"
          class="max-md:!min-h-[40px]"
          variant="outline"
          size="small"
          data-testid="testVoiceReviewAgain"
          :action="reviewAgain"
          :text="t('~~Review again')"
          :alt="t('~~Review again')"
        />
        <a
          v-for="link in caseLinks"
          :key="link.id"
          :href="link.href"
          target="_blank"
          rel="noopener"
          class="inline-flex min-h-[40px] items-center rounded border border-crisiscleanup-dark-100 px-2 py-1 text-xs font-semibold"
          data-testid="testVoiceReviewOpenCase"
        >
          {{ t('~~Edit case {number}', { number: link.case_number }) }}
          ↗
        </a>
        <BaseButton
          v-if="openSimple.length > 0"
          class="max-md:!min-h-[40px]"
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
          ref="audioEl"
          controls
          preload="metadata"
          class="mb-3 w-full"
          :src="review.audio_url"
          data-testid="testVoiceReviewAudio"
        />
        <p v-else class="mb-3 text-crisiscleanup-dark-300">
          {{ t('~~No recording was saved for this call.') }}
        </p>

        <dl class="mb-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
          <dt class="text-crisiscleanup-dark-300">{{ t('~~Case') }}</dt>
          <dd data-testid="testVoiceReviewCases">
            <template v-if="caseLinks.length > 0">
              <span
                v-for="(link, index) in caseLinks"
                :key="link.id"
                data-testid="testVoiceReviewCaseNumber"
              >
                <template v-if="index > 0">, </template>{{ link.case_number }}
              </span>
            </template>
            <template v-else>{{ t('~~No case') }}</template>
          </dd>
          <template v-if="review.flags?.length">
            <dt class="text-crisiscleanup-dark-300">{{ t('~~Flags') }}</dt>
            <dd><VoiceFlagPills :flags="review.flags" /></dd>
          </template>
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

        <p
          v-if="review.corrections.length > 0"
          class="mb-2 hidden text-xs text-crisiscleanup-dark-300 md:block"
          data-testid="testVoiceReviewKeysHint"
        >
          {{
            t('~~Keys: j and k move between findings, a accepts, d dismisses.')
          }}
        </p>

        <section v-for="group in groups" :key="group.title" class="mb-4">
          <h3
            class="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
          >
            {{ group.title }}
          </h3>
          <VoiceCorrectionCard
            v-for="correction in group.items"
            :key="correction.id"
            :ref="(card: unknown) => setCard(correction.id, card)"
            :active="activeId === correction.id"
            :correction="correction"
            :case-href="caseHref"
            :problem="problems[correction.id]"
            :can-use-in-form="canUseInForm(correction)"
            :in-form="usedInForm.has(correction.id)"
            :can-create-case="canCreateCase(correction)"
            :move-to="moveTarget(correction)?.name"
            @hover="
              (over: boolean) => (hoveredId = over ? correction.id : undefined)
            "
            @select="selectedId = correction.id"
            @undo="undo(correction)"
            @act="
              (action: CorrectionAction, value?: unknown) =>
                act(correction, action, value)
            "
            @use="useInForm(correction)"
            @create="startNewCase(correction)"
            @move="moveIncident(correction)"
          />
        </section>

        <section>
          <h3
            class="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
          >
            {{ t('~~Transcript') }}
          </h3>
          <VoiceReviewTranscript
            :turns="turns"
            :match="match"
            :can-seek="Boolean(review.audio_url)"
            @seek="seekTo"
          />
        </section>
      </div>

      <div v-if="showForm" class="min-w-0">
        <label
          v-if="newCase && !review.incident_id"
          class="mb-2 flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ t('~~Disaster for the new case') }}
          <select
            v-model="newCase.incidentId"
            class="mt-1 rounded border p-1.5 max-md:min-h-[40px] text-sm normal-case text-black"
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
import VoiceFlagPills from './VoiceFlagPills.vue';
import VoiceReviewTranscript from './VoiceReviewTranscript.vue';
import VoiceReviewCaseForm from './VoiceReviewCaseForm.vue';
import Incident from '@/models/Incident';
import {
  caseUrl,
  reviewCases,
  addressExtras,
  formChanges,
  incidentMove,
  missedCaseDetails,
  voiceReviewUrl,
  type MissedCaseDetails,
  type CorrectionAction,
  type FoundAddress,
  type VoiceCorrection,
  type VoiceReviewWithTranscript,
} from '@/hooks/voice/voiceReviews';
import {
  caseEditPath,
  sessionsUrl,
  type SessionDetail,
  type SpeechTurn,
} from '@/hooks/voice/voiceSessions';
import {
  findEvidence,
  parseSpeechTurns,
  seekSeconds,
} from '@/hooks/voice/voiceTranscript';
import { getErrorMessage } from '@/utils/errors';
import useDialogs from '@/hooks/useDialogs';

const props = defineProps<{ reviewId: number }>();
const emit = defineEmits<{ back: [] }>();

const { t } = useI18n();
const $toasted = useToast();
const router = useRouter();
const { confirm: confirmDialog } = useDialogs();

const review = ref<VoiceReviewWithTranscript>();
// Why an apply did not go through, shown on the correction itself.
const problems = ref<Record<number, string>>({});

// The case editor opens in a new tab, so the review stays in place.
const caseHref = computed(() => {
  const path = review.value && caseUrl(review.value);
  return path ? router.resolve(path).href : undefined;
});
// Every case of the call: a second address makes a second case.
const caseLinks = computed(() =>
  review.value
    ? reviewCases(review.value).map((item) => ({
        ...item,
        href: router.resolve(caseEditPath(item)).href,
      }))
    : [],
);
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

// The words of the call, with their time in the recording when known.
const sessionTurns = ref<SpeechTurn[]>([]);
const turns = computed<SpeechTurn[]>(() => {
  const given = review.value?.speech_turns?.length
    ? review.value.speech_turns
    : sessionTurns.value;
  return given.length > 0
    ? given
    : parseSpeechTurns(review.value?.transcript ?? '');
});
const audioEl = ref<HTMLAudioElement>();

// The finding under the mouse, or chosen with the keyboard.
const hoveredId = ref<number>();
const selectedId = ref<number>();
const activeId = computed(() => hoveredId.value ?? selectedId.value);
const match = computed(() => {
  const active = review.value?.corrections.find(
    (c: VoiceCorrection) => c.id === activeId.value,
  );
  return active?.evidence
    ? findEvidence(turns.value, active.evidence)
    : undefined;
});
const cards = new Map<number, { startDismiss: () => void }>();
function setCard(id: number, card: unknown) {
  if (card) cards.set(id, card as { startDismiss: () => void });
  else cards.delete(id);
}

function seekTo(line: { turn: SpeechTurn; index: number; count: number }) {
  const audio = audioEl.value;
  if (!audio) return;
  const go = () => {
    const seconds = seekSeconds(
      line.turn,
      line.index,
      line.count,
      audio.duration,
    );
    if (seconds === undefined) return;
    audio.currentTime = seconds;
    void audio.play?.();
  };
  // The length of the recording is not known until its start has loaded.
  if (
    typeof line.turn.offset_seconds !== 'number' &&
    !Number.isFinite(audio.duration)
  ) {
    audio.addEventListener('loadedmetadata', go, { once: true });
    audio.load();
  } else {
    go();
  }
}

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
  if (!caseForm.value) return;
  const fields = caseForm.value.formFields ?? [];
  let changes = formChanges(correction, correction.suggested_value, fields);
  if (correction.kind === 'address') {
    // Find the address with Google first, and fill the form only with
    // Google's version: street spelling, county, pin, what3words, plus code.
    try {
      const { data } = await axios.post<FoundAddress>(
        voiceReviewUrl('geocode'),
        correction.suggested_value,
      );
      changes = [
        ...(formChanges(correction, data, fields) ?? []),
        ...addressExtras(data),
      ];
    } catch (error) {
      problems.value[correction.id] = getErrorMessage(error);
      return;
    }
  }
  if (!changes) return;
  await caseForm.value.applyChanges(changes, false);
  delete problems.value[correction.id];
  usedInForm.value = new Set(usedInForm.value).add(correction.id);
}

function moveTarget(correction: VoiceCorrection) {
  return review.value?.worksite &&
    !newCase.value &&
    correction.status === 'open'
    ? incidentMove(correction)
    : undefined;
}

async function moveIncident(correction: VoiceCorrection) {
  const target = moveTarget(correction);
  if (!target || !caseForm.value) return;
  const answer = await confirmDialog({
    title: t('~~Move case'),
    content: t(
      '~~Move case {number} to {name}? It gets a new case number. Unsaved edits in the form are saved too.',
      { number: review.value?.worksite?.case_number, name: target.name },
    ),
    actions: {
      no: { text: t('actions.cancel'), type: 'outline' },
      yes: { text: t('~~Move case'), type: 'solid' },
    },
  });
  if (answer !== 'yes') return;
  const caseNumber = await caseForm.value.moveToIncident(target.incidentId);
  if (!caseNumber) return;
  try {
    await axios.post(voiceReviewUrl(`corrections/${correction.id}/resolve`), {
      applied_value: {
        incident_id: target.incidentId,
        incident_name: target.name,
        case_number: caseNumber,
        summary: `${target.name} (${caseNumber})`,
      },
    });
    usedInForm.value = new Set();
    await load();
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
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
    void loadSessionTurns(data.session.id);
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

let turnsLoadedFor: number | undefined;
// Only the console call has the time of each line; the review can go without.
async function loadSessionTurns(sessionId: number) {
  if (turnsLoadedFor === sessionId) return;
  turnsLoadedFor = sessionId;
  try {
    const { data } = await axios.get<SessionDetail>(
      sessionsUrl(String(sessionId)),
    );
    sessionTurns.value = data.speech_turns ?? [];
  } catch {
    sessionTurns.value = [];
  }
}

async function undo(correction: VoiceCorrection) {
  const answer = await confirmDialog({
    title: t('~~Undo this fix'),
    content: t(
      '~~Put the case back to what it was before this fix? If someone changed the case since, the undo stops.',
    ),
    actions: {
      no: { text: t('actions.cancel'), type: 'outline' },
      yes: { text: t('~~Undo'), type: 'solid' },
    },
  });
  if (answer !== 'yes') return;
  await act(correction, 'undo');
  // The undo can unlink a case, so the call shows its cases again.
  if (!problems.value[correction.id]) await load();
}

async function act(
  correction: VoiceCorrection,
  action: CorrectionAction,
  value?: unknown,
) {
  // A dismissal carries its reason; the other actions carry a value.
  let body: Record<string, unknown> = {};
  if (action === 'dismiss' && value) body = { reason: value };
  else if (action !== 'dismiss' && value !== undefined) body = { value };
  try {
    const { data } = await axios.post<VoiceCorrection>(
      voiceReviewUrl(`corrections/${correction.id}/${action}`),
      body,
    );
    Object.assign(correction, data);
    delete problems.value[correction.id];
    if (action === 'apply' || action === 'undo') reloadCaseForm();
  } catch (error) {
    problems.value[correction.id] = getErrorMessage(error);
  }
}

// Run the reviewer again on this call, for example after the reviewer
// changed. Open issues are replaced; fixed and dismissed ones stay.
async function reviewAgain() {
  if (!review.value) return;
  try {
    await axios.post(voiceReviewUrl('backfill'), {
      session: review.value.session.id,
      force: true,
    });
    $toasted.success(
      t('~~The call is queued for review. Reload in a minute for the result.'),
    );
  } catch (error) {
    $toasted.error(getErrorMessage(error));
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

// Keys, unless the person is typing: j and k move between findings, a
// accepts the one-click fix, d starts a dismissal.
const orderedIds = computed(() =>
  groups.value.flatMap((group: { items: VoiceCorrection[] }) =>
    group.items.map((c: VoiceCorrection) => c.id),
  ),
);

function moveSelection(step: 1 | -1) {
  const ids = orderedIds.value;
  if (ids.length === 0) return;
  const at =
    selectedId.value === undefined ? -1 : ids.indexOf(selectedId.value);
  const next =
    at === -1
      ? step === 1
        ? 0
        : ids.length - 1
      : Math.min(ids.length - 1, Math.max(0, at + step));
  selectedId.value = ids[next];
  void nextTick(() =>
    document
      .querySelector(`[data-correction-id="${ids[next]}"]`)
      ?.scrollIntoView?.({ block: 'nearest' }),
  );
}

function isTyping(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return Boolean(
    element?.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(element?.tagName ?? ''),
  );
}

function onKeydown(event: KeyboardEvent) {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    isTyping(event.target) ||
    !review.value
  ) {
    return;
  }
  const selected = review.value.corrections.find(
    (c: VoiceCorrection) => c.id === selectedId.value,
  );
  switch (event.key) {
    case 'j': {
      moveSelection(1);
      break;
    }
    case 'k': {
      moveSelection(-1);
      break;
    }
    case 'a': {
      if (selected?.simple && selected.status === 'open') {
        void act(selected, 'apply');
      }
      break;
    }
    case 'd': {
      if (selected?.status === 'open') cards.get(selected.id)?.startDismiss();
      break;
    }
  }
}
useEventListener(window, 'keydown', onKeydown);

watch(() => props.reviewId, load, { immediate: true });
</script>
