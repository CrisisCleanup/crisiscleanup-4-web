import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (k: string) => k,
    // Force the missing-translation path so the humanizer is exercised.
    te: () => false,
  }),
}));

const $tStub = (k: string) => k;
const mountOpts = { global: { mocks: { $t: $tStub } } };

vi.mock('@/hooks/useAnimatedNumber', () => ({
  useAnimatedNumber: vi.fn(),
}));

import LiveKpiStrip from '@/components/live/LiveKpiStrip.vue';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

const STATS = [
  {
    id: 1,
    name_t: 'reports.pp_site_stats_total_services',
    description_t: 'reports.pp_site_stats_total_services_d',
    value: 146_462_078,
    change_per_second: 0.42,
    currency_symbol: '$',
  },
  {
    id: 2,
    name_t: 'reports.pp_site_stats_total_volunteers',
    description_t: 'reports.pp_site_stats_total_volunteers_d',
    value: 22_230,
    change_per_second: 0,
    currency_symbol: '',
  },
  {
    id: 3,
    name_t: 'reports.pp_site_stats_est_hours',
    description_t: 'reports.pp_site_stats_est_hours_d',
    value: 488_207,
    change_per_second: 0,
    currency_symbol: '',
  },
];

describe('LiveKpiStrip', () => {
  beforeEach(() => {
    (useAnimatedNumber as unknown as { mockClear?: () => void }).mockClear?.();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the engagement primary cell with the rounded percentage', async () => {
    const wrapper = mount(LiveKpiStrip, {
      ...mountOpts,
      props: { engagement: 64.4, siteStats: STATS },
    });
    await flushPromises();
    const primary = wrapper.find('.kpi-strip__cell--primary');
    expect(primary.exists()).toBe(true);
    expect(primary.text()).toContain('64');
    // The thin horizontal track and fill exist as a single bar (no gauge SVG).
    expect(primary.find('.kpi-strip__bar').exists()).toBe(true);
    expect(primary.find('svg').exists()).toBe(false);
  });

  it('shows up to 4 supporting cells (top of the list)', () => {
    const wrapper = mount(LiveKpiStrip, {
      ...mountOpts,
      props: { engagement: 0, siteStats: STATS },
    });
    // Primary + supporting cells.
    const cells = wrapper.findAll('.kpi-strip__cell');
    expect(cells).toHaveLength(STATS.length + 1);
  });

  it('humanizes labels when the i18n bundle is missing the key', () => {
    const wrapper = mount(LiveKpiStrip, {
      ...mountOpts,
      props: { engagement: 0, siteStats: STATS },
    });
    const text = wrapper.text();
    // Raw key segments must not be visible — the humanizer collapses
    // `reports.pp_site_stats_total_services` → `Total Services`.
    expect(text).not.toContain('pp_site_stats_total_services');
    expect(text).toMatch(/total services/i);
    expect(text).toMatch(/est hours/i);
  });

  it('marks the cell with positive change_per_second as ticking', () => {
    const wrapper = mount(LiveKpiStrip, {
      ...mountOpts,
      props: { engagement: 0, siteStats: STATS },
    });
    const ticking = wrapper.findAll('.kpi-strip__cell--ticking');
    // Only the first stat row has change_per_second > 0 in the fixture.
    expect(ticking).toHaveLength(1);
  });

  it('drives the primary value via useAnimatedNumber, not Vue reactivity', () => {
    mount(LiveKpiStrip, {
      ...mountOpts,
      props: { engagement: 50, siteStats: STATS },
    });
    expect(useAnimatedNumber).toHaveBeenCalledTimes(1);
    const args = (
      useAnimatedNumber as unknown as { mock: { calls: unknown[][] } }
    ).mock.calls[0];
    // Third arg carries the formatter / duration options.
    expect(args[2]).toMatchObject({ duration: 600 });
  });
});
