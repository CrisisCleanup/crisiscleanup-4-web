import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VoiceCallDebug from '@/components/admin/voice/VoiceCallDebug.vue';

const download = vi.hoisted(() => vi.fn());
vi.mock('@/components/admin/voice/download', () => ({
  downloadText: download,
}));

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    call_id: 'console-test-room',
    created_at: '2026-10-10T12:00:00Z',
    ended_at: '2026-10-10T12:03:00Z',
    duration_seconds: 180,
    status: 'abandoned',
    referral: '',
    language: 'en',
    is_test: true,
    model: 'gpt-live-1',
    voice: 'marin',
    estimated_cost_usd: null,
    incident: 'Medium Flood',
    incident_id: 248,
    case_number: null,
    worksite_id: null,
    cases: [],
    flags: [],
    review_id: null,
    open_issues: 0,
    transcript: 'assistant: Hello\n[tool] save_case {}\n[tool result] ok',
    error: '',
    ...overrides,
  };
}

async function mountDebug(overrides: Record<string, unknown> = {}) {
  const wrapper = mount(VoiceCallDebug, {
    props: { session: session(overrides) as never },
  });
  await flushPromises();
  return wrapper;
}

function detail(
  wrapper: Awaited<ReturnType<typeof mountDebug>>,
  label: string,
) {
  return wrapper
    .findAll('dt')
    .find((row) => row.text().includes(label))
    ?.element.nextElementSibling?.textContent?.trim();
}

describe('VoiceCallDebug', () => {
  beforeEach(() => download.mockClear());

  it('shows saved Live usage and the recorded Luna and Decisions backend', async () => {
    const wrapper = await mountDebug({
      usage: {
        backend_model: 'gpt-6-luna',
        backend: 'decisions',
        gpt_live_session_seconds: 120,
        gpt_live_voice_cost_usd: 0.1,
      },
    });
    expect(detail(wrapper, 'Backend model')).toContain('gpt-6-luna');
    expect(detail(wrapper, 'Backend API')).toBe('Decisions');
    expect(detail(wrapper, 'Live billed time')).toBe('120.00 s');
    expect(detail(wrapper, 'Est. voice cost')).toBe('$0.100');
    expect(detail(wrapper, 'Backend cost')).toContain('Not estimated');
    expect(detail(wrapper, 'Total cost')).toContain('Not estimated');
  });

  it('shows the raw transcript with its tool calls', async () => {
    const wrapper = await mountDebug();
    expect(wrapper.text()).toContain('[tool] save_case {}');
    expect(wrapper.text()).toContain('[tool result] ok');
  });

  it('does not guess the backend API when old call data does not record it', async () => {
    const wrapper = await mountDebug({
      usage: {
        backend_model: 'gpt-6-luna',
        gpt_live_session_seconds: 0,
        gpt_live_voice_cost_usd: 0,
      },
    });
    expect(detail(wrapper, 'Backend API')).toBeUndefined();
    expect(detail(wrapper, 'Est. voice cost')).toBe('0.00¢');
    expect(detail(wrapper, 'Total cost')).toContain('Not estimated');
  });

  it('shows Responses when that backend was recorded', async () => {
    const wrapper = await mountDebug({ usage: { backend: 'responses' } });
    expect(detail(wrapper, 'Backend API')).toBe('Responses');
  });

  it('preserves the cost estimate for older realtime sessions without usage detail', async () => {
    const wrapper = await mountDebug({
      model: 'gpt-realtime',
      estimated_cost_usd: 0.25,
    });
    expect(detail(wrapper, 'Est. cost')).toBe('$0.250');
    expect(wrapper.text()).not.toContain('Live billed time');
  });

  it('shows the error and the evaluation when the call has them', async () => {
    const wrapper = await mountDebug({
      error: 'The model stopped.',
      evaluation: { grade: 'B', notes: 'Slow start' },
    });
    expect(detail(wrapper, 'Error')).toBe('The model stopped.');
    const evaluation = wrapper.get('[data-testid="testVoiceCallEvaluation"]');
    expect(evaluation.text()).toContain('"grade": "B"');
    const without = await mountDebug();
    expect(
      without.find('[data-testid="testVoiceCallEvaluation"]').exists(),
    ).toBe(false);
  });

  it('exports the call as JSON and the transcript as text', async () => {
    const wrapper = await mountDebug();
    const [json, text] = wrapper.findAll('button');
    await json.trigger('click');
    await text.trigger('click');
    expect(download.mock.calls[0][0]).toBe('console-test-room.json');
    expect(JSON.parse(download.mock.calls[0][1] as string)).toMatchObject({
      call_id: 'console-test-room',
    });
    expect(download.mock.calls[1]).toEqual([
      'console-test-room.txt',
      'assistant: Hello\n[tool] save_case {}\n[tool result] ok',
      'text/plain',
    ]);
  });
});
