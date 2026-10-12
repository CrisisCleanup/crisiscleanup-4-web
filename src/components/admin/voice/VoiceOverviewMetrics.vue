<template>
  <div class="flex flex-col gap-4 text-sm" data-testid="testVoiceOverview">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div
        class="inline-flex overflow-hidden rounded border border-crisiscleanup-grey-100"
        role="group"
        :aria-label="t('~~Time window')"
      >
        <button
          v-for="key in windows"
          :key="key"
          type="button"
          class="min-h-[40px] min-w-[48px] px-3 text-sm font-semibold"
          :class="
            key === windowKey
              ? 'bg-primary-light text-black'
              : 'bg-white text-crisiscleanup-grey-900 hover:bg-crisiscleanup-smoke'
          "
          :aria-pressed="key === windowKey"
          :title="t(WINDOW_LABELS[key])"
          :data-testid="`testVoiceWindow-${key}`"
          @click="changeWindow(key)"
        >
          {{ key }}
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <label class="flex min-h-[40px] items-center gap-2">
          <input
            v-model="includeTest"
            type="checkbox"
            data-testid="testVoiceOverviewIncludeTest"
          />
          {{ t('~~Include test calls') }}
        </label>
        <span
          class="text-xs text-crisiscleanup-dark-300"
          data-testid="testVoiceOverviewUpdated"
        >
          <template v-if="updatedAgo">
            {{ t('~~Updated {when}', { when: updatedAgo }) }}
          </template>
        </span>
        <BaseButton
          variant="outline"
          size="small"
          class="max-md:!min-h-[40px]"
          data-testid="testVoiceOverviewRefresh"
          :action="load"
          :disabled="loading"
          :text="t('actions.refresh', 'Refresh')"
          :alt="t('actions.refresh', 'Refresh')"
        />
      </div>
    </div>

    <p
      v-if="error"
      class="rounded bg-crisiscleanup-red-100/20 p-2 text-crisiscleanup-red-800"
      data-testid="testVoiceOverviewError"
    >
      {{ error }}
    </p>

    <Spinner v-if="!overview && loading" />

    <template v-if="overview">
      <section
        class="grid grid-cols-2 gap-3 max-md:[&>:last-child:nth-child(odd)]:col-span-2 md:grid-cols-4 md:[&>:last-child:nth-child(4n+3)]:col-span-2"
        :aria-label="t('~~Headline metrics')"
        data-testid="testVoiceHeadlines"
      >
        <VoiceMetricCard
          v-for="metric in headlines"
          :key="metric.key"
          :metric="metric"
          :window-key="windowKey"
          :selected="isSelected(metric)"
          :selectable="isSeries(metric)"
          large
          @select="selectSeries(metric)"
        />
      </section>

      <section
        v-for="group in groups"
        :key="group.title"
        :data-testid="`testVoiceGroup-${group.title}`"
      >
        <h2
          class="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ t(group.title) }}
        </h2>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          <VoiceMetricCard
            v-for="metric in group.metrics"
            :key="metric.key"
            :metric="metric"
            :window-key="windowKey"
            :selected="isSelected(metric)"
            :selectable="isSeries(metric)"
            @select="selectSeries(metric)"
          />
        </div>
        <VoiceCostProjection
          v-if="group.title === COST_GROUP"
          :metrics="metrics"
          :window-key="windowKey"
        />
      </section>
      <p class="text-xs text-crisiscleanup-dark-300">
        {{
          t(
            '~~Arrows compare the time frame with the same length of time just before it. Green is better, red is worse.',
          )
        }}
      </p>
    </template>

    <section v-if="overview" ref="trendEl" data-testid="testVoiceTrend">
      <div class="mb-2 flex flex-wrap items-end justify-between gap-2">
        <h2 class="text-lg font-semibold">
          {{
            t('~~Trend, last {window}', { window: t(WINDOW_LABELS[windowKey]) })
          }}
        </h2>
        <label
          class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ t('~~Show') }}
          <select
            v-model="series"
            class="mt-1 min-h-[40px] rounded border p-1.5 text-sm normal-case text-black"
            data-testid="testVoiceTrendSeries"
          >
            <option
              v-for="(label, key) in SERIES_LABELS"
              :key="key"
              :value="key"
            >
              {{ t(label) }}
            </option>
          </select>
        </label>
      </div>
      <p
        v-if="trend.length === 0"
        class="text-crisiscleanup-dark-300"
        data-testid="testVoiceTrendEmpty"
      >
        {{ t('~~No calls in this time.') }}
      </p>
      <template v-else>
        <div class="flex gap-2">
          <span
            class="w-8 shrink-0 text-right text-xs tabular-nums text-crisiscleanup-dark-300"
            >{{ peak }}</span
          >
          <div
            class="flex h-32 min-w-0 flex-1 items-end gap-0.5 border-b border-crisiscleanup-grey-100"
            role="img"
            :aria-label="t(SERIES_LABELS[series])"
          >
            <span
              v-for="bar in bars"
              :key="bar.start"
              class="min-w-[2px] flex-1 rounded-t-sm bg-crisiscleanup-dashboard-blue"
              :style="{ height: `${bar.height}%` }"
              :title="`${bar.label}: ${bar.value}`"
              data-testid="testVoiceTrendBar"
              :data-value="bar.value"
            />
          </div>
        </div>
        <div
          class="ml-10 mt-1 flex justify-between text-xs text-crisiscleanup-dark-300"
        >
          <span>{{ bars[0]?.label }}</span>
          <span>{{ bars.at(-1)?.label }}</span>
        </div>
      </template>
    </section>
    <section v-if="overview" data-testid="testVoiceCompare">
      <button
        type="button"
        class="min-h-[40px] rounded px-1 font-semibold text-primary-dark underline"
        :aria-expanded="showCompare"
        data-testid="testVoiceCompareToggle"
        @click="showCompare = !showCompare"
      >
        {{ t('~~Compare all time frames') }}
        {{ showCompare ? '▴' : '▾' }}
      </button>
      <div v-if="showCompare" class="mt-2 flex flex-col gap-2">
        <div
          v-if="overview"
          class="max-w-full overflow-x-auto rounded border border-crisiscleanup-grey-100"
          data-testid="testVoiceOverviewScroll"
        >
          <table class="w-full min-w-[620px] border-collapse">
            <thead>
              <tr
                class="text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
              >
                <th
                  scope="col"
                  class="sticky left-0 z-10 bg-crisiscleanup-smoke px-3 py-2"
                >
                  {{ t('~~Metric') }}
                </th>
                <th
                  v-for="key in windows"
                  :key="key"
                  scope="col"
                  class="px-3 py-2 text-right"
                  :class="
                    key === windowKey
                      ? 'bg-primary-light/60'
                      : 'bg-crisiscleanup-smoke'
                  "
                >
                  {{ key }}
                </th>
              </tr>
            </thead>
            <tbody v-for="group in tableGroups" :key="group.title">
              <tr>
                <th
                  scope="colgroup"
                  :colspan="windows.length + 1"
                  class="px-3 pb-1 pt-3 text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
                >
                  <span class="sticky left-3">{{ t(group.title) }}</span>
                </th>
              </tr>
              <tr
                v-for="metric in group.metrics"
                :key="metric.key"
                class="border-t border-crisiscleanup-grey-100"
                :data-testid="`testVoiceMetricRow-${metric.key}`"
              >
                <th
                  scope="row"
                  class="sticky left-0 z-10 max-w-[9rem] bg-white px-3 py-2 text-left font-normal shadow-[1px_0_0_0_theme(colors.crisiscleanup-grey.100)] md:max-w-none md:whitespace-nowrap"
                >
                  {{ metric.label }}
                </th>
                <td
                  v-for="key in windows"
                  :key="key"
                  class="whitespace-nowrap px-3 py-2 text-right tabular-nums"
                  :class="{ 'bg-primary-light/30': key === windowKey }"
                  :data-testid="`testVoiceMetricCell-${metric.key}-${key}`"
                >
                  <span
                    class="font-semibold"
                    data-testid="testVoiceMetricValue"
                  >
                    {{ formatMetricValue(metric.values[key], metric.format) }}
                  </span>
                  <span
                    v-if="deltaFor(metric, key)"
                    class="ml-1 whitespace-nowrap text-xs"
                    :class="DELTA_CLASSES[deltaFor(metric, key)!.tone]"
                    :data-tone="deltaFor(metric, key)!.tone"
                    :title="t('~~Compared with the same time just before')"
                    data-testid="testVoiceMetricDelta"
                  >
                    {{ ARROWS[deltaFor(metric, key)!.direction] }}
                    {{
                      deltaFor(metric, key)!.direction === 'flat'
                        ? ''
                        : deltaFor(metric, key)!.text
                    }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="overview" class="text-xs text-crisiscleanup-dark-300">
          {{
            t(
              '~~Arrows compare each window with the same length of time just before it. Green is better, red is worse.',
            )
          }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import VoiceCostProjection from '@/components/admin/voice/VoiceCostProjection.vue';
import VoiceMetricCard from '@/components/admin/voice/VoiceMetricCard.vue';
import {
  COST_GROUP,
  HEADLINE_KEYS,
  TREND_SERIES,
  WINDOW_LABELS,
  bucketLabel,
  formatMetricValue,
  groupMetrics,
  metricDelta,
  useVoiceOverview,
  withCostPerCall,
  type Metric,
  type MetricWindow,
  type TrendBucket,
  type TrendSeries,
} from '@/hooks/voice/voiceMetrics';

const { t } = useI18n();
const {
  includeTest,
  window: windowKey,
  overview,
  trend,
  loading,
  error,
  updatedAgo,
  load,
  changeWindow,
} = useVoiceOverview();

const SERIES_LABELS: Record<TrendSeries, string> = {
  calls: '~~Calls',
  cases_created: '~~Cases created',
  callback_offers: '~~Callback offers',
  errors: '~~Errors',
  open_issues: '~~Open issues',
};
const series = ref<TrendSeries>('calls');
const showCompare = ref(false);
const trendEl = ref<HTMLElement>();

const ARROWS = { up: '▲', down: '▼', flat: '–' };
const DELTA_CLASSES = {
  good: 'text-crisiscleanup-green-900',
  bad: 'text-crisiscleanup-red-700',
  neutral: 'text-crisiscleanup-dark-300',
};

const windows = computed<MetricWindow[]>(
  () => overview.value?.windows ?? ['1h', '3h', '24h', '7d', '30d'],
);
const metrics = computed(() => withCostPerCall(overview.value?.metrics ?? []));
// The headline metrics have large cards; the groups hold the rest.
const headlines = computed(() =>
  HEADLINE_KEYS.flatMap((key) =>
    metrics.value.filter((metric: Metric) => metric.key === key),
  ),
);
const tableGroups = computed(() => groupMetrics(metrics.value));
const groups = computed(() =>
  groupMetrics(
    metrics.value.filter(
      (metric: Metric) => !HEADLINE_KEYS.includes(metric.key),
    ),
  ),
);

function isSeries(metric: Metric) {
  return TREND_SERIES.includes(metric.key as TrendSeries);
}
function isSelected(metric: Metric) {
  return isSeries(metric) && metric.key === series.value;
}
function selectSeries(metric: Metric) {
  series.value = metric.key as TrendSeries;
  trendEl.value?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
}

function deltaFor(metric: Metric, key: MetricWindow) {
  return metricDelta(metric, metric.values[key], metric.previous?.[key]);
}

function valueOf(bucket: TrendBucket): number {
  return bucket[series.value as TrendSeries];
}

const peak = computed(() =>
  Math.max(0, ...trend.value.map((bucket: TrendBucket) => valueOf(bucket))),
);
const bars = computed(() =>
  trend.value.map((bucket: TrendBucket) => ({
    start: bucket.start,
    value: valueOf(bucket),
    label: bucketLabel(bucket.start, windowKey.value),
    // A bucket with some calls always shows a sliver.
    height: peak.value
      ? Math.max(
          valueOf(bucket) > 0 ? 3 : 0,
          (valueOf(bucket) / peak.value) * 100,
        )
      : 0,
  })),
);
</script>
