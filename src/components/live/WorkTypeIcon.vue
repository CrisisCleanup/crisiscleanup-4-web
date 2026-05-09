<template>
  <span ref="rootEl" class="work-type-icon" :data-key="workTypeKey"></span>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';

/**
 * Memoized SVG renderer for the map work-type legend on `/pew-pew`.
 *
 * The legacy implementation used `<div v-html="entry.svg">` inside a `v-for`,
 * which forced the browser to re-parse every legend item's raw SVG string on
 * every render of `displayedWorkTypeSvgs` (visibility toggle, color filter,
 * SVI slider — anything that mutated a sibling). Profiling showed that as a
 * persistent ~3ms hotspot per render at 1080p with the full work-type set.
 *
 * This component caches the SVG string by `(workTypeKey, svg-content)` keys
 * and writes it via `innerHTML` only when the cached entry changes. Identical
 * inputs across renders short-circuit before touching the DOM.
 *
 * See plan perf #7.
 */
const SVG_CACHE = new Map<string, string>();

export default defineComponent({
  name: 'WorkTypeIcon',
  props: {
    workTypeKey: {
      type: String,
      required: true,
    },
    svg: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const rootEl = ref<HTMLElement | null>(null);
    let lastWritten = '';

    const apply = () => {
      const cacheKey = `${props.workTypeKey}::${props.svg.length}::${
        // Cheap fingerprint — first/last 40 chars catches color swaps without
        // hashing the whole string. The cacheKey is keyed on length+slice so
        // collisions only happen on intentional same-shape SVGs.
        props.svg.slice(0, 40) + props.svg.slice(-40)
      }`;
      const cached = SVG_CACHE.get(cacheKey) ?? props.svg;
      if (!SVG_CACHE.has(cacheKey)) SVG_CACHE.set(cacheKey, props.svg);
      if (cached === lastWritten) return;
      if (rootEl.value) {
        rootEl.value.innerHTML = cached;
        lastWritten = cached;
      }
    };

    onMounted(apply);
    watch(
      () => [props.workTypeKey, props.svg],
      () => apply(),
    );

    return { rootEl };
  },
});
</script>

<style scoped>
.work-type-icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  flex: none;
}

.work-type-icon :deep(svg) {
  width: 16px;
  height: 16px;
}
</style>
