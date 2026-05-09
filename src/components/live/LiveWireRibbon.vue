<template>
  <div class="wire-ribbon" data-testid="testWireRibbonDiv">
    <span class="wire-ribbon__live" aria-hidden="true">
      <span class="wire-ribbon__pulse">●</span>
      <span class="wire-ribbon__live-text">{{ $t('~~LIVE') }}</span>
    </span>
    <span class="wire-ribbon__sep" aria-hidden="true">·</span>
    <span class="wire-ribbon__time" data-testid="testWireRibbonTime">
      {{ dateline }}
    </span>
    <template v-for="item in segments" :key="item.title">
      <span class="wire-ribbon__sep" aria-hidden="true">·</span>
      <button
        type="button"
        class="wire-ribbon__seg"
        :class="{
          'wire-ribbon__seg--active': activeFilter === item.filter,
          'wire-ribbon__seg--dim': activeFilter && activeFilter !== item.filter,
        }"
        :data-status="item.statusKey"
        :data-testid="`testWireRibbon${item.title}Btn`"
        :disabled="!item.filter"
        @click="onSegmentClick(item)"
      >
        <span class="wire-ribbon__label">{{ item.title }}</span>
        <span class="wire-ribbon__value">{{ formatNumber(item.count) }}</span>
      </button>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';

interface Segment {
  title: string;
  count: number;
  statusKey?: string;
  filter?: string;
}

export default defineComponent({
  name: 'LiveWireRibbon',
  props: {
    segments: {
      type: Array as PropType<Segment[]>,
      default: () => [],
    },
  },
  emits: ['filter'],
  setup(_, { emit }) {
    const now = ref<Date>(new Date());
    const activeFilter = ref<string | null>(null);

    const tickId = window.setInterval(() => {
      now.value = new Date();
    }, 30_000);

    onBeforeUnmount(() => {
      clearInterval(tickId);
    });

    const dateline = computed(() => {
      const d = now.value;
      // Locale-aware short month (e.g. "may", "mai", "5月"), then a fixed
      // numeric stamp in UTC. The format is structural, not translatable
      // copy — wrapping it in t() interferes with placeholder interpolation
      // for no UX gain.
      const month = d.toLocaleString(undefined, {
        month: 'short',
        timeZone: 'UTC',
      });
      const day = d.getUTCDate();
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      return `${month.toUpperCase()} ${day} · ${hh}:${mm} UTC`;
    });

    const formatNumber = (v: number | string) => {
      const n = Number(v);
      if (Number.isNaN(n)) return String(v);
      return n.toLocaleString('en-US');
    };

    const onSegmentClick = (item: Segment) => {
      if (!item.filter) return;
      const next = activeFilter.value === item.filter ? null : item.filter;
      activeFilter.value = next;
      emit('filter', next);
    };

    return { activeFilter, dateline, formatNumber, onSegmentClick };
  },
});
</script>

<style scoped lang="postcss">
.wire-ribbon {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.5ch;
  row-gap: 4px;
  padding: 14px 20px;
  background-color: var(--cc-ink-0);
  border-top: 1px solid var(--cc-ink-3);
  border-bottom: 1px solid var(--cc-ink-3);
  font-family: var(--ff-body);
  font-size: var(--ts-ribbon);
  line-height: 1.2;
  color: var(--cc-type-2);
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: thin;
}

.wire-ribbon__live {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cc-type-1);
}

.wire-ribbon__pulse {
  color: var(--cc-signal);
  display: inline-block;
  font-size: 0.85em;
  animation: wire-pulse 1600ms cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.wire-ribbon__live-text {
  /* Tabular figures don't apply but ensure no width drift on the LIVE label */
  font-feature-settings: var(--num-features);
}

.wire-ribbon__sep {
  color: var(--cc-type-3);
  opacity: 0.5;
  padding: 0 0.5ch;
  user-select: none;
}

.wire-ribbon__time {
  font-family: var(--ff-mono);
  font-size: calc(var(--ts-ribbon) * 0.95);
  font-weight: 500;
  font-feature-settings: var(--num-features);
  letter-spacing: 0.04em;
  color: var(--cc-type-2);
  text-transform: uppercase;
}

.wire-ribbon__seg {
  display: inline-flex;
  align-items: baseline;
  gap: 0.6ch;
  padding: 0;
  background: none;
  border: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-decoration: none;
  text-underline-offset: 6px;
  text-decoration-thickness: 2px;
  transition:
    color 200ms ease,
    text-decoration-color 200ms ease,
    opacity 200ms ease;
}

.wire-ribbon__seg[disabled] {
  cursor: default;
}

.wire-ribbon__seg:hover:not([disabled]) {
  color: var(--cc-type-1);
}

.wire-ribbon__seg:focus-visible {
  outline: 2px solid var(--cc-signal);
  outline-offset: 4px;
}

.wire-ribbon__label {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cc-type-3);
  font-size: calc(var(--ts-ribbon) * 0.92);
}

.wire-ribbon__value {
  font-family: var(--ff-display);
  font-feature-settings: var(--num-features);
  font-weight: 800;
  color: var(--cc-type-1);
  letter-spacing: -0.005em;
  /* Status hue underlines the value, not the cell */
  text-decoration: underline;
  text-decoration-color: var(--cc-ink-3);
  text-underline-offset: 4px;
  text-decoration-thickness: 2px;
}

.wire-ribbon__seg[data-status='unclaimed'] .wire-ribbon__value,
.wire-ribbon__seg[data-status='overdue'] .wire-ribbon__value {
  text-decoration-color: var(--cc-stat-neg);
}

.wire-ribbon__seg[data-status='claimed'] .wire-ribbon__value,
.wire-ribbon__seg[data-status='in_progress'] .wire-ribbon__value {
  text-decoration-color: var(--cc-stat-mid);
}

.wire-ribbon__seg[data-status='partly_done'] .wire-ribbon__value {
  text-decoration-color: var(--cc-stat-neu);
}

.wire-ribbon__seg[data-status='closed'] .wire-ribbon__value {
  text-decoration-color: var(--cc-stat-pos);
}

.wire-ribbon__seg--active .wire-ribbon__label,
.wire-ribbon__seg--active .wire-ribbon__value {
  color: var(--cc-signal);
}

.wire-ribbon__seg--active .wire-ribbon__value {
  text-decoration-color: var(--cc-signal);
  text-decoration-thickness: 3px;
}

.wire-ribbon__seg--dim {
  opacity: 0.55;
}

@keyframes wire-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wire-ribbon__pulse {
    animation: none;
  }
}
</style>
