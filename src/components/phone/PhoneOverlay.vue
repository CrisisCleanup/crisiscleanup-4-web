<script setup lang="ts">
import PhoneCmsItems from '@/components/phone/PhoneCmsItems.vue';

const emit = defineEmits([
  'onCompleteCall',
  'setCase',
  'onReportBug',
  'resetPhoneSystem',
]);
const { caseId } = defineProps({
  caseId: {
    type: Number,
    default: null,
  },
  selectedChat: {
    type: Object,
    default: null,
  },
});
const expanded = ref(false);
const sideBarExpanded = ref(true);
const { t } = useI18n();

const sections = [
  {
    view: 'callHistory',
    text: t('phoneDashboard.last_10_calls'),
    icon: 'phone-history',
  },
  {
    view: 'manualDialer',
    text: t('phoneDashboard.manual_dialer'),
    icon: 'manual-dialer',
  },
  {
    view: 'leaderboard',
    text: t('phoneDashboard.leaderboard'),
    icon: 'leaderboard',
  },
  { view: 'zoom', text: t('phoneDashboard.join_zoom'), icon: 'zoom' },
  { view: 'cms', text: t('phoneDashboard.news'), icon: 'news' },
  { view: 'generalStats', text: t('phoneDashboard.stats'), icon: 'stats' },
  { view: 'chat', text: t('chat.chat'), icon: 'chat' },
  {
    view: 'reportBug',
    text: t('phoneDashboard.report_bug'),
    icon: 'bug-report',
  },
];

import { useClipboard } from '@vueuse/core';
import BaseButton from '@/components/BaseButton.vue';
import Leaderboard from '@/components/phone/Leaderboard.vue';
import useConnectFirst from '@/hooks/useConnectFirst';
import ManualDialer from '@/components/phone/ManualDialer.vue';
import CallHistory from '@/components/phone/CallHistory.vue';
import { formatNationalNumber } from '@/filters';
import useEmitter from '@/hooks/useEmitter';
import GeneralStats from '@/components/phone/GeneralStats.vue';
import UpdateStatus from '@/components/phone/UpdateStatus.vue';
import ActiveCall from '@/components/phone/ActiveCall.vue';
import CurrentCall from '@/components/phone/CurrentCall.vue';
import CcuIcon from '@/components/BaseIcon.vue';
import Chat from '@/components/chat/Chat.vue';
import { reactive, ref } from 'vue';
import moment from 'moment';
import usePhoneService from '@/hooks/phone/usePhoneService';
const { emitter } = useEmitter();

const { text, copy } = useClipboard({
  source: '',
});
const remainingCallbacks = ref(0);
const remainingCalldowns = ref(0);
const unreadChatCount = ref(0);
const unreadUrgentChatCount = ref(0);

const showCompleteCallScreen = ref(false);

const endCall = () => {
  hangUp();
};

const showCompleteCall = () => {
  showCompleteCallScreen.value = true;
  expanded.value = true;
  currentView.value = '';
};

const completeCall = (payload) => {
  emit('onCompleteCall', payload);
  showCompleteCallScreen.value = false;
  expanded.value = false;
  currentView.value = '';
};

const onCancelCompleteCall = () => {
  showCompleteCallScreen.value = false;
};

const updateView = (view) => {
  expanded.value = true;
  currentView.value = view;
};

const closeTab = () => {
  currentView.value = '';
  if (!caller.value) {
    expanded.value = false;
  }
};

function setManualOutbound(phone) {
  currentView.value = 'manualDialer';
  emitter.emit('dialer:set_phone_number', formatNationalNumber(phone));
}

const currentView = ref('');
const connectFirst = useConnectFirst({
  emit,
});
watch(
  () => connectFirst.caller.value,
  (newValue) => {
    if (newValue) {
      currentView.value = '';
    }
  },
);

const formattedElapsedTime = ref('00:00:00');
let intervalId = null;

// Pad single digits with zero
function pad(number) {
  return number.toString().padStart(2, '0');
}

// Define a function to update the elapsed time
const updateElapsedTime = () => {
  if (!isOnCall.value || !call.value) {
    return;
  }

  // Remove the 'Z' to prevent automatic conversion to UTC and parse as local time
  const localTimeStr = call.value.call_at.slice(0, -1);
  const callAtLocal = new Date(localTimeStr);

  // Calculate the difference in milliseconds
  const nowLocal = new Date();
  const diff = nowLocal - callAtLocal;

  // Convert milliseconds into hours, minutes, and seconds
  const diffSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  formattedElapsedTime.value = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

onMounted(() => {
  // Immediately update once in case component mounts after call has started
  updateElapsedTime();

  // Then set an interval to update every second
  intervalId = setInterval(updateElapsedTime, 1000);
});

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

const {
  isOnCall,
  caller,
  stats,
  currentIncidentId,
  call,
  potentialFailedCall,
  setPotentialFailedCall,
  setCurrentIncidentId,
  isConnecting,
  isInboundCall,
  isOutboundCall,
  callHistory,
  dialManualOutbound,
  hangUp,
} = connectFirst;
</script>

<template>
  <div
    class="relative"
    :class="{
      'h-12': !expanded && caller,
      'h-full': expanded,
      'h-0': !expanded && !caller,
    }"
  >
    <div
      class="top-0 flex absolute right-0 left-0 bottom-0"
      style="z-index: 4998"
    >
      <!-- Container for the expand/collapse component -->
      <div class="flex-1 h-full">
        <div
          class="relative flex flex-col"
          :class="expanded ? 'h-full' : 'h-12'"
        >
          <div
            v-if="caller"
            class="p-3 flex flex-col justify-center h-12 bg-crisiscleanup-phone-green text-white"
            :class="isOnCall ? 'animate-pulse' : ''"
          >
            <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
                <div v-if="isConnecting" data-testid="testIsConnectingDiv">
                  {{ $t('phoneDashboard.connecting') }}
                </div>
                <div v-else-if="isOnCall" data-testid="testIsOnCallDiv">
                  <div v-if="isInboundCall" data-testid="testIsInboundCallDiv">
                    {{ $t('phoneDashboard.inbound_call') }}
                  </div>
                  <div
                    v-if="isOutboundCall"
                    data-testid="testIsOutboundCallDiv"
                  >
                    {{ $t('phoneDashboard.outbound_call') }}
                  </div>
                </div>
                <div v-else data-testid="testIsCompletedDiv">
                  {{ $t('phoneDashboard.call_ended') }}
                </div>
                <span class="font-bold">{{ caller.dnis }}</span>
                <font-awesome-icon
                  :icon="['fas', 'copy']"
                  class="ml-3 cursor-pointer"
                  @click="() => copy(caller.dnis)"
                />
                <span class="ml-3 font-light">
                  {{ caller.location_name }} {{ caller.state_name }}
                </span>
                <span class="ml-6 font-light">{{ formattedElapsedTime }}</span>
              </div>
              <div class="flex items-center gap-4">
                <base-button
                  class="p-1"
                  :action="() => (expanded = !expanded)"
                  :text="$t('actions.show_details')"
                  :suffix-icon="expanded ? 'chevron-up' : 'chevron-down'"
                />
                <base-button
                  v-if="isOnCall"
                  class="p-1 text-black"
                  variant="solid"
                  :action="endCall"
                  :text="$t('actions.end_call')"
                />
                <base-button
                  v-else
                  class="p-1 text-black"
                  variant="solid"
                  :action="showCompleteCall"
                >
                  {{ $t('phoneDashboard.complete_call') }}
                </base-button>
              </div>
            </div>
          </div>
          <div v-else></div>
          <template v-if="expanded">
            <div
              v-if="currentView"
              class="flex items-center justify-between p-3 bg-gray-100"
            >
              <h1></h1>
              <base-button :action="closeTab" variant="">
                {{ $t('Close Tab') }}
              </base-button>
            </div>
            <div class="bg-white">
              <Leaderboard
                v-if="currentView === 'leaderboard'"
                class="h-full"
              />
              <ManualDialer
                v-if="currentView === 'manualDialer'"
                class="p-2"
                data-testid="testManualDialerDiv"
                style="z-index: 1002"
                :dialing="false"
                @on-dial="dialManualOutbound"
              ></ManualDialer>
              <zoom v-if="currentView === 'zoom'">
                <div class="flex items-center justify-center p-3 gap-2 mt-12">
                  <a href="https://bit.ly/ccuzoom" target="_blank"
                    ><div class="bg-primary-light py-1 px-4">
                      {{ $t('phoneDashboard.join_zoom') }}
                    </div></a
                  >
                </div>
              </zoom>
              <PhoneCmsItems
                v-if="currentView === 'cms'"
                class="p-2"
                data-testid="testPhoneCmsItemsDiv"
                style="z-index: 1002"
              ></PhoneCmsItems>
              <CallHistory
                v-if="currentView === 'callHistory'"
                :calls="callHistory"
                :table-body-style="{ height: '30rem' }"
                @row-click="
                  ({ mobile }) => {
                    setManualOutbound(mobile);
                  }
                "
              ></CallHistory>
              <GeneralStats
                v-if="currentView === 'generalStats'"
                @on-remaining-callbacks="remainingCallbacks = $event"
                @on-remaining-calldowns="remainingCalldowns = $event"
              />
              <template v-if="currentView === 'chat'">
                <Chat
                  v-if="selectedChat"
                  :chat="selectedChat"
                  @unread-count="unreadChatCount = $event"
                  @unread-urgent-count="unreadUrgentChatCount = $event"
                  @on-new-message="unreadChatCount += 1"
                  @on-new-urgent-message="unreadUrgentChatCount += 1"
                />
              </template>
              <template v-if="currentView === 'reportBug'">
                <div class="flex items-center justify-center p-3 gap-2">
                  <base-button
                    size="medium"
                    data-testid="testReportBugButton"
                    :text="$t('phoneDashboard.report_bug')"
                    :alt="$t('phoneDashboard.report_bug')"
                    :action="() => emit('onReportBug')"
                    class="text-white bg-crisiscleanup-red-200"
                  ></base-button>
                </div>
              </template>
            </div>

            <div v-show="!currentView && caller" class="flex-grow">
              <template v-if="showCompleteCallScreen">
                <div
                  class="h-full bg-crisiscleanup-green-900 bg-opacity-20 p-2 flex flex-col items-start justify-between"
                >
                  <div class="w-full">
                    <div class="py-2">
                      {{ $t('phoneDashboard.complete_call') }}
                    </div>
                    <UpdateStatus
                      class="max-w-4xl"
                      data-testid="testUpdateStatusCompleteCallDiv"
                      :allow-cancel="true"
                      @on-complete-call="completeCall"
                      @on-cancel="onCancelCompleteCall"
                    />
                  </div>
                  <div class="w-full">
                    <base-button
                      class="p-1 w-full bg-white"
                      :action="() => (showCompleteCallScreen = false)"
                      :text="$t('actions.hide')"
                    />
                  </div>
                </div>
              </template>
              <template v-else>
                <CurrentCall
                  :case-id="caseId"
                  class="p-2 bg-crisiscleanup-green-900 bg-opacity-20 h-full"
                  @set-case="emit('setCase', $event)"
                />
              </template>
            </div>
          </template>
        </div>
      </div>

      <div :class="sideBarExpanded ? 'w-56' : 'w-14'">
        <nav
          class="bg-gray-100 h-[calc(100vh-10.5rem)] flex flex-col justify-between"
        >
          <ul class="mt-16">
            <div class="flex flex-col items-center">
              <div
                v-for="section in sections"
                :key="section.view"
                class="p-2.5 bg-white flex items-center gap-2 cursor-pointer hover:bg-primary-light hover:bg-opacity-30 w-full text-center border-b"
                :class="{
                  'border-l-4 border-l-primary-light':
                    currentView === section.view,
                  'justify-center': !sideBarExpanded,
                }"
                @click="() => updateView(section.view)"
              >
                <ccu-icon
                  :type="section.icon"
                  class="text-2xl"
                  :color="currentView === section.view ? 'white' : 'black'"
                />
                <div v-if="sideBarExpanded">{{ $t(section.text) }}</div>
              </div>
            </div>
          </ul>
          <div
            class="w-full cursor-pointer flex items-center p-3"
            :class="sideBarExpanded ? 'justify-between' : 'justify-center'"
            @click="() => (sideBarExpanded = !sideBarExpanded)"
          >
            {{ sideBarExpanded ? 'Collapse' : '' }}
            <font-awesome-icon
              :icon="[
                'fas',
                sideBarExpanded ? 'chevron-right' : 'chevron-left',
              ]"
              class="cursor-pointer"
            />
          </div>
        </nav>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
