import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CurrentCallVoicemail from '@/components/phone/CurrentCallVoicemail.vue';
import { commonComponentStubs } from '../../../helpers';

const i18nStub = {
  $t: (k: string, p?: Record<string, any>) =>
    p ? `${k} ${JSON.stringify(p)}` : k,
};

function factory(outbound: any, caller?: any) {
  const callerWithDefaults = caller ?? {
    caller_vm_count: 0,
    caller_vm_history: [],
  };

  return mount(CurrentCallVoicemail, {
    props: { outbound, caller: callerWithDefaults },
    global: {
      mocks: i18nStub,
      stubs: commonComponentStubs,
    },
  });
}

describe('CurrentCallVoicemail.vue', () => {
  it('renders summary + AI pill for a first-time caller with summary', () => {
    const wrapper = factory(
      {
        vm_url: 'https://example.com/vm.mp3',
        vm_transcription: 'Raw transcript.',
        vm_summary: 'Short AI summary.',
      },
      { caller_vm_count: 1, caller_vm_history: [] },
    );
    expect(wrapper.find('[data-testid="testVoicemailSummary"]').exists()).toBe(
      true,
    );
    expect(wrapper.text()).toContain('Short AI summary.');
    expect(wrapper.text()).toContain('~~AI-generated');
    expect(
      wrapper.find('[data-testid="testVoicemailPriorRibbon"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="testVoicemailHistoryDisclosure"]').exists(),
    ).toBe(false);
  });

  it('renders the pending skeleton when summary is not yet returned', () => {
    const wrapper = factory(
      {
        vm_url: 'https://example.com/vm.mp3',
        vm_transcription: null,
        vm_summary: null,
      },
      { caller_vm_count: 1, caller_vm_history: [] },
    );
    expect(
      wrapper.find('[data-testid="testVoicemailSummaryPending"]').exists(),
    ).toBe(true);
    expect(wrapper.text()).toContain('~~AI-generated');
    expect(wrapper.find('[data-testid="testVoicemailSummary"]').exists()).toBe(
      false,
    );
  });

  it('shows the repeat-caller ribbon and history disclosure for a repeat caller', () => {
    const history = [
      {
        id: 11,
        source: 'inbound' as const,
        created_at: '2026-04-01T10:00:00Z',
        vm_summary: 'Older VM A',
        vm_transcription: null,
      },
      {
        id: 12,
        source: 'outbound' as const,
        created_at: '2026-04-02T10:00:00Z',
        vm_summary: 'Older VM B',
        vm_transcription: 'B transcript',
      },
      {
        id: 13,
        source: 'inbound' as const,
        created_at: '2026-04-03T10:00:00Z',
        vm_summary: 'Older VM C',
        vm_transcription: null,
      },
    ];
    const wrapper = factory(
      {
        vm_url: 'https://example.com/vm.mp3',
        vm_transcription: null,
        vm_summary: 'Current summary',
      },
      { caller_vm_count: 4, caller_vm_history: history },
    );
    const ribbon = wrapper.find('[data-testid="testVoicemailPriorRibbon"]');
    expect(ribbon.exists()).toBe(true);
    expect(ribbon.text()).toContain('4');
    const hist = wrapper.find('[data-testid="testVoicemailHistoryDisclosure"]');
    expect(hist.exists()).toBe(true);
    expect(
      wrapper.find('[data-testid="testVoicemailHistoryItem_11"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="testVoicemailHistoryItem_12"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="testVoicemailHistoryItem_13"]').exists(),
    ).toBe(true);
  });

  it('renders skeleton for an opted-out caller (summary is null, transcription/audio exist)', () => {
    const wrapper = factory(
      {
        vm_url: 'https://example.com/vm.mp3',
        vm_transcription: 'Raw transcript only.',
        vm_summary: null,
      },
      { caller_vm_count: 1, caller_vm_history: [] },
    );
    expect(
      wrapper.find('[data-testid="testVoicemailSummaryPending"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="testVoicemailTranscription"]').exists(),
    ).toBe(true);
  });

  it('renders the audio element with preload="none" inside its disclosure', () => {
    const wrapper = factory(
      {
        vm_url: 'https://example.com/vm.mp3',
        vm_transcription: null,
        vm_summary: 'Summary',
      },
      { caller_vm_count: 1, caller_vm_history: [] },
    );
    const audio = wrapper.find('[data-testid="testVoicemailAudio"]');
    expect(audio.exists()).toBe(true);
    expect(audio.attributes('preload')).toBe('none');
    expect(audio.attributes('src')).toBe('https://example.com/vm.mp3');
  });

  it('respects newlines in summary via whitespace-pre-line', () => {
    const wrapper = factory(
      {
        vm_url: null,
        vm_transcription: null,
        vm_summary: 'line 1\nline 2',
      },
      { caller_vm_count: 1, caller_vm_history: [] },
    );
    const summary = wrapper.find('[data-testid="testVoicemailSummary"]');
    expect(summary.exists()).toBe(true);
    expect(summary.classes()).toContain('whitespace-pre-line');
    expect(summary.text()).toContain('line 1');
    expect(summary.text()).toContain('line 2');
  });

  it('renders voicemail section based on caller history even when current call has none', () => {
    const wrapper = factory(
      {
        vm_url: null,
        vm_transcription: null,
        vm_summary: null,
      },
      {
        caller_vm_count: 3,
        caller_vm_history: [
          {
            id: 100,
            source: 'inbound' as const,
            created_at: '2026-01-01T00:00:00Z',
            vm_summary: 'From a previous call',
            vm_transcription: null,
          },
        ],
      },
    );
    expect(
      wrapper.find('[data-testid="testVoicemailHistoryDisclosure"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="testVoicemailPriorRibbon"]').exists(),
    ).toBe(true);
    // No current-call summary/audio surfaces.
    expect(wrapper.find('[data-testid="testVoicemailSummary"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="testVoicemailAudio"]').exists()).toBe(
      false,
    );
  });
});
