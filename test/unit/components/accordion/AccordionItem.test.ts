import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AccordionItem from '@/components/accordion/AccordionItem.vue';

describe('AccordionItem', () => {
  it('should render with name prop', () => {
    const wrapper = mount(AccordionItem, {
      props: {
        name: 'Test Name',
      },
    });
    expect(wrapper.text()).toContain('Test Name');
  });

  it('should render with name slot', () => {
    const wrapper = mount(AccordionItem, {
      props: {
        name: 'Test Name',
      },
      slots: {
        name: '<div>Slot Name</div>',
      },
    });
    expect(wrapper.text()).toContain('Slot Name');
  });

  it.todo('should render default slot content', () => {
    const wrapper = mount(AccordionItem, {
      props: {
        name: 'Test Name',
      },
      slots: {
        default: '<div>Inner Content</div>',
      },
    });
    expect(wrapper.html()).not.toContain('Inner Content'); // Initially hidden
    wrapper.find('button').trigger('click');
    expect(wrapper.html()).toContain('Inner Content'); // Should be shown after click
  });

  it('should toggle isOpen state when button is clicked', async () => {
    const wrapper = mount(AccordionItem, {
      props: {
        name: 'Test Name',
      },
    });
    const button = wrapper.find('button');
    expect(wrapper.vm.isOpen).toBe(false);

    await button.trigger('click');
    expect(wrapper.vm.isOpen).toBe(true);

    await button.trigger('click');
    expect(wrapper.vm.isOpen).toBe(false);
  });

  it('should change icon based on isOpen state', async () => {
    const wrapper = mount(AccordionItem, {
      props: {
        name: 'Test Name',
        iconStyle: 'chevron',
      },
    });
    const button = wrapper.find('button');
    expect(wrapper.find('.svg-inline--fa').attributes('data-icon')).toBe(
      'chevron-right',
    );

    await button.trigger('click');
    expect(wrapper.find('.svg-inline--fa').attributes('data-icon')).toBe(
      'chevron-down',
    );

    await button.trigger('click');
    expect(wrapper.find('.svg-inline--fa').attributes('data-icon')).toBe(
      'chevron-right',
    );
  });

  it('matches snapshot when closed', () => {
    const wrapper = mount(AccordionItem, {
      props: {
        name: 'Test Name',
      },
      slots: {
        default: '<div>Inner Content</div>',
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('matches snapshot when open', async () => {
    const wrapper = mount(AccordionItem, {
      props: {
        name: 'Test Name',
      },
      slots: {
        default: '<div>Inner Content</div>',
      },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.html()).toMatchSnapshot();
  });
});
