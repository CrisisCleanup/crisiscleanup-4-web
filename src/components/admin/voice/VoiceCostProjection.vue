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
        {{ t('~~Based on the last 7 days, by hour of day') }}
      </p>
    </div>

    <p
      v-if="!forecast"
      class="text-crisiscleanup-dark-300"
      data-testid="testVoiceProjectionEmpty"
    >
      —
      <span class="text-xs">{{
        profile
          ? t('~~No calls in the last 7 days.')
          : t('~~The projection is not available now.')
      }}</span>
    </p>
    <template v-else>
      <dl class="grid grid-cols-2 gap-3 md:grid-cols-5">
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

      <div class="flex flex-col gap-1" data-testid="testVoiceProjectionHours">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-xs font-semibold text-crisiscleanup-grey-900">
            {{
              t('~~Typical {measure} by hour of day', {
                measure: t(chartBy === 'cost' ? '~~cost' : '~~calls'),
              })
            }}
          </h4>
          <div
            class="inline-flex overflow-hidden rounded border border-crisiscleanup-grey-100"
            role="group"
            :aria-label="t('~~Chart shows')"
          >
            <button
              v-for="option in CHART_OPTIONS"
              :key="option.key"
              type="button"
              class="min-h-[40px] px-3 text-xs font-semibold"
              :class="
                option.key === chartBy
                  ? 'bg-primary-light text-black'
                  : 'bg-white text-crisiscleanup-grey-900 hover:bg-crisiscleanup-smoke'
              "
              :aria-pressed="option.key === chartBy"
              :data-testid="`testVoiceProjectionChart-${option.key}`"
              @click="chartBy = option.key"
            >
              {{ t(option.label) }}
            </button>
          </div>
        </div>
        <div
          class="flex h-24 min-w-0 items-end gap-px border-b border-crisiscleanup-grey-100"
          role="img"
          :aria-label="
            t('~~Typical {measure} by hour of day', {
              measure: t(chartBy === 'cost' ? '~~cost' : '~~calls'),
            })
          "
        >
          <span
            v-for="bar in bars"
            :key="bar.hour"
            class="flex h-full min-w-px flex-1 items-end"
            :class="{ 'bg-primary-light/50': bar.current }"
          >
            <span
              class="w-full rounded-t-sm"
              :class="
                bar.current
                  ? 'bg-primary-dark'
                  : 'bg-crisiscleanup-dashboard-blue'
              "
              :style="{ height: `${bar.height}%` }"
              :title="`${bar.label}: ${bar.text}`"
              data-testid="testVoiceProjectionBar"
              :data-hour="bar.hour"
              :data-current="bar.current"
            />
          </span>
        </div>
        <div class="flex text-[10px] text-crisiscleanup-dark-300">
          <span v-for="bar in bars" :key="bar.hour" class="min-w-px flex-1">
            <span v-if="bar.hour % 6 === 0" class="whitespace-nowrap">
              {{ bar.label }}
            </span>
          </span>
        </div>
        <p class="text-xs text-crisiscleanup-dark-300">
          {{
            t(
              '~~Times in your time zone ({zone}). The highlighted hour is now.',
              {
                zone,
              },
            )
          }}
        </p>
      </div>

      <label class="flex flex-col gap-1 text-xs">
        <span class="font-semibold text-crisiscleanup-grey-900">
          {{ t('~~Expected calls per day') }}
        </span>
        <input
          v-model="expectedText"
          type="text"
          inputmode="decimal"
          class="min-h-[40px] w-full max-w-[12rem] rounded border p-1.5 text-sm"
          :placeholder="String(Math.round(forecast.callsPerDay))"
          data-testid="testVoiceExpectedCalls"
        />
        <span class="text-crisiscleanup-dark-300">
          {{
            t(
              '~~Leave empty to use the typical calls per day of the last 7 days. The hours of the day keep their shape.',
            )
          }}
        </span>
      </label>
    </template>

    <p class="text-xs text-crisiscleanup-dark-300">
      {{ t('~~Model cost only (voice + Luna). Excludes phone and LiveKit.') }}
    </p>
  </section>
</template>

<script setup lang="ts">
import {
  browserTimeZone,
  forecastCost,
  formatMetricValue,
  hourLabel,
  parseExpectedCalls,
  type CostProfile,
  type HourAverage,
} from '@/hooks/voice/voiceMetrics';

const props = defineProps<{
  profile?: CostProfile;
}>();
const { t } = useI18n();

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

const zone = browserTimeZone();
const forecast = computed(() =>
  props.profile
    ? forecastCost(props.profile, {
        zone,
        expectedCallsPerDay: parseExpectedCalls(expectedText.value),
      })
    : undefined,
);

const items = computed(() => {
  const value = forecast.value;
  if (!value) return [];
  return [
    { id: 'today', label: '~~Today (projected)', amount: value.today },
    { id: 'day', label: '~~Typical day', amount: value.perDay },
    { id: 'week', label: '~~Week', amount: value.perWeek },
    { id: 'month', label: '~~30 days', amount: value.perMonth },
    { id: 'call', label: '~~Cost per call', amount: value.perCall },
  ].map((item) => ({
    ...item,
    value: formatMetricValue(item.amount, 'usd'),
  }));
});

const CHART_OPTIONS = [
  { key: 'cost', label: '~~Cost' },
  { key: 'calls', label: '~~Calls' },
] as const;
const chartBy = ref<(typeof CHART_OPTIONS)[number]['key']>('cost');

const bars = computed(() => {
  const value = forecast.value;
  if (!value) return [];
  const amounts = value.hourly.map(
    (hour: HourAverage) => hour[chartBy.value as keyof HourAverage],
  );
  const peak = Math.max(0, ...amounts);
  return amounts.map((amount: number, hour: number) => ({
    hour,
    label: hourLabel(hour),
    text:
      chartBy.value === 'cost'
        ? formatMetricValue(amount, 'usd')
        : (Math.round(amount * 10) / 10).toLocaleString(),
    current: hour === value.currentHour,
    // An hour with some activity always shows a sliver.
    height: peak ? Math.max(amount > 0 ? 3 : 0, (amount / peak) * 100) : 0,
  }));
});
</script>
