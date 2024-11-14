import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import Slider from '@/components/Slider.vue'; // Adjust the path if necessary
import CcuIcon from '@/components/BaseIcon.vue'; // Adjust the path if necessary

describe('Slider.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(Slider);

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.range-slider__range').exists()).toBe(true);
    expect(wrapper.find('.range-slider__range').element.value).toBe('0');
  });

  it('renders correctly with provided props', () => {
    const wrapper = mount(Slider, {
      props: {
        min: 0,
        max: 100,
        step: 1,
        value: 50,
        title: 'Test Slider',
      },
    });

    expect(wrapper.find('.range-slider__range').element.value).toBe('50');
    expect(
      wrapper.find('[data-testid="testSliderTest SliderInput"]').text(),
    ).toBe('Test Slider');
  });

  it('emits input event with correct value when slider is changed', async () => {
    const wrapper = mount(Slider, {
      props: {
        min: 0,
        max: 10,
        step: 1,
        value: 5,
      },
    });

    const sliderInput = wrapper.find('.range-slider__range');
    await sliderInput.setValue(7);
    await sliderInput.trigger('input');

    expect(wrapper.emitted('input')).toBeTruthy();
    expect(wrapper.emitted('input')[0]).toEqual([7]);
  });

  it.todo(
    'emits input event with correct value when from label is clicked',
    async () => {
      const wrapper = mount(Slider, {
        props: {
          from: '1',
        },
      });

      const fromLabel = wrapper.find(
        '.text-crisiscleanup-grey-900.cursor-pointer',
      );
      await fromLabel.trigger('click');

      expect(wrapper.emitted('input')).toBeTruthy();
      expect(wrapper.emitted('input')[0]).toEqual([1]);
    },
  );

  it('emits input event with correct value when to label is clicked', async () => {
    const wrapper = mount(Slider, {
      props: {
        to: '100',
        max: 100,
      },
    });

    const toLabel = wrapper.find(
      '.text-crisiscleanup-grey-900.cursor-pointer:last-child',
    );
    await toLabel.trigger('click');

    expect(wrapper.emitted('input')).toBeTruthy();
    expect(wrapper.emitted('input')[0]).toEqual([100]);
  });

  it('renders help icon with tooltip when fromTooltip is provided', () => {
    const wrapper = mount(Slider, {
      props: {
        fromTooltip: 'This is a tooltip',
      },
      global: {
        components: {
          CcuIcon,
        },
      },
    });

    const helpIcon = wrapper.findComponent(CcuIcon);
    expect(helpIcon.exists()).toBe(true);
    expect(helpIcon.attributes('alt')).toBe('actions.help_alt');
  });
});
