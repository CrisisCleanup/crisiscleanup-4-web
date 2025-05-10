import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseSwitch from '@/components/BaseSwitch.vue';

describe('BaseSwitch', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseSwitch, {
      props: {
        modelValue: false,
      },
    });

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
    expect(wrapper.find('.toggle-path').exists()).toBe(true);
    expect(wrapper.find('.toggle-dot').exists()).toBe(true);
  });

  it('emits update:modelValue when toggled', async () => {
    const wrapper = mount(BaseSwitch, {
      props: {
        modelValue: false,
      },
    });

    await wrapper.find('input[type="checkbox"]').setValue(true);
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true]);
  });

  it('applies correct classes when value is true', () => {
    const wrapper = mount(BaseSwitch, {
      props: {
        modelValue: true,
      },
    });

    const togglePath = wrapper.find('.toggle-path');
    const toggleDot = wrapper.find('.toggle-dot');

    expect(togglePath.classes()).toContain('bg-crisiscleanup-light-smoke');
    expect(toggleDot.classes()).toContain('translate-x-full');
  });

  it('applies correct classes when value is false', () => {
    const wrapper = mount(BaseSwitch, {
      props: {
        modelValue: false,
      },
    });

    const togglePath = wrapper.find('.toggle-path');
    const toggleDot = wrapper.find('.toggle-dot');

    expect(togglePath.classes()).toContain('bg-crisiscleanup-grey-300');
    expect(toggleDot.classes()).toContain('translate-x-0');
  });

  it('renders slot content', () => {
    const wrapper = mount(BaseSwitch, {
      props: {
        modelValue: false,
      },
      slots: {
        default: 'Toggle Switch',
      },
    });

    expect(wrapper.text()).toContain('Toggle Switch');
  });
});
