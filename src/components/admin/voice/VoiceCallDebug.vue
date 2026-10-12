<template>
  <div class="min-w-0" data-testid="testVoiceCallDebug">
    <div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
      <button type="button" class="min-h-[40px] underline" @click="exportJson">
        {{ t('voiceConsole.export_json', 'Export JSON') }}
      </button>
      <button type="button" class="min-h-[40px] underline" @click="exportText">
        {{ t('voiceConsole.export_text', 'Export text') }}
      </button>
    </div>
    <dl class="mb-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
      <template v-for="[label, value] in detailRows" :key="label">
        <dt class="text-crisiscleanup-dark-300">{{ label }}</dt>
        <dd class="break-words">{{ value }}</dd>
      </template>
    </dl>
    <details
      v-if="session.evaluation"
      class="mb-3"
      data-testid="testVoiceCallEvaluation"
    >
      <summary class="min-h-[40px] cursor-pointer font-semibold">
        {{ t('~~Evaluation') }}
      </summary>
      <pre
        class="max-h-[45vh] overflow-auto whitespace-pre-wrap break-words rounded bg-crisiscleanup-grey-100/40 p-3 text-xs"
        >{{ JSON.stringify(session.evaluation, undefined, 2) }}</pre
      >
    </details>
    <h3
      class="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
    >
      {{ t('~~Raw transcript with tool calls') }}
    </h3>
    <pre
      class="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded bg-crisiscleanup-grey-100/40 p-3 text-xs"
      >{{
        session.transcript ||
        t('voiceConsole.no_transcript', '(no transcript saved)')
      }}</pre
    >
  </div>
</template>

<script setup lang="ts">
import { formatClock, formatCost } from '@/hooks/voice/voiceConsoleState';
import { outcomeLabel, type SessionDetail } from '@/hooks/voice/voiceSessions';
import { downloadText } from './download';

const props = defineProps<{ session: SessionDetail }>();
const { t } = useI18n();

const detailRows = computed(() => {
  const s = props.session;
  const rows: [string, string][] = [
    [t('voiceConsole.room', 'Room'), s.call_id],
    [
      t('voiceConsole.started', 'Started'),
      new Date(s.created_at).toLocaleString(),
    ],
    [t('voiceConsole.outcome', 'Outcome'), outcomeLabel(s, t)],
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
  downloadText(
    `${props.session.call_id}.json`,
    JSON.stringify(props.session, undefined, 2),
    'application/json',
  );
}

function exportText() {
  downloadText(
    `${props.session.call_id}.txt`,
    props.session.transcript || '',
    'text/plain',
  );
}
</script>
