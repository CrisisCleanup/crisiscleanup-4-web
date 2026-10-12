<template>
  <div class="text-sm" data-testid="testVoiceCallHistory">
    <template v-if="!selected">
      <div class="mb-3 grid grid-cols-2 items-end gap-3 md:flex md:flex-wrap">
        <label
          class="col-span-2 flex min-w-[10rem] flex-1 flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ t('~~Search') }}
          <input
            v-model="search"
            type="search"
            class="mt-1 min-h-[40px] rounded border p-1.5 text-sm normal-case text-black"
            :placeholder="t('~~Call, case or incident')"
            data-testid="testVoiceHistorySearch"
          />
        </label>
        <label
          class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ t('~~Outcome') }}
          <select
            v-model="status"
            class="mt-1 min-h-[40px] rounded border p-1.5 text-sm normal-case text-black"
            data-testid="testVoiceHistoryStatus"
          >
            <option value="">{{ t('~~Any outcome') }}</option>
            <option
              v-for="(label, key) in SESSION_STATUSES"
              :key="key"
              :value="key"
            >
              {{ t(label) }}
            </option>
          </select>
        </label>
        <label
          class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ t('~~Case') }}
          <select
            v-model="hasCase"
            class="mt-1 min-h-[40px] rounded border p-1.5 text-sm normal-case text-black"
            data-testid="testVoiceHistoryHasCase"
          >
            <option value="">{{ t('~~With or without') }}</option>
            <option value="true">{{ t('~~With a case') }}</option>
            <option value="false">{{ t('~~Without a case') }}</option>
          </select>
        </label>
        <label
          class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ t('~~Flag') }}
          <select
            v-model="flag"
            class="mt-1 min-h-[40px] rounded border p-1.5 text-sm normal-case text-black"
            data-testid="testVoiceHistoryFlag"
          >
            <option value="">{{ t('~~Any flag') }}</option>
            <option v-for="(item, key) in FLAGS" :key="key" :value="key">
              {{ t(item.label) }}
            </option>
          </select>
        </label>
        <label
          class="col-span-2 flex min-h-[40px] items-center gap-2 md:col-span-1"
        >
          <input
            v-model="includeTest"
            type="checkbox"
            data-testid="testVoiceHistoryIncludeTest"
          />
          {{ t('~~Include test calls') }}
        </label>
        <BaseButton
          variant="outline"
          size="small"
          class="col-span-2 max-md:!min-h-[40px] md:col-span-1"
          :action="refresh"
          :text="t('actions.refresh', 'Refresh')"
          :alt="t('actions.refresh', 'Refresh')"
        />
      </div>
      <p
        class="mb-2 text-crisiscleanup-dark-300"
        data-testid="testVoiceHistoryCount"
        :data-count="total"
      >
        {{ t('~~{n} calls', { n: total }) }}
      </p>
      <!-- A new key per filter: back to page 1 and one request. -->
      <AjaxTable
        :key="JSON.stringify(query)"
        :url="sessionsUrl()"
        :query="query"
        :columns="columns"
        :page-size="25"
        :body-style="{ maxHeight: '60vh', minHeight: '8rem' }"
        table-id="voiceHistory"
        data-testid="testVoiceHistoryTable"
        @data-fetched="(count: number) => (total = count)"
        @row-click="(row: SessionRow) => openSession(row.id)"
      >
        <template #created_at="{ item }">
          <span class="flex flex-wrap items-center gap-x-2">
            <span class="font-semibold md:font-normal">{{
              formatWhen(item.created_at)
            }}</span>
            <span
              v-if="item.is_test"
              class="text-xs text-crisiscleanup-dark-300"
            >
              {{ t('voiceConsole.test', 'test') }}
            </span>
          </span>
        </template>
        <template #status="{ item }">
          <span :class="outcomeClass(item.status)">{{ outcome(item) }}</span>
        </template>
        <template #cases="{ item }">
          <span v-if="mq.mdMinus" class="mr-2 font-semibold"
            >{{ t('~~Case') }}:</span
          >
          <VoiceCaseLinks :session="item" />
        </template>
        <template #flags="{ item }">
          <VoiceFlagPills :flags="item.flags ?? []" />
        </template>
        <template #open_issues="{ item }">
          <span v-if="mq.mdMinus" class="mr-2 font-semibold"
            >{{ t('~~Open issues') }}:</span
          >
          <router-link
            v-if="item.review_id && item.open_issues > 0"
            :to="{
              name: 'nav.voice_reviews',
              params: { reviewId: item.review_id },
            }"
            class="rounded bg-crisiscleanup-yellow-100 px-1.5 text-xs underline max-md:inline-flex max-md:min-h-[40px] max-md:items-center"
            data-testid="testVoiceHistoryIssues"
            @click.stop
          >
            {{ t('~~{n} open', { n: item.open_issues }) }}
          </router-link>
          <span v-else-if="item.review_id" class="text-crisiscleanup-dark-300">
            {{ t('~~None') }}
          </span>
          <span v-else class="text-crisiscleanup-dark-300">—</span>
        </template>
        <template #duration_seconds="{ item }">
          <span v-if="mq.mdMinus" class="mr-2 font-semibold"
            >{{ t('~~Length') }}:</span
          >
          <span class="tabular-nums">
            {{
              item.duration_seconds === null
                ? '—'
                : formatClock(item.duration_seconds)
            }}
          </span>
        </template>
        <template #estimated_cost_usd="{ item }">
          <span v-if="mq.mdMinus" class="mr-2 font-semibold"
            >{{ t('~~Est. model cost') }}:</span
          >
          <span class="tabular-nums">
            {{
              item.model === 'gpt-live-1' &&
              typeof item.estimated_cost_usd !== 'number'
                ? t('~~Not estimated')
                : formatCost(item.estimated_cost_usd)
            }}
          </span>
        </template>
      </AjaxTable>
    </template>

    <div v-else data-testid="testVoiceCallDetail">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          class="min-h-[40px] font-semibold underline"
          @click="selected = undefined"
        >
          ← {{ t('voiceConsole.all_calls', 'All calls') }}
        </button>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <router-link
            v-if="selected.review_id"
            class="inline-flex min-h-[40px] items-center font-semibold underline"
            data-testid="testVoiceCallAuditorLink"
            :to="{
              name: 'nav.voice_reviews',
              params: { reviewId: selected.review_id },
            }"
          >
            {{ t('~~View in auditor') }}
          </router-link>
          <button
            type="button"
            class="min-h-[40px] underline"
            @click="exportJson"
          >
            {{ t('voiceConsole.export_json', 'Export JSON') }}
          </button>
          <button
            type="button"
            class="min-h-[40px] underline"
            @click="exportText"
          >
            {{ t('voiceConsole.export_text', 'Export text') }}
          </button>
        </div>
      </div>
      <dl class="mb-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
        <template v-for="[label, value] in detailRows" :key="label">
          <dt class="text-crisiscleanup-dark-300">{{ label }}</dt>
          <dd class="break-words">{{ value }}</dd>
        </template>
        <dt class="text-crisiscleanup-dark-300">
          {{ t('voiceConsole.case', 'Case') }}
        </dt>
        <dd><VoiceCaseLinks :session="selected" /></dd>
        <template v-if="selected.flags?.length">
          <dt class="text-crisiscleanup-dark-300">{{ t('~~Flags') }}</dt>
          <dd><VoiceFlagPills :flags="selected.flags" /></dd>
        </template>
      </dl>
      <VoiceDecisionTimeline
        v-if="selected.decisions?.length"
        :decisions="selected.decisions"
        class="mb-3"
      />
      <pre
        class="max-h-[45vh] overflow-auto whitespace-pre-wrap break-words rounded bg-crisiscleanup-grey-100/40 p-3 text-xs"
        >{{
          selected.transcript ||
          t('voiceConsole.no_transcript', '(no transcript saved)')
        }}</pre
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { useMq } from 'vue3-mq';
import { useToast } from 'vue-toastification';
import AjaxTable from '@/components/AjaxTable.vue';
import { makeTableColumns } from '@/utils/table';
import { formatClock, formatCost } from '@/hooks/voice/voiceConsoleState';
import {
  FLAGS,
  SESSION_STATUSES,
  formatWhen,
  sessionsUrl,
  type SessionDetail,
  type SessionRow,
} from '@/hooks/voice/voiceSessions';
import useEmitter from '@/hooks/useEmitter';
import { getErrorMessage } from '@/utils/errors';
import { downloadText } from './download';
import VoiceCaseLinks from './VoiceCaseLinks.vue';
import VoiceDecisionTimeline from './VoiceDecisionTimeline.vue';
import VoiceFlagPills from './VoiceFlagPills.vue';

const { t } = useI18n();
const mq = useMq();
const $toasted = useToast();
const { emitter } = useEmitter();

const selected = ref<SessionDetail>();
const total = ref(0);

const search = ref('');
const status = ref('');
const hasCase = ref('');
const flag = ref('');
// Test calls are off, like the metrics, so the list adds up to the numbers.
const includeTest = ref(false);
const searchText = refDebounced(search, 400);

// AjaxTable adds offset and limit.
const query = computed(() => ({
  ...(searchText.value.trim() ? { search: searchText.value.trim() } : {}),
  ...(status.value ? { status: status.value } : {}),
  ...(hasCase.value ? { has_case: hasCase.value } : {}),
  ...(flag.value ? { flag: flag.value } : {}),
  include_test: String(includeTest.value),
}));

const columns = makeTableColumns([
  ['created_at', '9.5rem', t('voiceConsole.when', 'When')],
  ['status', '8rem', t('voiceConsole.outcome', 'Outcome')],
  ['cases', '9rem', t('voiceConsole.case', 'Case')],
  ['flags', '1fr', t('~~Flags')],
  ['open_issues', '6rem', t('~~Open issues')],
  ['duration_seconds', '5rem', t('voiceConsole.length', 'Length')],
  ['estimated_cost_usd', '6.5rem', t('~~Est. model cost')],
]);

function outcome(session: SessionRow) {
  const label = t(
    `voiceConsole.status_${session.status}`,
    SESSION_STATUSES[session.status]
      ? t(SESSION_STATUSES[session.status])
      : session.status,
  );
  return session.status === 'referred' && session.referral
    ? `${label} · ${session.referral}`
    : label;
}

function outcomeClass(status: string) {
  return {
    'text-crisiscleanup-green-900 font-semibold': status === 'completed',
    'text-crisiscleanup-red-700 font-semibold': status === 'failed',
    'text-crisiscleanup-dark-300':
      status === 'abandoned' || status === 'in_progress',
  };
}

function refresh() {
  emitter.emit('refreshTable-voiceHistory');
}

async function openSession(id: number) {
  try {
    const { data } = await axios.get<SessionDetail>(sessionsUrl(String(id)));
    selected.value = data;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

const detailRows = computed(() => {
  const s = selected.value;
  if (!s) return [];
  const rows: [string, string][] = [
    [t('voiceConsole.room', 'Room'), s.call_id],
    [
      t('voiceConsole.started', 'Started'),
      new Date(s.created_at).toLocaleString(),
    ],
    [t('voiceConsole.outcome', 'Outcome'), outcome(s)],
    [t('voiceConsole.disaster', 'Disaster'), s.incident ?? '—'],
    [
      t('voiceConsole.model', 'Model'),
      s.model ? `${s.model} · ${s.voice}` : '—',
    ],
    [
      t('voiceConsole.length', 'Length'),
      s.duration_seconds === null ? '—' : formatClock(s.duration_seconds),
    ],
  ];
  if (s.usage?.backend_model) {
    rows.push([t('~~Backend model'), s.usage.backend_model]);
  }
  if (s.usage?.backend) {
    const backends: Record<string, string> = {
      decisions: 'Decisions',
      responses: 'Responses',
    };
    rows.push([
      t('~~Backend API'),
      backends[s.usage.backend] ?? s.usage.backend,
    ]);
  }
  const isGptLive =
    s.model === 'gpt-live-1' ||
    (s.usage &&
      ('gpt_live_session_seconds' in s.usage ||
        'gpt_live_voice_cost_usd' in s.usage));
  if (isGptLive) {
    rows.push(
      [
        t('~~Live billed time'),
        typeof s.usage?.gpt_live_session_seconds === 'number'
          ? `${s.usage.gpt_live_session_seconds.toFixed(2)} s`
          : '—',
      ],
      [t('~~Est. voice cost'), formatCost(s.usage?.gpt_live_voice_cost_usd)],
      [
        t('~~Backend cost'),
        typeof s.usage?.backend_cost_usd === 'number'
          ? formatCost(s.usage.backend_cost_usd)
          : t('~~Not estimated'),
      ],
      [
        t('~~Total cost'),
        typeof s.usage?.total_cost_usd === 'number'
          ? formatCost(s.usage.total_cost_usd)
          : t('~~Not estimated'),
      ],
    );
  } else {
    rows.push([
      t('voiceConsole.estimated_cost', 'Est. cost'),
      formatCost(s.estimated_cost_usd),
    ]);
  }
  if (s.error) rows.push([t('voiceConsole.error', 'Error'), s.error]);
  return rows;
});

function exportJson() {
  if (selected.value) {
    downloadText(
      `${selected.value.call_id}.json`,
      JSON.stringify(selected.value, undefined, 2),
      'application/json',
    );
  }
}

function exportText() {
  if (selected.value) {
    downloadText(
      `${selected.value.call_id}.txt`,
      selected.value.transcript || '',
      'text/plain',
    );
  }
}
</script>
