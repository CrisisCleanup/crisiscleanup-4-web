import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TYPE } from 'vue-toastification';
import { dedupeErrorToasts, toastOptions } from '@/modules/toast';
import { CONNECTIVITY_TOAST_ID } from '@/modules/axios';

const { updateSpy } = vi.hoisted(() => ({ updateSpy: vi.fn() }));

vi.mock('vue-toastification', async () => {
  const actual =
    await vi.importActual<Record<string, unknown>>('vue-toastification');
  return {
    ...actual,
    useToast: () => ({ update: updateSpy }),
  };
});

/** Derived from the filter's signature; the package doesn't export it. */
type FilterToast = Parameters<typeof dedupeErrorToasts>[0];

/** Minimal stand-in for those props. */
function makeToast(overrides: Partial<FilterToast> = {}): FilterToast {
  return {
    id: 1,
    type: TYPE.ERROR,
    content: 'Connection problem.',
    timeout: 10_000,
    ...overrides,
  } as FilterToast;
}

describe('modules > toast > dedupeErrorToasts', () => {
  beforeEach(() => updateSpy.mockClear());

  it('lets a toast through when nothing matches', () => {
    expect(dedupeErrorToasts(makeToast(), [])).toBeTruthy();
  });

  it('suppresses a byte-identical error toast', () => {
    const existing = makeToast({ id: 1 });
    const incoming = makeToast({ id: 2 });
    expect(dedupeErrorToasts(incoming, [existing])).toBe(false);
  });

  it('refreshes the survivor timer instead of leaving it about to expire', () => {
    const existing = makeToast({ id: 1, timeout: 10_000 });
    dedupeErrorToasts(makeToast({ id: 2 }), [existing]);
    expect(updateSpy).toHaveBeenCalledWith(1, {
      options: { timeout: 10_001 },
    });
  });

  it('NEVER suppresses the sticky connectivity notice (regression guard)', () => {
    // A copy from an interceptor-less instance must not block the sticky
    // notice, or an outage shows nothing once that copy expires.
    const impostor = makeToast({ id: 99, timeout: 10_000 });
    const connectivity = makeToast({
      id: CONNECTIVITY_TOAST_ID,
      timeout: false,
    });

    expect(dedupeErrorToasts(connectivity, [impostor])).toBe(connectivity);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('does not try to refresh a sticky survivor that has no timer', () => {
    const sticky = makeToast({ id: 1, timeout: false });
    expect(dedupeErrorToasts(makeToast({ id: 2 }), [sticky])).toBe(false);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('leaves success and info toasts alone so repeat confirmations still show', () => {
    for (const type of [TYPE.SUCCESS, TYPE.INFO]) {
      const existing = makeToast({ id: 1, type, content: 'Saved' });
      const incoming = makeToast({ id: 2, type, content: 'Saved' });
      expect(dedupeErrorToasts(incoming, [existing])).toBe(incoming);
    }
  });

  it('skips non-string content, which is never reference-equal', () => {
    const component = { component: {} } as unknown as FilterToast['content'];
    const incoming = makeToast({ id: 2, content: component });
    expect(
      dedupeErrorToasts(incoming, [makeToast({ id: 1, content: component })]),
    ).toBe(incoming);
  });

  it('wires the filter into the exported plugin options', () => {
    expect(toastOptions.filterBeforeCreate).toBe(dedupeErrorToasts);
    expect(toastOptions.timeout).toBe(10_000);
  });
});
