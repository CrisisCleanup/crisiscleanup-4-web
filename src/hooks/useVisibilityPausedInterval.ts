import { onBeforeUnmount, getCurrentScope, onScopeDispose } from 'vue';

/**
 * `setInterval` that pauses when `document.visibilityState === 'hidden'`
 * and resumes when the tab is visible again. Cleans itself up on
 * component unmount or effect-scope disposal.
 *
 * Used by `/pew-pew` for chart-tab and site-info-tab auto-rotation, both
 * of which previously kept firing while the kiosk tab was hidden — see
 * plan perf #3.
 *
 * @returns a `cancel()` function — calling it stops the interval and
 *          unbinds the visibility listener immediately.
 */
export function useVisibilityPausedInterval(
  fn: () => void,
  ms: number,
): () => void {
  let timerId: number | null = null;

  const start = () => {
    if (timerId !== null) return;
    timerId = window.setInterval(fn, ms);
  };

  const stop = () => {
    if (timerId === null) return;
    clearInterval(timerId);
    timerId = null;
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      stop();
    } else {
      start();
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
    if (document.visibilityState !== 'hidden') start();
  }

  const cancel = () => {
    stop();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };

  if (getCurrentScope()) {
    onScopeDispose(cancel);
  } else {
    onBeforeUnmount(cancel);
  }

  return cancel;
}
