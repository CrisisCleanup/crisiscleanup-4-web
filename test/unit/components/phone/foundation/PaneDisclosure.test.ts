import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PaneDisclosure from '@/components/phone/foundation/PaneDisclosure.vue';
import { commonComponentStubs } from '../../../../helpers';

describe('PaneDisclosure.vue', () => {
  it('forwards the required name prop and renders the default title', () => {
    const wrapper = mount(PaneDisclosure, {
      props: { name: 'history', title: 'Prior voicemails' },
      global: { stubs: commonComponentStubs },
    });
    expect(wrapper.text()).toContain('Prior voicemails');
  });

  it('falls back to name when title is omitted', () => {
    const wrapper = mount(PaneDisclosure, {
      props: { name: 'transcript' },
      global: { stubs: commonComponentStubs },
    });
    expect(wrapper.text()).toContain('transcript');
  });

  it('renders a count pill when count > 0', () => {
    const wrapper = mount(PaneDisclosure, {
      props: { name: 'history', title: 'Prior voicemails', count: 3 },
      global: { stubs: commonComponentStubs },
    });
    expect(wrapper.text()).toContain('3');
  });

  it('does not render a count pill when count is 0 or undefined', () => {
    const wrapper = mount(PaneDisclosure, {
      props: { name: 'history', title: 'Prior voicemails', count: 0 },
      global: { stubs: commonComponentStubs },
    });
    expect(wrapper.findComponent({ name: 'BasePill' }).exists()).toBe(false);
  });

  it('renders the body slot content when start-open', () => {
    const wrapper = mount(PaneDisclosure, {
      props: { name: 'audio', title: 'Play recording', startOpen: true },
      slots: { default: '<p data-testid="body">hi</p>' },
      global: { stubs: commonComponentStubs },
    });
    expect(wrapper.find('[data-testid="body"]').exists()).toBe(true);
  });
});
