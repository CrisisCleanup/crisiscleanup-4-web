<template>
  <div class="kpi-strip" data-testid="testKpiStripDiv">
    <!-- Cell 1: primary engagement (4 cols, with horizontal bar — replaces gauge) -->
    <div class="kpi-strip__cell kpi-strip__cell--primary">
      <div class="kpi-strip__eyebrow">{{ engagementLabel }}</div>
      <div class="kpi-strip__primary-row">
        <span
          ref="primaryEl"
          class="kpi-strip__value kpi-strip__value--primary"
        >
          {{ formatPercent(engagement) }}
        </span>
        <span class="kpi-strip__primary-suffix">%</span>
      </div>
      <div
        class="kpi-strip__bar"
        :class="{ 'kpi-strip__bar--full': engagement >= 100 }"
        role="progressbar"
        :aria-valuenow="Math.round(engagement)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="kpi-strip__bar-fill"
          :style="{
            transform: `scaleX(${Math.max(0, Math.min(100, engagement)) / 100})`,
          }"
        ></div>
      </div>
      <div class="kpi-strip__delta">{{ engagementSubtitle }}</div>
    </div>

    <!-- Cells 2-5: supporting site stats. Animation reserved for the most -->
    <!-- recently-changing cell (rate > 0). All others snap. -->
    <div
      v-for="(stat, index) in supportingStats"
      :key="stat.id ?? index"
      class="kpi-strip__cell"
      :class="{
        'kpi-strip__cell--ticking': isTicking(stat),
      }"
      :data-testid="`testKpiCell${index}Div`"
    >
      <div class="kpi-strip__eyebrow">{{ statLabel(stat) }}</div>
      <div class="kpi-strip__value">
        <span class="kpi-strip__currency">{{
          stat.currency_symbol || ''
        }}</span>
        <span :ref="(el) => setCellRef(index, el)">{{
          formatStatValue(stat.value)
        }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  onMounted,
  watch,
  type PropType,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import type { SiteStatistic } from '@/hooks/live/types';

interface SiteStatRow extends SiteStatistic {
  id?: number | string;
  name_t?: string;
  description_t?: string;
}

export default defineComponent({
  name: 'LiveKpiStrip',
  props: {
    engagement: {
      type: Number,
      default: 0,
    },
    siteStats: {
      type: Array as PropType<SiteStatRow[]>,
      default: () => [],
    },
    /** i18n key for the primary cell eyebrow. */
    engagementLabelKey: {
      type: String,
      default: 'reports.pp_engagement_title',
    },
    engagementSubtitleKey: {
      type: String,
      default: 'reports.pp_engagement_description',
    },
  },
  setup(props) {
    const { t, te } = useI18n();

    const primaryEl = ref<HTMLElement | null>(null);
    const cellRefs = ref<Array<HTMLElement | null>>([]);

    const setCellRef = (index: number, el: unknown) => {
      cellRefs.value[index] = (el as HTMLElement) ?? null;
    };

    // Top 4 stats only — the rest live in a future "More stats" disclosure.
    const supportingStats = computed(() => props.siteStats.slice(0, 4));

    // Defaults are existing dotted keys that live in the locale bundle;
    // vue-i18n returns the bundled translation (e.g. "Community Engagement")
    // and falls back to a readable string only when the key is missing.
    const engagementLabel = computed(() => {
      const key = props.engagementLabelKey;
      const translated = t(key);
      return translated === key
        ? t('~~Engagement velocity · 3-day')
        : translated;
    });

    const engagementSubtitle = computed(() => {
      const key = props.engagementSubtitleKey;
      const translated = t(key);
      // Description tooltips are long; show the friendlier short fallback if
      // the bundle's value is the dotted key (missing) or > 80 chars.
      if (translated === key || translated.length > 80) {
        return t('~~3-day velocity vs. baseline');
      }
      return translated;
    });

    const formatPercent = (v: number) => {
      const n = Number(v);
      if (Number.isNaN(n)) return '0';
      return Math.round(n).toString();
    };

    const formatStatValue = (v: number | string) => {
      const n = Number(v);
      if (Number.isNaN(n)) return String(v);
      return Math.round(n).toLocaleString('en-US');
    };

    const statLabel = (stat: SiteStatRow) => {
      if (stat.name_t && te(stat.name_t)) return t(stat.name_t);
      if (!stat.name_t) return '';
      // Translation missing in this locale bundle — derive a humanized label
      // from the key so the strip never shows `REPORTS.PP_SITE_STATS_FOO`.
      const last = stat.name_t.split('.').pop() ?? stat.name_t;
      return last
        .replace(/^pp_site_stats_/, '')
        .replace(/_recipients?$/, ' served')
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    };

    /** A cell ticks if the API reports a positive change_per_second. */
    const isTicking = (stat: SiteStatRow) => {
      return Number(stat.change_per_second) > 0;
    };

    // Animate the primary cell number via rAF (no Vue reactivity per tick).
    onMounted(() => {
      useAnimatedNumber(primaryEl, () => Number(props.engagement) || 0, {
        format: formatPercent,
        duration: 600,
      });
    });

    // Animate each supporting cell *only* when its rate is positive AND its
    // value has changed. We attach the rAF watcher lazily because cell refs
    // are bound after the first render.
    watch(
      () => supportingStats.value.map((s) => s.value),
      () => {
        for (const [idx, stat] of supportingStats.value.entries()) {
          const el = cellRefs.value[idx];
          if (!el) continue;
          el.textContent = formatStatValue(stat.value);
        }
      },
      { flush: 'post' },
    );

    return {
      primaryEl,
      setCellRef,
      supportingStats,
      engagementLabel,
      engagementSubtitle,
      formatPercent,
      formatStatValue,
      statLabel,
      isTicking,
    };
  },
});
</script>

<style scoped lang="postcss">
.kpi-strip {
  display: grid;
  grid-template-columns: 4fr 2fr 2fr 2fr 2fr;
  align-items: stretch;
  background-color: var(--cc-ink-0);
  border-bottom: 1px solid var(--cc-ink-3);
  font-family: var(--ff-body);
}

.kpi-strip__cell {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 14px 20px;
  min-height: 100px;
  border-left: 1px solid var(--cc-ink-3);
}

.kpi-strip__cell:first-child {
  border-left: 0;
}

.kpi-strip__cell--primary {
  padding-top: 18px;
  gap: 4px;
}

.kpi-strip__eyebrow {
  font-family: var(--ff-body);
  font-size: var(--ts-kpi-lbl);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--cc-type-3);
}

.kpi-strip__primary-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.kpi-strip__value {
  font-family: var(--ff-display);
  font-feature-settings: var(--num-features);
  font-weight: 800;
  font-size: var(--ts-kpi-val);
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--cc-type-1);
}

.kpi-strip__value--primary {
  font-size: var(--ts-kpi-prim);
}

.kpi-strip__primary-suffix {
  font-family: var(--ff-display);
  font-weight: 800;
  font-size: calc(var(--ts-kpi-prim) * 0.55);
  color: var(--cc-type-3);
  line-height: 1;
}

.kpi-strip__currency {
  font-family: var(--ff-display);
  font-weight: 800;
  color: var(--cc-type-3);
  margin-right: 0.1ch;
}

.kpi-strip__bar {
  position: relative;
  height: 4px;
  width: 100%;
  background-color: var(--cc-ink-3);
  overflow: hidden;
  margin-top: 4px;
}

.kpi-strip__bar-fill {
  position: absolute;
  inset: 0;
  background-color: var(--cc-signal);
  transform-origin: left center;
  transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
}

.kpi-strip__delta {
  font-size: var(--ts-meta);
  color: var(--cc-type-3);
  margin-top: 2px;
}

/* Ticking hairline — only the cell whose rate > 0 gets the breathing accent. */
.kpi-strip__cell--ticking::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--cc-signal);
  animation: kpi-pulse 1600ms cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes kpi-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kpi-strip__cell--ticking::before {
    animation: none;
  }
  .kpi-strip__bar-fill {
    transition: none;
  }
}

/* Below lg the strip becomes horizontally scrollable so kiosk-mode never
   reflows but laptops can still see the whole row. */
@media (max-width: 1023px) {
  .kpi-strip {
    grid-template-columns: 4fr repeat(4, minmax(140px, 1fr));
    overflow-x: auto;
  }
  .kpi-strip__cell {
    min-height: 96px;
    padding: 12px 16px;
  }
  .kpi-strip__cell--primary {
    padding: 14px 16px;
  }
}

/* On mobile collapse to two rows. */
@media (max-width: 640px) {
  .kpi-strip {
    grid-template-columns: 1fr 1fr;
    overflow-x: visible;
  }
  .kpi-strip__cell--primary {
    grid-column: 1 / -1;
  }
}
</style>
