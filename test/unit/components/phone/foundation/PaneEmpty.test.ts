import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import PaneEmpty from '@/components/phone/foundation/PaneEmpty.vue';

describe('PaneEmpty.vue', () => {
  it('renders the required title', () => {
    const wrapper = mount(PaneEmpty, {
      props: { title: 'No recent cases' },
    });
    expect(wrapper.text()).toContain('No recent cases');
    expect(wrapper.attributes('role')).toBe('status');
  });

  it('renders the optional description when provided', () => {
    const wrapper = mount(PaneEmpty, {
      props: {
        title: 'No recent cases',
        description: 'New cases will appear here.',
      },
    });
    expect(wrapper.text()).toContain('New cases will appear here.');
  });

  it('renders the action slot when provided', () => {
    const wrapper = mount(PaneEmpty, {
      props: { title: 'Empty' },
      slots: {
        action: '<button data-testid="go">Start</button>',
      },
    });
    expect(wrapper.find('[data-testid="go"]').exists()).toBe(true);
  });

  it('renders the icon when provided', () => {
    const FakeIcon = { render: () => h('svg', { 'data-testid': 'fake-ico' }) };
    const wrapper = mount(PaneEmpty, {
      props: { title: 'Empty', icon: FakeIcon },
    });
    expect(wrapper.find('[data-testid="fake-ico"]').exists()).toBe(true);
  });
});
