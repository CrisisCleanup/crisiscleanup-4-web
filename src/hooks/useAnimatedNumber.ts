import { ref, watch, onBeforeUnmount, type Ref, type WatchSource } from 'vue';

interface AnimatedNumberOptions {
  /** ms over which to interpolate. Default 600. */
  duration?: number;
  /** display formatter (e.g. `Intl.NumberFormat().format`). */
  format?: (value: number) => string;
  /** easing in [0, 1]. Default easeOutQuart. */
  easing?: (t: number) => number;
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Animates a numeric target by writing directly to a `<HTMLElement>`'s
 * `textContent` via `requestAnimationFrame`. Bypasses Vue reactivity so
 * the per-tick updates do not re-render the surrounding tree.
 *
 * Use it for the KPI primary cell on `/pew-pew` (see plan perf #2 — replaces
 * the `setInterval(countUpStats, 1000)` that was rerendering 4+ stats per
 * second).
 *
 * @example
 * <span ref="el" class="kpi-value" />
 * const el = ref<HTMLElement | null>(null);
 * useAnimatedNumber(el, () => myStat.value, { format: (v) => v.toFixed(0) });
 */
export function useAnimatedNumber(
  el: Ref<HTMLElement | null>,
  source: WatchSource<number>,
  options: AnimatedNumberOptions = {},
) {
  const {
    duration = 600,
    format = (v) => Math.round(v).toLocaleString(),
    easing = easeOutQuart,
  } = options;

  const current = ref(0);
  let rafId: number | null = null;

  const stop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const writeNow = (value: number) => {
    current.value = value;
    if (el.value) el.value.textContent = format(value);
  };

  const animateTo = (target: number) => {
    stop();
    const start = current.value;
    const delta = target - start;
    if (delta === 0) {
      writeNow(target);
      return;
    }
    const startTs = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTs) / duration);
      writeNow(start + delta * easing(t));
      rafId = t < 1 ? requestAnimationFrame(tick) : null;
    };
    rafId = requestAnimationFrame(tick);
  };

  watch(
    source,
    (value: number) => {
      if (typeof value !== 'number' || Number.isNaN(value)) return;
      // Respect reduced-motion users: snap immediately.
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        writeNow(value);
        return;
      }
      animateTo(value);
    },
    { immediate: true },
  );

  onBeforeUnmount(stop);

  return { current, stop };
}
