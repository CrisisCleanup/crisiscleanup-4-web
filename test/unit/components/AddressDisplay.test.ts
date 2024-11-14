import { mount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AddressDisplay from '@/components/AddressDisplay.vue';
import { generateGoogleMapsLink } from '@/utils/helpers';

vi.mock('@/utils/helpers', () => ({
  generateGoogleMapsLink: vi.fn((address, latitude, longitude) => {
    let link = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    if (latitude !== undefined && longitude !== undefined) {
      link += `&ll=${latitude},${longitude}`;
    }
    return link;
  }),
}));

describe('AddressDisplay', () => {
  let wrapper: any;
  beforeEach(() => {
    wrapper = mount(AddressDisplay, {
      props: {
        address: '123 Main St, Anytown, USA',
        latitude: 40.7128,
        longitude: -74.006,
      },
    });
  });

  it('renders the formatted address', () => {
    expect(wrapper.text()).toContain('123 Main St, Anytown, USA');
  });

  it('generates the correct Google Maps link', () => {
    expect(generateGoogleMapsLink).toHaveBeenCalledWith(
      '123 Main St, Anytown, USA',
      40.7128,
      -74.006,
    );
    const link = wrapper.find('a');
    expect(link.attributes('href')).toBe(
      'https://maps.google.com/?q=123%20Main%20St%2C%20Anytown%2C%20USA&ll=40.7128,-74.006',
    );
  });

  it('renders the CopyText component with correct props', () => {
    const copyTextComponent = wrapper.findComponent({ name: 'CopyText' });
    expect(copyTextComponent.exists()).toBe(true);
    expect(copyTextComponent.props('text')).toBe('123 Main St, Anytown, USA');
    expect(copyTextComponent.props('iconClass')).toBe('px-2');
  });

  it('renders a link with target="_blank" and rel="noopener noreferrer"', () => {
    const link = wrapper.find('a');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
  });
});
