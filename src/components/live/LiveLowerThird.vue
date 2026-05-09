<template>
  <div class="lower-third" data-testid="testLiveLowerThirdDiv">
    <div class="lower-third__bar">
      <button
        type="button"
        class="lower-third__btn"
        :aria-label="isPaused ? $t('actions.play') : $t('actions.pause')"
        :data-testid="
          isPaused
            ? 'testResumeGeneratePointsButton'
            : 'testPauseGeneratePointsButton'
        "
        @click="$emit('toggle-pause')"
      >
        <font-awesome-icon :icon="isPaused ? 'play' : 'pause'" size="sm" />
      </button>

      <div class="lower-third__slider">
        <Slider
          v-if="markersLength > 0"
          :key="markersLength"
          data-testid="testUpdatedSliderDiv"
          :value="markersLength - 1"
          :min="0"
          :max="markersLength - 1"
          :from="from"
          :to="to"
          :alt="$t('actions.play')"
          @input="onSliderInput"
        ></Slider>
        <span v-else class="lower-third__slider-empty">
          {{ $t('~~Awaiting events') }}
        </span>
      </div>

      <button
        type="button"
        class="lower-third__legend-trigger"
        :class="{ 'lower-third__legend-trigger--open': isLegendOpen }"
        :aria-expanded="isLegendOpen"
        :aria-controls="`${uid}-legend-popover`"
        data-testid="testLegendToggleBtn"
        @click="isLegendOpen = !isLegendOpen"
      >
        <span>{{ $t('worksiteMap.legend') }}</span>
        <span class="lower-third__caret" aria-hidden="true">{{
          isLegendOpen ? '▾' : '▸'
        }}</span>
      </button>
    </div>

    <transition name="lower-third-pop">
      <div
        v-if="isLegendOpen && legendEntries.length > 0"
        :id="`${uid}-legend-popover`"
        class="lower-third__popover"
        role="region"
        :aria-label="$t('worksiteMap.legend')"
      >
        <div class="lower-third__popover-grid">
          <button
            v-for="entry in legendEntries"
            :key="entry.key"
            type="button"
            class="lower-third__legend-cell"
            :class="{ 'lower-third__legend-cell--active': entry.selected }"
            :data-testid="`testLegendSvgs${entry.key}Div`"
            @click="$emit('toggle-work-type', entry.key)"
          >
            <WorkTypeIcon :work-type-key="entry.key" :svg="entry.svg" />
            <span class="lower-third__legend-name">{{
              workTypeName(entry.key)
            }}</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  type PropType,
  getCurrentInstance,
} from 'vue';
import Slider from '@/components/Slider.vue';
import WorkTypeIcon from '@/components/live/WorkTypeIcon.vue';
import { getWorkTypeName } from '@/filters';

interface LegendEntry {
  key: string;
  svg: string;
  selected: boolean;
}

export default defineComponent({
  name: 'LiveLowerThird',
  components: { Slider, WorkTypeIcon },
  props: {
    isPaused: { type: Boolean, default: false },
    markersLength: { type: Number, default: 0 },
    from: { type: String, default: '' },
    to: { type: String, default: '' },
    legendEntries: {
      type: Array as PropType<LegendEntry[]>,
      default: () => [],
    },
    /** Initially expanded (default true on big-screen so the legend reads). */
    legendInitiallyOpen: { type: Boolean, default: true },
  },
  emits: ['toggle-pause', 'scrub', 'toggle-work-type'],
  setup(props, { emit }) {
    const isLegendOpen = ref(props.legendInitiallyOpen);
    const uid = computed(
      () => `lt${getCurrentInstance()?.uid ?? Math.floor(Math.random() * 1e6)}`,
    );

    const onSliderInput = (value: number) => emit('scrub', value);

    const workTypeName = (key: string) => {
      try {
        return getWorkTypeName(key) ?? key;
      } catch {
        return key;
      }
    };

    return { isLegendOpen, uid, onSliderInput, workTypeName };
  },
});
</script>

<style scoped lang="postcss">
.lower-third {
  position: relative;
  z-index: 2;
}

.lower-third__bar {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  column-gap: 16px;
  padding: 10px 16px;
  background-color: var(--cc-ink-0);
  border-top: 1px solid var(--cc-ink-3);
}

.lower-third__btn {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: transparent;
  border: 1px solid var(--cc-ink-3);
  color: var(--cc-type-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background-color 200ms ease,
    border-color 200ms ease;
}

.lower-third__btn:hover {
  background-color: var(--cc-ink-2);
  border-color: var(--cc-type-3);
}

.lower-third__btn:focus-visible {
  outline: 2px solid var(--cc-signal);
  outline-offset: 3px;
}

.lower-third__slider {
  min-height: 32px;
  display: flex;
  align-items: center;
}

.lower-third__slider-empty {
  font-family: var(--ff-body);
  font-size: var(--ts-meta);
  color: var(--cc-type-3);
  font-style: italic;
}

.lower-third__legend-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--cc-ink-3);
  color: var(--cc-type-2);
  font-family: var(--ff-body);
  font-size: var(--ts-meta);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition:
    background-color 200ms ease,
    color 200ms ease,
    border-color 200ms ease;
}

.lower-third__legend-trigger:hover,
.lower-third__legend-trigger--open {
  color: var(--cc-type-1);
  border-color: var(--cc-type-3);
}

.lower-third__legend-trigger:focus-visible {
  outline: 2px solid var(--cc-signal);
  outline-offset: 3px;
}

.lower-third__caret {
  font-size: 0.75em;
  color: var(--cc-type-3);
  line-height: 1;
}

.lower-third__popover {
  position: absolute;
  bottom: 100%;
  right: 16px;
  margin-bottom: 6px;
  background-color: var(--cc-ink-1);
  border: 1px solid var(--cc-ink-3);
  padding: 8px;
  max-width: 380px;
  min-width: 240px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.lower-third__popover-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.lower-third__legend-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: transparent;
  border: 0;
  color: var(--cc-type-2);
  font-family: var(--ff-body);
  font-size: var(--ts-meta);
  text-align: left;
  cursor: pointer;
  transition: background-color 200ms ease;
}

.lower-third__legend-cell:hover {
  background-color: var(--cc-ink-2);
}

.lower-third__legend-cell--active {
  background-color: var(--cc-ink-2);
  color: var(--cc-type-1);
}

.lower-third__legend-cell:focus-visible {
  outline: 2px solid var(--cc-signal);
  outline-offset: 2px;
}

.lower-third__legend-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lower-third-pop-enter-active,
.lower-third-pop-leave-active {
  transition:
    opacity 180ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: bottom right;
}

.lower-third-pop-enter-from,
.lower-third-pop-leave-to {
  opacity: 0;
  transform: translate3d(0, 4px, 0);
}

@media (prefers-reduced-motion: reduce) {
  .lower-third-pop-enter-active,
  .lower-third-pop-leave-active {
    transition: none;
  }
}
</style>
