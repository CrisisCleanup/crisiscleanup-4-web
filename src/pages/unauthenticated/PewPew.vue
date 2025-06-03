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
        class="md:hidden fixed bottom-0 left-0 w-full bg-crisiscleanup-dark-500 z-max flex justify-center items-center py-2"
      >
        <PewPewNavBar :color-mode="colorMode" />
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col pb-[146px] md:pb-0 overflow-y-auto">
        <div class="flex flex-col md:grid md:grid-cols-6 h-full">
          <!-- Left Sidebar with Stats -->
          <div class="w-full md:col-span-1 p-2">
            <div class="mt-4 md:mt-10">
              <tabs
                ref="tabs"
                tab-classes="text-xs"
                tab-default-classes="flex items-center justify-center h-8 cursor-pointer px-2 hover:bg-crisiscleanup-dark-300 transition-colors duration-200"
                tab-active-classes="bg-crisiscleanup-dark-400 rounded-t-sm"
                @tab-selected="stopSiteInfoTabCirculationTimer"
              >
                <!-- Live Tab -->
                <tab
                  :name="$t('pewPew.live')"
                  :selected="
                    siteInfoTimerData.isTimerActive &&
                    siteInfoTimerData.activeInfoTab === 0
                  "
                  data-testid="testPewPewLiveTab"
                  class="mx-1 left-0 right-0 min-w-[100px] md:min-w-[120px]"
                  :style="{ top: '2rem', bottom: 0 }"
                >
                  <SiteActivityGauge
                    v-if="currentSiteStats.length > 0"
                    :key="currentEngagement"
                    data-testid="testCurrentEngagementChart"
                    class="h-full w-full"
                    :chart-data="currentEngagement"
                    :margin-all="10"
                    chart-id="site-activity-gauge"
                    :title="$t('reports.pp_engagement_title')"
                  />
                  <div class="h-1/2 md:h-3/4 w-full overflow-hidden mt-2">
                    <CardStack ref="cards" />
                  </div>
                </tab>
                <!-- Stats Tab -->
                <tab
                  :name="
                    currentSiteStats.length > 0
                      ? `${currentSiteStats[0].currency_symbol}${formatStatValue(currentSiteStats[0].value)}`
                      : $t('reports.pp_site_stats_title')
                  "
                  :selected="
                    siteInfoTimerData.isTimerActive &&
                    siteInfoTimerData.activeInfoTab === 1
                  "
                  data-testid="testSiteStatsTab"
                  class="mx-0.5 md:mx-1 left-0 right-0 min-w-[90px] md:min-w-[110px]"
                  :style="{ top: '1.5rem', bottom: 0 }"
                >
                  <div
                    class="flex flex-col items-start justify-start p-1.5 md:p-3 w-full rounded-t-xl bg-crisiscleanup-dark-400 max-h-72 overflow-y-auto md:max-h-none"
                  >
                    <div
                      class="w-full grid grid-cols-2 sm:grid-cols-1 gap-1 md:gap-2"
                    >
                      <div
                        v-for="(stat, index) in currentSiteStats"
                        :key="stat.id"
                        :data-testid="`testSiteStats${stat.id}Div`"
                        class="p-1.5 md:p-2 rounded-lg hover:bg-crisiscleanup-dark-300 transition-colors duration-200"
                      >
                        <template v-if="index === 0">
                          <div
                            :key="stat.id"
                            class="flex items-center font-bold mb-0.5 md:mb-1"
                          >
                            <span class="text-[10px] md:text-xs lg:text-sm">{{
                              $t(stat.name_t)
                            }}</span>
                            <ccu-icon
                              v-tooltip="{
                                content: $t(stat.description_t),
                                html: true,
                                triggers: ['click'],
                                popperClass: 'interactive-tooltip w-auto',
                              }"
                              :invert-color="true"
                              :data-testid="`testSiteStats${stat.id}Icon`"
                              type="help"
                              size="small"
                              class="ml-0.5 md:ml-1"
                            />
                          </div>
                          <div
                            :key="stat.id"
                            class="text-base md:text-lg lg:text-xl stats font-bold"
                          >
                            {{ stat.currency_symbol
                            }}{{ formatStatValue(stat.value) }}
                          </div>
                        </template>
                        <template v-else>
                          <div
                            :key="stat.id"
                            class="flex items-center font-bold mb-0.5 md:mb-1"
                          >
                            <span class="text-[10px] md:text-xs lg:text-sm">{{
                              $t(stat.name_t)
                            }}</span>
                            <ccu-icon
                              v-tooltip="{
                                content: $t(stat.description_t),
                                triggers: ['click'],
                                html: true,
                                popperClass: 'interactive-tooltip w-auto',
                              }"
                              :invert-color="true"
                              :data-testid="`testSiteStats2${stat.id}Icon`"
                              type="help"
                              size="small"
                              class="ml-0.5 md:ml-1"
                            />
                          </div>
                          <div
                            :key="stat.id"
                            class="text-xs md:text-sm lg:text-base stats"
                          >
                            {{ stat.currency_symbol
                            }}{{ formatStatValue(stat.value) }}
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </tab>
              </tabs>
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="flex-1 md:col-span-5 flex flex-col">
            <!-- Top Banner -->
            <div
              class="min-h-8 md:min-h-12 grid grid-cols-1 md:grid-cols-10 mt-1 md:mt-0"
            >
              <div
                class="md:col-span-8 flex justify-center items-center text-black font-bold ribbon-gradient px-2 md:px-0"
              >
                <div
                  v-if="incidentList.length > 0"
                  class="text-[0.7rem] sm:text-sm md:text-base text-center md:py-2 px-4 md:px-32"
                >
                  <span
                    v-for="(incident, index) in incidentList"
                    :key="incident.id"
                    :data-testid="`testIncident${incident.id}Div`"
                    class="inline-flex items-center"
                  >
                    <span class="text-xs md:text-sm"
                      >{{ incident.short_name }}:</span
                    >
                    <div class="inline-block transform scale-70 ml-1">
                      <PhoneNumberDisplay
                        v-for="hotlineNumber in formatIncidentPhoneNumbers(
                          incident,
                        )"
                        :key="hotlineNumber"
                        type="plain"
                        :phone-number="hotlineNumber"
                      />
                    </div>
                    <span
                      v-if="index < incidentList.length - 1"
                      class="text-base text-primary-light mx-2"
                    >
                      |
                    </span>
                  </span>
                </div>
                <div
                  v-else
                  data-testid="testPewPewBannerDiv"
                  class="text-sm md:text-lg"
                >
                  {{ $t('homeVue.pew_pew_banner') }}
                </div>
              </div>

              <!-- Auth Buttons -->
              <div
                class="md:col-span-2 flex items-center justify-center space-x-2 mt-2 md:mt-0"
              >
                <template v-if="!isLoggedIn">
                  <base-button
                    class="text-[10px] md:text-xs p-1.5 md:p-2 w-20 md:w-24 text-black rounded-lg hover:bg-opacity-90 transition-colors duration-200"
                    data-testid="testRegisterButton"
                    variant="solid"
                    :text="$t('actions.register')"
                    :alt="$t('actions.register')"
                    :action="() => $router.push('/register')"
                  />
                  <base-button
                    class="text-[10px] md:text-xs p-1.5 md:p-2 w-20 md:w-24 rounded-lg hover:bg-opacity-90 transition-colors duration-200"
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
              class="h-14 md:h-18 lg:h-12 mt-2 md:mt-3 flex text-[10px] md:text-xs overflow-x-auto whitespace-nowrap"
            >
              <div
                class="live-tab px-3 md:px-4 lg:px-6"
                :class="incidentId ? '' : 'live-tab--selected'"
                @click="$router.push({ name: 'nav.pew' })"
              >
                {{ $t('pewPew.current') }}
              </div>
              <router-link
                v-for="i in incidents"
                :key="i.id"
                :data-testid="`testIncident${i.id}Div`"
                :to="{ name: 'nav.pew', query: { incident: i.id } }"
                class="live-tab px-2 md:px-3 lg:px-4"
                :class="
                  String(i.id) === String(incidentId)
                    ? 'live-tab--selected'
                    : ''
                "
              >
                <DisasterIcon
                  class="mx-0.5 md:mx-1 lg:mx-2"
                  :data-testid="`testDisaster${i.id}Icon`"
                  :current-incident="i"
                  :alt="i.short_name"
                />
                <span class="text-[10px] md:text-xs">{{ i.short_name }}</span>
              </router-link>
            </div>

            <!-- Map and Charts Area -->
            <div
              class="flex-grow select-none grid grid-cols-1 md:grid-cols-10 mt-1 md:mt-0"
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
                <div
                  class="absolute top-0 left-0 m-2 p-2 bg-opacity-25 bg-crisiscleanup-dark-400 rounded-sm z-map-controls w-[calc(100%-1rem)] md:w-auto"
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
                      icon-size="xs"
                      ccu-event="user_ui-zoom-in"
                      :title="$t('worksiteMap.zoom_in')"
                      :alt="$t('worksiteMap.zoom_in')"
                      :action="zoomIn"
                      class="w-8 h-8 border-crisiscleanup-dark-100 border-b bg-opacity-25 bg-crisiscleanup-dark-400 text-white text-xl rounded-sm hover:bg-opacity-50 transition-colors duration-200"
                    />
                    <base-button
                      text=""
                      data-testid="testZoomOutButton"
                      icon="minus"
                      icon-size="xs"
                      ccu-event="user_ui-zoom-out"
                      :title="$t('worksiteMap.zoom_out')"
                      :alt="$t('worksiteMap.zoom_out')"
                      :action="zoomOut"
                      class="w-8 h-8 bg-opacity-25 bg-crisiscleanup-dark-400 text-white text-xl rounded-sm hover:bg-opacity-50 transition-colors duration-200"
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
                      class="bg-crisiscleanup-dark-400 p-2 my-2 bg-opacity-25 w-48 md:w-56 text-center rounded-sm text-sm md:text-base"
                    >
                      {{ i.name }}
                    </div>
                  </transition-group>
                </div>

                <!-- Legend -->
                <div
                  v-if="displayedWorkTypeSvgs.length > 0"
                  class="absolute bottom-0 left-0 w-[calc(100%-1.5rem)] md:w-1/3 h-auto bg-crisiscleanup-dark-400 p-2 md:p-3 ml-3 bg-opacity-25 z-map-controls rounded-sm"
                  style="bottom: 25%"
                >
                  <div
                    class="flex justify-between font-bold my-1 md:my-2 text-white text-xs md:text-sm"
                  >
                    <span>{{ $t('worksiteMap.legend') }}</span>
                    <span
                      class="cursor-pointer hover:text-crisiscleanup-light-400 transition-colors duration-200"
                      @click="isLegendHidden = !isLegendHidden"
                    >
                      <font-awesome-icon
                        v-if="!isLegendHidden"
                        data-testid="testHideLegendIcon"
                        icon="minus"
                        :alt="$t('worksiteMap.hide_legend')"
                      />
                      <font-awesome-icon
                        v-else
                        data-testid="testShowLegendIcon"
                        icon="plus"
                        :alt="$t('worksiteMap.show_legend')"
                      />
                    </span>
                  </div>
                  <transition name="fade">
                    <div
                      v-if="!isLegendHidden"
                      class="grid grid-cols-2 md:grid-cols-2 auto-cols-max justify-between gap-1 md:gap-2"
                    >
                      <div
                        v-for="entry in displayedWorkTypeSvgs"
                        :key="entry.key"
                        :data-testid="`testLegendSvgs${entry.key}Div`"
                        class="flex items-center mb-1 cursor-pointer p-1 md:p-2 hover:bg-crisiscleanup-dark-300 rounded-sm transition-colors duration-200"
                        :class="
                          entry.selected ? 'bg-crisiscleanup-dark-300' : ''
                        "
                        @click="
                          () => {
                            entry.selected = !entry.selected;
                            refreshVisibility(entry.key);
                          }
                        "
                      >
                        <div class="map-svg-container" v-html="entry.svg"></div>
                        <span
                          class="text-[10px] md:text-xs ml-1 md:ml-2 text-white"
                          >{{ getWorkTypeName(entry.key) }}</span
                        >
                      </div>
                    </div>
                  </transition>
                </div>

                <!-- Map Stats and Controls -->
                <div class="absolute left-0 bottom-0 right-0 z-map-controls">
                  <div class="relative">
                    <img
                      src="@/assets/cc-logo.svg"
                      data-testid="testCcuLogoIcon"
                      alt="crisis-cleanup-logo"
                      class="absolute p-2 md:p-3 h-12 md:h-16 right-0 bottom-0 opacity-20"
                    />
                  </div>
                  <div
                    class="mapStats grid grid-flow-col auto-cols-max items-center overflow-x-auto mb-2 px-2 md:px-3"
                  >
                    <div
                      v-for="item in mapStatistics"
                      :key="item['title']"
                      :data-testid="`testMapStatItem${item['title']}Div`"
                      class="p-1 md:p-2 px-2 md:px-4 border mx-1 bg-opacity-25 bg-crisiscleanup-dark-400 rounded-sm hover:bg-opacity-35 transition-colors duration-200"
                      :style="item['style']"
                    >
                      <div
                        class="text-center text-white text-[10px] md:text-xs opacity-50"
                      >
                        {{ item['title'] }}
                      </div>
                      <div
                        class="text-center text-white text-xs md:text-sm font-semibold"
                      >
                        {{ item['count'] }}
                      </div>
                    </div>
                  </div>
                  <div
                    class="w-auto h-auto bg-crisiscleanup-dark-400 p-2 md:p-3 bg-opacity-25 flex mb-4 md:mb-8 mx-2 md:mx-3 rounded-sm"
                  >
                    <div class="flex justify-center items-center mr-2">
                      <base-button
                        v-if="!isPaused"
                        data-testid="testPauseGeneratePointsButton"
                        class="w-6 h-6 md:w-8 md:h-8 rounded-full focus:outline-none border p-1 md:p-2 hover:bg-opacity-50 transition-colors duration-200"
                        :action="pauseGeneratePoints"
                        icon="pause"
                        icon-size="xs"
                      >
                      </base-button>
                      <base-button
                        v-else
                        data-testid="testResumeGeneratePointsButton"
                        class="w-6 h-6 md:w-8 md:h-8 rounded-full focus:outline-none border p-1 md:p-2 hover:bg-opacity-50 transition-colors duration-200"
                        :action="resumeGeneratePoints"
                        icon="play"
                        icon-size="xs"
                      >
                      </base-button>
                    </div>
                    <Slider
                      v-if="markersLength > 0"
                      :key="markersLength"
                      data-testid="testUpdatedSliderDiv"
                      :value="markersLength - 1"
                      :min="0"
                      :max="markersLength - 1"
                      :from="queryFilter.start_date.format('MMM Do YYYY')"
                      :to="queryFilter.end_date.format('MMM Do YYYY')"
                      :alt="$t('actions.play')"
                      @input="
                        (_value) =>
                          throttle(() => refreshTimeline(_value), 1000)()
                      "
                    ></Slider>
                  </div>
                </div>
              </div>

              <!-- Right Sidebar -->
              <div
                class="h-full p-2 w-full col-span-1 md:col-span-3 grid grid-rows-12 min-h-[1200px] md:min-h-[0px]"
              >
                <LiveOrganizationTable
                  :organizations="organizations"
                  :query-filter="queryFilter"
                  :styles="styles"
                  :overlay-styles="overlayStyles"
                  data-testid="testLiveOrganizationTableDiv"
                  class="row-span-7 relative"
                />
                <div class="row-span-5" data-testid="testBottomChartTabsDiv">
                  <tabs
                    data-testid="testStopChartTabCirculationTimerTab"
                    class="relative h-full m-1 overflow-x-auto flex md:block"
                    tab-classes="text-[10px] md:text-xs"
                    tab-default-classes="flex items-center justify-center text-center h-8 md:h-10 cursor-pointer px-1.5 md:px-2 hover:bg-crisiscleanup-dark-300 transition-colors duration-200"
                    tab-active-classes="bg-crisiscleanup-dark-400 rounded-t-lg"
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
                      <div
                        class="chart-container rounded-tr-xl h-56 md:h-64 lg:h-72"
                      >
                        <CircularBarplot
                          v-if="circularBarplotData.length > 0"
                          :key="circularBarplotData"
                          data-testid="testPpCallTimesChart"
                          class="h-full w-full"
                          :chart-data="circularBarplotData"
                          :margin="15"
                          :is-stacked="false"
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
                      <div
                        class="chart-container rounded-t-xl h-56 md:h-64 lg:h-72"
                      >
                        <TotalCases
                          :key="totalCasesChartData"
                          data-testid="testTotalCasesChart"
                          class="h-full w-full"
                          :margin-all="20"
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
                      <div
                        class="chart-container rounded-t-xl h-56 md:h-64 lg:h-72"
                      >
                        <D3BarChart
                          :key="barChartData"
                          class="h-full w-full"
                          chart-id="completion-rate"
                          :chart-data="barChartData"
                          :is-stacked="true"
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
import moment from 'moment';
import axios from 'axios';
import { useStore } from 'vuex';
import { shuffle, throttle } from 'lodash';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { getQueryString } from '@/utils/urls';
import useLiveMap from '@/hooks/worksite/useLiveMap';
import CardStack from '@/components/live/CardStack.vue';
import Slider from '@/components/Slider.vue';
import DisasterIcon from '@/components/DisasterIcon.vue';
import UserProfileMenu from '@/components/header/UserProfileMenu.vue';
import {
  formatIncidentPhoneNumbers,
  getWorkTypeName,
  isValidActiveHotline,
} from '@/filters';
import Incident from '@/models/Incident';
import LiveOrganizationTable from '@/components/live/LiveOrganizationTable.vue';
import useSiteStatistics from '@/hooks/live/useSiteStatistics';
import SiteActivityGauge from '@/components/live/SiteActivityGauge.vue';
import CircularBarplot from '@/components/live/CircularBarplot.vue';
import D3BarChart from '@/components/live/D3BarChart.vue';
import LightTab from '@/components/tabs/LightTab.vue';
import TotalCases from '@/components/live/TotalCases.vue';
import PewPewNavBar from '@/components/navigation/PewPewNavBar.vue';
import User from '@/models/User';
import { useAuthStore } from '@/hooks';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay.vue';
import type { Sprite, WorksiteType } from '@/types';
import { useMq } from 'vue3-mq';

interface QueryFilter {
  start_date: moment.Moment;
  end_date: moment.Moment;
  incident?: string;
}

interface SiteInfoTimerData {
  timerId: number | null;
  activeInfoTab: number;
  isTimerActive: boolean;
}

interface ChartCirculationTimerData {
  timerId: number | null;
  activeInfoTab: number;
  isTimerActive: boolean;
}

interface MapStatistics {
  title: string;
  count: number;
  style: Record<string, string>;
}

export default {
  name: 'PewPew',
  components: {
    PhoneNumberDisplay,
    PewPewNavBar,
    TotalCases,
    LightTab,
    D3BarChart,
    CircularBarplot,
    SiteActivityGauge,
    LiveOrganizationTable,
    UserProfileMenu,
    DisasterIcon,
    Slider,
    CardStack,
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
    const cards = ref<InstanceType<typeof CardStack> | null>(null);
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
      color: colorMode.value === 'dark' ? 'white' : '#232323',
      backgroundColor: colorMode.value === 'dark' ? '#232323' : 'white',
    }));

    const overlayStyles = computed(() => ({
      color: colorMode.value === 'dark' ? 'white' : '#232323',
      backgroundColor: colorMode.value === 'dark' ? '#242C36' : 'white',
    }));

    // Timer Data
    const siteInfoTimerData = reactive<SiteInfoTimerData>({
      timerId: null,
      activeInfoTab: 0,
      isTimerActive: true,
    });

    const chartCirculationTimerData = reactive<ChartCirculationTimerData>({
      timerId: null,
      activeInfoTab: 0,
      isTimerActive: true,
    });

    // Methods
    async function getAllEvents() {
      try {
        mapLoading.value = true;
        if (queryFilter.value.incident) {
          const params: Record<string, any> = {
            limit: 60_000,
            event_key__in: Object.keys({
              user_create_worksite: true,
            }).join(','),
            sort: 'created_at',
            incident_id: queryFilter.value.incident || '',
            created_at__gte: queryFilter.value.start_date.toISOString(),
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
      const totalTabs = 2;
      siteInfoTimerData.timerId = window.setInterval(() => {
        siteInfoTimerData.activeInfoTab =
          (siteInfoTimerData.activeInfoTab + 1) % totalTabs;
      }, ms);
    }

    function stopSiteInfoTabCirculationTimer() {
      if (siteInfoTimerData.isTimerActive) {
        clearInterval(siteInfoTimerData.timerId);
        siteInfoTimerData.isTimerActive = false;
      }
    }

    function startTabCirculationTimer(ms: number) {
      const totalTabs = 3;
      chartCirculationTimerData.timerId = window.setInterval(() => {
        chartCirculationTimerData.activeChartTab =
          (chartCirculationTimerData.activeChartTab + 1) % totalTabs;
      }, ms);
    }

    function stopChartTabCirculationTimer() {
      if (chartCirculationTimerData.isTimerActive) {
        clearInterval(chartCirculationTimerData.timerId);
        chartCirculationTimerData.isTimerActive = false;
      }
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
    const isPaused = computed(() => mapUtils.value?.isPaused);
    const displayedWorkTypeSvgs = computed(
      () => mapUtils.value?.displayedWorkTypeSvgs || [],
    );

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

.mapStats > div:hover {
  @apply border-2 cursor-pointer;
}

.live-tab {
  @apply flex items-center justify-center h-12 cursor-pointer text-white no-underline;
  text-decoration: none !important;
}

.live-tab--selected {
  @apply bg-crisiscleanup-dark-400 rounded-sm;
}

.leaflet-data-marker svg {
  width: 30px;
  height: 30px;
}
.table-grid .header .header-column p {
  font-size: 11px;
}

.small-font {
  font-size: 11px;
}

.map-svg-container svg {
  width: 16px;
  height: 16px;
}

.pew-pew-blue {
  color: #61d5f8;
}

.pewpew {
  @apply h-full w-full overflow-hidden;

  .ribbon-gradient {
    background: rgba(129, 154, 176, 0.7);
  }

  /* set top to 2.5rem to place it after tab headers which has a h-10 = 2.5rem */
  .chart-tab {
    @apply absolute left-0 right-0;
    top: 2.5rem;
    bottom: 0;
  }

  .chart-container {
    @apply absolute
    top-0
    bottom-0
    left-0
    right-0
    bg-crisiscleanup-dark-400;
  }

  ::-webkit-scrollbar {
    width: 20px;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #d6dee1;
    border-radius: 20px;
    border: 6px solid transparent;
    background-clip: content-box;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: #a8bbbf;
  }
}
</style>
