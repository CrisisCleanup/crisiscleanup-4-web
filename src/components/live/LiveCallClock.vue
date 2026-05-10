<template>
  <div class="call-clock" data-testid="testLiveCallClockDiv">
    <svg
      class="call-clock__svg"
      :viewBox="`0 0 ${VIEW} ${VIEW}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="$t('~~Calls per hour, last 24 hours')"
    >
      <!-- Inner ring as a single hairline reference for the bar floor. -->
      <circle
        :cx="CENTER"
        :cy="CENTER"
        :r="INNER_R"
        class="call-clock__ring"
        fill="none"
      />

      <!-- Track outlines (max-radius outline per hour, dim) -->
      <g class="call-clock__tracks">
        <path
          v-for="bar in bars"
          :key="`track-${bar.hour}`"
          :d="bar.trackPath"
          class="call-clock__track"
          fill="none"
        />
      </g>

      <!-- Filled bars proportional to per-hour calls -->
      <g class="call-clock__bars">
        <path
          v-for="bar in bars"
          :key="`fill-${bar.hour}`"
          :d="bar.fillPath"
          class="call-clock__bar"
          :class="{ 'call-clock__bar--current': bar.hour === currentHour }"
          :data-hour="bar.hour"
        />
      </g>

      <!-- Cardinal hour labels (00, 06, 12, 18) -->
      <g class="call-clock__labels">
        <text
          v-for="lbl in CARDINAL_LABELS"
          :key="lbl.hour"
          :x="lbl.x"
          :y="lbl.y"
          text-anchor="middle"
          dominant-baseline="middle"
        >
          {{ String(lbl.hour).padStart(2, '0') }}
        </text>
      </g>

      <!-- Center: current-hour count + eyebrow -->
      <text
        :x="CENTER"
        :y="CENTER - 4"
        class="call-clock__count"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        {{ formatNum(currentHourCalls) }}
      </text>
      <text
        :x="CENTER"
        :y="CENTER + 16"
        class="call-clock__eyebrow"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        {{ $t('~~Calls / hr') }}
      </text>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from 'vue';

interface CallRow {
  hour?: number | string;
  name?: number | string;
  calls?: number;
  callbacks?: number;
  total?: number;
  missed?: number;
  [key: string]: unknown;
}

const VIEW = 260;
const CENTER = VIEW / 2;
const INNER_R = 50;
const MAX_R = 110;
const LABEL_R = MAX_R + 18;
const BAR_GAP_DEG = 2;
const BAR_DEG = 360 / 24 - BAR_GAP_DEG;

// SVG path for a "wedge" shape from inner radius to outer radius across a
// small angular span. Used twice per hour: once for the dim track at MAX_R,
// once for the fill at the data-driven radius.
const arcWedgePath = (
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
) => {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180; // 12 o'clock at top
  const startInner = {
    x: CENTER + innerR * Math.cos(toRad(startDeg)),
    y: CENTER + innerR * Math.sin(toRad(startDeg)),
  };
  const endInner = {
    x: CENTER + innerR * Math.cos(toRad(endDeg)),
    y: CENTER + innerR * Math.sin(toRad(endDeg)),
  };
  const startOuter = {
    x: CENTER + outerR * Math.cos(toRad(startDeg)),
    y: CENTER + outerR * Math.sin(toRad(startDeg)),
  };
  const endOuter = {
    x: CENTER + outerR * Math.cos(toRad(endDeg)),
    y: CENTER + outerR * Math.sin(toRad(endDeg)),
  };
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${startInner.x} ${startInner.y}`,
    `L ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
    'Z',
  ].join(' ');
};

const CARDINAL_LABELS = [0, 6, 12, 18].map((hour) => {
  const rad = ((hour * 15 - 90) * Math.PI) / 180;
  return {
    hour,
    x: CENTER + LABEL_R * Math.cos(rad),
    y: CENTER + LABEL_R * Math.sin(rad),
  };
});

export default defineComponent({
  name: 'LiveCallClock',
  props: {
    chartData: {
      type: Array as PropType<CallRow[]>,
      default: () => [],
    },
  },
  setup(props) {
    /** Normalize one row into { hour, calls } regardless of API shape. */
    const normalize = (row: CallRow): { hour: number; calls: number } => {
      const hourRaw = row.hour ?? row.name ?? 0;
      const hour =
        typeof hourRaw === 'number'
          ? hourRaw
          : Number.parseInt(String(hourRaw), 10) || 0;
      // Prefer answered = `calls`; fall back to total - missed for legacy.
      const calls =
        Number(row.calls) ||
        Math.max(0, Number(row.total || 0) - Number(row.missed || 0));
      return { hour: ((hour % 24) + 24) % 24, calls };
    };

    /** 24-element array indexed by hour. Missing hours = 0 calls. */
    const hourlyCalls = computed(() => {
      const out = Array.from({ length: 24 }, () => 0);
      for (const row of props.chartData) {
        const { hour, calls } = normalize(row);
        out[hour] = (out[hour] || 0) + calls;
      }
      return out;
    });

    const maxCalls = computed(() => Math.max(1, ...hourlyCalls.value));

    const bars = computed(() =>
      hourlyCalls.value.map((calls, hour) => {
        const startDeg = hour * 15 + BAR_GAP_DEG / 2;
        const endDeg = (hour + 1) * 15 - BAR_GAP_DEG / 2;
        const ratio = calls / maxCalls.value;
        const fillOuter = INNER_R + (MAX_R - INNER_R) * ratio;
        return {
          hour,
          calls,
          trackPath: arcWedgePath(INNER_R, MAX_R, startDeg, endDeg),
          fillPath: arcWedgePath(INNER_R, fillOuter, startDeg, endDeg),
        };
      }),
    );

    const currentHour = computed(() => new Date().getHours());
    const currentHourCalls = computed(
      () => hourlyCalls.value[currentHour.value] || 0,
    );

    const formatNum = (v: number) =>
      Number.isFinite(v) ? v.toLocaleString('en-US') : '0';

    return {
      VIEW,
      CENTER,
      INNER_R,
      CARDINAL_LABELS,
      bars,
      currentHour,
      currentHourCalls,
      formatNum,
    };
  },
});
</script>

<style scoped lang="postcss">
.call-clock {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 8px;
  background-color: var(--cc-ink-0);
  overflow: hidden;
  box-sizing: border-box;
}

/*
 * The chart container is `position: absolute; inset: 0` so its width/height
 * track the tab pane. We need the SVG to fit a SQUARE area inside that —
 * `aspect-ratio: 1` plus the min(...) cap forces the SVG to whichever of
 * width or height is smaller, so it never overflows vertically and clips
 * the cardinal-hour labels.
 */
.call-clock__svg {
  width: min(100%, calc(100% * 1));
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 1;
  display: block;
  object-fit: contain;
}

.call-clock__ring {
  stroke: var(--cc-ink-3);
  stroke-width: 1;
}

.call-clock__track {
  fill: var(--cc-ink-1);
  /*
   * Dim outline of the maximum bar height per hour — gives every hour a
   * "slot" so an empty hour still reads structurally.
   */
}

.call-clock__bar {
  fill: var(--cc-signal);
  /* No stroke, no gradient — civic palette only. */
}

.call-clock__bar--current {
  fill: var(--cc-signal-2);
}

.call-clock__labels text {
  font-family: var(--ff-body);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  fill: var(--cc-type-3);
  text-transform: uppercase;
}

.call-clock__count {
  font-family: var(--ff-display);
  font-feature-settings: var(--num-features);
  font-weight: 800;
  font-size: 28px;
  fill: var(--cc-type-1);
}

.call-clock__eyebrow {
  font-family: var(--ff-body);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  fill: var(--cc-type-3);
  text-transform: uppercase;
}
</style>
