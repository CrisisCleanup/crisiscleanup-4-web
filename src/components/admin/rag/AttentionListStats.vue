<script setup lang="ts">
import moment from '@/utils/dates';
import type { AttentionCounts } from '@/hooks/useRAG';

const props = defineProps<{
  attentionCounts: AttentionCounts | undefined;
  staleness: 'fresh' | 'amber' | 'red' | 'never';
  lastSyncAt: Date | undefined;
  isSyncing: boolean;
}>();

defineEmits<{ (e: 'sync'): void }>();

const { t } = useI18n();

const stalenessLabel = computed(() => {
  switch (props.staleness) {
    case 'never': {
      return '~~Never synced';
    }
    case 'red': {
      return '~~Stale';
    }
    case 'amber': {
      return '~~Aging';
    }
    default: {
      return '~~Fresh';
    }
  }
});

const stalenessClass = computed(() => {
  switch (props.staleness) {
    case 'red': {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    case 'amber': {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    case 'never': {
      return 'bg-slate-100 text-slate-600 border-slate-200';
    }
    default: {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  }
});

const lastSyncLabel = computed(() =>
  props.lastSyncAt ? moment(props.lastSyncAt).fromNow() : '—',
);

interface SourceRow {
  key: string;
  label: string;
}

const sources = computed<SourceRow[]>(() => [
  { key: 'watchedChat', label: '~~Watched chat' },
  { key: 'watchedBlog', label: '~~Watched blog' },
  { key: 'publicBlog', label: '~~Public blog' },
  { key: 'magazine', label: '~~Magazines' },
]);

const sourceCount = (key: string) => {
  const v = props.attentionCounts?.[key];
  return typeof v === 'number' ? v : 0;
};

const total = computed(() => {
  const v = props.attentionCounts?.chunksTotal;
  return typeof v === 'number' ? v : 0;
});

const maxSource = computed(() =>
  Math.max(1, ...sources.value.map((s: SourceRow) => sourceCount(s.key))),
);
</script>

<template>
  <section
    class="ccu-attention-stats border border-slate-200 rounded-lg p-4 bg-white"
  >
    <header class="flex items-start justify-between gap-3 mb-4">
      <div class="flex items-baseline gap-3">
        <p class="text-2xl font-semibold tabular-nums text-slate-900">
          {{ total.toLocaleString() }}
        </p>
        <span class="text-xs text-slate-500">
          {{ $t('~~indexed chunks') }}
          ·
          {{ $t('~~last synced') }} {{ lastSyncLabel }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span
          class="px-2 py-0.5 rounded-full text-[11px] font-semibold border"
          :class="stalenessClass"
        >
          {{ $t(stalenessLabel) }}
        </span>
        <button
          v-tooltip="{
            content: t(
              '~~Trigger an immediate sync against the configured sources. The daily 04:00 UTC cron will pick up any further changes automatically.',
            ),
            triggers: ['hover', 'focus'],
            popperClass: 'interactive-tooltip w-auto',
          }"
          type="button"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50"
          :disabled="isSyncing"
          @click="$emit('sync')"
        >
          <ccu-icon type="refresh" size="xs" />
          {{ isSyncing ? $t('~~Syncing…') : $t('~~Sync now') }}
        </button>
      </div>
    </header>

    <div class="space-y-1.5">
      <div
        v-for="row in sources"
        :key="row.key"
        class="flex items-center gap-3"
      >
        <span class="w-32 text-xs text-slate-500">
          {{ $t(row.label) }}
        </span>
        <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-slate-400 rounded-full"
            :style="{
              width: `${(sourceCount(row.key) / maxSource) * 100}%`,
            }"
          />
        </div>
        <span class="w-12 text-right text-xs tabular-nums text-slate-600">
          {{ sourceCount(row.key).toLocaleString() }}
        </span>
      </div>
    </div>
  </section>
</template>
