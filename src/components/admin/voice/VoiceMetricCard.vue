<template>
  <component
    :is="selectable ? 'button' : 'div'"
    class="flex min-h-[40px] min-w-0 flex-col gap-1 rounded border bg-white text-left"
    :class="[
      large ? 'p-4' : 'p-3',
      selected
        ? 'border-crisiscleanup-dashboard-blue ring-1 ring-crisiscleanup-dashboard-blue'
        : 'border-crisiscleanup-grey-100',
      { 'hover:bg-crisiscleanup-smoke': selectable },
    ]"
    :type="selectable ? 'button' : undefined"
    :aria-pressed="selectable ? selected : undefined"
    :title="selectable ? t('~~Show in the trend chart') : undefined"
    :data-testid="`testVoiceCard-${metric.key}`"
    @click="selectable && emit('select')"
  >
    <span class="text-xs font-semibold text-crisiscleanup-grey-900">
      {{ metric.label }}
    </span>
    <span
      class="break-words font-semibold tabular-nums"
      :class="large ? 'text-3xl' : 'text-xl'"
      data-testid="testVoiceCardValue"
    >
      {{ formatMetricValue(metric.values[windowKey], metric.format) }}
    </span>
    <span
      v-if="delta"
      class="text-xs"
      :class="DELTA_CLASSES[delta.tone]"
      :data-tone="delta.tone"
      :title="t('~~Compared with the same time just before')"
      data-testid="testVoiceCardDelta"
    >
      {{ ARROWS[delta.direction] }}
      {{ delta.direction === 'flat' ? '' : delta.text }}
      <span class="text-crisiscleanup-dark-300">
        {{ t('~~vs the {window} before', { window: windowKey }) }}
      </span>
    </span>
    <span
      v-if="hint"
      class="text-xs text-crisiscleanup-dark-300"
      data-testid="testVoiceCardHint"
    >
      {{ t(hint) }}
    </span>
  </component>
</template>

<script setup lang="ts">
import {
  METRIC_HINTS,
  formatMetricValue,
  metricDelta,
  type Metric,
  type MetricWindow,
} from '@/hooks/voice/voiceMetrics';

const props = defineProps<{
  metric: Metric;
  windowKey: MetricWindow;
  large?: boolean;
  /** The card is a button that picks its trend series. */
  selectable?: boolean;
  selected?: boolean;
}>();
const emit = defineEmits<{ select: [] }>();
const { t } = useI18n();

const ARROWS = { up: '▲', down: '▼', flat: '–' };
const DELTA_CLASSES = {
  good: 'text-crisiscleanup-green-900',
  bad: 'text-crisiscleanup-red-700',
  neutral: 'text-crisiscleanup-dark-300',
};

const delta = computed(() =>
  metricDelta(
    props.metric,
    props.metric.values[props.windowKey],
    props.metric.previous?.[props.windowKey],
  ),
);
const hint = computed(() => METRIC_HINTS[props.metric.key]);
</script>
