import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LiveEngagementGauge from '@/components/live/LiveEngagementGauge.vue';

describe('LiveEngagementGauge', () => {
  it('renders the SVG with track + fill arc paths', () => {
    const wrapper = mount(LiveEngagementGauge, { props: { value: 50 } });
    expect(wrapper.find('[data-testid="testEngagementGauge"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('.engagement-gauge__track').exists()).toBe(true);
    expect(wrapper.find('.engagement-gauge__fill').exists()).toBe(true);
  });

  it('clamps the value to 0..100 and reflects it in stroke-dashoffset', () => {
    const wrapper = mount(LiveEngagementGauge, { props: { value: 150 } });
    const fill = wrapper.find('.engagement-gauge__fill');
    // value=150 → clamped to 100 → dashoffset 0 (full arc visible)
    expect(fill.attributes('stroke-dashoffset')).toBe('0');
  });

  it('renders 21 tick marks (0/5/10/.../100)', () => {
    const wrapper = mount(LiveEngagementGauge, { props: { value: 0 } });
    expect(wrapper.findAll('.engagement-gauge__ticks line')).toHaveLength(21);
  });

  it('marks ticks at-or-below the current value as reached', () => {
    const wrapper = mount(LiveEngagementGauge, { props: { value: 50 } });
    const reached = wrapper.findAll(
      '.engagement-gauge__ticks line[data-reached="1"]',
    );
    // 0,5,10,...,50 = 11 reached
    expect(reached).toHaveLength(11);
  });

  it('contains no gradient, glow, or shadow defs (civic palette only)', () => {
    const wrapper = mount(LiveEngagementGauge, { props: { value: 64 } });
    const html = wrapper.html();
    expect(html).not.toContain('linearGradient');
    expect(html).not.toContain('radialGradient');
    expect(html).not.toContain('feGaussianBlur');
    expect(html).not.toContain('filter url');
  });
});
