import { mount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// vue-i18n is auto-imported globally in app code; the unit harness needs an
// explicit mock so component setup() doesn't crash on the missing provide.
// useI18n() — the local `t` used by `dateline` interpolates {month}/{day}/...
// placeholders against the key when the bundle has no translation.
// Stricter `attrs` type than vue-i18n's runtime contract — placeholder
// values in this codebase are always primitives, and a tighter type lets
// `String(...)` lint clean without a no-base-to-string complaint.
type Attrs = Record<string, string | number>;

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (k: string, attrs?: Attrs) =>
      attrs
        ? k.replaceAll(/{(\w+)}/g, (_, name: string) =>
            String(attrs[name] ?? ''),
          )
        : k,
    te: () => false,
  }),
}));

// Vue's template `$t` is provided by vue-i18n's global install, which we
// don't run in tests. Stub it via mount options.
const $tStub = (k: string, attrs?: Attrs) =>
  attrs
    ? k.replaceAll(/{(\w+)}/g, (_, name: string) => String(attrs[name] ?? ''))
    : k;
const mountOpts = { global: { mocks: { $t: $tStub } } };

import LiveWireRibbon from '@/components/live/LiveWireRibbon.vue';

const SEGMENTS = [
  { title: 'All Cases', count: 1234, statusKey: 'all', filter: '*' },
  {
    title: 'Unclaimed',
    count: 87,
    statusKey: 'unclaimed',
    filter: 'unclaimed',
  },
  { title: 'Claimed', count: 412, statusKey: 'claimed', filter: 'claimed' },
  { title: 'Closed', count: 920, statusKey: 'closed', filter: 'closed' },
];

describe('LiveWireRibbon', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-09T14:23:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders LIVE indicator and a wire-style dateline', () => {
    const wrapper = mount(LiveWireRibbon, {
      ...mountOpts,
      props: { segments: SEGMENTS },
    });
    expect(wrapper.find('[data-testid="testWireRibbonDiv"]').exists()).toBe(
      true,
    );
    // The `~~LIVE` key falls through the stub `t()` to bare "LIVE".
    expect(wrapper.text()).toContain('LIVE');
    // Dateline follows the AP-style "MAY 9 · HH:MM UTC" format after
    // the stubbed t() interpolates the {month}/{day}/{hh}/{mm} attrs.
    expect(wrapper.find('[data-testid="testWireRibbonTime"]').text()).toMatch(
      /MAY 9 · 14:23 UTC/,
    );
  });

  it('renders one button segment per non-empty entry with formatted numbers', () => {
    const wrapper = mount(LiveWireRibbon, {
      ...mountOpts,
      props: { segments: SEGMENTS },
    });
    const segments = wrapper.findAll('button.wire-ribbon__seg');
    expect(segments).toHaveLength(SEGMENTS.length);
    expect(segments[0].text()).toContain('All Cases');
    // 1234 must be locale-formatted (US: 1,234).
    expect(segments[0].text()).toContain('1,234');
    // Status hue is exposed via data-status so CSS can underline the value.
    expect(segments[1].attributes('data-status')).toBe('unclaimed');
  });

  it('emits `filter` with the segment key on click and toggles back to null', async () => {
    const wrapper = mount(LiveWireRibbon, {
      ...mountOpts,
      props: { segments: SEGMENTS },
    });
    const unclaimedBtn = wrapper.findAll('button.wire-ribbon__seg')[1];
    await unclaimedBtn.trigger('click');
    expect(wrapper.emitted('filter')?.[0]).toEqual(['unclaimed']);
    // Second click on the same segment clears the filter.
    await unclaimedBtn.trigger('click');
    expect(wrapper.emitted('filter')?.[1]).toEqual([null]);
  });

  it('disables segments without a filter (e.g., overdue summary cell)', () => {
    const wrapper = mount(LiveWireRibbon, {
      ...mountOpts,
      props: {
        segments: [
          { title: 'Overdue', count: 7, statusKey: 'overdue' },
          ...SEGMENTS,
        ],
      },
    });
    const buttons = wrapper.findAll('button.wire-ribbon__seg');
    // Disabled segments are non-interactive.
    expect(buttons[0].attributes('disabled')).toBeDefined();
    expect(buttons[1].attributes('disabled')).toBeUndefined();
  });
});
