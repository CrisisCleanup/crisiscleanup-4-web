<template>
  <div class="bg-white p-3 shadow text-sm">
    <!-- Display any validation errors -->
    <div
      v-if="validationErrors.length > 0"
      class="mb-3 bg-red-300 text-red-700 p-2 rounded"
    >
      <ul>
        <li v-for="(error, index) in validationErrors" :key="index">
          {{ error }}
        </li>
      </ul>
    </div>

    <!-- Worksite Info -->
    <base-text variant="h2" :weight="600" class="mb-2">
      {{ t('~~Worksite Information') }}
    </base-text>
    <div class="mb-3 text-gray-700">
      <base-text variant="body" weight="600" class="mr-1">
        {{ t('~~Worksite') }}:
      </base-text>
      <base-text variant="body">
        {{ worksite.case_number }} - {{ worksite.name }}
      </base-text>
    </div>

    <!-- Select Work Types -->
    <base-text variant="h3" :weight="600" class="mb-2">
      {{ t('~~Select Work Types') }}
    </base-text>
    <div class="mb-5">
      <div class="grid grid-cols-2 gap-y-2">
        <div
          v-for="wt in worksite.work_types"
          :key="wt.id"
          class="flex items-center"
        >
          <base-checkbox
            :model-value="selectedWorkTypeIds.includes(wt.id)"
            :data-testid="`testCheckboxWT-${wt.id}`"
            @update:model-value="handleWorkTypeCheckbox($event, wt.id)"
          >
            {{ $t(`workType.${wt.work_type}`) }}
          </base-checkbox>
        </div>
      </div>
    </div>

    <!-- Same Time For All -->
    <base-text variant="h3" :weight="600" class="mb-2">
      {{ t('~~Use the same time for all') }}
    </base-text>
    <div class="mb-5">
      <base-checkbox v-model="sameTimeForAll" data-testid="testSameTimeForAll">
        {{ t('~~Use the same time for all') }}
      </base-checkbox>
    </div>

    <!-- Time pickers & Team (common) -->
    <div v-if="sameTimeForAll" class="grid grid-cols-2 gap-4 mb-5">
      <div>
        <base-text variant="body" weight="600" class="block mb-1">
          {{ t('~~Start Time') }}
        </base-text>
        <datepicker
          v-model="commonStartAt"
          data-testid="testCommonStartAt"
          format="yyyy-MM-dd HH:mm"
          :enable-time-picker="true"
          auto-apply
          class="w-full"
        />
      </div>
      <div>
        <base-text variant="body" weight="600" class="block mb-1">
          {{ t('~~End Time') }}
        </base-text>
        <datepicker
          v-model="commonEndAt"
          data-testid="testCommonEndAt"
          format="yyyy-MM-dd HH:mm"
          :enable-time-picker="true"
          auto-apply
          class="w-full"
        />
      </div>

      <!-- Team selection (only one, used for all work types) -->
      <div class="col-span-2">
        <base-text variant="body" weight="600" class="block mb-1">
          {{ t('~~Select Team') }}
        </base-text>
        <base-select
          v-model="commonTeam"
          data-testid="testCommonTeamSelect"
          :placeholder="t('~~Select a Team')"
          class="w-full"
          :options="teams"
          item-key="id"
          label="name"
          select-classes="p-1"
        />
      </div>
    </div>

    <!-- Time pickers & Team (individual) -->
    <div v-else>
      <div v-for="wt in worksite.work_types" :key="wt.id">
        <div
          v-if="selectedWorkTypeIds.includes(wt.id)"
          class="mb-5 border p-3 rounded"
        >
          <base-text variant="h4" :weight="600" class="mb-2">
            {{ wt.work_type }} - {{ t('~~Time Schedule') }}
          </base-text>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <base-text variant="body" weight="600" class="block mb-1">
                {{ t('~~Start Time') }}
              </base-text>
              <datepicker
                v-model="individualTimes[wt.id].start"
                :data-testid="`testStartAt-${wt.id}`"
                format="yyyy-MM-dd HH:mm"
                :enable-time-picker="true"
                auto-apply
                class="w-full"
              />
            </div>
            <div>
              <base-text variant="body" weight="600" class="block mb-1">
                {{ t('~~End Time') }}
              </base-text>
              <datepicker
                v-model="individualTimes[wt.id].end"
                :data-testid="`testEndAt-${wt.id}`"
                format="yyyy-MM-dd HH:mm"
                :enable-time-picker="true"
                auto-apply
                class="w-full"
              />
            </div>
          </div>

          <!-- Team selection (specific for each work type) -->
          <div class="mt-3">
            <base-text variant="body" weight="600" class="block mb-1">
              {{ t('~~Select Team') }}
            </base-text>
            <base-select
              v-model="individualTeams[wt.id]"
              :data-testid="`testTeamSelect-${wt.id}`"
              :placeholder="t('~~Select a Team')"
              class="w-full"
              :options="teams"
              item-key="id"
              label="name"
              select-classes="p-1"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <base-text variant="h3" :weight="600" class="mb-2">
      {{ t('~~Notes') }}
    </base-text>
    <div class="mb-5">
      <base-input
        v-model="notes"
        text-area
        data-testid="testScheduleNotes"
        class="w-full border border-crisiscleanup-dark-100 placeholder-crisiscleanup-dark-200 outline-none resize-none"
        :placeholder="t('~~Write any notes here...')"
        rows="4"
      />
    </div>

    <!-- Action buttons -->
    <div
      class="sticky bottom-0 bg-white border-t border-gray-200 py-3 flex justify-end gap-4"
    >
      <base-button
        variant="outline"
        data-testid="testCancelButton"
        :text="t('~~Cancel')"
        :action="closeDialog"
        size="md"
      />
      <base-button
        variant="solid"
        data-testid="testSaveButton"
        :text="t('~~Save')"
        :show-spinner="saving"
        :disabled="selectedWorkTypeIds.length === 0"
        :action="saveSchedules"
        size="md"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import moment from 'moment';
import { getErrorMessage } from '@/utils/errors';
import { useCurrentIncident } from '@/hooks';
import Team from '@/models/Team';
import useEmitter from '@/hooks/useEmitter';
import type { WorkTypeSchedule } from '@/models/types';

interface WorkType {
  id: number;
  work_type: string;
}

interface Worksite {
  id: number;
  case_number: string;
  work_types: WorkType[];
}

const props = defineProps<{
  worksite: Worksite;
  initialData?: { start: string; end: string };
}>();
const emits = defineEmits(['close', 'saved']);

const { t } = useI18n();
const toast = useToast();
const saving = ref(false);
const { currentIncidentId } = useCurrentIncident();
const { emitter } = useEmitter();

const worksite = props.worksite;
const teams = ref<Team[]>([]);
const notes = ref('');
const selectedWorkTypeIds = ref<number[]>([]);

const sameTimeForAll = ref(true);
const commonStartAt = ref(props.initialData?.start ?? '');
const commonEndAt = ref(props.initialData?.end ?? '');
const commonTeam = ref<number | null>(null);

const individualTimes = ref<Record<number, { start: string; end: string }>>({});
const individualTeams = ref<Record<number, number | null>>({});

const validationErrors = ref<string[]>([]);

function validateForm(): boolean {
  validationErrors.value = [];

  if (selectedWorkTypeIds.value.length === 0) {
    validationErrors.value.push(t('~~You must select at least one Work Type.'));
  }

  if (sameTimeForAll.value) {
    if (!commonStartAt.value) {
      validationErrors.value.push(t('~~Common start time is required.'));
    }
    if (!commonEndAt.value) {
      validationErrors.value.push(t('~~Common end time is required.'));
    }
    if (
      commonStartAt.value &&
      commonEndAt.value &&
      moment(commonStartAt.value).isSameOrAfter(moment(commonEndAt.value))
    ) {
      validationErrors.value.push(
        t('~~Common start time must be before common end time.'),
      );
    }
  } else {
    selectedWorkTypeIds.value.forEach((wtId: string) => {
      const start = individualTimes.value[wtId]?.start;
      const end = individualTimes.value[wtId]?.end;

      if (!start) {
        validationErrors.value.push(t('~~Start time is missing'));
      }
      if (!end) {
        validationErrors.value.push(t('~~End time is missing'));
      }
      if (start && end && moment(start).isSameOrAfter(moment(end))) {
        validationErrors.value.push(
          t('~~Start time must be before end time for Work Type ID {id}.', {
            id: wtId,
          }),
        );
      }
    });
  }
  return validationErrors.value.length === 0;
}

function closeDialog() {
  emitter.emit('modal_component:close', 'add_schedule_dialog');
}

function handleWorkTypeCheckbox(isChecked: boolean, workTypeId: number) {
  if (isChecked) {
    if (!selectedWorkTypeIds.value.includes(workTypeId)) {
      selectedWorkTypeIds.value.push(workTypeId);
    }
    if (!individualTimes.value[workTypeId]) {
      individualTimes.value[workTypeId] = { start: '', end: '' };
    }
    if (!individualTeams.value[workTypeId]) {
      individualTeams.value[workTypeId] = null;
    }
  } else {
    selectedWorkTypeIds.value = selectedWorkTypeIds.value.filter(
      (id: string) => id !== workTypeId,
    );
    delete individualTimes.value[workTypeId];
    delete individualTeams.value[workTypeId];
  }
}

const getTeams = async () => {
  const results = await Team.api().get(
    `/teams?incident=${currentIncidentId.value}`,
    {
      dataKey: 'results',
    },
  );
  teams.value = (results.entities?.teams || []) as Team[];
};

async function saveSchedules() {
  if (!validateForm()) {
    toast.error(t('~~Please fix form errors before saving.'));
    return;
  }
  if (!worksite || selectedWorkTypeIds.value.length === 0) return;
  saving.value = true;

  const payloads = selectedWorkTypeIds.value.map((wtId: string) => {
    let start, end, team_id;
    if (sameTimeForAll.value) {
      start = moment(commonStartAt.value).toISOString();
      end = moment(commonEndAt.value).toISOString();
      team_id = commonTeam.value;
    } else {
      start = moment(individualTimes.value[wtId].start).toISOString();
      end = moment(individualTimes.value[wtId].end).toISOString();
      team_id = individualTeams.value[wtId];
    }
    return {
      worksite_work_type: wtId,
      start,
      end,
      team: team_id,
      notes: notes.value,
    };
  });

  try {
    await Promise.all(
      payloads.map((p: WorkTypeSchedule) =>
        axios.post('/worksite_work_types_schedule', p),
      ),
    );
    toast.success(t('~~Schedules saved successfully'));
    closeDialog();
  } catch (error) {
    toast.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  getTeams();
});
</script>
