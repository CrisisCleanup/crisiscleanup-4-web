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
    text: t('~~Volunteer Stats'),
    icon: 'leaderboard',
  },
  { view: 'zoom', text: t('phoneDashboard.join_zoom'), icon: 'zoom' },
  { view: 'cms', text: t('phoneDashboard.news'), icon: 'news' },
  { view: 'generalStats', text: t('~~Stats'), icon: 'stats' },
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
import BaseText from '@/components/BaseText.vue';
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
  console.log(call.value);
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
              class="flex items-center justify-between px-3 py-[11px] border-b-4"
            >
              <h1></h1>
              <base-button :action="closeTab" variant="">
                {{ $t('Close Tab') }}
              </base-button>
            </div>
            <div
              class="bg-white"
              :class="!currentView && caller ? '' : 'h-full'"
            >
              <Leaderboard
                v-if="currentView === 'leaderboard'"
                class="h-full"
              />
              <div
                v-if="currentView === 'manualDialer'"
                class="flex items-center justify-center h-[calc(100vh-13rem)]"
              >
                <ManualDialer
                  class="p-2"
                  data-testid="testManualDialerDiv"
                  style="z-index: 1002"
                  :dialing="false"
                  @on-dial="dialManualOutbound"
                ></ManualDialer>
              </div>

              <zoom v-if="currentView === 'zoom'">
                <div
                  class="h-[calc(100vh-13rem)]"
                  style="
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                  "
                >
                  <header style="margin-bottom: 20px" class="font-bold">
                    <h1>
                      {{ $t('~~Welcome to Our Phone Support Zoom Call') }}
                    </h1>
                  </header>
                  <main
                    style="
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      align-items: center;
                    "
                  >
                    <img
                      src="@/assets/zoomxcrisiscleanup.png"
                      style="width: 50%"
                      class="mb-10"
                    />
                    <p>
                      {{
                        $t(`~~Having trouble with your phone? Join our live Zoom meeting
                      now and get real-time support from experts and community
                      members!`)
                      }}
                    </p>
                    <div class="flex items-center justify-center gap-2 mt-6">
                      <a href="https://bit.ly/ccuzoom" target="_blank"
                        ><div class="bg-primary-light py-4 px-12">
                          {{ $t('phoneDashboard.join_zoom') }}
                        </div></a
                      >
                    </div>
                  </main>
                </div>
              </zoom>
              <PhoneCmsItems
                v-if="currentView === 'cms'"
                class="p-2 h-[calc(100vh-13rem)]"
                data-testid="testPhoneCmsItemsDiv"
                style="z-index: 1002"
              ></PhoneCmsItems>

              <CallHistory
                v-if="currentView === 'callHistory'"
                class="border-top-4"
                :calls="callHistory"
                :table-body-style="{ height: '30rem' }"
                @row-click="
                  ({ mobile }) => {
                    setManualOutbound(mobile);
                  }
                "
              ></CallHistory>
              <div
                v-if="currentView === 'generalStats'"
                class="flex items-center justify-center h-full"
              >
                <div class="w-1/2 border rounded">
                  <GeneralStats
                    @on-remaining-callbacks="remainingCallbacks = $event"
                    @on-remaining-calldowns="remainingCalldowns = $event"
                  />
                </div>
              </div>
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
                <div
                  class="h-[calc(100vh-13rem)] flex flex-col justify-center items-center text-left p-5"
                >
                  <div class="flex flex-col lg:flex-row">
                    <div class="flex items-center">
                      <img
                        src="@/assets/cc-bugs.png"
                        alt="Crisis Cleanup Bugs"
                        class="mb-5"
                      />
                    </div>
                    <div
                      class="flex flex-col items-center justify-center text-center font-sans text-gray-800"
                    >
                      <p class="font-bold text-2xl mb-2">
                        {{ $t('~~Hey there, Bug Buster!') }}
                      </p>
                      <p>
                        {{
                          $t(
                            "~~Looks like you've got a sharp eye! 🕵️‍♂️ If you've stumbled upon a little critter in our software that's not playing nice, we'd love for you to report it to our Bug Brigade!",
                          )
                        }}
                      </p>
                      <p class="font-bold text-2xl m-2">
                        {{
                          $t(
                            "~~Here's how you can send the buggy details our way:",
                          )
                        }}
                      </p>
                      <ul
                        class="space-y-2 m-5 lg:flex lg:flex-row lg:space-y-0 lg:space-x-2"
                      >
                        <li>
                          <div
                            class="font-bold p-2 border rounded hover:bg-crisiscleanup-yellow-100"
                          >
                            {{
                              $t(
                                "~~ 1. Capture the critter! (Take a screenshot or describe what it's up to)",
                              )
                            }}
                          </div>
                        </li>
                        <li>
                          <div
                            class="font-bold p-2 border rounded hover:bg-crisiscleanup-yellow-100"
                          >
                            {{
                              $t(
                                "~~2. Tell us where it's lurking. (Which part of the app are you in?)",
                              )
                            }}
                          </div>
                        </li>
                        <li>
                          <div
                            class="font-bold p-2 border rounded hover:bg-crisiscleanup-yellow-100"
                          >
                            {{
                              $t(
                                "~~3. Describe the mischief it's causing. (What were you expecting vs. what happened?)",
                              )
                            }}
                          </div>
                        </li>
                      </ul>
                      <p>
                        {{
                          $t(`~~Just hit the "🐞 Report a Bug" button in our app, and
                        we'll squish the troublemaker in no time! Plus, you'll
                        earn your stripes as an honorary member of the Bug
                        Brigade, complete with bragging rights and our eternal
                        gratitude.`)
                        }}
                      </p>
                      <p class="my-2">
                        {{
                          $t(
                            '~~Your keen eyes help us keep our software as bug-free as a squeaky-clean kitchen! 🍽️✨',
                          )
                        }}
                      </p>
                      <p class="my-2">
                        {{ $t('~~Happy Bug Hunting') }}
                      </p>
                      <p class="my-2">
                        {{ $t('~~- The Crisis Cleanup Development Team') }}
                      </p>

                      <base-button
                        size="large"
                        data-testid="testReportBugButton"
                        :text="$t('phoneDashboard.report_bug')"
                        :alt="$t('phoneDashboard.report_bug')"
                        :action="() => emit('onReportBug')"
                        class="text-white bg-crisiscleanup-red-200 my-2"
                      >
                        {{ $t('~~🐞 Report Bug') }}
                      </base-button>
                    </div>
                  </div>
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
          <ul>
            <div v-if="isOnCall" class="bg-blue">
              <div
                :class="isOnCall"
                class="h-12 flex items-center justify-center pulse bg-crisiscleanup-green-900"
              >
                <BaseText class="font-bold text-white">
                  {{ $t('~~Current Call') }} 00:00:00
                </BaseText>
              </div>
            </div>

            <div class="flex flex-col items-center">
              <div
                v-for="section in sections"
                :key="section.view"
                class="p-2 bg-white flex items-center gap-2 cursor-pointer hover:bg-primary-light hover:bg-opacity-30 w-full text-center border-b-4"
                :class="{
                  'border-l-4 border-l-primary-light font-bold':
                    currentView === section.view,
                  'justify-center': !sideBarExpanded,
                }"
                @click="
                  () =>
                    currentView === section.view
                      ? closeTab()
                      : updateView(section.view)
                "
              >
                <ccu-icon
                  :type="section.icon"
                  :class="
                    currentView === section.view
                      ? 'filter-primary'
                      : 'filter-gray'
                  "
                  size="large"
                />
                <div v-if="sideBarExpanded">{{ $t(section.text) }}</div>
              </div>
            </div>
          </ul>
          <div
            class="w-full cursor-pointer flex items-center p-3 border border-t-2"
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

<style lang="postcss" scoped></style>
