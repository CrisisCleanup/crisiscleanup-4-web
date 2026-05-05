import type { Ref } from 'vue';

interface UseTypewriterOptions {
  /** ms per character. Default 12ms ≈ 80 chars/sec, comfortable to read. */
  charDelayMs?: number;
  /** When false, the visible text immediately matches the source. */
  enabled?: Ref<boolean>;
}

/**
 * Drive a "typewriter" reveal of `source`. The returned ref grows from "" to
 * the full string at ~`charDelayMs` per character. If the source changes
 * mid-animation, the ref resets and re-animates from the start so the user
 * always sees the freshest content.
 *
 * Intended for the RAG chat: drive the agent's final-answer reveal off the
 * `status === 'finish'` transition. Don't drive it from `in_progress` chunks
 * — those payloads jitter (retries, tool narration), per the integration
 * guide.
 */
export const useTypewriter = (
  source: Ref<string>,
  options: UseTypewriterOptions = {},
) => {
  const { charDelayMs = 12, enabled } = options;
  const visible = ref('');
  const isAnimating = ref(false);
  let timer: number | undefined;

  const stop = () => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
    isAnimating.value = false;
  };

  const flush = () => {
    stop();
    visible.value = source.value;
  };

  const start = (full: string) => {
    stop();
    if (!full) {
      visible.value = '';
      return;
    }
    if (enabled && enabled.value === false) {
      visible.value = full;
      return;
    }
    visible.value = '';
    isAnimating.value = true;
    let i = 0;
    const tick = () => {
      if (i >= full.length) {
        isAnimating.value = false;
        timer = undefined;
        return;
      }
      i += 1;
      visible.value = full.slice(0, i);
      timer = window.setTimeout(tick, charDelayMs);
    };
    timer = window.setTimeout(tick, charDelayMs);
  };

  watch(
    source,
    (next: string) => {
      start(next);
    },
    { immediate: true },
  );

  if (enabled) {
    watch(enabled, (on: boolean) => {
      if (!on) flush();
    });
  }

  onBeforeUnmount(stop);

  return {
    visible,
    isAnimating,
    flush,
  };
};
