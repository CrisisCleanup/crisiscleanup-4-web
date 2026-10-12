<template>
  <div
    class="flex flex-col gap-4 bg-crisiscleanup-smoke p-3"
    data-testid="testAdminVoiceCall"
  >
    <section
      class="min-w-0 rounded-lg border border-crisiscleanup-grey-100 bg-white p-4 text-sm"
    >
      <div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <router-link
          :to="backLink.to"
          class="inline-flex min-h-[40px] items-center font-semibold underline"
          data-testid="testVoiceCallBackLink"
        >
          ← {{ backLink.label }}
        </router-link>
        <router-link
          :to="otherLink.to"
          class="inline-flex min-h-[40px] items-center font-semibold underline"
          data-testid="testVoiceCallOtherListLink"
        >
          {{ otherLink.label }}
        </router-link>
        <BaseButton
          class="ml-auto max-md:!min-h-[40px]"
          variant="outline"
          size="small"
          data-testid="testVoiceCallReload"
          :action="load"
          :text="t('actions.refresh', 'Refresh')"
          :alt="t('actions.refresh', 'Refresh')"
        />
      </div>

      <Spinner v-if="!session" />
      <template v-else>
        <dl
          class="mb-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 sm:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]"
          data-testid="testVoiceCallHeader"
        >
          <dt class="text-crisiscleanup-dark-300">{{ t('~~Call') }}</dt>
          <dd class="break-words font-semibold">{{ session.call_id }}</dd>
          <dt class="text-crisiscleanup-dark-300">{{ t('~~Started') }}</dt>
          <dd>{{ formatWhen(session.created_at) }}</dd>
          <dt class="text-crisiscleanup-dark-300">{{ t('~~Outcome') }}</dt>
          <dd :class="outcomeClass(session.status)">
            {{ outcomeLabel(session, t) }}
          </dd>
          <dt class="text-crisiscleanup-dark-300">{{ t('~~Case') }}</dt>
          <dd><VoiceCaseLinks :session="session" /></dd>
          <dt class="text-crisiscleanup-dark-300">{{ t('~~Length') }}</dt>
          <dd class="tabular-nums">
            {{
              session.duration_seconds === null
                ? '—'
                : formatClock(session.duration_seconds)
            }}
          </dd>
          <dt class="text-crisiscleanup-dark-300">
            {{ t('~~Est. model cost') }}
          </dt>
          <dd class="tabular-nums">{{ costLabel(session, t) }}</dd>
          <template v-if="session.flags?.length">
            <dt class="text-crisiscleanup-dark-300">{{ t('~~Flags') }}</dt>
            <dd class="sm:col-span-3">
              <VoiceFlagPills :flags="session.flags" />
            </dd>
          </template>
        </dl>

        <div
          class="mb-4 flex overflow-x-auto whitespace-nowrap border-b border-crisiscleanup-grey-100"
          role="tablist"
          data-testid="testVoiceCallTabs"
        >
          <button
            v-for="item in tabs"
            :key="item.key"
            type="button"
            role="tab"
            class="min-h-[40px] shrink-0 border-b-2 px-4 font-semibold"
            :class="
              tab === item.key
                ? 'border-black'
                : 'border-transparent text-crisiscleanup-dark-300'
            "
            :aria-selected="tab === item.key"
            :data-testid="`testVoiceCallTab-${item.key}`"
            @click="selectTab(item.key)"
          >
            {{ item.label }}
            <span
              v-if="item.badge"
              class="ml-1 rounded bg-crisiscleanup-yellow-100 px-1.5 text-xs"
              data-testid="testVoiceCallOpenIssues"
            >
              {{ item.badge }}
            </span>
          </button>
        </div>

        <!-- A tab loads when first opened, then stays, so the recording
             keeps playing while the person works on the review. -->
        <div
          v-if="visited.has('review')"
          v-show="tab === 'review'"
          role="tabpanel"
          data-testid="testVoiceCallReviewPane"
        >
          <VoiceReviewDetail
            v-if="review"
            v-model:review="review"
            :active="tab === 'review' && isActive"
            @reload="load"
            @evidence="(text?: string) => (evidence = text)"
          />
          <p v-else-if="reviewFailed" data-testid="testVoiceCallReviewFailed">
            {{ t('~~The review did not load. Try Refresh.') }}
          </p>
          <div
            v-else
            class="flex flex-col items-start gap-2 py-4"
            data-testid="testVoiceCallNoReview"
          >
            <p class="font-semibold">
              {{ t('~~This call has no review yet') }}
            </p>
            <p class="text-crisiscleanup-dark-300">
              {{
                t(
                  '~~A reviewer model compares what the caller said with the saved case and lists what to fix.',
                )
              }}
            </p>
            <BaseButton
              class="max-md:!min-h-[40px]"
              variant="solid"
              size="small"
              data-testid="testVoiceCallReviewThis"
              :disabled="waiting"
              :action="requestReview"
              :text="t('~~Review this call')"
              :alt="t('~~Review this call')"
            />
            <p v-if="waiting" data-testid="testVoiceCallQueued">
              {{
                t(
                  '~~The call is queued for review. It shows here when it is done.',
                )
              }}
            </p>
          </div>
        </div>
        <VoiceCallConversation
          v-if="visited.has('conversation')"
          v-show="tab === 'conversation'"
          role="tabpanel"
          :turns="turns"
          :audio-url="review?.audio_url"
          :decisions="session.decisions"
          :evidence="evidence"
          :visible="tab === 'conversation'"
        />
        <VoiceCallDebug
          v-if="visited.has('debug')"
          v-show="tab === 'debug'"
          role="tabpanel"
          :session="session"
        />
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';
import VoiceCallConversation from '@/components/admin/voice/VoiceCallConversation.vue';
import VoiceCallDebug from '@/components/admin/voice/VoiceCallDebug.vue';
import VoiceCaseLinks from '@/components/admin/voice/VoiceCaseLinks.vue';
import VoiceFlagPills from '@/components/admin/voice/VoiceFlagPills.vue';
import VoiceReviewDetail from '@/components/admin/voice/VoiceReviewDetail.vue';
import { useVoiceCall } from '@/hooks/voice/useVoiceCall';
import { formatClock } from '@/hooks/voice/voiceConsoleState';
import { queueReview } from '@/hooks/voice/voiceReviews';
import {
  callOrigin,
  costLabel,
  formatWhen,
  outcomeClass,
  outcomeLabel,
  type CallOrigin,
  type CallTab,
} from '@/hooks/voice/voiceSessions';
import { getErrorMessage } from '@/utils/errors';

const { t } = useI18n();
const $toasted = useToast();
const route = useRoute();
const router = useRouter();

const sessionId = computed(() => Number(route.params.sessionId) || undefined);
const { session, review, reviewFailed, turns, load } = useVoiceCall(sessionId);

// The admin pages are kept alive: a page out of sight takes no keys.
const isActive = ref(true);
onActivated(() => {
  isActive.value = true;
});
onDeactivated(() => {
  isActive.value = false;
  stopWaiting();
});

// Back returns to the list the person came from (?from=), kept across tabs.
// With no origin, that is the call history.
const LISTS = computed<Record<CallOrigin, { to: object; label: string }>>(
  () => ({
    calls: {
      to: { name: 'nav.voice_console', query: { view: 'calls' } },
      label: t('~~Call history'),
    },
    auditor: {
      to: { name: 'nav.voice_console', query: { view: 'auditor' } },
      label: t('~~Call Auditor'),
    },
  }),
);
const origin = computed(() => callOrigin(route.query.from));
const backLink = computed(() => LISTS.value[origin.value]);
const otherLink = computed(
  () => LISTS.value[origin.value === 'auditor' ? 'calls' : 'auditor'],
);

const TABS: CallTab[] = ['review', 'conversation', 'debug'];

// A call with open issues opens on the review, any other on the conversation.
// The choice is made when the call loads, so fixing issues does not move you.
const defaultTab = ref<CallTab>('conversation');
watch(
  () => session.value?.id,
  () => {
    defaultTab.value =
      session.value?.review_id && session.value.open_issues > 0
        ? 'review'
        : 'conversation';
  },
);
const tab = computed<CallTab>(
  () => TABS.find((key) => key === route.query.tab) ?? defaultTab.value,
);
function selectTab(key: CallTab) {
  void router.replace({ query: { ...route.query, tab: key } });
}

const visited = reactive(new Set<CallTab>());
watch(
  [tab, session],
  () => {
    if (session.value) visited.add(tab.value);
    else visited.clear();
  },
  { immediate: true },
);

const openIssues = computed(
  () =>
    review.value?.corrections.filter(
      (c: { status: string }) => c.status === 'open',
    ).length ??
    session.value?.open_issues ??
    0,
);
const tabs = computed(() => [
  {
    key: 'review' as const,
    label: t('~~Review'),
    badge: openIssues.value > 0 ? t('~~{n} open', { n: openIssues.value }) : '',
  },
  { key: 'conversation' as const, label: t('~~Conversation'), badge: '' },
  { key: 'debug' as const, label: t('~~Debug'), badge: '' },
]);

// The words of the chosen finding, marked in the conversation.
const evidence = ref<string>();

// A call with no review: queue one, then look for it every few seconds.
const waiting = ref(false);
let tries = 0;
const { pause, resume } = useIntervalFn(
  async () => {
    tries += 1;
    await load();
    if (review.value || tries >= 24) stopWaiting();
  },
  5000,
  { immediate: false },
);
function stopWaiting() {
  pause();
  waiting.value = false;
}
async function requestReview() {
  if (!session.value) return;
  try {
    await queueReview(session.value.id);
    waiting.value = true;
    tries = 0;
    resume();
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}
</script>
