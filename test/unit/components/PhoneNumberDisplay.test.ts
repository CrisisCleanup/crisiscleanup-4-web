import { mount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay.vue';
import { formatNationalNumber } from '@/filters';

vi.mock('@/filters', () => ({
  formatNationalNumber: vi.fn((number) => `Formatted: ${number}`),
}));

describe('PhoneNumberDisplay', () => {
  let wrapper: any;
  beforeEach(() => {
    wrapper = mount(PhoneNumberDisplay, {
      props: {
        phoneNumber: '1234567890',
      },
    });
  });

  it('formats the phone number using formatNationalNumber', () => {
    expect(formatNationalNumber).toHaveBeenCalledWith('1234567890');
    expect(wrapper.text()).toContain('Formatted: 1234567890');
  });

  it('renders the CopyText component with correct props', () => {
    const copyTextComponent = wrapper.findComponent({ name: 'CopyText' });
    expect(copyTextComponent.exists()).toBe(true);
    expect(copyTextComponent.props('text')).toBe('Formatted: 1234567890');
    expect(copyTextComponent.props('iconClass')).toBe(
      'p-2 rounded-r-full text-sm bg-primary-light bg-opacity-80',
    );
  });

  it('renders a link with the correct href', () => {
    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('tel:1234567890');
  });
});
