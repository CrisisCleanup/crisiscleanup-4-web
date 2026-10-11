import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VoiceMetrics from '@/components/admin/voice/VoiceMetrics.vue';
import type { ResponseMetrics } from '@/hooks/voice/voiceConsoleState';

const metric = (overrides: Partial<ResponseMetrics> = {}): ResponseMetrics => ({
  at: '0:30',
  ttft: 0.4,
  duration: 1,
  input_tokens: 10,
  cached_tokens: 2,
  output_tokens: 20,
  estimated_cost_usd: 0.02,
  ...overrides,
});

function stat(wrapper: Pick<VueWrapper, 'findAll'>, label: string) {
  return wrapper
    .findAll('dl > div')
    .find((row) => row.find('dt').text().includes(label))
    ?.find('dd')
    .text();
}

describe('VoiceMetrics', () => {
  it('uses the latest cumulative Live usage and separates voice from backend cost', () => {
    const wrapper = mount(VoiceMetrics, {
      props: {
        model: 'gpt-live-1',
        metrics: [
          metric({
            gpt_live_session_seconds: 60,
            gpt_live_voice_cost_usd: 0.05,
          }),
          metric({
            gpt_live_session_seconds: 120,
            gpt_live_voice_cost_usd: 0.1,
          }),
        ],
      },
    });

    expect(stat(wrapper, 'Live billed time')).toBe('120.00 s');
    expect(stat(wrapper, 'Est. voice cost')).toBe('$0.100');
    expect(stat(wrapper, 'Luna cost')).toContain('Not estimated');
    expect(wrapper.text()).toContain('including silence');
    expect(wrapper.text()).not.toContain('realtime model tokens only');
    expect(stat(wrapper, 'Input tokens')).toBe('20');
  });

  it('detects Live from metrics when configuration has not arrived', () => {
    const wrapper = mount(VoiceMetrics, {
      props: {
        metrics: [
          metric({ gpt_live_session_seconds: 0, gpt_live_voice_cost_usd: 0 }),
        ],
      },
    });
    expect(stat(wrapper, 'Est. voice cost')).toBe('0.00¢');
    expect(stat(wrapper, 'Live billed time')).toBe('0.00 s');
  });

  it('shows unknown Live costs before any metrics arrive', () => {
    const wrapper = mount(VoiceMetrics, {
      props: { model: 'gpt-live-1', metrics: [] },
    });
    expect(stat(wrapper, 'Est. voice cost')).toBe('—');
    expect(stat(wrapper, 'Live billed time')).toBe('—');
    expect(stat(wrapper, 'Luna cost')).toContain('Not estimated');
  });

  it('preserves token cost estimates for other realtime models', () => {
    const wrapper = mount(VoiceMetrics, {
      props: { model: 'gpt-realtime', metrics: [metric()] },
    });
    expect(stat(wrapper, 'Est. cost')).toBe('$0.020');
    expect(wrapper.text()).toContain('realtime model tokens only');
    expect(wrapper.text()).not.toContain('Live billed time');
  });
});
