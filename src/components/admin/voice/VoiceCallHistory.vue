<template>
  <div class="text-sm" data-testid="testVoiceCallHistory">
    <template v-if="!selected">
      <div class="mb-2 flex items-center justify-between">
        <span
          class="text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ t('voiceConsole.last_50_calls', 'Last 50 calls') }}
        </span>
        <BaseButton
          variant="outline"
          size="small"
          :action="load"
          :text="t('actions.refresh', 'Refresh')"
          :alt="t('actions.refresh', 'Refresh')"
        />
      </div>
      <Spinner v-if="loading" />
      <PaneEmpty
        v-else-if="sessions.length === 0"
        :title="t('voiceConsole.no_calls_title', 'No calls yet')"
        :description="t('voiceConsole.no_calls', 'Finished calls show here.')"
      />
      <div v-else class="max-h-[55vh] overflow-y-auto">
        <table class="w-full">
          <thead
            class="sticky top-0 bg-white text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
          >
            <tr>
              <th class="py-1">{{ t('voiceConsole.when', 'When') }}</th>
              <th>{{ t('voiceConsole.line', 'Line') }}</th>
              <th>{{ t('voiceConsole.outcome', 'Outcome') }}</th>
              <th>{{ t('voiceConsole.length', 'Length') }}</th>
              <th>{{ t('~~Est. model cost') }}</th>
              <th>{{ t('voiceConsole.case', 'Case') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="session in sessions"
              :key="session.id"
              class="cursor-pointer border-b border-crisiscleanup-grey-100 hover:bg-crisiscleanup-grey-100/40"
              @click="openSession(session.id)"
            >
              <td class="py-1.5">{{ formatWhen(session.created_at) }}</td>
              <td>
                {{ (session.language || 'en').toUpperCase() }}
                <span
                  v-if="session.is_test"
                  class="text-xs text-crisiscleanup-dark-300"
                >
                  {{ t('voiceConsole.test', 'test') }}
                </span>
              </td>
              <td :class="outcomeClass(session.status)">
                {{ outcome(session) }}
              </td>
              <td class="tabular-nums">
                {{
                  session.duration_seconds === null
                    ? '—'
                    : formatClock(session.duration_seconds)
                }}
              </td>
              <td class="tabular-nums">
                {{
                  session.model === 'gpt-live-1' &&
                  typeof session.estimated_cost_usd !== 'number'
                    ? t('~~Not estimated')
                    : formatCost(session.estimated_cost_usd)
                }}
              </td>
              <td>{{ session.case_number || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-else data-testid="testVoiceCallDetail">
      <div class="mb-3 flex items-center justify-between">
        <button
          type="button"
          class="font-semibold underline"
          @click="selected = undefined"
        >
          ← {{ t('voiceConsole.all_calls', 'All calls') }}
        </button>
        <div class="flex gap-3">
          <button type="button" class="underline" @click="exportJson">
            {{ t('voiceConsole.export_json', 'Export JSON') }}
          </button>
          <button type="button" class="underline" @click="exportText">
            {{ t('voiceConsole.export_text', 'Export text') }}
          </button>
        </div>
      </div>
      <dl class="mb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <template v-for="[label, value] in detailRows" :key="label">
          <dt class="text-crisiscleanup-dark-300">{{ label }}</dt>
          <dd>{{ value }}</dd>
        </template>
        <template v-if="selected.case_number && selected.incident_id">
          <dt class="text-crisiscleanup-dark-300">
            {{ t('voiceConsole.case', 'Case') }}
          </dt>
          <dd>
            <router-link
              class="underline"
              :to="`/incident/${selected.incident_id}/work/${selected.worksite_id}/edit`"
            >
              {{ selected.case_number }}
            </router-link>
          </dd>
        </template>
      </dl>
      <pre
        class="max-h-[45vh] overflow-auto whitespace-pre-wrap rounded bg-crisiscleanup-grey-100/40 p-3 text-xs"
        >{{
          selected.transcript ||
          t('voiceConsole.no_transcript', '(no transcript saved)')
        }}</pre
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import PaneEmpty from '@/components/phone/foundation/PaneEmpty.vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { voiceConsoleUrl } from '@/hooks/voice/useVoiceConsole';
import { formatClock, formatCost } from '@/hooks/voice/voiceConsoleState';
import { getErrorMessage } from '@/utils/errors';
import { downloadText } from './download';

interface SessionRow {
  id: number;
  call_id: string;
  created_at: string;
  duration_seconds: number | null;
  status: string;
  referral: string;
  language: string;
  is_test: boolean;
  model: string;
  voice: string;
  estimated_cost_usd: number | null;
  incident: string | null;
  incident_id: number | null;
  case_number: string | null;
  worksite_id: number | null;
}

interface SessionDetail extends SessionRow {
  transcript: string;
  error: string;
  usage?: {
    backend_model?: string;
    backend?: string;
    gpt_live_session_seconds?: number | null;
    gpt_live_voice_cost_usd?: number | null;
    backend_cost_usd?: number | null;
    total_cost_usd?: number | null;
  };
}

const { t } = useI18n();
const $toasted = useToast();

const sessions = ref<SessionRow[]>([]);
const selected = ref<SessionDetail>();
const loading = ref(false);

const OUTCOMES: Record<string, string> = {
  completed: 'Case',
  referred: 'Referred',
  abandoned: 'Abandoned',
  failed: 'Failed',
  in_progress: 'In progress',
};

function outcome(session: SessionRow) {
  const label = t(
    `voiceConsole.status_${session.status}`,
    OUTCOMES[session.status] ?? session.status,
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

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function load() {
  loading.value = true;
  try {
    const { data } = await axios.get<{ sessions: SessionRow[] }>(
      voiceConsoleUrl('sessions'),
    );
    sessions.value = data.sessions;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    loading.value = false;
  }
}

async function openSession(id: number) {
  try {
    const { data } = await axios.get<SessionDetail>(
      voiceConsoleUrl(`sessions/${id}`),
    );
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

onMounted(load);

defineExpose({ load });
</script>
