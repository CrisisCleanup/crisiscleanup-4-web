import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VoiceToolLog from '@/components/admin/voice/VoiceToolLog.vue';

describe('VoiceToolLog', () => {
  it('shows Decisions errors when the backend sends an empty output', () => {
    const wrapper = mount(VoiceToolLog, {
      props: {
        tools: [
          {
            at: '0:10',
            name: 'decisions_backend',
            arguments: '{}',
            output: '',
            is_error: true,
            error: 'Synthetic backend error',
            ms: 100,
          },
        ],
      },
    });
    expect(wrapper.text()).toContain('Synthetic backend error');
    expect(wrapper.get('summary').text()).toContain('decisions_backend');
  });
});
