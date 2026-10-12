<template>
  <section
    class="mt-3 flex min-w-0 flex-col gap-3 rounded border border-crisiscleanup-grey-100 bg-white p-3"
    data-testid="testVoiceCostProjection"
  >
    <div class="flex flex-col gap-0.5">
      <h3 class="text-sm font-semibold">{{ t('~~Cost projection') }}</h3>
      <p
        class="text-xs text-crisiscleanup-grey-900"
        data-testid="testVoiceProjectionBasis"
      >
        {{
          t('~~At the last {window} rate', {
            window: t(WINDOW_LABELS[windowKey]),
          })
        }}
      </p>
    </div>

    <p
      v-if="!projection"
      class="text-crisiscleanup-dark-300"
      data-testid="testVoiceProjectionEmpty"
    >
      —
      <span class="text-xs">{{
        t('~~No calls or no cost in this time.')
      }}</span>
    </p>
    <dl v-else class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex min-w-0 flex-col gap-1"
      >
        <dt class="text-xs font-semibold text-crisiscleanup-grey-900">
          {{ t(item.label) }}
        </dt>
        <dd
          class="break-words text-xl font-semibold tabular-nums"
          :data-testid="`testVoiceProjection-${item.id}`"
        >
          {{ item.value }}
        </dd>
      </div>
    </dl>

    <p
      v-if="projection?.change"
      class="text-xs"
      :class="DELTA_CLASSES[projection.change.tone]"
      :data-tone="projection.change.tone"
      data-testid="testVoiceProjectionChange"
    >
      {{ ARROWS[projection.change.direction] }}
      {{ projection.change.direction === 'flat' ? '' : projection.change.text }}
      <span class="text-crisiscleanup-dark-300">
        {{ t('~~vs the {window} before', { window: windowKey }) }}
      </span>
    </p>

    <label v-if="projection" class="flex flex-col gap-1 text-xs">
      <span class="font-semibold text-crisiscleanup-grey-900">
        {{ t('~~Expected calls per day') }}
      </span>
      <input
        v-model="expectedText"
        type="text"
        inputmode="decimal"
        class="min-h-[40px] w-full max-w-[12rem] rounded border p-1.5 text-sm"
        :placeholder="String(Math.round(projection.callsPerDay))"
        data-testid="testVoiceExpectedCalls"
      />
      <span class="text-crisiscleanup-dark-300">
        {{
          t(
            '~~Leave empty to use the calls per day of this time frame. Cost per call times the calls you expect.',
          )
        }}
      </span>
    </label>

    <p
      v-if="isShortWindow"
      class="text-xs text-crisiscleanup-dark-300"
      data-testid="testVoiceProjectionShortHint"
    >
      {{ t('~~Short window: projection is rough') }}
    </p>
    <p class="text-xs text-crisiscleanup-dark-300">
      {{ t('~~Model cost only (voice + Luna). Excludes phone and LiveKit.') }}
    </p>
  </section>
</template>

<script setup lang="ts">
import {
  SHORT_WINDOWS,
  WINDOW_LABELS,
  formatMetricValue,
  parseExpectedCalls,
  projectCost,
  type Metric,
  type MetricWindow,
} from '@/hooks/voice/voiceMetrics';

const props = defineProps<{
  metrics: Metric[];
  windowKey: MetricWindow;
}>();
const { t } = useI18n();

const ARROWS = { up: '▲', down: '▼', flat: '–' };
const DELTA_CLASSES = {
  good: 'text-crisiscleanup-green-900',
  bad: 'text-crisiscleanup-red-700',
  neutral: 'text-crisiscleanup-dark-300',
};

// The expected calls per day stay on this device between visits.
const STORAGE_KEY = 'voiceCostExpectedCallsPerDay';
function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}
const expectedText = ref(readStored());
watch(expectedText, (text: string) => {
  try {
    if (text.trim()) localStorage.setItem(STORAGE_KEY, text);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The number still holds until the page closes.
  }
});

function metricNamed(key: string) {
  return props.metrics.find((metric: Metric) => metric.key === key);
}

const projection = computed(() =>
  projectCost({
    cost: metricNamed('cost_usd')?.values[props.windowKey],
    calls: metricNamed('calls')?.values[props.windowKey],
    window: props.windowKey,
    previousCost: metricNamed('cost_usd')?.previous?.[props.windowKey],
    expectedCallsPerDay: parseExpectedCalls(expectedText.value),
  }),
);
const isShortWindow = computed(() => SHORT_WINDOWS.includes(props.windowKey));

const items = computed(() => {
  const value = projection.value;
  if (!value) return [];
  return [
    { id: 'day', label: '~~Per day', amount: value.perDay },
    { id: 'week', label: '~~Per week', amount: value.perWeek },
    { id: 'month', label: '~~Per month (30 days)', amount: value.perMonth },
    { id: 'call', label: '~~Per call', amount: value.perCall },
  ].map((item) => ({
    ...item,
    value: formatMetricValue(item.amount, 'usd'),
  }));
});
</script>
