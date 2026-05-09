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
    <span class="wire-ribbon__sep" aria-hidden="true">·</span>
    <div
      ref="trackEl"
      class="wire-ribbon__track"
      :class="{ 'wire-ribbon__track--has-overflow': hasOverflow }"
    >
      <template v-for="(item, idx) in segments" :key="item.title">
        <span v-if="idx > 0" class="wire-ribbon__sep" aria-hidden="true"
          >·</span
        >
        <button
          type="button"
          class="wire-ribbon__seg"
          :class="{
            'wire-ribbon__seg--active': activeFilter === item.filter,
            'wire-ribbon__seg--dim':
              activeFilter && activeFilter !== item.filter,
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
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  onBeforeUnmount,
  onMounted,
  nextTick,
  watch,
} from 'vue';
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
  setup(props, { emit }) {
    const now = ref<Date>(new Date());
    const activeFilter = ref<string | null>(null);
    const trackEl = ref<HTMLElement | null>(null);
    const hasOverflow = ref(false);

    const tickId = window.setInterval(() => {
      now.value = new Date();
    }, 30_000);

    // Edge-fade gating: only show the right-side fade when content actually
    // overflows the visible width. Without this, narrow viewports get a
    // permanent gradient stripe that looks like a UI bug.
    const measureOverflow = () => {
      const el = trackEl.value;
      if (!el) return;
      hasOverflow.value = el.scrollWidth - el.clientWidth > 4;
    };

    let resizeObs: ResizeObserver | null = null;
    onMounted(() => {
      measureOverflow();
      if (trackEl.value && typeof ResizeObserver !== 'undefined') {
        resizeObs = new ResizeObserver(measureOverflow);
        resizeObs.observe(trackEl.value);
      }
    });

    watch(
      () => props.segments,
      () => {
        nextTick(measureOverflow).catch(() => {});
      },
      { deep: true },
    );

    onBeforeUnmount(() => {
      clearInterval(tickId);
      resizeObs?.disconnect();
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

    return {
      activeFilter,
      dateline,
      formatNumber,
      onSegmentClick,
      trackEl,
      hasOverflow,
    };
  },
});
</script>

<style scoped lang="postcss">
.wire-ribbon {
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  column-gap: 0.5ch;
  padding: 14px 20px;
  background-color: var(--cc-ink-0);
  border-top: 1px solid var(--cc-ink-3);
  border-bottom: 1px solid var(--cc-ink-3);
  font-family: var(--ff-body);
  font-size: var(--ts-ribbon);
  line-height: 1.2;
  color: var(--cc-type-2);
  white-space: nowrap;
  overflow: hidden;
  min-width: 0;
}

/*
 * Track holds the segment buttons; the LIVE/dateline anchor stays fixed
 * to the left and the segments scroll. On wide displays the segments fit
 * inline (no scroll). On narrower screens it becomes a swipeable wire
 * ticker — broadcast aesthetic, never breaks to a second line.
 */
.wire-ribbon__track {
  display: flex;
  flex: 1 1 auto;
  align-items: baseline;
  column-gap: 0.5ch;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  /*
   * The right edge fades into the page when the track has off-screen
   * content. Mask is gated behind .--has-overflow so a fully-fitting
   * ribbon doesn't carry a phantom gradient stripe.
   */
  mask-image: none;
}

.wire-ribbon__track::-webkit-scrollbar {
  display: none;
}

.wire-ribbon__track--has-overflow {
  mask-image: linear-gradient(
    to right,
    black 0,
    black calc(100% - 48px),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    black 0,
    black calc(100% - 48px),
    transparent 100%
  );
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
  --seg-status: var(--cc-ink-3);
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
  text-decoration-thickness: 3px;
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
  display: inline-flex;
  align-items: center;
  gap: 0.55ch;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cc-type-3);
  font-size: calc(var(--ts-ribbon) * 0.92);
}

/*
 * Leading color chip — a small filled rectangle in the segment's status
 * hue. Reads at room distance where a 3px underline disappears. The
 * chip is the primary color signal; the underline is the reinforcement.
 */
.wire-ribbon__label::before {
  content: '';
  display: inline-block;
  width: 0.55em;
  height: 0.55em;
  background-color: var(--seg-status);
  border-radius: 1px;
  flex-shrink: 0;
  transform: translateY(0.02em);
}

.wire-ribbon__seg[data-status='all'] .wire-ribbon__label::before,
.wire-ribbon__seg[data-status='unknown'] .wire-ribbon__label::before {
  /* Aggregate cells get a hollow chip — the colored chips belong to status hues. */
  background-color: transparent;
  box-shadow: inset 0 0 0 1.5px var(--cc-type-3);
}

.wire-ribbon__value {
  font-family: var(--ff-display);
  font-feature-settings: var(--num-features);
  font-weight: 800;
  color: var(--cc-type-1);
  letter-spacing: -0.005em;
  text-decoration: underline;
  text-decoration-color: var(--seg-status);
  text-underline-offset: 4px;
  text-decoration-thickness: 3px;
}

.wire-ribbon__seg[data-status='unclaimed'],
.wire-ribbon__seg[data-status='overdue'] {
  --seg-status: var(--cc-stat-neg);
}

.wire-ribbon__seg[data-status='claimed'],
.wire-ribbon__seg[data-status='in_progress'] {
  --seg-status: var(--cc-stat-mid);
}

.wire-ribbon__seg[data-status='partly_done'] {
  --seg-status: var(--cc-stat-neu);
}

.wire-ribbon__seg[data-status='closed'] {
  --seg-status: var(--cc-stat-pos);
}

.wire-ribbon__seg--active {
  --seg-status: var(--cc-signal);
}

.wire-ribbon__seg--active .wire-ribbon__label,
.wire-ribbon__seg--active .wire-ribbon__value {
  color: var(--cc-signal);
}

.wire-ribbon__seg--active .wire-ribbon__value {
  text-decoration-thickness: 4px;
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

@media (max-width: 640px) {
  .wire-ribbon {
    padding: 10px 14px;
    column-gap: 0.4ch;
    font-size: calc(var(--ts-ribbon) * 0.92);
  }

  .wire-ribbon__live {
    letter-spacing: 0.08em;
  }

  .wire-ribbon__time {
    font-size: calc(var(--ts-ribbon) * 0.82);
    letter-spacing: 0.02em;
  }

  .wire-ribbon__label {
    letter-spacing: 0.06em;
  }
}
</style>
