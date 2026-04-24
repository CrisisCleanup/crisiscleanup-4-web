import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PaneError from '@/components/phone/foundation/PaneError.vue';
import { commonComponentStubs } from '../../../../helpers';

describe('PaneError.vue', () => {
  it('renders the required title and role="alert"', () => {
    const wrapper = mount(PaneError, {
      props: { title: 'Something went wrong' },
      global: { stubs: commonComponentStubs },
    });
    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.text()).toContain('Something went wrong');
  });

  it('renders description when provided', () => {
    const wrapper = mount(PaneError, {
      props: { title: 'Fetch failed', description: 'Check your network.' },
      global: { stubs: commonComponentStubs },
    });
    expect(wrapper.text()).toContain('Check your network.');
  });

  it('renders the action slot when provided', () => {
    const wrapper = mount(PaneError, {
      props: { title: 'Fetch failed' },
      slots: { action: '<button data-testid="retry">Retry</button>' },
      global: { stubs: commonComponentStubs },
    });
    expect(wrapper.find('[data-testid="retry"]').exists()).toBe(true);
  });
});
