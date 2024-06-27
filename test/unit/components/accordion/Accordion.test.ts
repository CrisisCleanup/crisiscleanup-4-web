import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Accordion from '@/components/accordion/Accordion.vue'; // Adjust the import path as necessary

describe('Accordion', () => {
  it('renders correctly', () => {
    const wrapper = mount(Accordion);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.classes()).toContain('divide-y');
    expect(wrapper.classes()).toContain('divide-gray-200');
  });

  it('renders default slot content', () => {
    const wrapper = mount(Accordion, {
      slots: {
        default: '<div>Accordion Item</div>',
      },
    });
    expect(wrapper.html()).toContain('<div>Accordion Item</div>');
  });

  it('matches snapshot', () => {
    const wrapper = mount(Accordion, {
      slots: {
        default: '<div>Accordion Item</div>',
      },
    });
    expect(wrapper.html()).toMatchInlineSnapshot(`
      "<div class="divide-y divide-gray-200">
        <div>Accordion Item</div>
      </div>"
    `);
  });
});
