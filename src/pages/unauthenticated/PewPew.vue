<template>
  <div
    class="pewpew min-h-screen w-full"
    :style="styles"
    data-testid="testPewPewDiv"
  >
    <div class="relative w-full h-full flex flex-col md:flex-row">
      <!-- Navigation Sidebar (Desktop) -->
      <div class="hidden md:block w-[100px] h-full z-20">
        <PewPewNavBar :color-mode="colorMode" />
      </div>
      <!-- Bottom Bar (Mobile) -->
      <div
        class="md:hidden fixed bottom-0 left-0 w-full bg-cc-ink-1 border-t border-cc-ink-3 z-max flex justify-center items-center py-2"
      >
        <PewPewNavBar :color-mode="colorMode" />
      </div>

      <!-- Main Content Area — full-width; engagement + site stats live in -->
      <!-- the top KPI strip, the live event stream lives in the right rail. -->
      <!-- Mobile bottom clearance lives on the chart container itself -->
      <!-- (mb-[200px] md:mb-0) — the nested h-full flex chain here -->
      <!-- swallows pb-* on the scroll container. -->
      <div
        class="flex-1 flex flex-col md:pb-0 overflow-y-auto md:overflow-hidden"
      >
        <div class="flex flex-col h-full md:min-h-0">
          <div class="flex-1 flex flex-col md:min-h-0 md:overflow-hidden">
            <!-- Top Banner -->
            <div
              class="min-h-8 md:min-h-12 grid grid-cols-1 md:grid-cols-10 mt-1 md:mt-0"
            >
              <div
                class="md:col-span-8 flex justify-center items-center bg-cc-ink-0 border-b border-cc-ink-3 px-3 md:px-6 py-2"
              >
                <div
                  v-if="incidentList.length > 0"
                  class="text-center md:py-1 w-full"
                >
                  <span
                    v-for="(incident, index) in incidentList"
                    :key="incident.id"
                    :data-testid="`testIncident${incident.id}Div`"
                    class="inline-flex items-center align-middle"
                  >
                    <span class="hotline-label">{{ incident.short_name }}</span>
                    <span class="hotline-numbers ml-2">
                      <PhoneNumberDisplay
                        v-for="hotlineNumber in formatIncidentPhoneNumbers(
                          incident,
                        )"
                        :key="hotlineNumber"
                        type="plain"
                        :phone-number="hotlineNumber"
                      />
                    </span>
                    <span
                      v-if="index < incidentList.length - 1"
                      class="hotline-sep mx-3"
                      aria-hidden="true"
                    >
                      ·
                    </span>
                  </span>
                </div>
                <div
                  v-else
                  data-testid="testPewPewBannerDiv"
                  class="hotline-numbers"
                >
                  {{ $t('homeVue.pew_pew_banner') }}
                </div>
              </div>

              <!-- Auth Buttons -->
              <div
                class="md:col-span-2 flex items-center justify-end space-x-2 px-2 md:px-3 mt-2 md:mt-0 bg-cc-ink-0 border-b border-cc-ink-3"
              >
                <template v-if="!isLoggedIn">
                  <base-button
                    class="text-xs px-3 h-8 text-black hover:bg-opacity-90 transition-colors duration-200"
                    data-testid="testRegisterButton"
                    variant="solid"
                    :text="$t('actions.register')"
                    :alt="$t('actions.register')"
                    :action="() => $router.push('/register')"
                  />
                  <base-button
                    class="text-xs px-3 h-8 hover:bg-cc-ink-2 transition-colors duration-200"
                    data-testid="testLoginButton"
                    variant="outline-dark"
                    :text="$t('actions.login')"
                    :alt="$t('actions.login')"
                    :action="() => $router.push('/login')"
                  />
                </template>
                <template v-else>
                  <UserProfileMenu
                    invert
                    data-testid="testLogoutLink"
                    @auth:logout="logout"
                  />
                </template>
              </div>
            </div>

            <!-- Incident Tabs -->
            <div
              class="incident-tabs h-14 md:h-14 mt-2 md:mt-3 flex overflow-x-auto whitespace-nowrap border-b border-cc-ink-3"
            >
              <div
                class="incident-chip"
                :class="incidentId ? '' : 'incident-chip--selected'"
                @click="$router.push({ name: 'nav.pew' })"
              >
                {{ $t('pewPew.current') }}
              </div>
              <router-link
                v-for="i in incidents"
                :key="i.id"
                :data-testid="`testIncident${i.id}Div`"
                :to="{ name: 'nav.pew', query: { incident: i.id } }"
                class="incident-chip"
                :class="
                  String(i.id) === String(incidentId)
                    ? 'incident-chip--selected'
                    : ''
                "
              >
                <DisasterIcon
                  class="mr-2 incident-chip__icon"
                  :data-testid="`testDisaster${i.id}Icon`"
                  :current-incident="i"
                  :alt="i.short_name"
                />
                <span>{{ i.short_name }}</span>
              </router-link>
            </div>

            <!-- KPI Strip — engagement primary + 4 supporting site stats. -->
            <!-- Replaces the buried "Stats" tab and the standalone gauge. -->
            <LiveKpiStrip
              :engagement="currentEngagement"
              :site-stats="currentSiteStats"
              data-testid="testLiveKpiStripDiv"
            />

            <!-- Map and Charts Area -->
            <div
              class="flex-grow select-none grid grid-cols-1 md:grid-cols-10 mt-1 md:mt-0 md:min-h-0 md:overflow-hidden"
            >
              <!-- Map Section -->
              <div
                class="relative min-h-[400px] md:h-full select-none col-span-1 md:col-span-7"
              >
                <div
                  id="map"
                  ref="map"
                  data-testid="testMapDiv"
                  class="absolute top-0 left-0 right-0 bottom-0 rounded-sm"
                ></div>

                <!-- Map Loading Indicator -->
                <div
                  v-if="mapLoading"
                  data-testid="testMapLoadingDiv"
                  class="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center z-map-controls bg-black bg-opacity-50 rounded-sm"
                >
                  <spinner />
                </div>

                <!-- Map Controls -->
                <!-- Mobile: cap width so the slider doesn't dominate the map. -->
                <div
                  class="absolute top-0 left-0 m-2 px-2 py-1.5 md:p-2 bg-cc-ink-1 ring-1 ring-cc-ink-3 z-map-controls w-[calc(70%-0.5rem)] md:w-auto max-w-xs"
                >
                  <Slider
                    primary-color="#FECE09"
                    data-testid="testSviSliderDiv"
                    :value="100"
                    :from="$t('svi.most_vulnerable')"
                    :to="$t('svi.everyone')"
                    @input="(_value) => refreshSvi(_value)"
                  ></Slider>
                </div>

                <!-- Zoom Controls -->
                <div
                  class="absolute top-0 left-0 m-2 p-2 rounded-md mt-12 flex flex-col z-map-controls"
                >
                  <div class="zoom-control flex flex-col mb-5">
                    <base-button
                      text=""
                      data-testid="testZoomInButton"
                      icon="plus"
                      icon-size="sm"
                      ccu-event="user_ui-zoom-in"
                      :title="$t('worksiteMap.zoom_in')"
                      :alt="$t('worksiteMap.zoom_in')"
                      :action="zoomIn"
                      class="w-10 h-10 border-cc-ink-3 border-b bg-cc-ink-1 ring-1 ring-cc-ink-3 text-cc-type-1 text-xl hover:bg-cc-ink-2 transition-colors duration-200"
                    />
                    <base-button
                      text=""
                      data-testid="testZoomOutButton"
                      icon="minus"
                      icon-size="sm"
                      ccu-event="user_ui-zoom-out"
                      :title="$t('worksiteMap.zoom_out')"
                      :alt="$t('worksiteMap.zoom_out')"
                      :action="zoomOut"
                      class="w-10 h-10 bg-cc-ink-1 ring-1 ring-cc-ink-3 text-cc-type-1 text-xl hover:bg-cc-ink-2 transition-colors duration-200"
                    />
                  </div>
                </div>

                <!-- Live Incidents -->
                <div
                  :key="incidentId"
                  class="absolute top-0 right-0 h-48 w-auto overflow-hidden mt-3 mr-3 z-map-controls"
                >
                  <transition-group
                    ref="incidentScroll"
                    name="incidentScroll"
                    data-testid="testCurrentEventIncidentScrollDiv"
                    tag="div"
                  >
                    <div
                      v-for="i in liveIncidents"
                      :key="i.key"
                      class="bg-cc-ink-1 ring-1 ring-cc-ink-3 p-2 my-2 w-48 md:w-56 text-center text-sm md:text-base font-medium"
                    >
                      {{ i.name }}
                    </div>
                  </transition-group>
                </div>

                <!-- Legend lives inside the lower-third broadcast bar (below). -->

                <!-- Map Stats and Controls -->
                <div class="absolute left-0 bottom-0 right-0 z-map-controls">
                  <div class="relative">
                    <img
                      src="@/assets/cc-logo.svg"
                      data-testid="testCcuLogoIcon"
                      alt="crisis-cleanup-logo"
                      class="absolute p-2 md:p-3 h-12 md:h-16 right-0 bottom-0 opacity-30"
                    />
                  </div>
                  <LiveWireRibbon
                    :segments="ribbonSegments"
                    data-testid="testLiveWireRibbonDiv"
                    @filter="onRibbonFilter"
                  />
                  <LiveLowerThird
                    :is-paused="isPaused"
                    :markers-length="markersLength"
                    :from="queryFilter.start_date.format('MMM Do YYYY')"
                    :to="queryFilter.end_date.format('MMM Do YYYY')"
                    :legend-entries="displayedWorkTypeSvgs"
                    @toggle-pause="togglePause"
                    @scrub="onTimelineScrub"
                    @toggle-work-type="onLegendToggle"
                  />
                </div>
              </div>

              <!-- Right Rail — live event stream, leaderboard, chart cluster -->
              <!-- Desktop: rigid 12-row grid for stable kiosk proportions. -->
              <!-- Mobile: flex-col with content-driven heights so empty -->
              <!-- panels don't reserve dead space and the last chart isn't -->
              <!-- clipped behind the fixed bottom nav. -->
              <div
                class="md:h-full w-full col-span-1 md:col-span-3 flex flex-col md:grid md:grid-rows-12 md:min-h-0 md:border-l md:border-cc-ink-3 border-t md:border-t-0 border-cc-ink-3 md:overflow-hidden"
              >
                <!-- Mobile: relative wrapper with content-driven height -->
                <!-- (capped at 380px to leave room for the leaderboard). -->
                <!-- Desktop: absolute layout in the rigid 12-row grid. -->
                <div
                  class="md:row-span-4 md:relative md:overflow-hidden border-b border-cc-ink-3 md:min-h-0"
                  data-testid="testLiveEventStreamWrap"
                >
                  <div class="flex items-center gap-3 px-4 pt-3">
                    <span class="section-label">Live feed</span>
                    <span
                      class="flex-1 h-px bg-cc-ink-3"
                      aria-hidden="true"
                    ></span>
                  </div>
                  <div
                    class="px-2 md:absolute md:left-0 md:right-0 md:bottom-0 md:top-10 overflow-y-auto md:overflow-hidden max-h-[380px] md:max-h-none"
                  >
                    <LiveEventStream ref="cards" />
                  </div>
                </div>
                <LiveLeaderboard
                  :organizations="organizations"
                  :query-filter="queryFilter"
                  :overlay-styles="overlayStyles"
                  :visible-count="8"
                  data-testid="testLiveLeaderboardDiv"
                  class="md:row-span-4 relative"
                />
                <div
                  class="md:row-span-4 border-t border-cc-ink-3 min-h-[280px] md:min-h-0 mb-[200px] md:mb-0"
                  data-testid="testBottomChartTabsDiv"
                >
                  <tabs
                    data-testid="testStopChartTabCirculationTimerTab"
                    class="relative h-full m-1 overflow-x-auto flex md:block"
                    tab-classes="section-label"
                    tab-default-classes="flex items-center justify-center text-center h-9 md:h-10 cursor-pointer px-3 text-cc-type-3 hover:text-cc-type-1 transition-colors duration-200 border-b border-transparent"
                    tab-active-classes="text-cc-type-1 border-b-cc-signal"
                    @tab-selected="stopChartTabCirculationTimer"
                  >
                    <LightTab
                      :name="$t('reports.pp_call_volume_title')"
                      :alt="$t('reports.pp_call_volume_description')"
                      data-testid="testPpCallVolumeTab"
                      class="chart-tab"
                      :selected="
                        chartCirculationTimerData.isTimerActive &&
                        chartCirculationTimerData.activeChartTab === 0
                      "
                    >
                      <div class="chart-container h-full">
                        <LiveCallVolumeChart
                          data-testid="testPpCallTimesChart"
                          class="h-full w-full"
                          :chart-data="circularBarplotData"
                        />
                      </div>
                    </LightTab>
                    <LightTab
                      :name="$t('reports.pp_total_cases_title')"
                      :alt="$t('reports.pp_total_cases_description')"
                      data-testid="testTotalCasesTab"
                      class="chart-tab"
                      :selected="
                        chartCirculationTimerData.isTimerActive &&
                        chartCirculationTimerData.activeChartTab === 1
                      "
                    >
                      <div class="chart-container h-full">
                        <LiveTotalCasesChart
                          data-testid="testTotalCasesChart"
                          class="h-full w-full"
                          :chart-data="totalCasesChartData"
                        />
                      </div>
                    </LightTab>
                    <LightTab
                      :name="$t('reports.completion_rate')"
                      data-testid="testCompletionRateChart"
                      class="chart-tab"
                      :selected="
                        chartCirculationTimerData.isTimerActive &&
                        chartCirculationTimerData.activeChartTab === 2
                      "
                    >
                      <div class="chart-container h-full">
                        <LiveCompletionRateChart
                          class="h-full w-full"
                          :chart-data="barChartData"
                        />
                      </div>
                    </LightTab>
                  </tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import moment from '@/utils/dates';
import axios from 'axios';
import { useStore } from 'vuex';
import { shuffle, throttle } from 'lodash';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { getQueryString } from '@/utils/urls';
import useLiveMap from '@/hooks/worksite/useLiveMap';
import { useVisibilityPausedInterval } from '@/hooks/useVisibilityPausedInterval';
import LiveWireRibbon from '@/components/live/LiveWireRibbon.vue';
import LiveKpiStrip from '@/components/live/LiveKpiStrip.vue';
import LiveEventStream from '@/components/live/LiveEventStream.vue';
import LiveLeaderboard from '@/components/live/LiveLeaderboard.vue';
import Slider from '@/components/Slider.vue';
import DisasterIcon from '@/components/DisasterIcon.vue';
import UserProfileMenu from '@/components/header/UserProfileMenu.vue';
import {
  formatIncidentPhoneNumbers,
  getWorkTypeName,
  isValidActiveHotline,
} from '@/filters';
import Incident from '@/models/Incident';
import useSiteStatistics from '@/hooks/live/useSiteStatistics';
import LiveCallVolumeChart from '@/components/live/LiveCallVolumeChart.vue';
import LiveCompletionRateChart from '@/components/live/LiveCompletionRateChart.vue';
import LiveTotalCasesChart from '@/components/live/LiveTotalCasesChart.vue';
import LiveLowerThird from '@/components/live/LiveLowerThird.vue';
import LightTab from '@/components/tabs/LightTab.vue';
import PewPewNavBar from '@/components/navigation/PewPewNavBar.vue';
import { useAuthStore } from '@/hooks';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay.vue';
import type { Sprite, WorksiteType } from '@/types';
import { useMq } from 'vue3-mq';

interface QueryFilter {
  start_date: moment.Dayjs;
  end_date: moment.Dayjs;
  incident?: string;
}

interface SiteInfoTimerData {
  cancel: (() => void) | null;
  activeInfoTab: number;
  isTimerActive: boolean;
}

interface ChartCirculationTimerData {
  cancel: (() => void) | null;
  activeChartTab: number;
  isTimerActive: boolean;
}

export default {
  name: 'PewPew',
  components: {
    PhoneNumberDisplay,
    PewPewNavBar,
    LightTab,
    LiveCallVolumeChart,
    LiveCompletionRateChart,
    LiveTotalCasesChart,
    LiveLowerThird,
    UserProfileMenu,
    DisasterIcon,
    Slider,
    LiveWireRibbon,
    LiveKpiStrip,
    LiveEventStream,
    LiveLeaderboard,
  },
  setup() {
    const store = useStore();
    const { t } = useI18n();
    const authStore = useAuthStore();
    const route = useRoute();
    const mq = useMq();

    // State
    const queryFilter = ref<QueryFilter>({
      start_date: moment().add(-60, 'days'),
      end_date: moment(),
    });
    const cards = ref<InstanceType<typeof LiveEventStream> | null>(null);
    const incidentId = ref<string | null>(null);
    const liveIncidents = ref<Array<{ name: string; key: string }>>([]);
    const incidents = ref<Array<Record<string, any>>>([]);
    const mapLoading = ref(false);
    const isLegendHidden = ref(false);
    const colorMode = ref('dark');
    const lastEventTimestamp = ref<string | null>(null);
    const markersLength = ref(0);
    const mapUtils = ref<any>(null);
    const organizations = ref<Array<Record<string, any>>>([]);
    const showSidebar = ref(false);

    // Computed
    const isDarkMode = computed(() => colorMode.value === 'dark');
    const { isAuthenticated: isLoggedIn } = useAuthStore();
    const incidentList = computed(() =>
      Incident.query()
        .where('active_phone_number', (p: unknown) => isValidActiveHotline(p))
        .get(),
    );

    const {
      currentSiteStats,
      currentEngagement,
      circularBarplotData,
      barChartData,
      totalCasesChartData,
      mapStatistics,
      formatStatValue,
    } = useSiteStatistics(queryFilter, organizations);

    const styles = computed(() => ({
      color: colorMode.value === 'dark' ? 'var(--cc-type-1)' : '#232323',
      backgroundColor: colorMode.value === 'dark' ? 'var(--cc-ink-0)' : 'white',
      fontFamily: 'var(--ff-body)',
    }));

    const overlayStyles = computed(() => ({
      color: colorMode.value === 'dark' ? 'var(--cc-type-1)' : '#232323',
      backgroundColor: colorMode.value === 'dark' ? 'var(--cc-ink-1)' : 'white',
      fontFamily: 'var(--ff-body)',
    }));

    // Timer Data — auto-rotation cancels are stored so we can clean them up
    // on unmount; useVisibilityPausedInterval pauses them when the kiosk tab
    // is hidden. See plan perf #3.
    const siteInfoTimerData = reactive<SiteInfoTimerData>({
      cancel: null,
      activeInfoTab: 0,
      isTimerActive: true,
    });

    const chartCirculationTimerData = reactive<ChartCirculationTimerData>({
      cancel: null,
      activeChartTab: 0,
      isTimerActive: true,
    });

    // Methods
    async function getAllEvents() {
      try {
        mapLoading.value = true;
        if (queryFilter.value.incident) {
          // Bounded initial fetch: cap to last 7 days OR 5,000 events
          // (whichever the API hits first). Was unbounded at 60_000, which
          // jammed the page on slow links. See plan perf #1.
          const initialWindowStart = moment.max(
            moment(queryFilter.value.start_date),
            moment().add(-7, 'days'),
          );
          const params: Record<string, any> = {
            limit: 5000,
            event_key__in: Object.keys({
              user_create_worksite: true,
            }).join(','),
            sort: 'created_at',
            incident_id: queryFilter.value.incident || '',
            created_at__gte: initialWindowStart.toISOString(),
            created_at__lte: queryFilter.value.end_date.toISOString(),
          };
          const queryString = getQueryString(params);
          const response = await axios.get(
            `${import.meta.env.VITE_APP_API_BASE_URL}/all_events?${queryString}`,
          );
          return response.data.results;
        }

        const params = {
          sort: '-created_at',
        };
        const queryString = getQueryString(params);
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/recent_events?${queryString}`,
        );
        markersLength.value = response.data.length;
        return response.data;
      } finally {
        mapLoading.value = false;
      }
    }

    async function getLatestEvents() {
      const params: Record<string, any> = {
        limit: 100,
        sort: '-created_at',
        incident_id: queryFilter.value.incident || '',
      };

      if (lastEventTimestamp.value) {
        params.created_at__gte = lastEventTimestamp.value;
      }

      const queryString = getQueryString(params);
      lastEventTimestamp.value = moment().toISOString();
      const { data } = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/live_events?${queryString}`,
      );
      const liveEvents = [...data.results];
      liveEvents.reverse();
      return liveEvents;
    }

    function zoomIn() {
      mapUtils.value?.getMap().zoomIn();
    }

    function zoomOut() {
      mapUtils.value?.getMap().zoomOut();
    }

    function pauseGeneratePoints() {
      mapUtils.value?.pauseGeneratePoints();
    }

    function resumeGeneratePoints() {
      mapUtils.value?.resumeGeneratePoints();
    }

    function refreshTimeline(index: number) {
      mapUtils.value?.refreshTimeline(index);
    }

    function refreshSvi(index: number) {
      mapUtils.value?.refreshSvi(index);
    }

    function refreshVisibility(index: string) {
      mapUtils.value?.refreshVisibility(index);
    }

    // Wire ribbon: trim the always-zero Counties/Volunteers/Households cells
    // (see useSiteStatistics — they hardcode 0 and are not yet wired). Keep
    // the 7 case-status cells + Total Orgs.
    const ribbonSegments = computed(() =>
      (mapStatistics.value || [])
        .filter(
          (s: Record<string, any>) =>
            !['Counties Parishes', 'Volunteers', 'Households'].includes(
              s.name as string,
            ),
        )
        .map((s: Record<string, any>) => ({
          title: String(s.title || s.name),
          count: Number(s.count) || 0,
          statusKey: s.statusKey as string | undefined,
          filter: s.filter as string | undefined,
        })),
    );

    function onRibbonFilter(filter: string | null) {
      // Map the wire-ribbon's status filter onto the existing leaflet
      // visibility toggle. '*' means "show everything" — refresh with
      // no specific work-type so the map clears its hide list.
      if (!filter || filter === '*') {
        mapUtils.value?.refreshVisibility('*');
        return;
      }
      mapUtils.value?.refreshVisibility(filter);
    }

    /** Lower-third controls — pause/resume, throttled scrubbing, legend toggle. */
    function togglePause() {
      if (isPausedComputed.value) {
        mapUtils.value?.resumeGeneratePoints();
      } else {
        mapUtils.value?.pauseGeneratePoints();
      }
    }

    const onTimelineScrub = throttle((value: number) => {
      mapUtils.value?.refreshTimeline(value);
    }, 1000);

    function onLegendToggle(key: string) {
      // Mutate the entry the same way the old inline handler did so
      // selected state persists across re-renders, then refresh the map.
      const entry = mapUtils.value?.displayedWorkTypeSvgs?.find(
        (e: { key: string; selected: boolean }) => e.key === key,
      );
      if (entry) entry.selected = !entry.selected;
      mapUtils.value?.refreshVisibility(key);
    }

    async function getRecentIncidents() {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/incidents?fields=id,name,short_name,geofence,locations,incident_type,color,turn_on_release,active_phone_number&limit=8&sort=-start_at`,
      );
      const { results } = response.data;
      return results;
    }

    async function getOrganizations() {
      const params: Record<string, any> = {
        start_date: moment().add(-120, 'days').format('YYYY-MM-DD'),
        end_date: moment().format('YYYY-MM-DD'),
      };
      if (queryFilter.value.incident) {
        params.incident = queryFilter.value.incident;
      }

      const queryString = getQueryString(params);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/reports_data/organization_statistics?${queryString}`,
      );
      return response.data;
    }

    function startSiteInfoTabCirculationTimer(ms: number) {
      if (siteInfoTimerData.cancel) return;
      const totalTabs = 2;
      siteInfoTimerData.cancel = useVisibilityPausedInterval(() => {
        siteInfoTimerData.activeInfoTab =
          (siteInfoTimerData.activeInfoTab + 1) % totalTabs;
      }, ms);
    }

    function stopSiteInfoTabCirculationTimer() {
      if (siteInfoTimerData.cancel) {
        siteInfoTimerData.cancel();
        siteInfoTimerData.cancel = null;
      }
      siteInfoTimerData.isTimerActive = false;
    }

    function startTabCirculationTimer(ms: number) {
      if (chartCirculationTimerData.cancel) return;
      const totalTabs = 3;
      chartCirculationTimerData.cancel = useVisibilityPausedInterval(() => {
        chartCirculationTimerData.activeChartTab =
          (chartCirculationTimerData.activeChartTab + 1) % totalTabs;
      }, ms);
    }

    function stopChartTabCirculationTimer() {
      if (chartCirculationTimerData.cancel) {
        chartCirculationTimerData.cancel();
        chartCirculationTimerData.cancel = null;
      }
      chartCirculationTimerData.isTimerActive = false;
    }

    // Lifecycle Hooks
    onMounted(async () => {
      getRecentIncidents().then((results) => {
        incidents.value = results;
      });
      getOrganizations().then((o) => {
        organizations.value = shuffle(o);
      });
      const emptyArray: (Sprite & WorksiteType)[] = [];
      mapUtils.value = useLiveMap(
        await getAllEvents(),
        emptyArray,
        new Incident({
          id: 0,
          case_label: '',
          timezone: '',
          form_fields: [],
          geofence: null,
          short_name: '',
          name: '',
          start_at: '',
          uuid: '',
          extent: null,
          incident_type: '',
          color: '',
          locations: [],
          turn_on_release: false,
          auto_contact: false,
          active_phone_number: undefined,
          created_work_types: [],
          is_archived: false,
          incident_center: null,
        }),
        2000,
        getLatestEvents,
        (card) => {
          cards.value?.addCardComponent(card);
          if (
            liveIncidents.value.length === 0 ||
            (liveIncidents.value[0].name !== card.event.attr.incident_name &&
              card.event.attr.incident_name)
          ) {
            liveIncidents.value.unshift({
              name: card.event.attr.incident_name,
              key: card.event.id,
            });
          }
        },
        () => {
          cards.value?.clearCards();
          liveIncidents.value = [];
        },
      );
      mapUtils.value.restartLiveEvents();
      startTabCirculationTimer(10_000);
    });

    // Watchers
    watch(
      () => route.query.incident,
      async (value: string | undefined) => {
        if (value) {
          queryFilter.value.incident = value;
          incidentId.value = value;
          queryFilter.value = { ...queryFilter.value };
          lastEventTimestamp.value = null;
          mapUtils?.value?.reloadMap(
            await getAllEvents(),
            [] as (Sprite & WorksiteType)[],
          );
          mapUtils?.value?.restartLiveEvents();
        }
      },
    );

    // Computed Properties
    const isPausedComputed = computed(() => mapUtils.value?.isPaused);
    const isPaused = isPausedComputed;
    const displayedWorkTypeSvgs = computed(
      () => mapUtils.value?.displayedWorkTypeSvgs || [],
    );

    onBeforeUnmount(() => {
      // Both timers must be cleaned up explicitly — previously only
      // the chart timer was cleared (and only on manual selection),
      // leaving an orphan interval ticking after navigation away.
      stopSiteInfoTabCirculationTimer();
      stopChartTabCirculationTimer();
      mapUtils.value?.destroy?.();
      mapUtils.value = null;
    });

    return {
      isLegendHidden,
      colorMode,
      queryFilter,
      cards,
      mapLoading,
      styles,
      overlayStyles,
      incidentId,
      liveIncidents,
      zoomIn,
      zoomOut,
      incidents,
      isDarkMode,
      isLoggedIn,
      incidentList,
      organizations,
      siteInfoTimerData,
      chartCirculationTimerData,
      currentSiteStats,
      formatStatValue,
      currentEngagement,
      circularBarplotData,
      barChartData,
      totalCasesChartData,
      mapStatistics,
      formatIncidentPhoneNumbers,
      pauseGeneratePoints,
      resumeGeneratePoints,
      markersLength,
      isPaused,
      refreshTimeline,
      refreshSvi,
      refreshVisibility,
      ribbonSegments,
      onRibbonFilter,
      togglePause,
      onTimelineScrub,
      onLegendToggle,
      throttle,
      startSiteInfoTabCirculationTimer,
      stopSiteInfoTabCirculationTimer,
      startTabCirculationTimer,
      stopChartTabCirculationTimer,
      displayedWorkTypeSvgs,
      getWorkTypeName,
      logout: () => authStore.logout(),
      $t: (text: string) => (text ? t(text) : undefined),
      showSidebar,
      mq,
    };
  },
};
</script>

<style lang="postcss">
.show-enter-active,
.show-leave-enter {
  transform: translateY(0);
  transition: all 0.3s linear;
}
.show-enter,
.show-leave-to {
  transform: translateY(-100%);
}

.incidentScroll-move {
  transition: transform 1s;
}

.leaflet-data-marker svg {
  width: 30px;
  height: 30px;
}

.map-svg-container svg {
  width: 16px;
  height: 16px;
}

.pewpew {
  @apply h-full w-full overflow-hidden;
  background-color: var(--cc-ink-0);
  color: var(--cc-type-1);
  font-family: var(--ff-body);

  /* Typography primitives — Civic Bulletin scale */
  .kpi-label {
    font-family: var(--ff-body);
    font-size: var(--ts-kpi-lbl);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--cc-type-3);
  }

  .kpi-value {
    font-family: var(--ff-display);
    font-feature-settings: var(--num-features);
    font-weight: 800;
    font-size: var(--ts-kpi-val);
    line-height: 1;
    color: var(--cc-type-1);
    letter-spacing: -0.01em;
  }

  .kpi-value--primary {
    font-size: var(--ts-kpi-prim);
  }

  .section-label {
    font-family: var(--ff-body);
    font-size: var(--ts-meta);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--cc-type-3);
  }

  /* Top banner hotline strip */
  .hotline-label {
    font-family: var(--ff-body);
    font-weight: 600;
    font-size: var(--ts-meta);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--cc-type-3);
  }

  .hotline-numbers {
    font-family: var(--ff-display);
    font-weight: 600;
    font-feature-settings: var(--num-features);
    font-size: var(--ts-body);
    color: var(--cc-type-1);
  }

  .hotline-sep {
    color: var(--cc-type-3);
    opacity: 0.5;
    font-size: var(--ts-body);
  }

  /*
   * Incident tabs — horizontal scroll with hidden scrollbar. On mobile a
   * right-edge fade signals the cutoff chip as "more →" instead of a
   * truncation bug. At md+ all chips fit so the mask is dropped to avoid
   * dimming the rightmost tab unnecessarily.
   */
  .incident-tabs {
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
  }

  .incident-tabs::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 767px) {
    .incident-tabs {
      -webkit-mask-image: linear-gradient(
        to right,
        black 0,
        black calc(100% - 32px),
        transparent 100%
      );
      mask-image: linear-gradient(
        to right,
        black 0,
        black calc(100% - 32px),
        transparent 100%
      );
    }
  }

  /* Incident chips — replaces .live-tab */
  .incident-chip {
    @apply inline-flex items-center px-4 md:px-4 h-full no-underline whitespace-nowrap;
    flex: 0 0 auto;
    scroll-snap-align: start;
    font-family: var(--ff-body);
    font-size: var(--ts-meta);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--cc-type-3);
    border-bottom: 2px solid transparent;
    transition:
      color 200ms ease,
      border-color 200ms ease;
    cursor: pointer;
    text-decoration: none !important;
    min-height: 44px;
  }

  .incident-chip:first-child {
    padding-left: 16px;
  }

  .incident-chip:last-child {
    padding-right: 32px;
  }

  .incident-chip:hover {
    color: var(--cc-type-1);
  }

  .incident-chip--selected {
    color: var(--cc-type-1);
    border-bottom-color: var(--cc-signal);
  }

  /*
   * DisasterIcon renders an inner SVG (.standard-icon / .easter-egg) at
   * w-10/h-10 = 40px. Override via the wrapper so the icon fits the chip
   * without crashing into the label. Using > * because the inner classes
   * are scoped to DisasterIcon and unreachable directly.
   */
  .incident-chip__icon {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .incident-chip__icon > * {
    width: 28px !important;
    height: 28px !important;
  }

  @media (min-width: 768px) {
    .incident-chip__icon,
    .incident-chip__icon > * {
      width: 32px !important;
      height: 32px !important;
    }
  }

  /* Map status cells — top accent only, see plan moment #1 */
  .map-stat-cell__label {
    font-family: var(--ff-body);
    font-size: var(--ts-meta);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--cc-type-3);
    text-align: center;
  }

  .map-stat-cell__value {
    font-family: var(--ff-display);
    font-feature-settings: var(--num-features);
    font-weight: 800;
    font-size: clamp(1rem, 1.4vw, 1.5rem);
    color: var(--cc-type-1);
    text-align: center;
    line-height: 1.05;
  }

  .mapStats > .map-stat-cell:hover {
    cursor: pointer;
  }

  /* Chart panel scaffolding */
  .chart-tab {
    @apply absolute left-0 right-0;
    top: 2.5rem;
    bottom: 0;
  }

  .chart-container {
    @apply absolute top-0 bottom-0 left-0 right-0;
    background-color: var(--cc-ink-0);
    border: 1px solid var(--cc-ink-3);
  }

  /* Scrollbar — ink palette */
  ::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--cc-ink-3);
    border-radius: 8px;
    border: 3px solid transparent;
    background-clip: content-box;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: var(--cc-ink-4);
  }
}
</style>
