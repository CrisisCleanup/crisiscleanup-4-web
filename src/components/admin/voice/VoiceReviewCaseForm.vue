<template>
  <div
    class="flex h-[80vh] flex-col overflow-hidden rounded border border-crisiscleanup-grey-100"
    data-testid="testVoiceReviewCaseForm"
  >
    <Spinner v-if="!incidentLoaded" />
    <VoiceReviewMiniMap
      v-if="incidentLoaded"
      :coordinates="pinCoordinates"
      :boundaries="boundaries"
    />
    <div v-if="incidentLoaded" class="min-h-0 flex-1">
      <WorksiteForm
        ref="form"
        :key="formKey"
        :worksite-id="worksiteId ? String(worksiteId) : null"
        :incident-id="String(incidentId)"
        :is-editing="Boolean(worksiteId)"
        :data-prefill="prefill"
        :use-draft="false"
        disable-claim-and-save
        @saved-worksite="onSaved"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';
import Incident from '@/models/Incident';
import Worksite from '@/models/Worksite';
import VoiceReviewMiniMap from './VoiceReviewMiniMap.vue';
import { getErrorMessage } from '@/utils/errors';
import {
  missedCasePrefill,
  type FormChange,
  type FormFieldInfo,
  type MissedCaseDetails,
} from '@/hooks/voice/voiceReviews';

// The case form is large; load it only when a review shows it.
const WorksiteForm = defineAsyncComponent(
  () => import('@/components/work/WorksiteForm.vue'),
);

/** The `WorksiteForm` members the auditor uses (returned from its setup). */
interface CaseFormApi {
  ready: boolean;
  worksite?: { location?: { coordinates?: number[] } };
  dynamicFields: Record<string, unknown>;
  updateWorksite: (value: unknown, key: string) => void;
  saveWorksite: (reload?: boolean) => Promise<number | false | undefined>;
  findPotentialGeocode: () => Promise<void>;
}

const props = defineProps<{
  incidentId: number;
  /** Edit this case. Without it, the form makes a new case. */
  worksiteId?: number;
  /** For a new case: what the caller said. */
  missedCase?: MissedCaseDetails;
}>();
const emit = defineEmits<{ saved: [worksite: { id: number }] }>();

const $toasted = useToast();
const form = ref<CaseFormApi>();
const formKey = ref(0);
const incidentLoaded = ref(false);

const formFields = computed<FormFieldInfo[]>(() =>
  incidentLoaded.value
    ? ((Incident.find(String(props.incidentId))?.form_fields ??
        []) as FormFieldInfo[])
    : [],
);
// The pin follows the form: the saved location, a geocoded address, or a drag.
const pinCoordinates = computed(
  () => form.value?.worksite?.location?.coordinates,
);
const boundaries = computed<object[]>(() => {
  if (!incidentLoaded.value) return [];
  const incident = Incident.find(String(props.incidentId)) as
    | { locationModels?: { poly?: object; geom?: object }[] }
    | undefined;
  return (incident?.locationModels ?? []).flatMap((location) => {
    const geometry = location.poly ?? location.geom;
    return geometry ? [geometry] : [];
  });
});
const prefill = computed(() =>
  props.worksiteId ? {} : missedCasePrefill(props.missedCase, formFields.value),
);

async function loadIncident() {
  incidentLoaded.value = false;
  try {
    await Incident.api().fetchById(String(props.incidentId));
    incidentLoaded.value = true;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

function onSaved(worksite: { id: number }) {
  emit('saved', worksite);
}

/** Put suggestions in the form. The admin checks them and saves the case. */
async function applyChanges(changes: FormChange[], geocode = false) {
  const api = form.value;
  if (!api?.ready) return;
  for (const change of changes) {
    if (change.target === 'worksite') {
      api.updateWorksite(change.value, change.key);
    } else {
      api.dynamicFields = { ...api.dynamicFields, [change.key]: change.value };
    }
  }
  // A new address needs a new map location before the case can save.
  if (geocode) await api.findPotentialGeocode();
}

/**
 * Move the case to another incident and save it, as the Work page does when
 * an address is in another disaster. The API gives it a new case number and
 * moves its form answers and work types. Returns the new case number.
 */
async function moveToIncident(incidentId: number) {
  const api = form.value;
  if (!api?.ready) return;
  api.updateWorksite(incidentId, 'incident');
  const savedId = await api.saveWorksite(false);
  // The save response updates the store; the form's copy keeps the old number.
  return savedId
    ? (Worksite.find(String(savedId)) as { case_number?: string } | null)
        ?.case_number
    : undefined;
}

/** Load the case again, after the API changed it. Unsaved edits are lost. */
function reload() {
  formKey.value += 1;
}

// A new case from the call has an address but no map location yet.
watch(
  () => form.value?.ready,
  async (ready: boolean | undefined) => {
    if (ready && !props.worksiteId && props.missedCase?.address) {
      await form.value?.findPotentialGeocode();
    }
  },
);

watch(() => props.incidentId, loadIncident, { immediate: true });

defineExpose({ applyChanges, moveToIncident, reload, formFields });
</script>
