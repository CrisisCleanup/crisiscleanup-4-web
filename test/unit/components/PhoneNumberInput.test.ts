import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PhoneNumberInput from '@/components/PhoneNumberInput.vue';
import BaseInput from '@/components/BaseInput.vue';
import useValidation from '@/hooks/useValidation';

vi.mock('@/hooks/useValidation', () => ({
  default: () => ({
    validatePhoneNumber: vi.fn((value) => ({
      newValue: `formatted-${value}`,
      valid: true,
    })),
  }),
}));

describe('PhoneNumberInput', () => {
  it('should not log any errors', () => {
    const spy = vi.spyOn(global.console, 'error');
    mount(PhoneNumberInput);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should format initial modelValue', () => {
    const wrapper = mount(PhoneNumberInput, {
      props: {
        modelValue: '1234567890',
      },
    });
    expect(wrapper.emitted('update:modelValue')).toEqual([
      ['formatted-1234567890'],
    ]);
  });

  it('should emit update:modelValue on input', async () => {
    const wrapper = mount(PhoneNumberInput);
    const baseInput = wrapper.findComponent(BaseInput);
    await baseInput.vm.$emit('update:modelValue', 'new value');
    expect(wrapper.emitted('update:modelValue')).toEqual([['new value']]);
  });

  it('should emit iconClicked on icon click', async () => {
    const wrapper = mount(PhoneNumberInput);
    const baseInput = wrapper.findComponent(BaseInput);
    await baseInput.vm.$emit('icon-clicked');
    expect(wrapper.emitted('iconClicked')).toBeTruthy();
  });

  it('should render correctly and match snapshot', () => {
    const wrapper = mount(PhoneNumberInput, {
      props: {
        size: 'large',
      },
    });
    expect(wrapper.element).toMatchSnapshot();
  });

  it('should render correctly and match snapshot with label', () => {
    const wrapper = mount(PhoneNumberInput, {
      props: {
        size: 'large',
        topLabel: 'Top Label',
      },
    });
    expect(wrapper.element).toMatchSnapshot();
  });

  it('should render correctly and match snapshot when required and provided', () => {
    const wrapper = mount(PhoneNumberInput, {
      props: {
        size: 'large',
        required: true,
        modelValue: 'Test',
      },
    });
    expect(wrapper.element).toMatchSnapshot();
  });
});
