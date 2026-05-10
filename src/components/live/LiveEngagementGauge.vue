<template>
  <svg
    class="engagement-gauge"
    data-testid="testEngagementGauge"
    :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
    preserveAspectRatio="xMidYMid meet"
    role="presentation"
    aria-hidden="true"
  >
    <!--
      Two stacked semicircular arcs: ink-3 track and signal-yellow fill.
      The fill arc draws the same path; stroke-dasharray clips it to the
      current value's share of the arc. No gradients, no glow, no shadow.
    -->
    <path class="engagement-gauge__track" :d="ARC_PATH" fill="none" />
    <path
      class="engagement-gauge__fill"
      :d="ARC_PATH"
      fill="none"
      :stroke-dasharray="`${ARC_LEN} ${ARC_LEN}`"
      :stroke-dashoffset="dashOffset"
    />

    <!--
      21 tick hairlines at 0/5/10/.../100. Reached ticks pick up the fill
      color implicitly (we redraw via the data-reached flag) so they
      separate the arc into NWS-style minor / major beats.
    -->
    <g class="engagement-gauge__ticks">
      <line
        v-for="tick in TICKS"
        :key="tick.pct"
        :x1="tick.x1"
        :y1="tick.y1"
        :x2="tick.x2"
        :y2="tick.y2"
        :data-reached="tick.pct <= clampedValue ? '1' : '0'"
        :data-major="tick.pct % 25 === 0 ? '1' : '0'"
      />
    </g>

    <!--
      Needle: a single thin line from arc center to the value point on
      the arc. Connects the digit (above this gauge in the KPI cell) to
      the visualization. No round dot at the tip — civic, not skeuomorphic.
    -->
    <line
      class="engagement-gauge__needle"
      :x1="CENTER_X"
      :y1="CENTER_Y"
      :x2="needleTip.x"
      :y2="needleTip.y"
    />
    <circle class="engagement-gauge__hub" :cx="CENTER_X" :cy="CENTER_Y" r="3" />
  </svg>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

const VIEW_W = 200;
const VIEW_H = 110;
const CENTER_X = VIEW_W / 2;
const CENTER_Y = VIEW_H - 10;
const ARC_RADIUS = 86;
const TICK_INNER = 92;
const TICK_OUTER_MINOR = 98;
const TICK_OUTER_MAJOR = 104;

// Half-circle path from the leftmost (180°) to the rightmost (0°) point.
// SVG arc: M startX startY A radius radius 0 0 1 endX endY
const ARC_START_X = CENTER_X - ARC_RADIUS;
const ARC_END_X = CENTER_X + ARC_RADIUS;
const ARC_PATH = `M ${ARC_START_X} ${CENTER_Y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${ARC_END_X} ${CENTER_Y}`;
const ARC_LEN = Math.PI * ARC_RADIUS;

const polar = (radius: number, pct: number) => {
  // Map 0..100 to 180°..0° (left → right across the top).
  const angle = Math.PI - (Math.PI * pct) / 100;
  return {
    x: CENTER_X + radius * Math.cos(angle),
    y: CENTER_Y - radius * Math.sin(angle),
  };
};

const TICKS = Array.from({ length: 21 }, (_, i) => {
  const pct = i * 5;
  const inner = polar(TICK_INNER, pct);
  const outer = polar(
    pct % 25 === 0 ? TICK_OUTER_MAJOR : TICK_OUTER_MINOR,
    pct,
  );
  return { pct, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
});

export default defineComponent({
  name: 'LiveEngagementGauge',
  props: {
    value: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const clampedValue = computed(() =>
      Math.max(0, Math.min(100, Number(props.value) || 0)),
    );

    // stroke-dasharray hides the unfilled portion of the same path, so
    // we don't need a separate filled-arc element with a different `d`.
    const dashOffset = computed(
      () => ARC_LEN - (ARC_LEN * clampedValue.value) / 100,
    );

    const needleTip = computed(() => polar(ARC_RADIUS - 8, clampedValue.value));

    return {
      VIEW_W,
      VIEW_H,
      CENTER_X,
      CENTER_Y,
      ARC_PATH,
      ARC_LEN,
      TICKS,
      clampedValue,
      dashOffset,
      needleTip,
    };
  },
});
</script>

<style scoped lang="postcss">
.engagement-gauge {
  display: block;
  width: 100%;
  height: auto;
  max-width: 220px;
  margin: 4px 0;
}

.engagement-gauge__track {
  stroke: var(--cc-ink-3);
  stroke-width: 6;
  stroke-linecap: butt;
}

.engagement-gauge__fill {
  stroke: var(--cc-signal);
  stroke-width: 6;
  stroke-linecap: butt;
  transition: stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1);
}

.engagement-gauge__ticks line {
  stroke: var(--cc-ink-3);
  stroke-width: 1;
}

.engagement-gauge__ticks line[data-reached='1'] {
  stroke: var(--cc-type-3);
}

.engagement-gauge__ticks line[data-major='1'] {
  stroke-width: 1.5;
}

.engagement-gauge__needle {
  stroke: var(--cc-type-1);
  stroke-width: 1.5;
  stroke-linecap: round;
  transition:
    x2 600ms cubic-bezier(0.22, 1, 0.36, 1),
    y2 600ms cubic-bezier(0.22, 1, 0.36, 1);
}

.engagement-gauge__hub {
  fill: var(--cc-type-1);
}

@media (prefers-reduced-motion: reduce) {
  .engagement-gauge__fill,
  .engagement-gauge__needle {
    transition: none;
  }
}
</style>
