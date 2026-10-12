import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VoiceReviewRawTranscript from '@/components/admin/voice/VoiceReviewRawTranscript.vue';

const TRANSCRIPT = [
  'assistant: What is your name?',
  'user: John, J-O-H-N',
  'and Smith.',
  '[tool] save_case({"name": "John"})',
  '[tool result] ok',
  '[tool metadata] {"input_revision": 1}',
  'assistant: Thanks.',
].join('\n');

function testId(id: string) {
  return `[data-testid="${id}"]`;
}

function mountPanel(props: Record<string, unknown> = {}) {
  return mount(VoiceReviewRawTranscript, {
    props: { transcript: TRANSCRIPT, ...props },
    attachTo: document.body,
  });
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('VoiceReviewRawTranscript', () => {
  it('shows the speech as stored, in order, with no tool lines', () => {
    const wrapper = mountPanel();
    const lines = wrapper.findAll(testId('testVoiceRawTranscriptLine'));
    expect(lines.map((line) => line.text())).toEqual([
      'assistant: What is your name?',
      'user: John, J-O-H-N\nand Smith.',
      'assistant: Thanks.',
    ]);
    expect(wrapper.text()).not.toContain('[tool');
    expect(wrapper.text()).not.toContain('save_case');
  });

  it('copies the raw text without tool lines', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const wrapper = mountPanel();
    await wrapper.get(testId('testVoiceRawTranscriptCopy')).trigger('click');
    expect(writeText).toHaveBeenCalledWith(
      [
        'assistant: What is your name?',
        'user: John, J-O-H-N',
        'and Smith.',
        'assistant: Thanks.',
      ].join('\n'),
    );
  });

  it('marks the words a finding quotes', () => {
    const wrapper = mountPanel({ evidence: 'Caller: "John, J-O-H-N"' });
    expect(wrapper.get(testId('testVoiceRawEvidenceMark')).text()).toBe(
      'John, J-O-H-N',
    );
  });

  it('says there is no transcript, with nothing to copy', () => {
    const wrapper = mountPanel({
      transcript: '[tool] save_case({})\n[tool result] ok',
    });
    expect(wrapper.get(testId('testVoiceRawTranscriptEmpty')).text()).toBe(
      '~~No transcript',
    );
    expect(wrapper.find(testId('testVoiceRawTranscriptLine')).exists()).toBe(
      false,
    );
    expect(wrapper.find(testId('testVoiceRawTranscriptCopy')).exists()).toBe(
      false,
    );
  });

  it('is collapsed on a narrow screen until asked', async () => {
    const wrapper = mountPanel();
    const body = wrapper.get(testId('testVoiceRawTranscriptBody'));
    const toggle = wrapper.get(testId('testVoiceRawTranscriptToggle'));
    expect(body.classes()).toContain('hidden');
    expect(toggle.attributes('aria-expanded')).toBe('false');
    await toggle.trigger('click');
    expect(body.classes()).not.toContain('hidden');
    expect(toggle.attributes('aria-expanded')).toBe('true');
  });

  it('asks to hide itself on a wide screen', async () => {
    const wrapper = mountPanel();
    await wrapper.get(testId('testVoiceRawTranscriptHide')).trigger('click');
    expect(wrapper.emitted('update:hidden')).toEqual([[true]]);
  });
});
