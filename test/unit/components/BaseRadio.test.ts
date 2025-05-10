import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseRadio from '@/components/BaseRadio.vue';

describe('BaseRadio', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseRadio, {
      props: {
        name: 'test-radio',
        modelValue: '',
        label: 'Option 1',
      },
    });

    expect(wrapper.find('input[type="radio"]').exists()).toBe(true);
    expect(wrapper.find('input[type="radio"]').attributes('name')).toBe(
      'test-radio',
    );
    expect(wrapper.text()).toBe('test-radio');
  });

  it('emits update:modelValue and change events when selected', async () => {
    const wrapper = mount(BaseRadio, {
      props: {
        name: 'test-radio',
        modelValue: '',
        label: 'Option 1',
      },
    });

    await wrapper.find('input[type="radio"]').setValue(true);

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['Option 1']);
    expect(wrapper.emitted('change')).toBeTruthy();
    expect(wrapper.emitted('change')[0]).toEqual(['Option 1']);
  });

  it('applies checked class when selected', () => {
    const wrapper = mount(BaseRadio, {
      props: {
        name: 'test-radio',
        modelValue: 'Option 1',
        label: 'Option 1',
      },
    });

    expect(wrapper.find('input[type="radio"]').classes()).toContain('checked');
  });

  it('applies custom label class', () => {
    const wrapper = mount(BaseRadio, {
      props: {
        name: 'test-radio',
        modelValue: '',
        label: 'Option 1',
        labelClass: 'custom-label',
      },
    });

    expect(wrapper.find('span').classes()).toContain('custom-label');
  });

  it('renders slot content instead of name when provided', () => {
    const wrapper = mount(BaseRadio, {
      props: {
        name: 'test-radio',
        modelValue: '',
        label: 'Option 1',
      },
      slots: {
        default: 'Custom Label',
      },
    });

    expect(wrapper.text()).toBe('Custom Label');
  });

  it('handles boolean type correctly', () => {
    const wrapper = mount(BaseRadio, {
      props: {
        name: 'test-radio',
        modelValue: true,
        label: 'true',
        type: 'boolean',
      },
    });

    expect(wrapper.find('input[type="radio"]').classes()).toContain('checked');
  });
});
