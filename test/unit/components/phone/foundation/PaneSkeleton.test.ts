import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PaneSkeleton from '@/components/phone/foundation/PaneSkeleton.vue';

describe('PaneSkeleton.vue', () => {
  it('renders a line variant by default with default width/height classes', () => {
    const wrapper = mount(PaneSkeleton);
    const root = wrapper.element as HTMLElement;
    expect(root.className).toContain('animate-pulse');
    expect(root.className).toContain('w-full');
    expect(root.className).toContain('h-3');
  });

  it('applies requested width and height classes for the line variant', () => {
    const wrapper = mount(PaneSkeleton, {
      props: { variant: 'line', width: '1/2', height: 'lg' },
    });
    const root = wrapper.element as HTMLElement;
    expect(root.className).toContain('w-1/2');
    expect(root.className).toContain('h-4');
  });

  it('renders the block variant with shadowed card container and three bars', () => {
    const wrapper = mount(PaneSkeleton, { props: { variant: 'block' } });
    const root = wrapper.element as HTMLElement;
    expect(root.className).toContain('shadow-crisiscleanup-card');
    expect(root.querySelectorAll('div').length).toBe(3);
  });

  it('renders the row variant with a border-b and two bars', () => {
    const wrapper = mount(PaneSkeleton, { props: { variant: 'row' } });
    const root = wrapper.element as HTMLElement;
    expect(root.className).toContain('border-b');
    expect(root.querySelectorAll('div').length).toBe(2);
  });
});
