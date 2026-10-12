import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import VoiceCallConversation from '@/components/admin/voice/VoiceCallConversation.vue';
import { parseSpeechTurns } from '@/hooks/voice/voiceTranscript';

const stubs = { Spinner: true };

const TRANSCRIPT = [
  'assistant: What is your name?',
  'user: John, J-O-H-N.',
  'assistant: And your phone?',
  'user: 918 555 0142.',
].join('\n');

function testId(id: string) {
  return `[data-testid="${id}"]`;
}

function decision(turn: number, caller_text: string) {
  return {
    turn,
    at: null,
    caller_text,
    route: 'intake',
    callback: '',
    intake_answer: true,
    service_question: false,
    rules_applied: ['offer_waits_for_caller_need'],
    actions: [],
  };
}

function mountConversation(props: Record<string, unknown> = {}) {
  return mount(VoiceCallConversation, {
    props: {
      turns: parseSpeechTurns(TRANSCRIPT),
      audioUrl: 'https://signed.example/3.ogg',
      ...props,
    },
    global: { stubs },
    attachTo: document.body,
  });
}

function mockAudio(wrapper: ReturnType<typeof mountConversation>) {
  const audio = wrapper.get(testId('testVoiceReviewAudio'))
    .element as HTMLAudioElement;
  const times: number[] = [];
  Object.defineProperty(audio, 'currentTime', {
    configurable: true,
    get: () => times.at(-1) ?? 0,
    set: (value: number) => times.push(value),
  });
  Object.defineProperty(audio, 'duration', { configurable: true, value: 80 });
  const play = vi.fn(() => Promise.resolve());
  audio.play = play;
  return { times, play };
}

describe('VoiceCallConversation recording', () => {
  it('plays the recording from the review', () => {
    const wrapper = mountConversation();
    expect(wrapper.get(testId('testVoiceReviewAudio')).attributes('src')).toBe(
      'https://signed.example/3.ogg',
    );
  });

  it('says so when there is no recording link', () => {
    const wrapper = mountConversation({ audioUrl: undefined });
    expect(wrapper.find(testId('testVoiceReviewAudio')).exists()).toBe(false);
    expect(wrapper.get(testId('testVoiceNoRecording')).text()).toContain(
      'No recording link is available',
    );
  });

  it('seeks to the offset of a line, or to its place in the call', async () => {
    const turns = [
      {
        id: 0,
        role: 'assistant',
        text: 'What is your name?',
        offset_seconds: 1.5,
      },
      { id: 1, role: 'user', text: 'John, J-O-H-N.', offset_seconds: 4 },
      {
        id: 2,
        role: 'assistant',
        text: 'And your phone?',
        offset_seconds: null,
      },
      { id: 3, role: 'user', text: '918 555 0142.', offset_seconds: null },
    ];
    const wrapper = mountConversation({ turns });
    const { times, play } = mockAudio(wrapper);
    const lines = wrapper.findAll(testId('testVoiceTranscriptLine'));
    expect(lines).toHaveLength(4);

    await lines[1].trigger('click');
    // No offset: line 3 of 4 is three quarters into an 80 second call.
    await lines[3].trigger('click');
    expect(times).toEqual([4, 60]);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('seeks in proportion when only the stored transcript is there', async () => {
    const wrapper = mountConversation();
    const { times } = mockAudio(wrapper);
    await wrapper
      .findAll(testId('testVoiceTranscriptLine'))[2]
      .trigger('click');
    expect(times).toEqual([40]);
  });
});

describe('VoiceCallConversation evidence', () => {
  it('marks the quoted words of the chosen finding', async () => {
    const wrapper = mountConversation();
    expect(wrapper.find(testId('testVoiceEvidenceMark')).exists()).toBe(false);
    await wrapper.setProps({ evidence: 'Caller: "John, J-O-H-N."' });
    expect(wrapper.get(testId('testVoiceEvidenceMark')).text()).toBe(
      'John, J-O-H-N',
    );
    await wrapper.setProps({ evidence: undefined });
    expect(wrapper.find(testId('testVoiceEvidenceMark')).exists()).toBe(false);
  });
});

describe('VoiceCallConversation decisions', () => {
  it('shows each decision under the caller line it belongs to', async () => {
    const wrapper = mountConversation({
      decisions: [decision(1, 'John, J-O-H-N'), decision(2, '918 555 0142')],
    });
    await flushPromises();
    // Lines and decisions in the order they show.
    const order = wrapper
      .findAll(
        '[data-testid="testVoiceTranscriptLine"], [data-testid="testVoiceDecision"]',
      )
      .map((item) => item.attributes('data-testid'));
    expect(order).toEqual([
      'testVoiceTranscriptLine',
      'testVoiceTranscriptLine',
      'testVoiceDecision',
      'testVoiceTranscriptLine',
      'testVoiceTranscriptLine',
      'testVoiceDecision',
    ]);
    // Under the line with the caller's words, so they are not repeated.
    expect(wrapper.find(testId('testVoiceDecisionCaller')).exists()).toBe(
      false,
    );
    expect(wrapper.find(testId('testVoiceDecisions')).exists()).toBe(false);
  });

  it('lists a decision that fits no line apart, with the caller words', () => {
    const wrapper = mountConversation({
      decisions: [decision(9, 'Something the transcript never had')],
    });
    const list = wrapper.get(testId('testVoiceDecisions'));
    expect(list.text()).toContain('Decisions that match no line');
    expect(list.get(testId('testVoiceDecisionCaller')).text()).toBe(
      'Something the transcript never had',
    );
  });
});
