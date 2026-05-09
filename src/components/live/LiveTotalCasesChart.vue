<template>
  <div class="total-cases-chart" data-testid="testLiveTotalCasesChartDiv">
    <ApexChart
      v-if="series[0].data.length > 0"
      type="treemap"
      :options="options"
      :series="series"
      height="100%"
      width="100%"
    />
    <div v-else class="total-cases-chart__empty">
      {{ $t('~~No case data yet.') }}
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

interface CaseRow {
  name?: string;
  title?: string;
  count: number | string;
  statusKey?: string;
}

const ApexChart = defineAsyncComponent(async () => {
  const mod = await import('vue3-apexcharts');
  return mod.default as never;
});

/**
 * OKLCH-tuned status palette — kept in step with `src/utils/statusColors.ts`.
 * Apex chart fills don't accept CSS custom properties, so we resolve to hex
 * here and rely on the unit test to flag drift.
 */
const STATUS_FILL: Record<string, string> = {
  unclaimed: '#c8331a',
  overdue: '#c8331a',
  claimed: '#cf9b18',
  in_progress: '#cf9b18',
  partly_done: '#3b69a3',
  closed: '#1aa44e',
  unknown: '#5a5247',
  all: '#5a5247',
};

export default defineComponent({
  name: 'LiveTotalCasesChart',
  components: { ApexChart },
  props: {
    chartData: {
      type: Array as PropType<CaseRow[]>,
      default: () => [],
    },
  },
  setup(props) {
    const { t } = useI18n();

    /** Treemap data rows with non-zero counts only (Apex draws zero rects). */
    const tiles = computed(() =>
      (props.chartData || [])
        .filter((row) => Number(row.count) > 0)
        .map((row) => ({
          x: String(row.title || row.name || ''),
          y: Number(row.count) || 0,
          fillColor:
            STATUS_FILL[row.statusKey ?? 'unknown'] ?? STATUS_FILL.unknown,
        })),
    );

    const series = computed(() => [{ data: tiles.value }]);

    const options = computed(() => ({
      chart: {
        type: 'treemap' as const,
        toolbar: { show: false },
        animations: { speed: 320, easing: 'easeOut' as const },
        background: 'transparent',
        fontFamily: 'Public Sans, sans-serif',
      },
      legend: { show: false },
      dataLabels: {
        enabled: true,
        style: {
          fontFamily: 'Big Shoulders Display, sans-serif',
          fontSize: '14px',
          fontWeight: 800,
          colors: ['#FFF'],
        },
        // Two lines per tile: STATUS NAME (uppercase) + count.
        formatter: (text: string, op: { value: number }) =>
          [
            text.toUpperCase(),
            Number(op.value).toLocaleString('en-US'),
          ] as unknown as string,
        offsetY: -4,
      },
      plotOptions: {
        treemap: {
          distributed: true,
          enableShades: false,
          // Square corners — civic, not soft.
          borderRadiusApplication: 'around' as const,
        },
      },
      stroke: { width: 1, colors: ['rgba(0, 0, 0, 0.35)'] },
      tooltip: {
        theme: 'dark' as const,
        y: {
          formatter: (v: number) =>
            t('~~{n} cases', { n: v.toLocaleString('en-US') }),
        },
      },
      states: {
        hover: { filter: { type: 'lighten', value: 0.08 } },
        active: { filter: { type: 'darken', value: 0.05 } },
      },
    }));

    return { options, series };
  },
});
</script>

<style scoped lang="postcss">
.total-cases-chart {
  width: 100%;
  height: 100%;
  background-color: var(--cc-ink-0);
  padding: 4px;
}

.total-cases-chart__empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cc-type-3);
  font-style: italic;
  font-size: var(--ts-meta);
}
</style>
