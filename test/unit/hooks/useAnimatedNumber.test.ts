import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

/**
 * Thin host that drives `useAnimatedNumber` against a real DOM element so we
 * can assert on `textContent`. Returns the host wrapper plus the ref to the
 * target element.
 */
function makeHost(initialTarget: number) {
  const Target = ref(initialTarget);
  const Host = defineComponent({
    setup() {
      const el = ref<HTMLElement | null>(null);
      useAnimatedNumber(el, () => Target.value, {
        duration: 200,
        format: (v) => Math.round(v).toString(),
      });
      return () => h('span', { ref: el }, '');
    },
  });
  const wrapper = mount(Host);
  return { wrapper, Target };
}

describe('useAnimatedNumber', () => {
  beforeEach(() => {
    // matchMedia isn't implemented in happy-dom by default; provide a stub
    // that reports "no preference" so the hook takes the animation path.
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the formatted target value to the element via rAF', async () => {
    // Anchor the animation clock so manual rAF ticks produce predictable t.
    vi.spyOn(performance, 'now').mockReturnValue(0);
    let rafCb: FrameRequestCallback | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCb = cb;
      return 1 as unknown as number;
    });

    const { wrapper, Target } = makeHost(0);
    Target.value = 100;
    await flushPromises();

    // First rAF tick at t=0 should write the start value (rounded 0).
    rafCb?.(0);
    expect(wrapper.element.textContent).toBe('0');

    // Driving rAF past the 200ms duration converges on the rounded target.
    rafCb?.(1000);
    expect(wrapper.element.textContent).toBe('100');
  });

  it('snaps immediately to the target when prefers-reduced-motion is set', async () => {
    (
      window.matchMedia as unknown as { mockReturnValue: (v: object) => void }
    ).mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    const { wrapper, Target } = makeHost(0);
    Target.value = 42;
    await flushPromises();

    expect(rafSpy).not.toHaveBeenCalled();
    expect(wrapper.element.textContent).toBe('42');
  });

  it('ignores NaN updates (defensive — guards against stale stat rows)', async () => {
    const { wrapper, Target } = makeHost(10);
    await flushPromises();
    // Force NaN via the source-watcher path; the hook should keep prior text.
    (Target as unknown as { value: number }).value = Number.NaN;
    await flushPromises();
    expect(wrapper.element.textContent).not.toContain('NaN');
  });
});
