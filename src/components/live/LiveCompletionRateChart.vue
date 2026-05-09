<template>
  <div
    class="completion-rate-chart"
    data-testid="testLiveCompletionRateChartDiv"
  >
    <ApexChart
      v-if="series[0].data.length > 0"
      type="bar"
      :options="options"
      :series="series"
      height="100%"
      width="100%"
    />
    <div v-else class="completion-rate-chart__empty">
      {{ $t('~~No completion data yet.') }}
    </div>
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

interface BarRow {
  group: string;
  newCases?: number;
  closedCases?: number;
}

const ApexChart = defineAsyncComponent(async () => {
  const mod = await import('vue3-apexcharts');
  return mod.default as never;
});

export default defineComponent({
  name: 'LiveCompletionRateChart',
  components: { ApexChart },
  props: {
    chartData: {
      type: Array as PropType<BarRow[]>,
      default: () => [],
    },
  },
  setup(props) {
    const { t } = useI18n();

    const dataPoints = computed(() =>
      props.chartData.map((row) => {
        const ts = Date.parse(row.group);
        return {
          x: Number.isNaN(ts) ? row.group : ts,
          newCases: Number(row.newCases) || 0,
          closedCases: Number(row.closedCases) || 0,
        };
      }),
    );

    const series = computed(() => [
      {
        name: t('~~Closed'),
        data: dataPoints.value.map((d) => ({ x: d.x, y: d.closedCases })),
      },
      {
        name: t('~~New'),
        data: dataPoints.value.map((d) => ({ x: d.x, y: d.newCases })),
      },
    ]);

    const options = computed(() => ({
      chart: {
        type: 'bar',
        stacked: true,
        toolbar: { show: false },
        animations: {
          speed: 320,
          easing: 'easeOut' as const,
          dynamicAnimation: { speed: 240 },
        },
        background: 'transparent',
        fontFamily: 'Public Sans, sans-serif',
      },
      plotOptions: {
        bar: { columnWidth: '52%', borderRadius: 0 },
      },
      dataLabels: { enabled: false },
      // Closed = positive green; new = subdued ink so closed reads as "good".
      colors: ['#1aa44e', '#7a7066'],
      legend: {
        position: 'top' as const,
        horizontalAlign: 'left' as const,
        labels: { colors: '#bdb6a8' },
        fontSize: '12px',
        fontFamily: 'Public Sans, sans-serif',
        markers: { width: 10, height: 10, radius: 0 },
        itemMargin: { horizontal: 12 },
      },
      xaxis: {
        type: 'datetime' as const,
        labels: {
          style: {
            colors: '#bdb6a8',
            fontSize: '11px',
            fontFamily: 'Public Sans, sans-serif',
          },
          datetimeFormatter: { day: 'MMM d', month: 'MMM' },
        },
        axisBorder: { color: 'rgba(255,255,255,0.14)' },
        axisTicks: { color: 'rgba(255,255,255,0.14)' },
        crosshairs: { stroke: { color: 'rgba(254, 206, 9, 0.4)' } },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#bdb6a8',
            fontSize: '11px',
            fontFamily: 'Public Sans, sans-serif',
          },
        },
      },
      grid: {
        borderColor: 'rgba(255,255,255,0.08)',
        strokeDashArray: 0,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      tooltip: {
        theme: 'dark' as const,
        y: { formatter: (v: number) => v.toLocaleString() },
        x: { format: 'MMM d' },
      },
    }));

    return { options, series };
  },
});
</script>

<style scoped lang="postcss">
.completion-rate-chart {
  width: 100%;
  height: 100%;
  background-color: var(--cc-ink-0);
  padding: 4px;
}
.completion-rate-chart__empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cc-type-3);
  font-style: italic;
  font-size: var(--ts-meta);
}
</style>
