<template>
  <section
    class="mb-3 flex flex-col gap-1"
    :aria-label="t('~~Last 24 hours')"
    data-testid="testVoiceHistoryStrip"
  >
    <div class="flex flex-wrap items-center justify-between gap-x-3">
      <h2
        class="text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
      >
        {{ t('~~Last 24 hours') }}
      </h2>
      <router-link
        :to="{ name: 'nav.voice_console', query: { view: 'metrics' } }"
        class="inline-flex min-h-[40px] items-center font-semibold underline"
        data-testid="testVoiceHistoryStripLink"
      >
        {{ t('~~All metrics') }} →
      </router-link>
    </div>
    <div v-if="cards.length > 0" class="grid grid-cols-3 gap-2">
      <VoiceMetricCard
        v-for="metric in cards"
        :key="metric.key"
        :metric="metric"
        :window-key="WINDOW"
        compact
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import axios from 'axios';
import VoiceMetricCard from '@/components/admin/voice/VoiceMetricCard.vue';
import {
  metricsUrl,
  type Metric,
  type MetricsResponse,
  type MetricWindow,
} from '@/hooks/voice/voiceMetrics';

const props = defineProps<{ includeTest: boolean }>();
const { t } = useI18n();

const WINDOW: MetricWindow = '24h';
const KEYS = ['calls', 'case_rate', 'open_issues'];

const metrics = ref<Metric[]>([]);
const cards = computed(() =>
  KEYS.flatMap((key) =>
    metrics.value.filter((metric: Metric) => metric.key === key),
  ),
);

// The strip is a glance: when it cannot load, the history still works.
async function load() {
  try {
    const { data } = await axios.get<MetricsResponse>(metricsUrl(), {
      params: { include_test: props.includeTest },
    });
    metrics.value = data.metrics;
  } catch {
    metrics.value = [];
  }
}

onMounted(load);
watch(() => props.includeTest, load);
defineExpose({ load });
</script>
