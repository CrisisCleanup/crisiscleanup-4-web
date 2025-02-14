<template>
  <div class="bg-white p-3 shadow text-sm">
    <tabs tab-details-classes="h-120 mt-3 overflow-auto">
      <tab name="View">
        <div v-if="loading" class="text-gray-600">
          {{ $t('info.loading') }}...
        </div>
        <div v-if="!schedule">
          {{ $t('info.no_data_found') }}
        </div>
        <div v-else class="mb-4">
          <base-text variant="h2" :weight="600" class="">
            {{ event.title }}
          </base-text>
          <div>{{ event.location }}</div>

          <div class="text-crisiscleanup-dark-300">
            {{ event.description }}
          </div>

          <LocationViewer
            v-if="worksite"
            :key="JSON.stringify(worksite.location)"
            :location="worksite.location"
            data-testid="testLocationViewerDiv"
            class="h-84 mt-4 w-full"
            :allow-reposition="false"
            :custom-svg-icon="markerIcon"
          />

          <!-- Actions (Claim, Print, Share)  -->
          <div class="flex justify-start gap-1 mt-4">
            <base-button
              variant="solid"
              size="small"
              :text="$t('actions.print')"
              :action="() => printWorksite(worksite.id, '')"
              ccu-icon="print"
              icon-size="small"
            />
            <base-button
              variant="solid"
              size="small"
              :text="$t('~~Send to me')"
              :action="sendWorksite"
              ccu-icon="share"
              icon-size="small"
            />
            <base-button
              variant="solid"
              size="small"
              :text="$t('~~Open in google maps')"
              :action="openInGoogleMaps"
              ccu-icon="map"
              icon-size="small"
            />
          </div>
        </div>
      </tab>
      <tab name="Edit">
        <div v-if="schedule" class="flex flex-col space-y-3">
          <!-- Start time -->
          <div>
            <base-text variant="body" weight="600" class="block mb-1">
              {{ $t('scheduleFields.startTime') }}
            </base-text>
            <datepicker
              v-model="form.start"
              format="yyyy-MM-dd HH:mm"
              :enable-time-picker="true"
              auto-apply
              class="w-full"
            />
          </div>

          <!-- End time -->
          <div>
            <base-text variant="body" weight="600" class="block mb-1">
              {{ $t('scheduleFields.endTime') }}
            </base-text>
            <datepicker
              v-model="form.end"
              format="yyyy-MM-dd HH:mm"
              :enable-time-picker="true"
              auto-apply
              class="w-full"
            />
          </div>

          <!-- Team selection -->
          <div>
            <base-text variant="body" weight="600" class="block mb-1">
              {{ $t('scheduleFields.selectTeam') }}
            </base-text>
            <base-select
              v-model="form.team"
              :placeholder="$t('teams.select_a_team')"
              class="w-full"
              :options="teams"
              item-key="id"
              label="name"
              select-classes="p-1"
            />
          </div>

          <!-- Notes -->
          <div>
            <base-text variant="body" weight="600" class="block mb-1">
              {{ $t('scheduleFields.notes') }}
            </base-text>
            <base-input
              v-model="form.notes"
              text-area
              class="w-full border border-crisiscleanup-dark-100 placeholder-crisiscleanup-dark-200 outline-none resize-none"
              :placeholder="$t('scheduleFields.notes_placeholder')"
              rows="3"
            />
          </div>
        </div>
      </tab>
    </tabs>
    <div
      class="sticky bottom-0 bg-white border-t border-gray-200 py-3 flex justify-end gap-2"
    >
      <base-button :action="closeDialog" variant="outline" size="md">
        {{ $t('actions.cancel') }}
      </base-button>
      <base-button
        variant="outline"
        size="md"
        :text="$t('actions.delete')"
        :action="deleteSchedule"
        :disabled="loading || !schedule"
      />
      <base-button
        variant="solid"
        size="md"
        :text="$t('actions.save')"
        :show-spinner="saving"
        :disabled="loading || !schedule"
        :action="updateSchedule"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import moment from 'moment';
import { getErrorMessage } from '@/utils/errors';
import { useCurrentIncident } from '@/hooks';
import Team from '@/models/Team';
import useEmitter from '@/hooks/useEmitter';
import LocationViewer from '@/components/locations/LocationViewer.vue';
import Worksite from '@/models/Worksite';
import { forceFileDownload } from '@/utils/downloads';
import { templates } from '@/icons/icons_templates';
import useCurrentUser from '@/hooks/useCurrentUser';
import useWorktypeImages from '@/hooks/worksite/useWorktypeImages';
import BaseButton from '@/components/BaseButton.vue';

/**
 * The schedule object might look like this from your API:
 * {
 *   id: number;
 *   start: string; // ISO date
 *   end: string;   // ISO date
 *   team: number|null;
 *   notes?: string;
 *   worksite_work_types?: WorksiteWorkType[]; // new many-to-many field
 *   work_type_key?: string; // legacy field
 *   worksite_id: number;
 *   ...
 * }
 */
interface ScheduleItem {
  id: number;
  start: string;
  end: string;
  team?: number | null;
  notes?: string;
  worksite_work_types?: { work_type_key?: string }[];
  work_type_key?: string;
  worksite_id: number;
}

/** Props: we receive the schedule ID via event prop. */
const props = defineProps<{
  event: Record<string, any>;
}>();

const emits = defineEmits(['close', 'saved', 'deleted']);

const { t } = useI18n();
const toast = useToast();
const { currentIncidentId } = useCurrentIncident();
const { currentUser } = useCurrentUser();
const { emitter } = useEmitter();
const { getBasicWorktypeSVG } = useWorktypeImages();

const loading = ref(true);
const saving = ref(false);

const schedule = ref<ScheduleItem | null>(null);
const teams = ref<Team[]>([]);
const worksite = ref<Worksite | null>(null);

const form = ref({
  start: '',
  end: '',
  team: null as number | null,
  notes: '',
});

// Update markerIcon to use the first work type key from the nested array if available
const markerIcon = computed(() => {
  let workTypeKey = null;
  if (schedule.value) {
    workTypeKey =
      schedule.value.worksite_work_types &&
      schedule.value.worksite_work_types.length > 0
        ? schedule.value.worksite_work_types[0].work_type_key
        : schedule.value.work_type_key;
  }
  return getBasicWorktypeSVG(workTypeKey, 35);
});

function closeDialog() {
  emitter.emit('modal_component:close', 'edit_schedule_dialog');
}

async function fetchSchedule(id: number) {
  try {
    loading.value = true;
    const { data } = await axios.get(`/worksite_work_types_schedule/${id}`);
    schedule.value = data;
    // Pre-fill the form
    form.value.start = data.start
      ? moment(data.start).format('YYYY-MM-DD HH:mm')
      : '';
    form.value.end = data.end
      ? moment(data.end).format('YYYY-MM-DD HH:mm')
      : '';
    form.value.team = data.team || null;
    form.value.notes = data.notes || '';
  } catch (error) {
    toast.error(getErrorMessage(error));
    schedule.value = null;
  } finally {
    loading.value = false;
  }
}

async function fetchTeams() {
  try {
    const response = await Team.api().get(
      `/teams?incident=${currentIncidentId.value}`,
      { dataKey: 'results' },
    );
    teams.value = (response.entities?.teams || []) as Team[];
  } catch (error) {
    console.error(error);
  }
}

async function fetchWorksite() {
  if (!schedule.value) return;
  try {
    const { data } = await axios.get(
      `/worksites/${schedule.value.worksite_id}`,
    );
    worksite.value = data;
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}

async function updateSchedule() {
  if (!schedule.value) return;
  saving.value = true;

  const payload = {
    start: moment(form.value.start).toISOString(),
    end: moment(form.value.end).toISOString(),
    team: form.value.team,
    notes: form.value.notes,
  };

  try {
    await axios.patch(
      `/worksite_work_types_schedule/${schedule.value.id}`,
      payload,
    );
    toast.success(t('actions.saved_successfully'));
    emits('saved'); // Let the parent know an update occurred
    closeDialog();
  } catch (error) {
    toast.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function deleteSchedule() {
  if (!schedule.value) return;
  try {
    await axios.delete(`/worksite_work_types_schedule/${schedule.value.id}`);
    toast.success(t('actions.deleted_successfully'));
    emits('deleted'); // Let parent know it's deleted
    closeDialog();
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}

async function printWorksite(id: number) {
  const file = await Worksite.api().printWorksite(id, '');
  forceFileDownload(file.response);
}

async function sendWorksite() {
  if (!worksite.value) return;

  await Worksite.api().shareWorksite(
    worksite.value.id,
    [currentUser.value.email],
    [currentUser.value.mobile.replaceAll(/\D/g, '')],
    '',
    '',
  );

  toast.success(t('~~Worksite details sent to you'));
}

function openInGoogleMaps() {
  if (!worksite.value) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${worksite.value.location.coordinates[1]},${worksite.value.location.coordinates[0]}`;
  window.open(url, '_blank');
}

onMounted(async () => {
  await fetchTeams();
  await fetchSchedule(props.event.id);
  await fetchWorksite();
});
</script>
