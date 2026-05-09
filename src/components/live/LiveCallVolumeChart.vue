<template>
  <div class="call-volume-chart" data-testid="testLiveCallVolumeChartDiv">
    <ApexChart
      v-if="totalCalls >= 0"
      type="radialBar"
      :options="options"
      :series="series"
      height="100%"
      width="100%"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  defineAsyncComponent,
  type PropType,
} from 'vue';
import { useI18n } from 'vue-i18n';

interface CallRow {
  hour?: number | string;
  calls?: number;
  callbacks?: number;
  total?: number;
  missed?: number;
  // Tolerate other shapes the API may return.
  [key: string]: unknown;
}

const ApexChart = defineAsyncComponent(async () => {
  const mod = await import('vue3-apexcharts');
  return mod.default as never;
});

export default defineComponent({
  name: 'LiveCallVolumeChart',
  components: { ApexChart },
  props: {
    chartData: {
      type: Array as PropType<CallRow[]>,
      default: () => [],
    },
  },
  setup(props) {
    const { t } = useI18n();

    /** Sum a numeric field across the rows safely. */
    const sumField = (field: string) =>
      props.chartData.reduce((acc, row) => acc + (Number(row[field]) || 0), 0);

    // The /reports_data/daily_calls endpoint returns one row per hour with
    // both `calls` (answered) and `callbacks` (missed) columns. Some legacy
    // payloads use `total` / `missed`. We support either.
    const answered = computed(
      () =>
        sumField('calls') ||
        Math.max(0, sumField('total') - sumField('missed')),
    );
    const missed = computed(() => sumField('callbacks') || sumField('missed'));
    const totalCalls = computed(() => answered.value + missed.value);

    const answeredPct = computed(() => {
      if (!totalCalls.value) return 0;
      return Math.round((answered.value / totalCalls.value) * 100);
    });

    const series = computed(() => [answeredPct.value]);

    const options = computed(() => ({
      chart: {
        type: 'radialBar',
        toolbar: { show: false },
        animations: { speed: 320, easing: 'easeOut' as const },
        background: 'transparent',
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: { margin: 0, size: '58%', background: 'transparent' },
          track: {
            background: 'rgba(255,255,255,0.06)',
            strokeWidth: '100%',
            margin: 4,
          },
          dataLabels: {
            name: {
              offsetY: 22,
              fontSize: '12px',
              fontFamily: 'Public Sans, sans-serif',
              fontWeight: 700,
              color: 'rgba(204, 196, 173, 0.66)',
            },
            value: {
              offsetY: -10,
              fontSize: '38px',
              fontFamily: 'Big Shoulders Display, sans-serif',
              fontWeight: 800,
              color: 'rgba(248, 246, 240, 0.97)',
              formatter: (v: number) => `${v}%`,
            },
          },
        },
      },
      fill: {
        colors: ['#fece09'],
        type: 'solid',
      },
      labels: [t('~~Answered').toUpperCase()],
      stroke: { lineCap: 'butt' as const },
      grid: { padding: { top: 4, bottom: 0 } },
    }));

    return {
      options,
      series,
      totalCalls,
      answered,
      missed,
      answeredPct,
    };
  },
});
</script>

<style scoped lang="postcss">
.call-volume-chart {
  width: 100%;
  height: 100%;
  background-color: var(--cc-ink-0);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
