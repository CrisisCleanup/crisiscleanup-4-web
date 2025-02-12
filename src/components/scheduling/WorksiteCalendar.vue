<template>
  <div class="flex flex-col md:flex-row h-full mb-20 md:mb-0">
    <div class="flex flex-col flex-grow relative overflow-y-auto w-full">
      <div class="sticky top-0 bg-white z-10 p-2">
        <div class="flex flex-wrap items-center gap-2 mt-10 md:mt-0">
          <ccu-icon
            type="calendar"
            size="md"
            fa
            :action="() => setView('calendar')"
            :class="
              showCalendar
                ? 'text-primary-light'
                : 'text-crisiscleanup-dark-100'
            "
          />

          <ccu-icon
            type="map"
            size="md"
            class="hidden md:inline-flex"
            fa
            :action="() => setView('map')"
            :class="
              showMap ? 'text-primary-light' : 'text-crisiscleanup-dark-100'
            "
          />

          <ccu-icon
            type="list"
            size="md"
            fa
            :action="() => setView('upcoming')"
            :class="
              showUpcoming
                ? 'text-primary-light'
                : 'text-crisiscleanup-dark-100'
            "
          />

          <!-- Worksite Search -->
          <WorksiteSearchInput
            data-testid="testWorksiteSearch"
            icon="filters"
            display-property="name"
            :placeholder="$t('~~Search')"
            size="medium"
            skip-validation
            use-recents
            :query="{
              work_type__claimed_by_or_isnull:
                [
                  ...currentUser.organization.affiliates,
                  currentUser.organization.id,
                ].join(',') + ',true',
            }"
            @selected-existing="
              (ws: Worksite) => {
                selectedWorksite = ws;
              }
            "
          />

          <!-- (Optional) AddFromList -->
          <AddFromList
            model-type="worksite_worksites"
            :title="$t('~~Select from List')"
            class="text-sm"
            :incident="currentIncidentId"
            @add-item="
              (ws: Worksite) => {
                selectedWorksite = ws;
              }
            "
          />

          <!-- Select from map icon -->
          <base-button
            ccu-icon="go-case"
            icon-size="medium"
            class="py-0.5 px-3 text-sm"
            :text="$t('~~Select from Map')"
            variant="outline"
            :action="openSelectFromMapDialog"
          />

          <!-- Currently selected case -->
          <div
            v-if="selectedWorksite"
            class="ml-auto flex items-center gap-2 bg-primary-light border border-primary-dark rounded px-3 py-1"
          >
            <base-text variant="body" weight="700" class="text-yellow-900">
              {{ t('~~Case') }}:
            </base-text>
            <base-text variant="body" weight="600" class="text-yellow-900">
              {{ selectedWorksite?.case_number }} - {{ selectedWorksite?.name }}
            </base-text>
            <ccu-icon
              type="times"
              size="sm"
              fa
              :action="() => (selectedWorksite = null)"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-2 mt-2">
          <div class="items-center gap-2">
            <base-text variant="body" weight="600">
              {{ t('~~Start Date') }}
            </base-text>
            <datepicker
              v-model="filterStartDate"
              format="yyyy-MM-dd"
              :enable-time-picker="false"
              auto-apply
              @update:model-value="fetchSchedules"
            />
          </div>

          <div class="items-center gap-2">
            <base-text variant="body" weight="600">
              {{ t('~~End Date') }}
            </base-text>
            <datepicker
              v-model="filterEndDate"
              format="yyyy-MM-dd"
              :enable-time-picker="false"
              auto-apply
              @update:model-value="fetchSchedules"
            />
          </div>

          <div class="items-center gap-2">
            <base-text variant="body" weight="600">
              {{ t('~~Team') }}
            </base-text>
            <base-select
              v-model="filterTeam"
              :options="teams"
              item-key="id"
              label="name"
              placeholder="All Teams"
              select-classes="p-1 border"
              class="w-72 h-10"
              @update:model-value="fetchSchedules"
            />
          </div>

          <v-popover placement="bottom-start">
            <base-button
              action="add"
              suffix-icon="caret-down"
              class="border border-1.5 border-black p-1 px-4 bg-white"
            >
              {{ $t('~~Actions') }}
            </base-button>

            <template #popper>
              <div class="flex flex-col">
                <base-button
                  text="Export CSV"
                  variant="bare"
                  icon-size="medium"
                  class="cursor-pointer hover:bg-primary-light px-6 py-2"
                  @click="exportToCSV"
                />
                <base-button
                  text="Export PDF"
                  variant="bare"
                  icon-size="medium"
                  class="cursor-pointer hover:bg-primary-light px-6 py-2"
                  @click="exportToPDF"
                />
                <base-button
                  text="Export iCal"
                  variant="bare"
                  icon-size="medium"
                  class="cursor-pointer hover:bg-primary-light px-6 py-2"
                  @click="exportToICS"
                />
                <base-button
                  text="Print Calendar"
                  variant="bare"
                  icon-size="medium"
                  class="cursor-pointer hover:bg-primary-light px-6 py-2"
                  @click="printCalendar"
                />
              </div>
            </template>
          </v-popover>
        </div>
      </div>
      <template v-if="showMap">
        <div class="h-full">
          <WorkTypeSchedulesMap
            :schedules="upcomingSchedules"
            @work-type-schedule-click="editEvent"
          />
        </div>
      </template>

      <template v-if="showCalendar">
        <ScheduleXCalendar :calendar-app="calendarApp" />
      </template>

      <template v-if="showUpcoming">
        <div class="p-4">
          <div class="flex justify-between items-center">
            <div class="mb-4 text-2xl font-bold">
              {{ t('~~Upcoming') }}
            </div>
          </div>

          <div v-if="upcomingSchedules.length > 0">
            <div
              v-for="schedule in upcomingSchedules"
              :key="schedule.id"
              class="mb-4 p-4 bg-white rounded-lg shadow flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
            >
              <div class="space-y-2">
                <div
                  class="text-lg font-semibold text-gray-800 flex items-center"
                >
                  {{ schedule.worksite_case_number }}
                  <span
                    v-if="schedule.work_type_key"
                    class="ml-2 text-sm text-gray-600"
                  >
                    ({{ $t(`workType.${schedule.work_type_key}`) }})
                  </span>
                </div>
                <p v-if="schedule.notes" class="text-gray-500">
                  {{ schedule.notes }}
                </p>
                <p class="text-sm text-gray-400">
                  <span class="font-medium text-gray-600">
                    {{ t('~~Address:') }}
                  </span>
                  {{ schedule.worksite_address }}
                </p>
              </div>

              <div class="text-right space-y-1">
                <p class="text-sm text-gray-500">
                  <span class="font-medium text-gray-700">
                    {{ t('~~Start:') }}
                  </span>
                  {{ moment(schedule.start).format('MMM DD, YYYY [at] HH:mm') }}
                </p>
                <p class="text-sm text-gray-500">
                  <span class="font-medium text-gray-700">
                    {{ t('~~End:') }}
                  </span>
                  {{ moment(schedule.end).format('MMM DD, YYYY [at] HH:mm') }}
                </p>
                <p
                  v-if="schedule.team_name"
                  class="text-sm mt-2 text-indigo-600 font-semibold"
                >
                  {{ schedule.team_name }}
                </p>

                <div class="flex gap-2 mt-2 justify-end">
                  <ccu-icon
                    type="edit"
                    size="sm"
                    fa
                    :action="() => editEvent(schedule)"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500">
            {{ t('~~No upcoming schedules found.') }}
          </div>
        </div>
      </template>
    </div>

    <div class="h-full md:w-108 w-full hidden md:block">
      <WorksiteForm
        ref="worksiteForm"
        :key="selectedWorksite?.id"
        :incident-id="String(currentIncidentId)"
        :worksite-id="selectedWorksite?.id"
        :is-editing="true"
      >
        <template v-if="selectedWorksite" #custom-header>
          <div class="text-left text-black flex items-center">
            <div class="mt-1 mr-1">
              {{ selectedWorksite.case_number }} - {{ selectedWorksite.name }}
            </div>
            <ccu-icon
              type="calendar"
              size="sm"
              fa
              :action="addCaseToSchedule"
            />
          </div>
          <div
            v-if="selectedWorksite.id"
            class="text-xs text-crisiscleanup-grey-700"
          >
            {{ t('~~Updated') }}
            {{ momentFromNow(selectedWorksite.updated_at) }}
          </div>
        </template>
      </WorksiteForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import moment from 'moment';
import { useI18n } from 'vue-i18n';

import { ScheduleXCalendar } from '@schedule-x/vue';
import '@schedule-x/theme-default/dist/index.css';

import {
  createCalendar,
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar';

import { createEventsServicePlugin } from '@schedule-x/events-service';
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop';
import { createResizePlugin } from '@schedule-x/resize';
import { createCurrentTimePlugin } from '@schedule-x/current-time';

import WorksiteForm from '@/components/work/WorksiteForm.vue';
import WorksiteSearchInput from '@/components/work/WorksiteSearchInput.vue';
import CcuIcon from '@/components/BaseIcon.vue';
import { useCurrentIncident } from '@/hooks';
import useDialogs from '@/hooks/useDialogs';
import AddScheduleDialog from '@/components/scheduling/AddScheduleDialog.vue';
import EditScheduleDialog from '@/components/scheduling/EditScheduleDialog.vue';
import type { WorkTypeSchedule } from '@/models/types';
import WorkTypeSchedulesMap from '@/components/scheduling/WorkTypeScheduleMap.vue';
import type Worksite from '@/models/Worksite';
import AddFromList from '@/pages/lists/AddFromList.vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import { momentFromNow } from '@/filters';
import Team from '@/models/Team';
import WorksiteMapPopup from '@/components/WorksiteMapPopup.vue';
import useEmitter from '@/hooks/useEmitter';
import BaseButton from '@/components/BaseButton.vue';
import jsPDF from 'jspdf';

export interface CalendarEvent {
  id: string | number;
  start: string;
  end: string;
  title?: string;
  description?: string;
  location?: string;
  people?: string[];
  calendarId?: string;
}

const { t } = useI18n();
const { currentIncidentId } = useCurrentIncident();
const { currentUser } = useCurrentUser();
const { component } = useDialogs();
const { emitter } = useEmitter();

const eventsServicePlugin = createEventsServicePlugin();
const dragAndDropPlugin = createDragAndDropPlugin();
const resizePlugin = createResizePlugin();
const currentTimePlugin = createCurrentTimePlugin();

const scheduleEvents = ref([]);
const upcomingSchedules = ref<WorkTypeSchedule[]>([]);
const selectedWorksite = ref<Worksite | null>(null);

const showMap = ref(false);
const showCalendar = ref(true);
const showUpcoming = ref(false);
function setView(view: string) {
  showMap.value = view === 'map';
  showCalendar.value = view === 'calendar';
  showUpcoming.value = view === 'upcoming';
}

const filterStartDate = ref<string>('');
const filterEndDate = ref<string>('');
const filterTeam = ref<number | null>(null);
const teams = ref<Team[]>([]);

function convertScheduleToEvent(item: WorkTypeSchedule) {
  const caseNumber = item.worksite_case_number || 'UnknownCase';
  const workType = item.work_type_key || 'UnknownWorkType';
  return {
    id: item.id,
    title: `${caseNumber} - ${t(`workType.${workType}`)}`,
    start: moment(item.start).format('YYYY-MM-DD HH:mm'),
    end: moment(item.end).format('YYYY-MM-DD HH:mm'),
    description: item.notes,
    location: item.worksite_address,
    people: item.team_name ? [item.team_name] : null,
  };
}

async function fetchSchedules() {
  try {
    const params: any = {};
    if (filterStartDate.value) {
      params['start_at__gt'] = moment(filterStartDate.value)
        .startOf('day')
        .toISOString();
    }
    if (filterEndDate.value) {
      params['start_at__lt'] = moment(filterEndDate.value)
        .endOf('day')
        .toISOString();
    }
    if (filterTeam.value) {
      params['team'] = filterTeam.value;
    }
    const { data } = await axios.get('/worksite_work_types_schedule', {
      params,
    });
    scheduleEvents.value = data.results.map((item: WorkTypeSchedule) =>
      convertScheduleToEvent(item),
    );
    calendarApp.eventsService.set(scheduleEvents.value);
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
  }
}

async function fetchUpcomingSchedules() {
  try {
    const now = moment().toISOString();
    const params: any = {
      start_at__gt: now,
      limit: 10,
    };
    const { data } = await axios.get('/worksite_work_types_schedule', {
      params,
    });
    upcomingSchedules.value = data.results;
  } catch (error) {
    console.error('Failed to fetch upcoming schedules:', error);
  }
}

const getTeams = async () => {
  try {
    const results = await Team.api().get(
      `/teams?incident=${currentIncidentId.value}`,
      {
        dataKey: 'results',
      },
    );
    teams.value = (results.entities?.teams || []) as Team[];
  } catch (error) {
    console.error('Failed to fetch teams:', error);
  }
};

const editEvent = async (event: any) => {
  await component({
    title: 'Edit Schedule',
    id: 'edit_schedule_dialog',
    component: EditScheduleDialog,
    hideFooter: true,
    props: { event },
  });
};

async function updateSchedule(event: any) {
  try {
    await axios.patch(`/worksite_work_types_schedule/${event.id}`, {
      start: moment(event.start).toISOString(),
      end: moment(event.end).toISOString(),
    });
    await fetchSchedules();
    await fetchUpcomingSchedules();
  } catch (error) {
    console.error('Failed to update schedule:', error);
  }
}

async function addCaseToSchedule() {
  if (!selectedWorksite.value) return;
  await openAddScheduleDialog();
}

async function openAddScheduleDialog(initialData = null) {
  await component({
    title: 'Create Schedules',
    component: AddScheduleDialog,
    classes: 'w-full h-144 overflow-y-auto p-3',
    modalClasses: 'bg-white max-w-4xl shadow',
    id: 'add_schedule_dialog',
    hideFooter: true,
    props: {
      worksite: selectedWorksite.value,
      initialData: initialData
        ? initialData
        : {
            start: moment().format('YYYY-MM-DD HH:mm'),
            end: moment().add(1, 'hour').format('YYYY-MM-DD HH:mm'),
          },
    },
  });
  await fetchSchedules();
  await fetchUpcomingSchedules();
}

async function openSelectFromMapDialog() {
  let workTypeClaimedByOrIsnull =
    [
      ...(currentUser.value.organization.affiliates || []),
      currentUser.value.organization.id,
    ].join(',') + ',true';
  await component({
    title: '~~Select Worksite from Map',
    component: WorksiteMapPopup,
    id: 'select_worksite_from_map',
    modalClasses: 'bg-white max-w-6xl shadow',
    classes: 'h-180',
    props: {
      incidentId: currentIncidentId.value,
      query: {
        incident: currentIncidentId.value,
        work_type__claimed_by_or_isnull: workTypeClaimedByOrIsnull,
      },
    },
    listeners: {
      selectWorksite(value: Worksite) {
        selectedWorksite.value = value;
        emitter.emit('modal_component:close', 'select_worksite_from_map');
      },
    },
  });
}

function exportToCSV() {
  const data = scheduleEvents.value;
  if (data.length === 0) {
    alert('No events to export');
    return;
  }

  // Build CSV rows
  const headers = ['Title', 'Start', 'End', 'Description', 'Location', 'Team'];
  const rows = data.map((event: CalendarEvent) => {
    // Adjust as needed for your data shape
    const team = event.people?.join(' / ') ?? '';
    return [
      `"${event.title}"`,
      `"${event.start}"`,
      `"${event.end}"`,
      `"${event.description || ''}"`,
      `"${event.location || ''}"`,
      `"${team}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'schedules_export.csv');
  link.click();
}

async function exportToPDF() {
  const doc = new jsPDF();
  doc.setFontSize(12);

  let yPos = 10;
  doc.text('Schedules Export', 10, yPos);

  scheduleEvents.value.forEach((evt: CalendarEvent, index: number) => {
    yPos += 10;
    doc.text(`${index + 1}) ${evt.title}`, 10, yPos);
    yPos += 6;
    doc.text(`Start: ${evt.start}`, 10, yPos);
    yPos += 6;
    doc.text(`End: ${evt.end}`, 10, yPos);
    if (yPos > 270) {
      doc.addPage();
      yPos = 10;
    }
  });

  doc.save('schedules_export.pdf');
}

function exportToICS() {
  const data = scheduleEvents.value;
  if (data.length === 0) {
    alert('No events to export');
    return;
  }

  // Build iCal string
  let icsContent =
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YourApp//Schedule Export//EN',
    ].join('\r\n') + '\r\n';

  data.forEach((event: CalendarEvent) => {
    // Convert "YYYY-MM-DD HH:mm" -> "YYYYMMDDTHHmmssZ" (UTC)
    const startUTC = moment(event.start, 'YYYY-MM-DD HH:mm')
      .utc()
      .format('YYYYMMDDTHHmmss[Z]');
    const endUTC = moment(event.end, 'YYYY-MM-DD HH:mm')
      .utc()
      .format('YYYYMMDDTHHmmss[Z]');

    icsContent +=
      [
        'BEGIN:VEVENT',
        `UID:${event.id}@yourapp.com`,
        `DTSTAMP:${moment().utc().format('YYYYMMDDTHHmmss[Z]')}`,
        `DTSTART:${startUTC}`,
        `DTEND:${endUTC}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ''}`,
        `LOCATION:${event.location || ''}`,
        'END:VEVENT',
      ].join('\r\n') + '\r\n';
  });

  icsContent += 'END:VCALENDAR\r\n';

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'schedules_export.ics';
  link.click();
}

// Example: Print the calendar
// This is a simple approach that will print the entire page,
// including the calendar view. For a more refined approach,
// you might create a dedicated print stylesheet or use
// a library like print-js to customize what gets printed.
function printCalendar() {
  window.print();
}
// --------------------------------------------------------------

const calendarApp = createCalendar(
  {
    selectedDate: moment().format('YYYY-MM-DD'),
    isResponsive: true,
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    weekOptions: {
      gridHeight: 2000,
    },
    events: scheduleEvents.value,
    callbacks: {
      onEventClick: editEvent,
      onEventUpdate(updatedEvent) {
        updateSchedule(updatedEvent);
      },
      onClickDateTime(date: string) {
        if (selectedWorksite.value) {
          const start = moment(date).format('YYYY-MM-DD HH:mm');
          const end = moment(date).add(1, 'hour').format('YYYY-MM-DD HH:mm');
          openAddScheduleDialog({ start: start, end: end } as any);
        }
      },
    },
  },
  [eventsServicePlugin, dragAndDropPlugin, resizePlugin, currentTimePlugin],
);

onMounted(async () => {
  await getTeams();
  await fetchSchedules();
  await fetchUpcomingSchedules();
});
</script>

<style scoped>
/* Your page-specific styles here if needed */
</style>
