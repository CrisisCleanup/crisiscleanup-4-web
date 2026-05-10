<template>
  <div class="ccu-slider flex flex-col" :style="[cssVars]">
    <div class="ccu-slider__labels flex justify-between">
      <span
        class="ccu-slider__label ccu-slider__label--from flex items-center justify-start"
      >
        <span class="cursor-pointer" @click="$emit('input', Number(1))">{{
          from
        }}</span>
        <ccu-icon
          v-if="fromTooltip"
          v-tooltip="{
            content: fromTooltip,
            triggers: ['click'],
            popperClass: 'interactive-tooltip w-auto',
            html: true,
          }"
          :alt="$t('actions.help_alt')"
          type="help"
          size="medium"
        />
      </span>
      <div>
        <span
          v-if="title"
          :data-testid="`testSlider${title}Input`"
          class="ccu-slider__label ccu-slider__label--title font-bold"
          >{{ title }}</span
        >
      </div>
      <span
        class="ccu-slider__label ccu-slider__label--to items-center justify-start cursor-pointer"
        @click="$emit('input', Number(max))"
        >{{ to }}</span
      >
    </div>
    <div class="range-slider" :title="localValue">
      <input
        class="range-slider__range"
        :class="[sliderClass, { activated: localValue < max }]"
        type="range"
        :value="localValue"
        :min="min"
        :max="max"
        :step="step"
        @input="update"
        @input.stop=""
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, ref, watch } from 'vue';

export default defineComponent({
  name: 'Slider',
  props: {
    value: {
      type: Number,
      default: 0,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    step: {
      type: Number,
      default: 1,
    },
    from: {
      type: String,
      default: '0',
    },
    to: {
      type: String,
      default: '100',
    },
    primaryColor: {
      type: String,
      default: '#61d5f8',
    },
    secondaryColor: {
      type: String,
      default: 'rgba(0, 0, 0, 0.5)',
    },
    handleSize: {
      type: String,
      default: '14px',
    },
    trackSize: {
      type: String,
      default: '4px',
    },
    sliderClass: {
      type: String,
      default: 'w-84',
    },
    title: {
      type: String,
      default: '',
    },
    fromTooltip: {
      type: String,
      default: null,
      required: false,
    },
  },
  setup(props, { emit }) {
    // Mirror the input position locally so the gradient track always
    // reflects what the user is dragging — some callers (e.g. the SVI
    // filter) hardcode `:value` and only emit downstream effects, so
    // relying solely on `props.value` would freeze the visual fill.
    const localValue = ref(props.value);
    watch(
      () => props.value,
      (v) => {
        localValue.value = v;
      },
    );

    function update(e: Event) {
      const target = e.target as HTMLInputElement;
      const v = Number(target.value);
      localValue.value = v;
      emit('input', v);
    }

    const cssVars = computed(() => {
      const range = Math.max(1, props.max - props.min);
      const filled = Math.min(
        100,
        Math.max(0, ((localValue.value - props.min) / range) * 100),
      );
      return {
        '--primary-color': props.primaryColor,
        '--secondary-color': props.secondaryColor,
        '--handle-size': props.handleSize,
        '--track-size': props.trackSize,
        '--ccu-slider-fill-pct': `${filled}%`,
      };
    });

    return {
      update,
      cssVars,
      localValue,
    };
  },
});
</script>

<style scoped lang="scss">
$handle-size: var(--handle-size);
$track-size: var(--track-size);
$primary: var(--primary-color);
// Track unfilled portion derives from currentColor so the slider reads
// on both dark (white-ish text) and light (dark text) parents. Callers
// can override with `--ccu-slider-track-bg` if they want a specific tone.
$track-bg: var(
  --ccu-slider-track-bg,
  color-mix(in srgb, currentColor 22%, transparent)
);

.ccu-slider__labels {
  margin-bottom: 6px;
  font-family: var(--ff-body, 'Public Sans', system-ui, sans-serif);
  font-size: 12px;
  letter-spacing: 0.04em;
}

.ccu-slider__label {
  color: var(--cc-type-3, #6b6b6b);
  text-transform: uppercase;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.06em;
}

.ccu-slider__label--from,
.ccu-slider__label--to {
  color: inherit;
  opacity: 0.85;
  transition: opacity 160ms ease;
}

.ccu-slider__label--from:hover,
.ccu-slider__label--to:hover {
  opacity: 1;
}

.ccu-slider__label--title {
  color: var(--cc-type-1, currentColor);
  font-size: 12px;
}

.range-slider {
  padding: 0 calc(#{$handle-size} / 2);
}

.range-slider__range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  min-width: 0;
  display: block;
  height: $track-size;
  background: linear-gradient(
    to right,
    $primary 0%,
    $primary var(--ccu-slider-fill-pct, 100%),
    $track-bg var(--ccu-slider-fill-pct, 100%),
    $track-bg 100%
  );
  border-radius: calc(#{$track-size} / 2);
  outline: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  transition: filter 160ms ease;
}

.range-slider__range:hover {
  filter: brightness(1.05);
}

/* Activated: brand yellow takes over the filled track + thumb gets a soft
   halo so callers using a neutral primary-color (e.g. #dadada on the work
   page) still get a clear "this slider is on" signal. */
.range-slider__range.activated {
  background: linear-gradient(
    to right,
    #fece09 0%,
    #fece09 var(--ccu-slider-fill-pct, 100%),
    $track-bg var(--ccu-slider-fill-pct, 100%),
    $track-bg 100%
  );
}

.range-slider__range.activated::-webkit-slider-thumb {
  background-color: #fece09;
  box-shadow:
    0 0 0 4px rgba(254, 206, 9, 0.25),
    0 1px 4px rgba(0, 0, 0, 0.35);
}

.range-slider__range.activated::-moz-range-thumb {
  background-color: #fece09;
  box-shadow:
    0 0 0 4px rgba(254, 206, 9, 0.25),
    0 1px 4px rgba(0, 0, 0, 0.35);
}

.range-slider__range::-webkit-slider-thumb {
  appearance: none;
  width: $handle-size;
  height: $handle-size;
  border-radius: 50%;
  background-color: $primary;
  border: 2px solid var(--cc-ink-0, #fff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: transform 160ms ease;
}

.range-slider__range:hover::-webkit-slider-thumb,
.range-slider__range:active::-webkit-slider-thumb {
  transform: scale(1.1);
}

.range-slider__range::-moz-range-thumb {
  width: $handle-size;
  height: $handle-size;
  border-radius: 50%;
  background-color: $primary;
  border: 2px solid var(--cc-ink-0, #fff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: transform 160ms ease;
}

.range-slider__range:hover::-moz-range-thumb,
.range-slider__range:active::-moz-range-thumb {
  transform: scale(1.1);
}

.range-slider__range:focus-visible {
  outline: 2px solid $primary;
  outline-offset: 4px;
}

::-moz-range-track {
  background: transparent;
  border: 0;
}

input::-moz-focus-inner,
input::-moz-focus-outer {
  border: 0;
}
</style>
