import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import BaseText from '@/components/BaseText.vue';

describe('BaseText', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseText);
    expect(wrapper.text()).toBe('BaseText');
    expect(wrapper.classes()).toContain('text-body');
    expect(wrapper.classes()).toContain('font-body');
    expect(wrapper.classes()).toContain('text-crisiscleanup-dark-500');
    expect(wrapper.classes()).toContain('font-sans');
  });

  it('renders slot content', () => {
    const wrapper = mount(BaseText, {
      slots: {
        default: 'Custom Text',
      },
    });
    expect(wrapper.text()).toBe('Custom Text');
  });

  it('applies correct classes for different variants', () => {
    const variants = [
      {
        variant: 'h1',
        classes: ['text-h1', 'font-h1', 'text-crisiscleanup-dark-400'],
      },
      {
        variant: 'h2',
        classes: ['text-h2', 'font-h2', 'text-crisiscleanup-dark-500'],
      },
      {
        variant: 'h3',
        classes: ['text-h3', 'font-h3', 'text-crisiscleanup-dark-500'],
      },
      {
        variant: 'h4',
        classes: ['text-h4', 'font-h4', 'text-crisiscleanup-dark-400'],
      },
      {
        variant: 'body',
        classes: ['text-body', 'font-body', 'text-crisiscleanup-dark-500'],
      },
      { variant: 'bodysm', classes: ['text-bodysm', 'font-bodysm'] },
      { variant: 'bodyxsm', classes: ['text-bodyxsm', 'font-bodyxsm'] },
    ];

    for (const { variant, classes } of variants) {
      const wrapper = mount(BaseText, {
        props: { variant },
      });
      for (const className of classes) {
        expect(wrapper.classes()).toContain(className);
      }
    }
  });

  it('applies correct font classes', () => {
    const wrapper = mount(BaseText, {
      props: { font: 'display' },
    });
    expect(wrapper.classes()).toContain('font-display');
  });

  it('applies correct font weights', () => {
    const weightTests = [
      { props: { bold: true }, expected: { fontWeight: 700 } },
      { props: { semiBold: true }, expected: { fontWeight: 600 } },
      { props: { regular: true }, expected: { fontWeight: 400 } },
      { props: { weight: 500 }, expected: { fontWeight: 500 } },
    ];

    for (const { props, expected } of weightTests) {
      const wrapper = mount(BaseText, {
        props,
      });
      expect(wrapper.attributes('style')).toContain(
        `font-weight: ${expected.fontWeight}`,
      );
    }
  });

  it('prioritizes weight prop over other weight props', () => {
    const wrapper = mount(BaseText, {
      props: {
        weight: 500,
        bold: true,
        semiBold: true,
        regular: true,
      },
    });
    expect(wrapper.attributes('style')).toContain('font-weight: 500');
  });
});
