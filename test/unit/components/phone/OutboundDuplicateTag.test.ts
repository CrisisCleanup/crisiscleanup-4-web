import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import OutboundDuplicateTag from '@/components/phone/OutboundDuplicateTag.vue';

function factory(possibleDuplicate: any) {
  return mount(OutboundDuplicateTag, {
    props: {
      outbound: {
        incident_id: [320, 324],
        possible_duplicate: possibleDuplicate,
      },
    },
    global: { mocks: { $t: (k: string) => k.replace(/^~~/, '') } },
  });
}

describe('OutboundDuplicateTag.vue', () => {
  it('renders nothing without a possible duplicate', () => {
    expect(factory(null).html()).not.toContain('Possible duplicate');
  });

  it('links each case in the latest incident', () => {
    const wrapper = factory({
      cases: [{ id: 448_774, case_number: 'W123' }],
      ai_session_ids: [],
    });
    const link = wrapper.get('a');
    expect(link.text()).toBe('W123');
    expect(link.attributes('href')).toBe('/incident/324/work/448774');
    expect(wrapper.text()).not.toContain('AI took a call');
  });

  it('says when the AI took a call', () => {
    const wrapper = factory({ cases: [], ai_session_ids: [12] });
    expect(wrapper.text()).toContain('AI took a call');
    expect(wrapper.find('a').exists()).toBe(false);
  });
});
