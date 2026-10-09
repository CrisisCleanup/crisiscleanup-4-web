import { describe, expect, it } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import VoiceCasePanel from '@/components/admin/voice/VoiceCasePanel.vue';
import { emptyCaseState } from '@/hooks/voice/voiceConsoleState';

const mountPanel = (props: Record<string, unknown>) =>
  mount(VoiceCasePanel, {
    props,
    global: { stubs: { RouterLink: RouterLinkStub, Badge: true } },
  });

describe('VoiceCasePanel', () => {
  it('shows the recorded fields and what is still needed', () => {
    const wrapper = mountPanel({
      caseState: {
        ...emptyCaseState(),
        incident: { id: 248, name: 'Medium Flood' },
        fields: { phone1: '647-980-4730', older_than_60: 'false' },
        missing: ['Name'],
      },
      finalized: null,
    });
    expect(wrapper.text()).toContain('Medium Flood');
    expect(wrapper.text()).toContain('older than 60');
    expect(wrapper.text()).toContain('647-980-4730');
    expect(wrapper.text()).toContain('Name');
    expect(wrapper.find('[data-testid="testVoiceCaseCreated"]').exists()).toBe(
      false,
    );
  });

  it('links a created case to its edit page', () => {
    const wrapper = mountPanel({
      caseState: {
        ...emptyCaseState(),
        incident: { id: 248, name: 'Medium Flood' },
      },
      finalized: { case_number: 'P2454', worksite_id: 9001 },
    });
    expect(
      wrapper.find('[data-testid="testVoiceCaseCreated"]').text(),
    ).toContain('P2454');
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe(
      '/incident/248/work/9001/edit',
    );
  });
});
