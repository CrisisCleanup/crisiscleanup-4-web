import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import Tag from '@/components/Tag.vue'; // Adjust the path if necessary
import CcuIcon from '@/components/BaseIcon.vue'; // Adjust the path if necessary

describe('Tag.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(Tag);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.classes()).toContain('tag');
    expect(wrapper.find('[data-testid="testCancelIcon"]').exists()).toBe(false);
  });

  it('renders correctly when closeable is true', () => {
    const wrapper = mount(Tag, {
      props: {
        closeable: true,
      },
      global: {
        components: {
          CcuIcon,
        },
      },
    });

    expect(wrapper.find('[data-testid="testCancelIcon"]').exists()).toBe(true);
  });

  it('emits closed event when cancel icon is clicked', async () => {
    const wrapper = mount(Tag, {
      props: {
        closeable: true,
      },
      global: {
        components: {
          CcuIcon,
        },
      },
    });

    const cancelIcon = wrapper.find('[data-testid="testCancelIcon"]');
    await cancelIcon.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('closed');
  });
});
