import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import LiveCallClock from '@/components/live/LiveCallClock.vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k, te: () => false }),
}));

const $tStub = (k: string) => k;
const mountOpts = { global: { mocks: { $t: $tStub } } };

const buildHourly = (calls: Record<number, number>) =>
  Object.entries(calls).map(([h, c]) => ({ hour: Number(h), calls: c }));

describe('LiveCallClock', () => {
  it('renders 24 bars regardless of input length', () => {
    const wrapper = mount(LiveCallClock, {
      ...mountOpts,
      props: { chartData: buildHourly({ 9: 12, 10: 18, 11: 22 }) },
    });
    expect(wrapper.findAll('.call-clock__bar')).toHaveLength(24);
    expect(wrapper.findAll('.call-clock__track')).toHaveLength(24);
  });

  it('marks the current hour bar with --current modifier', () => {
    const currentHour = new Date().getHours();
    const wrapper = mount(LiveCallClock, {
      ...mountOpts,
      props: { chartData: buildHourly({ [currentHour]: 30 }) },
    });
    const current = wrapper.find('.call-clock__bar--current');
    expect(current.exists()).toBe(true);
    expect(current.attributes('data-hour')).toBe(String(currentHour));
  });

  it('renders 4 cardinal labels (00, 06, 12, 18)', () => {
    const wrapper = mount(LiveCallClock, {
      ...mountOpts,
      props: { chartData: [] },
    });
    const labels = wrapper.findAll('.call-clock__labels text');
    expect(labels).toHaveLength(4);
    const text = labels.map((l) => l.text());
    expect(text).toEqual(['00', '06', '12', '18']);
  });

  it('shows the current-hour calls count in the center', () => {
    const currentHour = new Date().getHours();
    const wrapper = mount(LiveCallClock, {
      ...mountOpts,
      props: { chartData: buildHourly({ [currentHour]: 47 }) },
    });
    expect(wrapper.find('.call-clock__count').text()).toBe('47');
  });

  it('contains no gradient or filter defs (civic palette)', () => {
    const wrapper = mount(LiveCallClock, {
      ...mountOpts,
      props: { chartData: buildHourly({ 0: 10 }) },
    });
    const html = wrapper.html();
    expect(html).not.toContain('linearGradient');
    expect(html).not.toContain('radialGradient');
    expect(html).not.toContain('feGaussianBlur');
  });

  it('falls back to total - missed when calls field is absent', () => {
    const currentHour = new Date().getHours();
    const wrapper = mount(LiveCallClock, {
      ...mountOpts,
      props: {
        chartData: [{ hour: currentHour, total: 50, missed: 8 }],
      },
    });
    expect(wrapper.find('.call-clock__count').text()).toBe('42');
  });
});
