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
const { updateUserStates } = useCurrentUser();

const sections = [
  {
    view: 'callHistory',
    text: t('phoneDashboard.last_10_calls'),
    icon: 'phone-history',
    alt: t('phoneDashboard.last_10_calls'),
  },
  {
    view: 'manualDialer',
    text: t('phoneDashboard.manual_dialer'),
    icon: 'manual-dialer',
    alt: t('phoneDashboard.manual_dialer'),
  },
  {
    view: 'leaderboard',
    text: t('phoneDashboard.volunteer_stats'),
    icon: 'leaderboard',
    alt: t('phoneDashboard.volunteer_stats'),
  },
  {
    view: 'zoom',
    text: t('phoneDashboard.join_zoom'),
    icon: 'zoom',
    alt: t('phoneDashboard.join_zoom'),
  },
  {
    view: 'cms',
    text: t('phoneDashboard.news'),
    icon: 'news',
    alt: t('phoneDashboard.news'),
  },
  {
    view: 'generalStats',
    text: t('phoneDashboard.stats'),
    icon: 'stats',
    alt: t('phoneDashboard.stats'),
  },
  {
    view: 'chat',
    text: t('chat.chat'),
    icon: 'chat',
    onOpen: () => {
      updateUserStates({
        chat_last_seen: moment().toISOString(),
      });
      unreadChatCount.value = 0;
      unreadUrgentChatCount.value = 0;
    },
  },
  {
    view: 'reportBug',
    text: t('phoneDashboard.report_bug'),
    icon: 'bug-report',
    alt: t('phoneDashboard.report_bug'),
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
import { computed, reactive, ref } from 'vue';
import moment from 'moment';
import usePhoneService from '@/hooks/phone/usePhoneService';
import BaseText from '@/components/BaseText.vue';
import Badge from '@/components/Badge.vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import PhoneOutbound from '@/models/PhoneOutbound';
import { useToast } from 'vue-toastification';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay.vue';
const { emitter } = useEmitter();
const $toasted = useToast();

const { text, copy } = useClipboard({
  source: '',
});
const remainingCallbacks = ref(0);
const remainingCalldowns = ref(0);
const unreadChatCount = ref(0);
const unreadUrgentChatCount = ref(0);
const unreadNewsCount = ref(0);

const showCompleteCallScreen = ref(false);
const phoneNumberToDial = ref('');
const endCall = () => {
  hangUp();
};
const currentCallStart = ref<Date | null>(null);
const hasCallEnded = ref(false);

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
  hasCallEnded.value = false;
};

const onCancelCompleteCall = () => {
  showCompleteCallScreen.value = false;
};

const updateView = (section) => {
  expanded.value = true;
  currentView.value = section.view;
  section.onOpen?.();
};

const closeTab = () => {
  currentView.value = '';

  if (!caller.value) {
    expanded.value = false;
  }
};

function setManualOutbound(phone) {
  currentView.value = 'manualDialer';
  phoneNumberToDial.value = formatNationalNumber(phone);
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
      expanded.value = true;
    }
  },
);

watch(
  () => connectFirst.isOnCall.value,
  (newValue) => {
    if (newValue) {
      currentCallStart.value = new Date();
    } else {
      currentCallStart.value = null;
      hasCallEnded.value = true;
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
  if (!isOnCall.value || !call.value || !currentCallStart.value) {
    return;
  }

  // Calculate the difference in milliseconds
  const nowLocal = new Date();
  const diff = nowLocal - currentCallStart.value;

  // Convert milliseconds into hours, minutes, and seconds
  const diffSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  formattedElapsedTime.value = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

async function updateCallbacks() {
  remainingCallbacks.value =
    await PhoneOutbound.api().getRemainingCallbackCount('');
  remainingCalldowns.value =
    await PhoneOutbound.api().getRemainingCalldownCount('');
}

const callsWaiting = computed(function () {
  return (
    Number(stats.value.inQueue || 0) +
    Number(stats.value.active || 0) +
    Number(remainingCallbacks.value || 0) +
    Number(remainingCalldowns.value || 0)
  );
});

const reset = async () => {
  await resetPhoneSystem();
  await updateCallbacks();
  currentView.value = '';
  expanded.value = false;
  $toasted.success(t('phoneDashboard.reset_phone_system_success'));
};

onMounted(() => {
  // Immediately update once in case component mounts after call has started
  updateElapsedTime();

  // Then set an interval to update every second
  intervalId = setInterval(updateElapsedTime, 1000);

  updateCallbacks();

  emitter.on('phone_outbound:click', (payload: Record<string, any>) => {
    const { phone_number } = payload;
    setManualOutbound(phone_number);
  });
});

const viewToTitleMap = {
  callHistory: t('phoneDashboard.last_10_calls'),
  manualDialer: t('phoneDashboard.manual_dialer'),
  leaderboard: t('phoneDashboard.volunteer_stats'),
  zoom: t('phoneDashboard.join_zoom'),
  cms: t('phoneDashboard.news'),
  generalStats: t('phoneDashboard.stats'),
  chat: t('chat.chat'),
  reportBug: t('phoneDashboard.report_bug'),
};

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

const {
  isOnCall,
  caller,
  stats,
  call,
  isConnecting,
  isInboundCall,
  isOutboundCall,
  callHistory,
  dialManualOutbound,
  removeNumberFromQueue,
  hangUp,
  resetPhoneSystem,
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
    <div class="top-0 flex absolute right-0 left-0 bottom-0 z-phone-overlay">
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
                <div class="flex flex-col item-center">
                  <div v-if="isConnecting" data-testid="testIsConnectingDiv">
                    {{ $t('phoneDashboard.connecting') }}
                  </div>
                  <div v-else-if="isOnCall" data-testid="testIsOnCallDiv">
                    <div
                      v-if="isInboundCall"
                      data-testid="testIsInboundCallDiv"
                    >
                      {{ $t('phoneDashboard.inbound_call') }}
                    </div>
                    <div
                      v-if="isOutboundCall"
                      data-testid="testIsOutboundCallDiv"
                    >
                      {{ $t('phoneDashboard.outbound_call') }}
                    </div>
                  </div>
                  <div
                    v-else-if="hasCallEnded"
                    data-testid="testIsCompletedDiv"
                  >
                    {{ $t('phoneDashboard.call_ended') }}
                  </div>
                  <PhoneNumberDisplay
                    class="w-40"
                    :phone-number="caller.dnis"
                    type="plain"
                  />
                </div>

                <span
                  class="ml-3 font-light break-words text-xs sm:text-sm lg:text-base"
                >
                  {{ caller.location_name }} {{ caller.state_name }}
                </span>

                <span class="ml-6 font-light">{{ formattedElapsedTime }}</span>
              </div>

              <div class="flex items-center">
                <base-button
                  class="p-1"
                  :action="() => (expanded = !expanded)"
                  :text="$t('actions.show_details')"
                  :alt="$t('actions.show_details')"
                  :suffix-icon="expanded ? 'chevron-up' : 'chevron-down'"
                />
                <base-button
                  v-if="isOnCall"
                  class="p-1 text-black text-sm"
                  variant="solid"
                  :action="endCall"
                  :text="$t('actions.end_call')"
                  :alt="$t('actions.end_call')"
                />
                <base-button
                  v-else
                  class="p-1 text-black text-sm ml-10"
                  variant="solid"
                  :action="showCompleteCall"
                  :alt="$t('phoneDashboard.complete_call')"
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
              <h1>{{ viewToTitleMap[currentView] }}</h1>
              <base-button
                :action="closeTab"
                :alt="$t('phoneDashboard.close_tab')"
              >
                {{ $t('phoneDashboard.close_tab') }}
              </base-button>
            </div>
            <div
              class="bg-white"
              :class="!currentView && caller ? '' : 'h-full'"
            >
              <div class="bg-white">
                <Leaderboard
                  v-if="currentView === 'leaderboard'"
                  class="h-full"
                />
              </div>

              <div
                v-if="currentView === 'manualDialer'"
                class="flex items-center justify-center h-[calc(100vh-13rem)] bg-white"
              >
                <ManualDialer
                  class="p-2 z-phone-component"
                  data-testid="testManualDialerDiv"
                  :dialing="false"
                  :phone-number="phoneNumberToDial"
                  @on-dial="dialManualOutbound"
                  @on-remove-number-from-queue="removeNumberFromQueue"
                ></ManualDialer>
              </div>

              <div v-if="currentView === 'zoom'" class="bg-white">
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
                      {{ $t('phoneDashboard.zoom_support') }}
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
                      {{ $t(`phoneDashboard.zoom_description`) }}
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
              </div>
              <PhoneCmsItems
                v-if="currentView === 'cms'"
                class="p-2 h-[calc(100vh-13rem)] z-phone-component bg-white"
                data-testid="testPhoneCmsItemsDiv"
                @unread-count="unreadNewsCount = $event"
              ></PhoneCmsItems>

              <div class="bg-white">
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
              </div>

              <div
                v-if="currentView === 'generalStats'"
                class="flex items-center justify-center h-full"
              >
                <div class="h-full flex flex-col items-center justify-center">
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
                  class="h-[calc(100vh-13rem)] flex flex-col justify-center items-center text-left p-5 w-full bg-white"
                >
                  <div class="flex flex-col lg:flex-row">
                    <div class="flex items-center">
                      <img
                        src="@/assets/cc-bugs.png"
                        alt="$t('phoneDashboard.crisis_cleanup_bugs')"
                        class="mb-5"
                      />
                    </div>
                    <div
                      class="flex flex-col items-center justify-center text-center font-sans text-gray-800"
                    >
                      <p class="font-bold text-2xl mb-2">
                        {{ $t('phoneDashboard.hey_bug_buster') }}
                      </p>
                      <p>
                        {{ $t('phoneDashboard.stumble_across critter') }}
                      </p>
                      <p class="font-bold text-2xl m-2">
                        {{ $t('phoneDashboard.how_to_report_bugs') }}
                      </p>
                      <ul
                        class="space-y-2 m-5 lg:flex lg:flex-row lg:space-y-0 lg:space-x-2"
                      >
                        <li>
                          <div
                            class="font-bold p-2 border rounded hover:bg-crisiscleanup-yellow-100"
                          >
                            {{ $t('phoneDashboard.capture_the_critter') }}
                          </div>
                        </li>
                        <li>
                          <div
                            class="font-bold p-2 border rounded hover:bg-crisiscleanup-yellow-100"
                          >
                            {{ $t('phoneDashboard.where_lurking') }}
                          </div>
                        </li>
                        <li>
                          <div
                            class="font-bold p-2 border rounded hover:bg-crisiscleanup-yellow-100"
                          >
                            {{ $t('phoneDashboard.tell_us_what_happened') }}
                          </div>
                        </li>
                      </ul>
                      <p>
                        {{ $t('phoneDashboard.hit_report_a_bug_button') }}
                      </p>
                      <p class="my-2">
                        {{ $t('phoneDashboard.thank_you_keen_eyes') }}
                      </p>
                      <p class="my-2">
                        {{ $t('phoneDashboard.happy_bug_hunting') }}
                      </p>
                      <p class="my-2">
                        {{ $t('phoneDashboard.ccu_dev_team_signature') }}
                      </p>

                      <base-button
                        size="large"
                        data-testid="testReportBugButton"
                        :text="$t('phoneDashboard.report_bug')"
                        :alt="$t('phoneDashboard.report_bug')"
                        :action="() => emit('onReportBug')"
                        class="text-white bg-crisiscleanup-red-200 my-2"
                      >
                        {{ $t('phoneDashboard.report_bug') }}
                      </base-button>

                      <base-button
                        :action="reset"
                        class="text-white bg-crisiscleanup-red-200 my-2"
                        :text="$t('phoneDashboard.reset_phone_system')"
                        :alt="$t('phoneDashboard.reset_phone_system')"
                        data-testid="testResetPhoneSystemButton"
                        size="large"
                      >
                        {{ $t('phoneDashboard.reset_phone_system') }}
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
                      :alt="$t('actions.hide')"
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
                class="h-12 flex items-center justify-center"
                style="background: #358816"
              >
                <BaseText class="font-bold text-white">
                  {{ $t('phoneDashboard.current_call') }} 00:00:00
                </BaseText>
              </div>
            </div>

            <div class="flex flex-col items-center">
              <div
                v-for="section in sections"
                :key="section.view"
                :data-testid="`testPhoneOverlay_${section.view}`"
                class="p-2 bg-white flex items-center gap-2 justify-between cursor-pointer hover:bg-primary-light hover:bg-opacity-30 w-full text-center border-b-4"
                :class="{
                  'border-l-4 border-l-primary-light font-bold':
                    currentView === section.view,
                  'justify-center': !sideBarExpanded,
                }"
                @click="
                  () =>
                    currentView === section.view
                      ? closeTab()
                      : updateView(section)
                "
              >
                <div class="flex items-center gap-2">
                  <ccu-icon
                    :type="section.icon"
                    :alt="section.alt"
                    :class="[
                      currentView === section.view
                        ? 'filter-primary'
                        : 'filter-gray',
                      '!transition-none',
                    ]"
                    size="large"
                  />
                  <div v-if="sideBarExpanded">{{ $t(section.text) }}</div>
                </div>
                <div v-if="section.view === 'generalStats'" class="relative">
                  <badge
                    v-if="callsWaiting > 0"
                    class="ml-2 text-black bg-primary-light text-base"
                    :class="
                      sideBarExpanded
                        ? 'relative p-3'
                        : 'absolute top-0 right-0 p-2'
                    "
                    >{{ callsWaiting }}</badge
                  >
                </div>
                <div v-if="section.view === 'cms'" class="relative">
                  <badge
                    v-if="unreadNewsCount > 0"
                    class="ml-2 text-black bg-primary-light text-base"
                    :class="
                      sideBarExpanded
                        ? 'relative p-3'
                        : 'absolute top-0 right-0 p-2'
                    "
                    >{{ unreadNewsCount }}</badge
                  >
                </div>
                <div v-if="section.view === 'chat'" class="flex gap-1 relative">
                  <badge
                    v-if="unreadChatCount > 0"
                    class="text-black bg-primary-light text-base"
                    :class="
                      sideBarExpanded
                        ? 'relative p-3'
                        : 'absolute top-0 right-0 p-2'
                    "
                  >
                    {{ unreadChatCount }}
                  </badge>
                  <badge
                    v-if="unreadUrgentChatCount > 0"
                    class="text-white bg-red-500 text-base"
                    :class="
                      sideBarExpanded
                        ? 'relative p-3'
                        : 'absolute top-0 right-0 p-2'
                    "
                  >
                    {{ unreadUrgentChatCount }}
                  </badge>
                </div>
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
