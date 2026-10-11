import { flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { describe, expect, it } from 'vitest';
import VoiceCallHistory from '@/components/admin/voice/VoiceCallHistory.vue';
import { server } from '../../../setupTests';

const sessionsUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_console/sessions`;

async function mountDetail(overrides: Record<string, unknown> = {}) {
  const session = {
    id: 1,
    call_id: 'console-test-room',
    created_at: '2026-10-10T12:00:00Z',
    duration_seconds: 180,
    status: 'abandoned',
    referral: '',
    language: 'en',
    is_test: true,
    model: 'gpt-live-1',
    voice: 'marin',
    transcript: 'Test transcript',
    error: '',
    ...overrides,
  };
  server.use(
    rest.get(sessionsUrl, (_request, response, context) =>
      response(context.json({ sessions: [session] })),
    ),
    rest.get(`${sessionsUrl}/1`, (_request, response, context) =>
      response(context.json(session)),
    ),
  );
  const wrapper = mount(VoiceCallHistory, {
    global: { stubs: { BaseButton: true, Spinner: true, RouterLink: true } },
  });
  await flushPromises();
  await wrapper.get('tbody tr').trigger('click');
  await flushPromises();
  return wrapper;
}

function detail(
  wrapper: Awaited<ReturnType<typeof mountDetail>>,
  label: string,
) {
  return wrapper
    .findAll('dt')
    .find((row) => row.text().includes(label))
    ?.element.nextElementSibling?.textContent?.trim();
}

describe('VoiceCallHistory', () => {
  it('shows saved Live usage and the recorded Luna and Decisions backend', async () => {
    const wrapper = await mountDetail({
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
    expect(wrapper.text()).toContain('Test transcript');
  });

  it('does not guess the backend API when old call data does not record it', async () => {
    const wrapper = await mountDetail({
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
    const wrapper = await mountDetail({ usage: { backend: 'responses' } });
    expect(detail(wrapper, 'Backend API')).toBe('Responses');
  });

  it('preserves the cost estimate for older realtime sessions without usage detail', async () => {
    const wrapper = await mountDetail({
      model: 'gpt-realtime',
      estimated_cost_usd: 0.25,
    });
    expect(detail(wrapper, 'Est. cost')).toBe('$0.250');
    expect(wrapper.text()).not.toContain('Live billed time');
  });
});
