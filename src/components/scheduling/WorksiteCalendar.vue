<template>
  <div class="flex flex-col md:flex-row h-full mb-20 md:mb-0">
    <div class="flex flex-col flex-grow relative overflow-y-auto w-full">
      <!-- Header / Actions -->
      <div class="sticky top-0 bg-white z-10 p-2">
        <div
          class="flex flex-wrap items-center gap-2 lg:justify-start lg:mt-0 mt-4 justify-end"
        >
          <WorksiteNavigationIcons
            :case-images="[]"
            :showing-feed="false"
            :showing-map="false"
            :showing-photo-map="false"
            :showing-table="false"
            :showing-calendar="showCalendar"
            :showing-calendar-list="showUpcoming"
            :showing-calendar-map="showMap"
            @show-feed="() => {}"
            @show-map="
              () => $router.push(`/incident/${currentIncidentId}/work`)
            "
            @show-photo-map="() => {}"
            @show-table="
              () =>
                $router.push(
                  `/incident/${currentIncidentId}/work?showTable=true`,
                )
            "
            @show-calendar="() => setView('calendar')"
            @show-calendar-list="() => setView('upcoming')"
            @show-calendar-map="() => setView('map')"
          />
          <!-- Currently selected worksite -->
          <div
            v-if="selectedWorksite"
            class="ml-auto flex items-center gap-2 bg-primary-light border border-primary-dark rounded px-3 py-1"
          >
            <base-text variant="body" weight="700" class="text-yellow-900">
              {{ t('calendar.case') }}:
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

        <!-- Filters -->
        <div
          class="flex lg:flex-wrap lg:flex-row flex-col items-end gap-2 mt-2"
        >
          <div class="items-center gap-2 lg:w-80 w-full">
            <base-text variant="body" weight="600">
              {{ t('calendar.start_date') }}
            </base-text>
            <datepicker
              v-model="filterStartDate"
              format="yyyy-MM-dd"
              :enable-time-picker="false"
              auto-apply
              @update:model-value="initialize"
            />
          </div>
          <div class="items-center gap-2 lg:w-80 w-full">
            <base-text variant="body" weight="600">
              {{ t('calendar.end_date') }}
            </base-text>
            <datepicker
              v-model="filterEndDate"
              format="yyyy-MM-dd"
              :enable-time-picker="false"
              auto-apply
              @update:model-value="initialize"
            />
          </div>
          <div class="items-center gap-2 lg:w-72 w-full">
            <base-text variant="body" weight="600">
              {{ t('calendar.team') }}
            </base-text>
            <base-select
              v-model="filterTeam"
              :options="teams"
              item-key="id"
              label="name"
              :placeholder="$t('calendar.all_teams')"
              select-classes="p-1 border"
              class="lg:w-72 w-full h-10"
              @update:model-value="initialize"
            />
          </div>
          <v-popover placement="bottom-start">
            <base-button
              action="add"
              suffix-icon="caret-down"
              class="border border-1.5 border-black p-1 px-4 bg-white"
            >
              {{ $t('calendar.actions') }}
            </base-button>
            <template #popper>
              <div class="flex flex-col">
                <base-button
                  :text="$t('actions.export_csv')"
                  variant="bare"
                  icon-size="medium"
                  class="cursor-pointer hover:bg-primary-light px-6 py-2"
                  @click="exportToCSV"
                />
                <base-button
                  :text="$t('actions.export_pdf')"
                  variant="bare"
                  icon-size="medium"
                  class="cursor-pointer hover:bg-primary-light px-6 py-2"
                  @click="exportToPDF"
                />
                <base-button
                  :text="$t('actions.export_ical')"
                  variant="bare"
                  icon-size="medium"
                  class="cursor-pointer hover:bg-primary-light px-6 py-2"
                  @click="exportToICS"
                />
                <base-button
                  :text="$t('actions.print_calendar')"
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

      <!-- Main Views -->
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

      <!-- Upcoming Schedules List -->
      <template v-if="showUpcoming">
        <div class="p-4">
          <div class="flex justify-between items-center">
            <div class="mb-4 text-2xl font-bold">
              {{ t('calendar.upcoming') }}
            </div>
          </div>

          <div v-if="upcomingSchedules.length > 0">
            <div
              v-for="schedule in upcomingSchedules"
              :key="schedule.id"
              class="mb-4 p-4 bg-white rounded-lg shadow flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
            >
              <div class="space-y-2">
                <!-- Loop through all connected cases -->
                <div
                  v-if="
                    schedule.worksite_work_types &&
                    schedule.worksite_work_types.length > 0
                  "
                >
                  <div
                    v-for="workType in schedule.worksite_work_types"
                    :key="workType.id"
                    class="text-lg font-semibold text-gray-800 flex items-center"
                  >
                    {{ workType.worksite_case_number }}
                    <span
                      v-if="workType.work_type_key"
                      class="ml-2 text-sm text-gray-600"
                    >
                      ({{ $t(`workType.${workType.work_type_key}`) }})
                    </span>
                  </div>
                </div>
                <!-- Fallback if no nested cases exist -->
                <div
                  v-else
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
                    {{ t('calendar.address') }}
                  </span>
                  <span
                    v-if="
                      schedule.worksite_work_types &&
                      schedule.worksite_work_types.length > 0
                    "
                  >
                    <span
                      v-for="(workType, idx) in schedule.worksite_work_types"
                      :key="idx"
                    >
                      {{ workType.worksite_address
                      }}<span
                        v-if="idx < schedule.worksite_work_types.length - 1"
                        >,
                      </span>
                    </span>
                  </span>
                  <span v-else>
                    {{ schedule.worksite_address }}
                  </span>
                </p>
              </div>

              <div class="text-right space-y-1">
                <p class="text-sm text-gray-500">
                  <span class="font-medium text-gray-700">
                    {{ t('calendar.start') }}
                  </span>
                  {{ moment(schedule.start).format('MMM DD, YYYY [at] HH:mm') }}
                </p>
                <p class="text-sm text-gray-500">
                  <span class="font-medium text-gray-700">
                    {{ t('calendar.end') }}
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
                    :title="$t('actions.edit')"
                    :alt="$t('actions.edit')"
                    fa
                    :action="() => editEvent(schedule)"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500">
            {{ t('calendar.no_upcoming_schedules_found') }}
          </div>
        </div>
      </template>
    </div>

    <!-- Side Panel: Worksite Form -->
    <div class="h-full md:w-132 w-full hidden md:block">
      <div
        class="sticky top-0 bg-white z-10 shadow p-2 flex justify-between items-center h-12"
      >
        <div class="flex gap-4">
          <base-button
            :class="{
              'text-primary-dark': selectedTab === 'add',
            }"
            :action="() => setSelectedTab('add')"
          >
            {{ $t('actions.add_or_edit') }}
          </base-button>
          <base-button
            v-if="selectedWorksite"
            :class="{
              'text-primary-dark': selectedTab === 'info',
            }"
            :action="() => setSelectedTab('info')"
          >
            {{ $t('calendar.case_info') }}
          </base-button>
        </div>
      </div>
      <div class="h-[calc(100%-theme(spacing.12))]">
        <WorksiteForm
          v-show="selectedTab === 'info'"
          v-if="selectedWorksite"
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
            </div>
            <div
              v-if="selectedWorksite.id"
              class="text-xs text-crisiscleanup-grey-700"
            >
              {{ t('calendar.updated') }}
              {{ momentFromNow(selectedWorksite.updated_at) }}
            </div>
          </template>
        </WorksiteForm>
        <dic v-show="selectedTab === 'add'" class="flex flex-col h-full">
          <div v-if="!selectedEvent">
            <WorksiteSearchInput
              data-testid="testWorksiteSearch"
              icon="filters"
              display-property="name"
              :placeholder="$t('actions.search')"
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
              class="m-3"
              @selected-existing="
                (ws: Worksite) => {
                  selectedWorksite = ws;
                }
              "
            />
            <div class="flex gap-4 my-1 mx-3">
              <AddFromList
                model-type="worksite_worksites"
                :title="$t('calendar.select_from_list')"
                class="text-sm flex-grow"
                :incident="currentIncidentId"
                @add-item="
                  (ws: Worksite) => {
                    selectedWorksite = ws;
                  }
                "
              />

              <base-button
                ccu-icon="go-case"
                icon-size="medium"
                class="text-sm flex-grow"
                :text="$t('calendar.select_from_map')"
                variant="outline"
                :action="openSelectFromMapDialog"
              />
            </div>
          </div>
          <EditScheduleDialog
            v-if="selectedEvent"
            :key="selectedEvent"
            :event="selectedEvent"
            @deleted="onDeleteEvent"
            @close="
              selectedEvent = null;
              selectedWorksite = null;
            "
            @saved="onSaveEvent"
          />
          <AddScheduleDialog
            v-else
            :key="selectedWorksite"
            :worksite="selectedWorksite"
            :initial-data="initialData"
            @close="selectedWorksite = null"
            @saved="onSaveEvent"
          />
        </dic>
      </div>
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
import { createCalendarControlsPlugin } from '@schedule-x/calendar-controls';

import WorksiteForm from '@/components/work/WorksiteForm.vue';
import WorksiteSearchInput from '@/components/work/WorksiteSearchInput.vue';
import CcuIcon from '@/components/BaseIcon.vue';
import { useCurrentIncident } from '@/hooks';
import useDialogs from '@/hooks/useDialogs';
import AddScheduleDialog from '@/components/scheduling/AddScheduleDialog.vue';
import EditScheduleDialog from '@/components/scheduling/EditScheduleDialog.vue';
import type { WorkTypeSchedule } from '@/models/types';
import WorkTypeSchedulesMap from '@/components/scheduling/WorkTypeScheduleMap.vue';
import Worksite from '@/models/Worksite';
import AddFromList from '@/pages/lists/AddFromList.vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import { momentFromNow } from '@/filters';
import type Team from '@/models/Team';
import WorksiteMapPopup from '@/components/WorksiteMapPopup.vue';
import useEmitter from '@/hooks/useEmitter';
import BaseButton from '@/components/BaseButton.vue';
import jsPDF from 'jspdf';
import { useRoute } from 'vue-router';
import WorksiteNavigationIcons from '@/pages/WorksiteNavigationIcons.vue';

const { currentIncidentId } = useCurrentIncident();
const { currentUser } = useCurrentUser();
const { component } = useDialogs();
const { emitter } = useEmitter();
const route = useRoute();
const { t, locale } = useI18n();

const eventsServicePlugin = createEventsServicePlugin();
const dragAndDropPlugin = createDragAndDropPlugin();
const resizePlugin = createResizePlugin();
const currentTimePlugin = createCurrentTimePlugin();
const calendarControls = createCalendarControlsPlugin();

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
  route.query.view = view;
}

const filterStartDate = ref<string>('');
const filterEndDate = ref<string>('');
const filterTeam = ref<number | null>(null);
const teams = ref<Team[]>([]);

const selectedTab = ref('add');

const selectedEvent = ref<Record<string, any> | null>(null);

const initialData = ref({
  start: '',
  end: '',
});

function setSelectedTab(tab: string) {
  selectedTab.value = tab;
}

if (route.query.view) {
  setView(route.query.view as string);
}

function generateColorVariants(baseColor: string) {
  return {
    lightColors: {
      main: baseColor,
      container: baseColor + '99',
      onContainer: '#000000',
    },
  };
}

function convertScheduleToEvent(item: WorkTypeSchedule) {
  let caseNumbers = '';
  let workTypes = '';
  let location = '';

  if (item.worksite_work_types && item.worksite_work_types.length > 0) {
    // Deduplicate case numbers and work type keys
    const uniqueCaseNumbers = [
      ...new Set(
        item.worksite_work_types.map((w: any) => w.worksite_case_number),
      ),
    ];
    const uniqueWorkTypes = [
      ...new Set(
        item.worksite_work_types.map((w: any) =>
          t(`workType.${w.work_type_key}`),
        ),
      ),
    ];

    caseNumbers = uniqueCaseNumbers.join(', ');
    workTypes = uniqueWorkTypes.join(', ');

    // Determine location: if more than one unique address exists, mark as "Multiple locations"
    const uniqueAddresses = [
      ...new Set(item.worksite_work_types.map((w: any) => w.worksite_address)),
    ];
    location =
      uniqueAddresses.length > 1 ? 'Multiple locations' : uniqueAddresses[0];
  } else {
    caseNumbers = item.worksite_case_number || 'UnknownCase';
    workTypes = item.work_type_key || 'UnknownWorkType';
    location = item.worksite_address || 'Unknown location';
  }

  return {
    id: item.id,
    title: `${caseNumbers} - ${workTypes}`,
    start: moment(item.start).format('YYYY-MM-DD HH:mm'),
    end: moment(item.end).format('YYYY-MM-DD HH:mm'),
    description: item.notes,
    location: location,
    people: item.team_name ? [item.team_name] : null,
    calendarId: String(item.team),
  };
}

async function fetchSchedules() {
  try {
    const params: any = {
      worksite_work_type__incident: currentIncidentId.value,
    };
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
      worksite_work_type__incident: currentIncidentId.value,
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
  const { data } = await axios.get(
    `/teams?incident=${currentIncidentId.value}`,
  );
  teams.value = data.results as Team[];
  calendarControls.setCalendars(
    teams.value.reduce((acc: Record<string, any>, team: Team) => {
      acc[String(team.id)] = {
        colorName: String(team.id),
        ...generateColorVariants(team.color),
      };
      return acc;
    }, {}),
  );
};

const editEvent = async (event: any) => {
  selectedEvent.value = event;
  const response = await axios.get(`/worksite_work_types_schedule/${event.id}`);
  selectedWorksite.value = Worksite.fetchOrFindId(response.data.worksite_id);
};

const onDeleteEvent = async (event: any) => {
  selectedEvent.value = null;
  selectedWorksite.value = null;
  await initialize();
};

const onSaveEvent = async (schedules: any) => {
  await initialize();
  selectedEvent.value = scheduleEvents.value.find(
    (e: any) => e.id === schedules[0].id,
  );
};

async function updateSchedule(event: any) {
  try {
    await axios.patch(`/worksite_work_types_schedule/${event.id}`, {
      start: moment(event.start).toISOString(),
      end: moment(event.end).toISOString(),
    });
    await initialize();
    await fetchUpcomingSchedules();
  } catch (error) {
    console.error('Failed to update schedule:', error);
  }
}

async function openAddScheduleDialog(initialData = null) {
  const { formattedStart, formattedEnd } = getRoundedTimeSlots(
    moment().toISOString(),
  );
  await component({
    title: t('calendar.create_schedules'),
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
            start: formattedStart,
            end: formattedEnd,
          },
    },
  });
  await initialize();
}

async function openSelectFromMapDialog() {
  let workTypeClaimedByOrIsnull =
    [
      ...(currentUser.value.organization.affiliates || []),
      currentUser.value.organization.id,
    ].join(',') + ',true';
  await component({
    title: t('calendar.select_worksite_from_map'),
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
  const headers = ['Title', 'Start', 'End', 'Description', 'Location', 'Team'];
  const rows = data.map((event: any) => {
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
  scheduleEvents.value.forEach((evt: any, index: number) => {
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
  let icsContent =
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YourApp//Schedule Export//EN',
    ].join('\r\n') + '\r\n';
  data.forEach((event: any) => {
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

function printCalendar() {
  window.print();
}

const getRoundedTimeSlots = (date: string) => {
  const minutes = moment(date).minutes();
  const roundedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 60;
  const start = moment(date).minutes(roundedMinutes).seconds(0);

  if (roundedMinutes === 60) {
    start.add(1, 'hour').minutes(0);
  }

  const formattedStart = start.format('YYYY-MM-DD HH:mm');
  const formattedEnd = start.add(2, 'hours').format('YYYY-MM-DD HH:mm');
  return { formattedStart, formattedEnd };
};

const calendarApp = createCalendar(
  {
    selectedDate: moment().format('YYYY-MM-DD'),
    isResponsive: true,
    locale: locale.value,
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    weekOptions: { gridHeight: 800 },
    dayBoundaries: {
      start: '04:00',
      end: '22:00',
    },
    events: scheduleEvents.value,
    callbacks: {
      onEventClick: editEvent,
      onEventUpdate(updatedEvent) {
        updateSchedule(updatedEvent);
      },
      onClickDateTime(date: string) {
        const { formattedStart, formattedEnd } = getRoundedTimeSlots(date);
        initialData.value = {
          start: formattedStart,
          end: formattedEnd,
        };
      },
    },
  },
  [
    eventsServicePlugin,
    dragAndDropPlugin,
    resizePlugin,
    currentTimePlugin,
    calendarControls,
  ],
);

const initialize = async () => {
  await getTeams();
  await fetchSchedules();
  await fetchUpcomingSchedules();
  const { formattedStart, formattedEnd } = getRoundedTimeSlots(
    moment().toISOString(),
  );
  initialData.value = {
    start: formattedStart,
    end: formattedEnd,
  };
};
onMounted(async () => {
  await initialize();
});
</script>

<style scoped>
/* Your page-specific styles here if needed */
.sx-vue-calendar-wrapper {
  @apply z-0;
}
</style>
