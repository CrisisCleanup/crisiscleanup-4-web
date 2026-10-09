<template>
  <div class="flex flex-col gap-4 text-sm" data-testid="testVoiceMetrics">
    <dl class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="border-t-2 border-crisiscleanup-dark-500 pt-1"
      >
        <dt
          class="text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ stat.label }}
        </dt>
        <dd class="text-xl font-bold tabular-nums">{{ stat.value }}</dd>
      </div>
    </dl>

    <div>
      <div
        class="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
      >
        {{
          t(
            'voiceConsole.latency_per_response',
            'Time to first audio, per response',
          )
        }}
      </div>
      <div
        class="flex h-20 items-end gap-0.5 border-b border-crisiscleanup-grey-100"
        role="img"
        :aria-label="
          t('voiceConsole.latency_chart', 'Response time per response')
        "
      >
        <span
          v-for="(bar, index) in bars"
          :key="index"
          class="max-w-[18px] flex-1 rounded-t-sm"
          :class="bar.className"
          :style="{ height: `${bar.height}%` }"
          :title="`${t('voiceConsole.response', 'Response')} ${index + 1}: ${formatSeconds(bar.value)}`"
        />
      </div>
    </div>

    <dl class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div
        v-for="item in tokens"
        :key="item.label"
        class="border-t border-crisiscleanup-grey-100 pt-1"
      >
        <dt
          class="text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ item.label }}
        </dt>
        <dd class="font-semibold tabular-nums">
          {{ item.value.toLocaleString() }}
        </dd>
      </div>
    </dl>
    <p class="text-xs text-crisiscleanup-dark-300">
      {{
        t(
          'voiceConsole.cost_note',
          'The cost covers the realtime model tokens only, not telephony or LiveKit.',
        )
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  type ResponseMetrics,
  formatCost,
  formatSeconds,
  summarizeMetrics,
} from '@/hooks/voice/voiceConsoleState';

const props = defineProps<{ metrics: ResponseMetrics[] }>();

const { t } = useI18n();

const summary = computed(() => summarizeMetrics(props.metrics));

const stats = computed(() => [
  {
    label: t('voiceConsole.last_response', 'Last response'),
    value: formatSeconds(summary.value.last),
  },
  {
    label: t('voiceConsole.average', 'Average'),
    value: formatSeconds(summary.value.average),
  },
  {
    label: t('voiceConsole.slowest', 'Slowest'),
    value: formatSeconds(summary.value.slowest),
  },
  {
    label: t('voiceConsole.estimated_cost', 'Est. cost'),
    value: formatCost(summary.value.cost),
  },
]);

const tokens = computed(() => [
  {
    label: t('voiceConsole.input_tokens', 'Input tokens'),
    value: summary.value.inputTokens,
  },
  {
    label: t('voiceConsole.cached_input', 'Cached input'),
    value: summary.value.cachedTokens,
  },
  {
    label: t('voiceConsole.output_tokens', 'Output tokens'),
    value: summary.value.outputTokens,
  },
  {
    label: t('voiceConsole.responses', 'Responses'),
    value: summary.value.responses,
  },
]);

// One bar per response. 1.5 s or more sounds slow on a phone line; 3 s or
// more sounds broken.
const bars = computed(() => {
  const values = props.metrics
    .map((m: ResponseMetrics) => m.ttft)
    .filter((v: number) => v >= 0)
    .slice(-60);
  const top = Math.max(2, ...values);
  return values.map((value: number) => ({
    value,
    height: Math.max(3, (value / top) * 100),
    className:
      value >= 3
        ? 'bg-crisiscleanup-red-500'
        : value >= 1.5
          ? 'bg-primary-dark'
          : 'bg-crisiscleanup-green-500',
  }));
});
</script>
