import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseLink from '@/components/BaseLink.vue';

describe('BaseLink', () => {
  it('renders as a router-link when to prop is provided', () => {
    const wrapper = mount(BaseLink, {
      props: {
        to: '/some-route',
      },
      slots: {
        default: 'Test Link',
      },
    });

    expect(wrapper.find('router-link').exists()).toBe(true);
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.text()).toBe('Test Link');
  });

  it('renders as an anchor tag when href prop is provided', () => {
    const wrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
      },
      slots: {
        default: 'Test Link',
      },
    });

    expect(wrapper.find('a').exists()).toBe(true);
    expect(wrapper.find('router-link').exists()).toBe(false);
    expect(wrapper.text()).toBe('Test Link');
  });

  it('applies light variant class when linkVariant is light', () => {
    const wrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
        linkVariant: 'light',
      },
      slots: {
        default: 'Test Link',
      },
    });

    expect(wrapper.find('a').classes()).toContain('link');
  });

  it('applies dark variant class when linkVariant is dark', () => {
    const wrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
        linkVariant: 'dark',
      },
      slots: {
        default: 'Test Link',
      },
    });

    expect(wrapper.classes()).toContain('link-dark');
  });

  it('passes target attribute to the link', () => {
    const wrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
        target: '_blank',
      },
      slots: {
        default: 'Test Link',
      },
    });

    expect(wrapper.attributes('target')).toBe('_blank');
  });
});
