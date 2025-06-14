<template>
  <div class="bg-white p-3 shadow text-sm flex-grow flex flex-col">
    <!-- Display any validation errors -->
    <div class="flex-grow">
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
      <template v-if="worksite?.id">
        <!-- Worksite Info -->
        <base-text variant="h2" :weight="600" class="mb-2">
          {{ t('calendar.worksite_info') }}
        </base-text>
        <div class="mb-3 text-gray-700">
          <base-text variant="body" weight="600" class="mr-1">
            {{ t('calendar.worksite') }}:
          </base-text>
          <base-text variant="body">
            {{ worksite.case_number }} - {{ worksite.name }}
          </base-text>
        </div>

        <!-- Select Work Types -->
        <base-text variant="h3" :weight="600" class="mb-2">
          {{ t('calendar.select_work_types') }}
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
          {{ t('calendar.use_same_time_for_all') }}
        </base-text>
        <div class="mb-5">
          <base-checkbox
            v-model="sameTimeForAll"
            data-testid="testSameTimeForAll"
          >
            {{ t('calendar.use_same_time_for_all') }}
          </base-checkbox>
        </div>
      </template>

      <!-- Time pickers & Team (common) -->
      <div v-if="sameTimeForAll" class="flex flex-col gap-3">
        <div>
          <base-text variant="body" weight="600" class="block mb-1">
            {{ t('calendar.start_time') }}
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
            {{ t('calendar.end_time') }}
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
            {{ t('calendar.select_team') }}
          </base-text>
          <base-select
            v-model="commonTeam"
            data-testid="testCommonTeamSelect"
            :placeholder="t('calendar.select_team')"
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
              {{ wt.work_type }} - {{ t('calendar.time_schedule') }}
            </base-text>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <base-text variant="body" weight="600" class="block mb-1">
                  {{ t('calendar.start_time') }}
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
                  {{ t('calendar.end_time') }}
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
                {{ t('calendar.select_team') }}
              </base-text>
              <base-select
                v-model="individualTeams[wt.id]"
                :data-testid="`testTeamSelect-${wt.id}`"
                :placeholder="t('calendar.select_team')"
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
      <div class="mt-2">
        <base-text variant="h2" :weight="600" class="mb-2">
          {{ t('calendar.notes') }}
        </base-text>
        <div class="mb-5">
          <base-input
            v-model="notes"
            text-area
            data-testid="testScheduleNotes"
            class="w-full placeholder-crisiscleanup-dark-200 outline-none resize-none"
            :placeholder="t('calendar.add_notes_here')"
            rows="4"
          />
        </div>
      </div>
    </div>
    <!-- Action buttons -->
    <div class="flex justify-between gap-2">
      <base-button
        variant="outline"
        data-testid="testCancelButton"
        :text="t('actions.cancel')"
        :action="closeDialog"
        size="large"
        class="flex-grow"
      />
      <base-button
        variant="solid"
        data-testid="testSaveButton"
        :text="t('actions.save')"
        :show-spinner="saving"
        :disabled="selectedWorkTypeIds.length === 0"
        :action="saveSchedules"
        size="large"
        class="flex-grow"
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
import type Team from '@/models/Team';
import useEmitter from '@/hooks/useEmitter';
import type { WorkTypeSchedule } from '@/models/types';

interface WorkType {
  id: number;
  work_type: string;
}

interface Worksite {
  id: number;
  case_number: string;
  name: string;
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
    validationErrors.value.push(t('calendar.must_select_work_type'));
  }

  if (sameTimeForAll.value) {
    if (!commonStartAt.value) {
      validationErrors.value.push(t('calendar.start_time_required'));
    }
    if (!commonEndAt.value) {
      validationErrors.value.push(t('calendar.end_time_required'));
    }
    if (
      commonStartAt.value &&
      commonEndAt.value &&
      moment(commonStartAt.value).isSameOrAfter(moment(commonEndAt.value))
    ) {
      validationErrors.value.push(t('calendar.start_time_before_end_time'));
    }
  } else {
    selectedWorkTypeIds.value.forEach((wtId: number) => {
      const start = individualTimes.value[wtId]?.start;
      const end = individualTimes.value[wtId]?.end;

      if (!start) {
        validationErrors.value.push(t('calendar.start_time_missing'));
      }
      if (!end) {
        validationErrors.value.push(t('calendar.end_time_missing'));
      }
      if (start && end && moment(start).isSameOrAfter(moment(end))) {
        validationErrors.value.push(
          t('calendar.start_time_before_end_time_for_work_type_id', {
            id: wtId,
          }),
        );
      }
    });
  }
  return validationErrors.value.length === 0;
}

const resetFormValues = () => {
  sameTimeForAll.value = true;
  commonStartAt.value = '';
  commonEndAt.value = '';
  commonTeam.value = null;
  individualTimes.value = {};
  individualTeams.value = {};
  selectedWorkTypeIds.value = [];
  notes.value = '';
  validationErrors.value = [];
};

function closeDialog() {
  resetFormValues();
  emits('close');
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
      (id: number) => id !== workTypeId,
    );
    delete individualTimes.value[workTypeId];
    delete individualTeams.value[workTypeId];
  }
}

const getTeams = async () => {
  const { data } = await axios.get(
    `/teams?incident=${currentIncidentId.value}`,
  );
  teams.value = data.results as Team[];
};

async function saveSchedules() {
  if (!validateForm()) {
    toast.error(t('info.please_fix_errors_on_save'));
    return;
  }
  if (!worksite || selectedWorkTypeIds.value.length === 0) return;
  saving.value = true;

  const payloads: any[] = sameTimeForAll.value
    ? [
        {
          worksite_work_types_ids: selectedWorkTypeIds.value,
          start: moment(commonStartAt.value).toISOString(),
          end: moment(commonEndAt.value).toISOString(),
          team: commonTeam.value,
          notes: notes.value,
        },
      ]
    : selectedWorkTypeIds.value.map((wtId: number) => ({
        worksite_work_types_ids: [wtId],
        start: moment(individualTimes.value[wtId].start).toISOString(),
        end: moment(individualTimes.value[wtId].end).toISOString(),
        team: individualTeams.value[wtId],
        notes: notes.value,
      }));

  try {
    const results = await Promise.all(
      payloads.map((p: WorkTypeSchedule) =>
        axios.post('/worksite_work_types_schedule', p),
      ),
    );
    toast.success(t('calendar.schedules_saved_successfully'));
    emits(
      'saved',
      results.map((r) => r.data),
    );
  } catch (error) {
    toast.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.initialData,
  () => {
    if (props.initialData) {
      commonStartAt.value = props.initialData.start;
      commonEndAt.value = props.initialData.end;
    }
  },
);

onMounted(() => {
  getTeams();
});
</script>
