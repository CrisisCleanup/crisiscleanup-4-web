<template>
  <template v-if="mq.mdMinus">
    <div v-if="!isEditing && !isNew">
      <div class="h-20 absolute top-0 w-24 mt-20 z-toolbar">
        <PhoneToolBar
          :complete-call="completeCall"
          :on-logged-in="onLoggedIn"
          :set-allowed-call-type="setAllowedCallType"
          :select-case="selectCase"
          :worksite-id="worksiteId"
        />
      </div>
      <SimpleMap
        :key="showingMap"
        :map-loading="mapLoading"
        class="mb-16"
        zoom-buttons-class="mt-20"
      />
      <WorksiteTable
        v-if="showingTable"
        class="mt-28"
        :worksite-query="worksiteQuery"
        @selection-changed="onSelectionChanged"
        @row-click="
          (worksite) => {
            worksiteId = worksite.id;
            isEditing = true;
          }
        "
      />
      <div
        ref="phoneButtons"
        class="phone-system__actions"
        data-testid="testPhoneButtonsDiv"
      >
        <PhoneComponentButton
          name="caller"
          data-testid="testPhoneComponentCallerButton"
          :alt="$t('phoneDashboard.availability_indicator')"
          class="phone-system__action"
          component-class="phone-system__action-content phone-system__action-content--caller"
        >
          <template #button>
            <div
              class="w-full h-full relative flex items-center justify-center"
            >
              <PhoneIndicator class="w-full h-full" />
              <!-- add invisible layer over svg to allow pointer events / onClicks -->
              <span class="absolute inset-0 bg-transparent"></span>
            </div>
          </template>
          <template #component>
            <div
              v-if="potentialFailedCall"
              data-testid="testPotentialFailedCallDiv"
              class="bg-red-500 mt-6 text-white p-1.5"
            >
              {{ $t('phoneDashboard.ended_early') }}
              <base-button
                :action="retryFailedCall"
                data-testid="testRetryFailedCallButton"
                variant="solid"
                class="px-2 text-black mt-1"
                :text="$t('phoneDashboard.try_again')"
                :alt="$t('phoneDashboard.try_again')"
              />
            </div>
            <tabs ref="tabs" :details="false" @mounted="setTabs">
              <tab ref="callTab" :name="$t('phoneDashboard.active_call')">
                <ActiveCall
                  :case-id="worksiteId"
                  data-testid="testActiveCallDiv"
                  @set-case="selectCase"
                />
              </tab>
              <tab ref="statusTab" :name="$t('phoneDashboard.call_status')">
                <UpdateStatus
                  class="p-2"
                  data-testid="testUpdateStatusCompleteCallDiv"
                  @on-complete-call="completeCall"
                />
              </tab>
            </tabs>
          </template>
        </PhoneComponentButton>
        <PhoneComponentButton
          name="dialer"
          data-testid="testPhoneComponentDialerButton"
          class="phone-system__action"
          component-class="phone-system__action-content phone-system__action-content--dialer"
          :alt="$t('phoneDashboard.manual_dialer')"
          icon="dialer"
          icon-size="small"
          icon-class="bg-black p-1"
        >
          <template #component>
            <ManualDialer
              class="p-2 z-toolbar"
              data-testid="testManualDialerDiv"
              :dialing="dialing"
              @on-dial="initiateManualOutbound"
            ></ManualDialer>
          </template>
        </PhoneComponentButton>

        <PhoneComponentButton
          name="chat"
          data-testid="testPhoneComponentChatButton"
          :alt="$t('chat.chat')"
          class="phone-system__action"
          component-class="phone-system__action-content phone-system__action-content--chat"
          @open="
            () => {
              updateUserState({
                chat_last_seen: moment().toISOString(),
              });
              unreadChatCount = 0;
              unreadUrgentChatCount = 0;
            }
          "
        >
          <template #button>
            <div
              class="w-full h-full flex items-center justify-center relative"
            >
              <div
                v-if="unreadChatCount"
                class="absolute top-0 left-0 m-1"
                data-testid="testUnreadChatCountDiv"
              >
                <span
                  class="inline-flex items-center justify-center px-1 py-0.5 mr-2 text-xs font-bold leading-none text-black bg-primary-light rounded-full"
                  >{{ unreadChatCount }}</span
                >
              </div>
              <div
                v-if="unreadUrgentChatCount"
                class="absolute top-0 right-0 my-1 -mx-1"
                data-testid="testUnreadUrgentChatCountDiv"
              >
                <span
                  class="inline-flex items-center justify-center px-1 py-0.5 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full"
                  >{{ unreadUrgentChatCount }}</span
                >
              </div>
              <ccu-icon
                type="chat"
                class="p-1 ml-1.5"
                size="large"
                :alt="$t('chat.chat')"
              />
            </div>
          </template>
          <template #component>
            <Chat
              v-if="selectedChat"
              :chat="selectedChat"
              @unread-count="unreadChatCount = $event"
              @unread-urgent-count="unreadUrgentChatCount = $event"
              @on-new-message="unreadChatCount += 1"
              @on-new-urgent-message="unreadUrgentChatCount += 1"
              @focus-news-tab="focusNewsTab"
            />
          </template>
        </PhoneComponentButton>
        <PhoneComponentButton
          name="zoom"
          data-testid="testZoomMeetingButton"
          :alt="$t('phoneDashboard.join_zoom')"
          class="phone-system__action"
          component-class="phone-system__action-content phone-system__action-content--zoom"
        >
          <template #button>
            <div class="w-full h-full flex items-center justify-center">
              <ccu-icon
                type="zoom"
                class="p-1"
                size="medium"
                :alt="$t('phoneDashboard.join_zoom')"
              />
            </div>
          </template>
          <template #component>
            <div class="flex items-center justify-center p-3 gap-2">
              <a href="https://bit.ly/ccuzoom" target="_blank"
                ><div class="bg-primary-light py-1 px-4">
                  {{ $t('phoneDashboard.join_zoom') }}
                </div></a
              >
            </div>
          </template>
        </PhoneComponentButton>
        <PhoneComponentButton
          v-if="callHistory"
          data-testid="testPhoneComponentHistoryButton"
          :alt="$t('phoneDashboard.call_history')"
          name="history"
          class="phone-system__action"
          component-class="phone-system__action-content phone-system__action-content--history"
          icon="phone-history"
          icon-size="large"
          icon-class="p-1"
        >
          <template #component>
            <CallHistory
              :calls="callHistory"
              data-testid="testCallHistoryDiv"
              @row-click="handleCallHistoryRowClick"
            />
          </template>
        </PhoneComponentButton>
        <PhoneComponentButton
          name="stats"
          data-testid="testPhoneComponentStatsButton"
          :alt="$t('phoneDashboard.stats')"
          class="phone-system__action"
          component-class="phone-system__action-content phone-system__action-content--stats"
        >
          <template #button>
            <div class="w-full h-full flex items-center justify-center">
              <div class="text-xl">
                {{ callsWaiting }}
              </div>
            </div>
          </template>
          <template #component>
            <GeneralStats
              @on-remaining-callbacks="remainingCallbacks = $event"
              @on-remaining-calldowns="remainingCalldowns = $event"
            />
          </template>
        </PhoneComponentButton>
        <PhoneComponentButton
          name="leaderboard"
          data-testid="testPhoneComponentLeaderboardButton"
          :alt="$t('phoneDashboard.leaderboard')"
          class="phone-system__action"
          component-class="phone-system__action-content phone-system__action-content--leaderboard"
          icon="leaderboard"
          icon-size="medium"
          icon-class="p-1"
        >
          <template #button>
            <div class="w-full h-full flex items-center justify-center">
              <ccu-icon
                :fa="true"
                type="users"
                class="p-1"
                size="medium"
                :alt="$t('phoneDashboard.leaderboard')"
              />
            </div>
          </template>
          <template #component>
            <Leaderboard class="h-full" />
          </template>
        </PhoneComponentButton>
      </div>
      <span
        v-if="allWorksiteCount"
        class="font-thin w-screen absolute flex items-center justify-center mt-4 mr-6 z-toolbar"
      >
        <span class="bg-black rounded p-2 text-white">
          <span data-testid="testCaseCountContent">
            {{ allWorksiteCount }}
            {{ $t('casesVue.cases') }}
          </span>
        </span>
      </span>
      <div class="absolute top-4 right-4 flex z-toolbar">
        <base-button
          text=""
          data-testid="testSearchButton"
          icon="search"
          icon-size="sm"
          :title="$t('actions.search')"
          :alt="$t('actions.search')"
          :action="
            () => {
              showingSearchModal = !showingSearchModal;
            }
          "
          class="w-10 h-10 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
        />
      </div>
      <div class="absolute top-28 left-12 mt-2 z-toolbar">
        <WorksiteSearchInput
          v-if="showingSearchModal"
          :value="mobileSearch"
          data-testid="testWorksiteSearch"
          size="large"
          display-property="name"
          :placeholder="$t('actions.search')"
          skip-validation
          use-recents
          class="mx-4 py-1 inset-1"
          @selected-existing="onSelectExistingWorksite"
          @input="
            (value: string) => {
              mobileSearch = value;
            }
          "
        />
      </div>
      <div class="absolute bottom-20 gap-2 right-4 flex flex-col z-toolbar">
        <base-button
          data-testid="testAddCaseButton"
          icon="plus"
          icon-size="sm"
          :title="$t('actions.add_case')"
          :alt="$t('actions.add_case')"
          :action="
            () => {
              isNew = true;
            }
          "
          class="w-12 h-12 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
        />
        <base-button
          v-if="showingMap"
          data-testid="testShowTableButton"
          ccu-icon="table"
          icon-size="sm"
          :title="$t('actions.table_view_alt')"
          :alt="$t('actions.table_view_alt')"
          :action="() => toggleView('showingTable')"
          class="w-12 h-12 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
        />
        <base-button
          v-if="showingTable"
          data-testid="testShowMapButton"
          ccu-icon="map"
          icon-size="sm"
          :title="$t('casesVue.map_view')"
          :alt="$t('casesVue.map_view')"
          :action="() => toggleView('showingMap')"
          class="w-12 h-12 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
        />
      </div>
    </div>
    <div
      v-else
      :style="{
        height: worksite ? 'calc(100vh - 10rem)' : 'calc(100vh - 8rem)',
      }"
    >
      <CaseHeader
        v-if="worksite"
        data-testid="testCaseHeaderDiv"
        :worksite="worksite"
        class="p-2 border-l border-r"
        can-edit
        :is-viewing-worksite="false"
        @on-jump-to-case="jumpToCase"
        @on-download-worksite="() => downloadWorksites([worksite?.id])"
        @on-print-worksite="() => printWorksite(worksite?.id)"
        @on-flag-case="
          () => {
            showFlags = true;
            showHistory = false;
          }
        "
        @on-share-worksite="() => shareWorksite(worksite?.id)"
        @on-show-history="
          () => {
            showFlags = false;
            showHistory = true;
          }
        "
      />
      <div v-else class="phone-system__form-header">
        <div class="flex items-center cursor-pointer">
          <ccu-icon
            :alt="$t('casesVue.new_case')"
            data-testid="testNewCaseIcon"
            type="active"
            size="small"
            :action="() => selectCase(null)"
          />
          <span class="px-1 mt-0.5"
            >{{ $t('casesVue.new_case') }} -
            {{ currentIncident?.short_name }}</span
          >
        </div>
        <base-button
          v-if="$mq === 'sm'"
          data-testid="testShowMapIcon"
          type="bare"
          icon="map"
          class="text-gray-700 pt-2"
          :action="
            () => {
              showMobileMap = true;
              $nextTick(() => {
                map.invalidateSize();
              });
            }
          "
          :text="$t('casesVue.show_map')"
          :alt="$t('casesVue.show_map')"
        />
      </div>
      <div v-if="showingDetails" class="phone-system__form-toggler">
        <base-button
          icon="arrow-left"
          data-testid="testShowHistoryButton"
          :icon-size="medium"
          :alt="$t('actions.history')"
          :action="
            () => {
              showHistory = false;
              showFlags = false;
            }
          "
        />
        <span class="text-base">{{ $t('actions.history') }}</span>
        <div></div>
      </div>
      <div class="h-full min-h-0">
        <CaseHistory
          v-if="showHistory"
          data-testid="testHistoryDiv"
          :incident-id="currentIncidentId"
          :worksite-id="worksiteId"
        ></CaseHistory>
        <WorksiteForm
          v-else
          ref="worksiteForm"
          :key="worksiteId"
          data-testid="testWorksiteFormDiv"
          :incident-id="String(currentIncidentId)"
          :worksite-id="worksiteId"
          disable-claim-and-save
          :is-editing="isEditing"
          class="border shadow"
          @jump-to-case="jumpToCase"
          @saved-worksite="
            (worksite) => {
              onSaveCase(worksite);
              init();
            }
          "
          @close-worksite="
            () => {
              clearCase();
              isNew = false;
              isEditing = false;
              init();
            }
          "
          @navigate-to-worksite="onSelectExistingWorksite"
          @geocoded="addMarkerToMap"
        />
      </div>
    </div>
  </template>
  <template v-else>
    <div class="phone-system">
      <div class="phone-system__main">
        <div class="phone-system__main-header">
          <div class="flex py-3 px-2" style="min-width: 80px">
            <ccu-icon
              :alt="$t('casesVue.map_view')"
              data-testid="testPhoneMapViewIcon"
              size="medium"
              class="mr-4 cursor-pointer"
              :class="showingMap ? 'filter-yellow' : 'filter-gray'"
              type="map"
              ccu-event="user_ui-view-map"
              @click="toggleView('showingMap')"
            />
            <ccu-icon
              :alt="$t('casesVue.table_view')"
              data-testid="testPhoneTableViewIcon"
              size="medium"
              class="mr-4 cursor-pointer"
              :class="showingTable ? 'filter-yellow' : 'filter-gray'"
              type="table"
              ccu-event="user_ui-view-table"
              @click="toggleView('showingTable')"
            />
          </div>
          <span v-if="allWorksiteCount" class="font-thin">
            <span>
              {{ $t('casesVue.cases') }}
              {{ allWorksiteCount }}
            </span>
          </span>
          <div class="flex justify-start w-auto">
            <WorksiteSearchInput
              :value="search"
              data-testid="testWorksiteSearch"
              icon="search"
              display-property="name"
              :placeholder="$t('actions.search')"
              size="medium"
              skip-validation
              class="mx-2 w-full"
              use-recents
              @selected-existing="onSelectExistingWorksite"
              @input="
                (value) => {
                  search = value;
                  worksiteQuery = { ...worksiteQuery, search: value };
                }
              "
            />
          </div>
          <template v-if="incidentsWithActivePhones.length > 0">
            <div
              v-for="incident in incidentsWithActivePhones"
              :key="incident.id"
              :data-testid="`testIncidentWithActiveAni${incident.id}Div`"
              class="ml-2"
            >
              {{ incident.short_name }}:
              {{ getIncidentPhoneNumbers(incident) }}
            </div>
          </template>
          <div v-else class="flex-grow">
            {{ $t('homeVue.phone_or_website') }}
          </div>
        </div>
        <PhoneToolBar
          :complete-call="completeCall"
          :on-logged-in="onLoggedIn"
          :set-allowed-call-type="setAllowedCallType"
          :select-case="selectCase"
          :worksite-id="worksiteId"
          :allowed-call-type="allowCallType"
        />
        <PhoneOverlay
          :case-id="worksiteId"
          :selected-chat="selectedChat"
          @on-complete-call="completeCall"
          @set-case="selectCase"
          @on-report-bug="reportBug"
        />
        <div class="phone-system__main-content">
          <div v-show="showingMap" class="phone-system__main-content--map">
            <SimpleMap
              :key="showingMap"
              :map-loading="mapLoading"
              show-zoom-buttons
              :available-work-types="availableWorkTypes"
              @on-zoom-in="zoomIn"
              @on-zoom-out="zoomOut"
              @on-zoom-incident-center="goToIncidentCenter"
              @on-zoom-interactive="goToInteractive"
            />
          </div>
          <div v-show="showingTable" class="phone-system__main-content--table">
            <div class="justify-end items-center hidden md:flex">
              <base-button
                class="ml-3 my-3 border p-1 px-4 bg-white"
                data-testid="testUnclaimButton"
                :class="
                  selectedTableItems && selectedTableItems.size === 0
                    ? 'text-crisiscleanup-grey-700'
                    : ''
                "
                :disabled="selectedTableItems && selectedTableItems.size === 0"
                :action="showUnclaimModal"
                :text="$t('actions.unclaim')"
                :alt="$t('actions.unclaim')"
              >
              </base-button>
            </div>
            <WorksiteTable
              :worksite-query="worksiteQuery"
              :body-style="{ height: 'calc(100vh - 24rem)' }"
              @selection-changed="onSelectionChanged"
              @row-click="
                (worksite) => {
                  worksiteId = worksite.id;
                  isEditing = true;
                }
              "
            />
          </div>
        </div>
      </div>
      <div class="phone-system__form h-full min-h-0">
        <CaseHeader
          v-if="worksite"
          data-testid="testCaseHeaderDiv"
          :worksite="worksite"
          class="p-2 border-l border-r"
          can-edit
          :is-viewing-worksite="false"
          @on-jump-to-case="jumpToCase"
          @on-download-worksite="() => downloadWorksites([worksite?.id])"
          @on-print-worksite="() => printWorksite(worksite?.id)"
          @on-show-history="
            () => {
              showFlags = false;
              showHistory = true;
            }
          "
          @on-share-worksite="() => shareWorksite(worksite?.id)"
          @on-flag-case="
            () => {
              showFlags = true;
              showHistory = false;
            }
          "
        />
        <div v-else class="phone-system__form-header">
          <div class="flex items-center cursor-pointer">
            <ccu-icon
              :alt="$t('casesVue.new_case')"
              data-testid="testNewCaseIcon"
              type="active"
              size="small"
              :action="() => selectCase(null)"
            />
            <span class="px-1 mt-0.5"
              >{{ $t('casesVue.new_case') }} -
              {{ currentIncident?.short_name }}</span
            >
          </div>
          <base-button
            v-if="$mq === 'sm'"
            data-testid="testShowMapIcon"
            type="bare"
            icon="map"
            class="text-gray-700 pt-2"
            :action="
              () => {
                showMobileMap = true;
                $nextTick(() => {
                  map.invalidateSize();
                });
              }
            "
            :text="$t('casesVue.show_map')"
            :alt="$t('casesVue.show_map')"
          />
        </div>
        <div v-if="showingDetails" class="phone-system__form-toggler">
          <base-button
            icon="arrow-left"
            data-testid="testShowHistoryButton"
            :icon-size="medium"
            :alt="$t('actions.history')"
            :action="
              () => {
                showHistory = false;
                showFlags = false;
              }
            "
          />
          <span v-if="showHistory" class="text-base">{{
            $t('actions.history')
          }}</span>
          <span v-else-if="showFlags" class="text-base">{{
            $t('actions.flag')
          }}</span>
          <div></div>
        </div>
        <div class="h-auto min-h-0">
          <CaseHistory
            v-if="showHistory"
            data-testid="testHistoryDiv"
            :incident-id="currentIncidentId"
            :worksite-id="worksiteId"
          ></CaseHistory>
          <CaseFlag
            v-else-if="showFlags"
            data-testid="testShowFlagsDiv"
            :incident-id="String(currentIncidentId)"
            :worksite-id="worksiteId"
            @reload-case="
              () => {
                reloadCase();
                showFlags = false;
              }
            "
            @reload-map="
              () => {
                reloadMap();
                showFlags = false;
              }
            "
            @clear-case="clearCase"
          ></CaseFlag>
          <div v-else class="h-full scroll-overflow-y">
            <div v-if="hasWorksiteFlags" class="flex p-1">
              <flag
                v-for="flag in worksite.flags"
                :key="flag.reason_t"
                :data-testid="`test${flag.reason_t}Flag`"
                :flag-reason="flag.reason_t"
                removable
                @on-remove="removeFlag(flag)"
              />
            </div>
            <WorksiteForm
              ref="worksiteForm"
              :key="worksiteId"
              data-testid="testWorksiteFormDiv"
              :incident-id="String(currentIncidentId)"
              :worksite-id="worksiteId"
              disable-claim-and-save
              :is-editing="isEditing"
              inherit-form-height
              class="border shadow"
              @jump-to-case="jumpToCase"
              @saved-worksite="
                (worksite) => {
                  onSaveCase(worksite);
                }
              "
              @close-worksite="clearCase"
              @navigate-to-worksite="onSelectExistingWorksite"
              @geocoded="addMarkerToMap"
            />
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<script lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useStore } from 'vuex';
import axios from 'axios';
import { useRouter } from 'vue-router';
import moment from 'moment';
import { useMq } from 'vue3-mq';
import PhoneComponentButton from '../../components/phone/PhoneComponentButton.vue';
import ManualDialer from '../../components/phone/ManualDialer.vue';
import AjaxTable from '../../components/AjaxTable.vue';
import {
  formatNationalNumber,
  getColorForStatus,
  getIncidentPhoneNumbers,
  getWorkTypeName,
  isValidActiveHotline,
} from '../../filters';
import CaseHeader from '../../components/work/CaseHeader.vue';
import Worksite from '../../models/Worksite';
import CaseHistory from '../../components/work/CaseHistory.vue';
import WorksiteSearchInput from '../../components/work/WorksiteSearchInput.vue';
import PhoneOutbound from '../../models/PhoneOutbound';
import useEmitter from '../../hooks/useEmitter';
import GeneralStats from '../../components/phone/GeneralStats.vue';
import CallHistory from '../../components/phone/CallHistory.vue';
import SimpleMap from '../../components/SimpleMap.vue';
import Leaderboard from '../../components/phone/Leaderboard.vue';
import Incident from '../../models/Incident';
import Chat from '../../components/chat/Chat.vue';
import ActiveCall from '../../components/phone/ActiveCall.vue';
import UpdateStatus from '../../components/phone/UpdateStatus.vue';
import PhoneIndicator from '../../components/phone/PhoneIndicator.vue';
import useWorksiteMap from '../../hooks/worksite/useWorksiteMap';
import PhoneToolBar from '../../components/phone/PhoneToolBar.vue';
import PhoneNews from '../../components/phone/PhoneNews.vue';
import useDialogs from '../../hooks/useDialogs';
import useConnectFirst from '../../hooks/useConnectFirst';
import User from '../../models/User';
import Flag from '@/components/work/Flag.vue';
import WorksiteForm from '../../components/work/WorksiteForm.vue';
import { loadCasesCached } from '@/utils/worksite';
import { getErrorMessage } from '@/utils/errors';
import usePhoneService from '@/hooks/phone/usePhoneService';
import WorksiteTable from '@/components/work/WorksiteTable.vue';
import useWorksiteTableActions from '@/hooks/worksite/useWorksiteTableActions';
import AdminEventStream from '@/components/admin/AdminEventStream.vue';
import BugReport from '@/components/BugReport.vue';
import { forceFileDownload } from '@/utils/downloads';
import ShareWorksite from '@/components/modals/ShareWorksite.vue';
import CaseFlag from '@/components/work/CaseFlag.vue';
import {
  BUTTON_VARIANTS as VARIANTS,
  INTERACTIVE_ZOOM_LEVEL,
} from '@/constants';
import { averageGeolocation } from '@/utils/map';
import type { MapUtils } from '@/hooks/worksite/useLiveMap';
import { useCurrentUser } from '@/hooks';
import PhoneOverlay from '@/components/phone/PhoneOverlay.vue';
import useAcl from '@/hooks/useAcl';

export enum AllowedCallType {
  INBOUND_ONLY = 'INBOUND_ONLY',
  OUTBOUND_ONLY = 'OUTBOUND_ONLY',
  BOTH = 'BOTH',
}

export const PhoneSystemActionQueryParam = {
  OPEN_MANUAL_DIALER: 'open_manual_dialer',
} as const;

export default defineComponent({
  name: 'PhoneSystem',
  components: {
    CaseFlag,
    Flag,
    PhoneOverlay,
    WorksiteTable,
    PhoneIndicator,
    UpdateStatus,
    ActiveCall,
    PhoneToolBar,
    PhoneNews,
    Chat,
    Leaderboard,
    SimpleMap,
    CallHistory,
    GeneralStats,
    WorksiteSearchInput,
    CaseHistory,
    CaseHeader,
    AjaxTable,
    ManualDialer,
    PhoneComponentButton,
    WorksiteForm,
  },
  setup(props, context) {
    const { t } = useI18n();
    const { $can } = useAcl();
    const $toasted = useToast();
    const { prompt, confirm, component } = useDialogs();
    const { emitter } = useEmitter();
    const router = useRouter();
    const route = useRoute();
    const store = useStore();
    const { currentUser } = useCurrentUser();
    const phoneService = reactive(usePhoneService());
    const mq = useMq();

    const { updateUserStates } = useCurrentUser();

    const imageUrl = ref('');
    const numberClicks = ref(0);
    const scale = ref(1);
    const worksiteId = ref(null);
    const loading = ref(false);
    const isEditing = ref(false);
    const isNew = ref(false);
    const mapLoading = ref(false);
    const map = ref(null);
    const hover = ref(false);
    const showingMap = ref(true);
    const showingTable = ref(false);
    const allWorksiteCount = ref(0);
    const viewCase = ref(false);
    const showHistory = ref(false);
    const showFlags = ref(false);
    const searchWorksites = ref([]);
    const chatGroups = ref([]);
    const selectedChat = ref(null);
    const searchingWorksites = ref(false);
    const dialing = ref(false);
    const tabs = ref(null);
    const showMobileMap = ref(false);
    const remainingCallbacks = ref(0);
    const remainingCalldowns = ref(0);
    const unreadNewsCount = ref(0);
    const unreadChatCount = ref(0);
    const unreadUrgentChatCount = ref(0);
    const search = ref('');
    const mapUtils = ref<MapUtils>();
    const worksiteForm = ref(null);
    const statusTab = ref(null);
    const callTab = ref(null);
    const selectedTableItems = ref(new Set());
    const availableWorkTypes = ref({});
    const connectFirst = useConnectFirst(context);
    const showingSearchModal = ref(false);
    const mobileSearch = ref('');
    const allowCallType = ref<AllowedCallType>(AllowedCallType.BOTH);
    const { showUnclaimModal } = useWorksiteTableActions(
      selectedTableItems,
      () => {},
    );
    const callsBlocked = ref(false);
    const hasWorksiteFlags = ref(false);

    const {
      isOnCall,
      isTakingCalls,
      isTransitioning,
      isConnecting,
      caller,
      stats,
      currentIncidentId,
      call,
      lastCall,
      clearCall,
      potentialFailedCall,
      setPotentialFailedCall,
      loadAgent,
      setWorking,
      setAway,
      dialNextOutbound,
      setAvailable,
      setGeneralStats,
      setCurrentIncidentId,
      dialManualOutbound,
    } = connectFirst;

    function blockCalls() {
      callsBlocked.value = true;
      setTimeout(() => {
        callsBlocked.value = false;
      }, 60_000);
    }

    const initiateManualOutbound = async (number: string) => {
      blockCalls();
      return dialManualOutbound(number);
    };

    const prefillData = computed(() => {
      if (caller.value) {
        return {
          phone1: caller.value?.dnis ?? '',
        };
      }
      return {};
    });
    const callsWaiting = computed(function () {
      return (
        Number(stats.value.inQueue || 0) +
        Number(stats.value.active || 0) +
        Number(remainingCallbacks.value || 0) +
        Number(remainingCalldowns.value || 0)
      );
    });
    const showingDetails = computed(function () {
      return showHistory.value || showFlags.value;
    });
    const worksiteQuery = ref({
      incident: currentIncidentId.value,
    });
    const worksite = computed(function () {
      if (worksiteId.value) {
        return Worksite.find(worksiteId.value);
      }

      return null;
    });
    const incidentsWithActivePhones = computed(() =>
      Incident.query()
        .where('active_phone_number', (p: unknown) => isValidActiveHotline(p))
        .get(),
    );

    function onSelectionChanged(selectedItems) {
      selectedTableItems.value = selectedItems;
    }

    function reloadTable() {
      worksiteQuery.value = { ...worksiteQuery.value };
    }

    async function completeCall({ status, notes }) {
      if (worksiteForm.value?.dirtyFields.size > 0) {
        const result = await confirm({
          title: t('phoneDashboard.complete_call'),
          content: t('phoneDashboard.unsaved_changes_error'),
          actions: {
            no: {
              text: t('actions.do_not_save'),
              type: 'outline',
              buttonClass: 'border border-black',
            },
            yes: {
              text: t('actions.continue'),
              type: 'outline',
              buttonClass: 'border border-black',
            },
            save: {
              text: t('actions.save_worksite'),
              type: 'solid',
            },
          },
        });
        if (result === 'no' || result === 'cancel') {
          return;
        }
        if (result === 'save') {
          const saved = await worksiteForm.value?.saveWorksite();
          if (!saved) {
            return;
          }
        }
      }

      try {
        if (phoneService.callInfo.callType === 'OUTBOUND' && status) {
          await PhoneOutbound.api().updateStatus(
            call?.value?.id || lastCall?.value?.id,
            {
              statusId: status,
              worksiteId: worksiteId.value,
              notes,
            },
          );
        }

        if (phoneService.callInfo.callType === 'INBOUND') {
          let data = {
            status,
            notes,
          };
          if (worksiteId.value) {
            data = { ...data, cases: [worksiteId.value] };
          }

          await axios.post(
            `${import.meta.env.VITE_APP_API_BASE_URL}/phone_inbound/${
              call?.value?.id || lastCall?.value?.id
            }/update_status`,
            data,
          );
        }

        $toasted.success(t('phoneDashboard.update_success'));
        clearCall();
        clearCase();
        setPotentialFailedCall(null);
        await loadAgent();
        emitter.emit('phone_component:close');
        emitter.emit('phone:clear_call');
        switchToCallTab();
      } catch (error) {
        $toasted.error(getErrorMessage(error));
      }
    }

    function setManualOutbound(phone: string) {
      emitter.emit('phone_component:open', 'dialer');
      emitter.emit('dialer:set_phone_number', formatNationalNumber(phone));
    }

    function clearCase() {
      worksiteId.value = null;
      isEditing.value = false;
    }

    function setTabs(t) {
      tabs.value = t;
    }

    function toggleView(view) {
      showingMap.value = false;
      showingTable.value = false;
      if (view === 'showingMap') {
        showingMap.value = true;
        nextTick(() => {
          init();
        });
      }

      if (view === 'showingTable') {
        showingTable.value = true;
      }
    }

    function onSelectExistingWorksite(worksite) {
      // only show worksite on map if on map view
      if (showingMap.value && !showingTable.value) {
        router.push({
          query: { showOnMap: true },
        });
      } else {
        router.push({
          query: {}, // clear query params
        });
      }

      worksiteId.value = worksite.id;
      isEditing.value = true;
    }

    async function reloadCase() {
      console.info('onReloadCase');
      return Worksite.api().fetch(
        worksite?.value?.id,
        currentIncidentId.value.id,
      );
    }

    async function downloadWorksites(ids: number[]) {
      console.info('onDownloadWorksites', ids);
      loading.value = true;
      try {
        let params;

        params = ids
          ? {
              id__in: ids.join(','),
            }
          : {
              ...worksiteQuery.value,
            };

        const response = await axios.get(
          `${
            import.meta.env.VITE_APP_API_BASE_URL
          }/worksites_download/download_csv`,
          {
            params,
            headers: { Accept: 'text/csv' },
            responseType: 'blob',
          },
        );
        if (response.status === 202) {
          await confirm({
            title: t('info.processing_download'),
            content: t('info.processing_download_d'),
          });
        } else {
          forceFileDownload(response);
        }
      } catch (error) {
        $toasted.error(getErrorMessage(error));
      } finally {
        loading.value = false;
      }
    }

    async function shareWorksite(id: number) {
      console.info('onShareWorksite');
      loading.value = true;
      let noClaimText = '';
      const worksiteToShare = Worksite.find(id);
      const hasClaimedWorkType = worksiteToShare?.work_types.some((type) =>
        currentUser?.value?.organization.affiliates.includes(type.claimed_by),
      );
      if (hasClaimedWorkType) {
        noClaimText = '';
      } else {
        const result = await prompt({
          title: t('casesVue.share_case'),
          content: t('casesVue.please_claim_if_share'),
          actions: {
            cancel: {
              text: t('actions.cancel'),
              type: 'outline',
              buttonClass: 'border border-black',
            },
            shareNoClaim: {
              text: t('actions.share_no_claim'),
              type: 'outline',
              buttonClass: 'border border-black',
            },
            claimAndShare: {
              text: t('actions.claim_and_share'),
              type: 'solid',
              buttonClass:
                'border text-base p-2 px-4 mx-2 text-black border-primary-light',
            },
          },
        });

        if (result.key === 'cancel' || !result) {
          return;
        }

        if (result.key === 'claimAndShare') {
          noClaimText = '';
        }

        if (result.key === 'shareNoClaim') {
          if (!result.response) {
            $toasted.error(t('casesVue.please_explain_why_no_claim'));
            return shareWorksite(id);
          }

          noClaimText = result.response;
        }
      }

      let emails: string[] = [];
      let phoneNumbers: string[] = [];
      let shareMessage = '';

      const result = await component({
        title: t('actions.share'),
        component: ShareWorksite,
        classes: 'w-full h-144',
        actionText: t('actions.share'),
        props: {
          worksite: id,
        },
        listeners: {
          phoneNumbersUpdated(value: string[]) {
            phoneNumbers = value.map((number) =>
              String(number).replaceAll(/\D/g, ''),
            );
          },
          emailsUpdated(value: string[]) {
            emails = value;
          },
          shareMessageUpdated(value: string) {
            shareMessage = value;
          },
        },
      });
      if (result === 'no' || result === 'cancel') {
        return;
      }

      await Worksite.api().shareWorksite(
        id,
        emails,
        phoneNumbers,
        shareMessage,
        noClaimText,
      );
      await reloadCase();
      $toasted.success(t('casesVue.sucessfully_shared_case'));
    }

    async function printWorksite(id: number) {
      console.info('onPrintWorksite');
      loading.value = true;
      let file;
      const worksiteToPrint = await Worksite.find(id);
      const hasClaimedWorkType = worksiteToPrint?.work_types.some((type) =>
        currentUser?.value?.organization.affiliates.includes(type.claimed_by),
      );
      if (hasClaimedWorkType) {
        file = await Worksite.api().printWorksite(id, '');
      } else {
        const result = await prompt({
          title: t('actions.print_case'),
          content: t('casesVue.please_claim_if_print'),
          actions: {
            cancel: {
              text: t('actions.cancel'),
              type: 'outline',
              buttonClass: 'border border-black',
            },
            printNoClaim: {
              text: t('actions.print_without_claiming'),
              type: 'solid',
              buttonClass:
                'border text-base p-2 px-4 mx-2 text-black border-primary-light',
            },
            claimAndPrint: {
              text: t('actions.claim_and_print'),
              type: 'solid',
              buttonClass:
                'border text-base p-2 px-4 mx-2 text-black border-primary-light',
            },
          },
        });

        if (result.key === 'claimAndPrint') {
          file = await Worksite.api().printWorksite(id, '');
        }

        if (result.key === 'printNoClaim') {
          if (result.response) {
            file = await Worksite.api().printWorksite(id, result.response);
          } else {
            $toasted.error(t('casesVue.please_explain_why_no_claim'));
          }
        }
      }

      if (file) {
        forceFileDownload(file.response);
      }

      loading.value = false;
      await reloadCase();
    }

    async function addMarkerToMap(location) {
      mapUtils.value.addMarkerToMap(location);
    }

    async function jumpToCase() {
      toggleView('showingMap');
      mapUtils.value.jumpToCase(worksite.value, true);
    }

    function onSelectMarker(marker) {
      isEditing.value = true;
      worksiteId.value = marker.id;
    }

    function handleCallHistoryRowClick(payload: Record<string, any>) {
      const { mobile, incident } = payload;
      setManualOutbound(mobile);
      const incidentId = incident?.id;
      if (incidentId) {
        router.replace({
          path: `/incident/${incidentId}/phone`,
          query: {
            action: PhoneSystemActionQueryParam.OPEN_MANUAL_DIALER,
            phone_number: mobile,
          },
        });
      }
    }

    async function getWorksites() {
      mapLoading.value = true;
      const response = await loadCasesCached({
        incident: currentIncidentId.value,
      });
      mapLoading.value = false;
      allWorksiteCount.value = response.results.length;
      return response.results;
    }

    /**
     * Handles actions to perform when a user logs in, adjusting call states and managing call types.
     *
     * This asynchronous function evaluates the user’s allowed call type (inbound, outbound, or both),
     * and sets their availability status based on call queue status and remaining call quotas. It:
     * - Blocks additional calls using `blockCalls`.
     * - Checks `allowCallType` and updates the user’s status to available, working, or away, depending on:
     *    - Whether there are calls waiting in the queue or being routed.
     *    - Whether there are remaining callbacks or calldowns.
     *
     * Logic flow:
     * - If `allowCallType` is set to `BOTH` and there are no calls in the queue or routing:
     *    - If the sum of `remainingCallbacks` and `remainingCalldowns` is greater than 0, sets the user to "working".
     *    - Attempts to dial the next outbound call. If unsuccessful, sets the user to "available."
     * - If `allowCallType` is set to `INBOUND_ONLY`, sets the user to "available."
     * - If `allowCallType` is set to `OUTBOUND_ONLY`:
     *    - Sets the user to "working" and attempts to dial the next outbound call.
     *    - If unsuccessful, sets the user to "away."
     * - If none of the above conditions are met, defaults to setting the user as "available."
     *
     * Extra notes:
     *  - AVAILABILITY: "available" means the user is ready to take inbound and outbound calls, "working" means they can only take outbound calls, and "away" means they are unavailable.
     *
     * @async
     * @function onLoggedIn
     * @returns {Promise<void>} No return value.
     */
    async function onLoggedIn() {
      blockCalls();

      if (
        allowCallType.value === AllowedCallType.BOTH &&
        Number(stats.value.inQueue || stats.value.routing || 0) === 0
      ) {
        if (remainingCallbacks.value + remainingCalldowns.value > 0) {
          await setWorking();
        }

        try {
          await dialNextOutbound();
        } catch {
          await setAvailable();
        }
      } else if (allowCallType.value === AllowedCallType.INBOUND_ONLY) {
        await setAvailable();
      } else if (allowCallType.value === AllowedCallType.OUTBOUND_ONLY) {
        await setWorking();
        try {
          await dialNextOutbound();
        } catch {
          await setAway();
        }
      } else {
        await setAvailable();
      }
    }

    function setAllowedCallType(value: AllowedCallType) {
      allowCallType.value = value;
    }

    function selectCase(worksite) {
      if (worksite) {
        setCurrentIncidentId(worksite.incident);
        worksiteId.value = worksite.id;
      } else {
        worksiteId.value = null;
      }
    }

    async function reloadMap() {
      getWorksites().then((markers) => {
        mapUtils?.value?.reloadMap(
          markers,
          markers.map((m) => m.id),
        );
      });
    }

    async function onSaveCase(worksite) {
      worksiteId.value = worksite.id;
      isEditing.value = true;
      switchToStatusTab();
      if (showingTable.value) {
        reloadTable();
      }

      if (showingMap.value) {
        getWorksites().then((markers) => {
          mapUtils?.value?.reloadMap(
            markers,
            markers.map((m) => m.id),
          );
        });
      }
    }

    async function getChatGroups() {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/chat_groups`,
        {
          params: {
            channel: 'phone',
          },
        },
      );
      chatGroups.value = response.data.results;
    }

    function focusNewsTab() {
      emitter.emit('phone_component:close');
      // open the active call PhoneComponentButton
      emitter.emit('phone_component:open', 'news');
    }

    const switchToStatusTab = () => {
      if (tabs.value && statusTab.value) {
        tabs.value.selectTab(statusTab.value.index);
      }
    };

    const switchToCallTab = () => {
      if (tabs.value && callTab.value) {
        tabs.value.selectTab(callTab.value.index);
      }
    };

    async function retryFailedCall() {
      if (potentialFailedCall.value) {
        const { phone_number } = potentialFailedCall.value;
        if (call.value) {
          await completeCall({ status: 23, notes: '' });
        }

        await phoneService.changeState('WORKING');
        await initiateManualOutbound(phone_number);
      }
    }

    function zoomIn() {
      mapUtils.value?.getMap().zoomIn();
    }

    function zoomOut() {
      mapUtils.value?.getMap().zoomOut();
    }

    function getIncidentCenter() {
      const { incident_center } = Incident.find(
        currentIncidentId.value,
      ) as Incident;
      if (incident_center) {
        return [incident_center.coordinates[1], incident_center.coordinates[0]];
      }
      return [35.746_512_259_918_5, -96.411_509_631_256_56];
    }

    function goToIncidentCenter() {
      mapUtils.value?.getMap().setView(getIncidentCenter(), 6);
    }

    function goToInteractive() {
      mapUtils.value
        ?.getMap()
        .setView(getIncidentCenter(), INTERACTIVE_ZOOM_LEVEL);
    }

    async function reportBug() {
      await component({
        id: 'phone_bug_modal',
        title: t(`phoneDashboard.report_bug`),
        component: BugReport,
        classes: 'w-full h-96 overflow-auto',
        modalClasses: 'bg-white max-w-3xl shadow p-3',
        hideFooter: true,
        props: {
          // eslint-disable-next-line vue/require-prop-type-constructor, vue/require-default-prop
          reportType: 'phone',
        },
      });
    }

    async function init() {
      phoneService.apiGetQueueStats().then((response) => {
        setGeneralStats({ ...response.data });
      });
      await getChatGroups();
      const [group] = chatGroups.value;
      selectedChat.value = group;
      const markers = await getWorksites();
      mapUtils.value = useWorksiteMap(
        markers,
        markers.map((m) => m.id),
        (m) => {
          onSelectMarker(m);
        },
        ({ workTypes }) => {
          availableWorkTypes.value = workTypes;
        },
        true,
      );
    }

    watch(
      () => worksiteId.value,
      (newValue, oldValue) => {
        if (oldValue !== newValue) {
          showMobileMap.value = false;
        }
      },
    );

    watch(
      () => isOnCall.value,
      (newValue, oldValue) => {
        if (oldValue && !newValue) {
          callsBlocked.value = true; // block calls until the agent is ready
          switchToStatusTab();
        }
      },
    );

    watch(
      () => currentIncidentId.value,
      (value) => {
        if (value) {
          getWorksites().then((markers) => {
            mapUtils?.value?.reloadMap(
              markers,
              markers.map((m) => m.id),
            );
          });
        }
      },
    );

    watch(
      () => worksite?.value,
      (newValue, oldValue) => {
        hasWorksiteFlags.value = !!newValue?.flags?.length;
      },
    );

    onMounted(async () => {
      if (currentUser.value.isAdmin) {
        allowCallType.value = AllowedCallType.INBOUND_ONLY;
      }

      emitter.on('phone_outbound:click', (payload: Record<string, any>) => {
        const { phone_number, incident_id } = payload;
        const [incidentId = null] = incident_id;
        setManualOutbound(phone_number);
      });

      if (
        route.query.action === PhoneSystemActionQueryParam.OPEN_MANUAL_DIALER &&
        route.query.phone_number
      ) {
        setManualOutbound(route.query.phone_number);
      }

      await init();

      setInterval(() => {
        if (
          isTakingCalls.value &&
          !isOnCall.value &&
          !isTransitioning.value &&
          !isConnecting.value &&
          !callsBlocked.value
        ) {
          onLoggedIn();
        }
      }, 20_000);
    });

    async function removeFlag(flag) {
      if (worksite.value) {
        try {
          await Worksite.api().deleteFlag(worksite.value.id, flag);
          await Worksite.api().fetch(worksite.value.id);
        } catch (error) {
          console.error(error);
          await $toasted.error(getErrorMessage(error));
        }
      } else {
        console.error('Worksite not found. Cannot remove flag');
      }
    }

    return {
      switchToStatusTab,
      imageUrl,
      numClicks: numberClicks,
      scale,
      worksiteId,
      isEditing,
      isNew,
      mapLoading,
      map,
      hover,
      showingMap,
      showingTable,
      allWorksiteCount,
      viewCase,
      showHistory,
      showFlags,
      searchWorksites,
      chatGroups,
      selectedChat,
      searchingWorksites,
      dialing,
      tabs,
      showMobileMap,
      remainingCallbacks,
      remainingCalldowns,
      unreadNewsCount,
      unreadChatCount,
      unreadUrgentChatCount,
      mapUtils,
      getColorForStatus,
      prefillData,
      callsWaiting,
      showingDetails,
      worksiteQuery,
      worksite,
      incidentsWithActivePhones,
      worksiteForm,
      statusTab,
      callTab,
      ...connectFirst,
      init,
      getIncidentPhoneNumbers,
      completeCall,
      blockCalls,
      potentialFailedCall,
      setManualOutbound,
      clearCase,
      setTabs,
      toggleView,
      onSelectExistingWorksite,
      handleCallHistoryRowClick,
      search,
      addMarkerToMap,
      jumpToCase,
      downloadWorksites,
      shareWorksite,
      printWorksite,
      onSelectMarker,
      getWorksites,
      onLoggedIn,
      setAllowedCallType,
      selectCase,
      getChatGroups,
      focusNewsTab,
      zoomIn,
      zoomOut,
      goToInteractive,
      goToIncidentCenter,
      getWorkTypeName,
      updateUserState: updateUserStates,
      moment,
      retryFailedCall,
      onSelectionChanged,
      selectedTableItems,
      availableWorkTypes,
      showUnclaimModal,
      reloadTable,
      onSaveCase,
      reportBug,
      reloadMap,
      reloadCase,
      mq,
      showingSearchModal,
      mobileSearch,
      can: $can,
      allowCallType,
      hasWorksiteFlags,
      removeFlag,
    };
  },
});
</script>

<style lang="postcss">
.phone-system {
  &__action {
    &-content {
      @apply right-20 sm:right-12 h-auto;
      width: 35vw;

      &--caller {
        width: 50vw;
        height: max-content;
      }
      &--dialer {
        @apply h-full;
      }
      &--chat {
      }
      &--news {
        height: 60vh;
        width: 50vw;
      }
      &--history {
        @apply h-full;
        width: 50vw;
      }
      &--stats {
      }
      &--leaderboard {
        height: 60vh;
        width: 50vw;
      }
      &--reset {
        @apply h-full;
      }
    }
  }
}

@media screen and (max-width: theme('screens.sm')) {
  .phone-system {
    &__action {
      &-content {
        width: 80vw;

        &--caller {
        }
        &--dialer {
        }
        &--chat {
        }
        &--news {
        }
        &--history {
        }
        &--stats {
        }
        &--leaderboard {
        }
        &--reset {
        }
      }
    }
  }
}
</style>

<style lang="postcss" scoped>
.phone-system {
  @apply grid flex-grow h-full;
  grid-template-columns: auto 350px;

  &__actions {
    @apply absolute top-0 right-0 flex flex-col select-text z-toolbar;
  }

  &__action {
    @apply shadow
      w-20
      h-20
      sm:w-12
      sm:h-12
      my-2
      sm:my-1
      bg-white
      cursor-pointer
      z-50;
  }

  /* Container for map */
  &__main {
    @apply flex flex-col;

    &-header {
      @apply flex items-center;
    }

    &-content {
      @apply flex-grow;

      &--map {
        @apply relative h-full select-none;
      }

      &--table {
        @apply p-2 h-full shadow;
      }
    }
  }

  /* Container for case form */
  &__form {
    @apply flex flex-col;

    &-header {
      @apply h-12 px-2 border flex items-center justify-between;
    }

    &-toggler {
      @apply flex items-center justify-between px-2;
    }

    &-body {
      @apply flex-grow relative h-full flex flex-col md:flex-row;
    }
  }
}

/* Mobile styles */
@media screen and (max-width: theme('screens.sm')) {
  .phone-system {
    @apply flex flex-col;

    &__actions {
      @apply mt-40;
    }

    &__action {
      @apply shadow
      w-12
      h-12
      my-1
      bg-white
      cursor-pointer
      z-50;
    }

    &__main {
      @apply h-1/2;
    }

    &__form {
      @apply h-1/2;
    }
  }
}

.scroll-overflow-y {
  overflow-y: scroll;
}
</style>
