import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { describe, expect, it } from 'vitest';
import VoiceCallHistory from '@/components/admin/voice/VoiceCallHistory.vue';
import { server } from '../../../setupTests';

const sessionsUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_console/sessions`;
const stubs = { BaseButton: true, Spinner: true, RouterLink: RouterLinkStub };

function testId(id: string) {
  return `[data-testid="${id}"]`;
}

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
    worksite_url: null,
    cases: [],
    flags: [],
    review_id: null,
    open_issues: 0,
    transcript: 'Test transcript',
    error: '',
    ...overrides,
  };
}

async function mountDetail(overrides: Record<string, unknown> = {}) {
  const row = session(overrides);
  server.use(
    rest.get(sessionsUrl, (_request, response, context) =>
      response(context.json({ count: 1, results: [row] })),
    ),
    rest.get(`${sessionsUrl}/1`, (_request, response, context) =>
      response(context.json(row)),
    ),
  );
  const wrapper = mount(VoiceCallHistory, { global: { stubs } });
  await flushPromises();
  await wrapper.get(testId('testDataItem1Content')).trigger('click');
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

describe('VoiceCallHistory table', () => {
  it('pages on the server and sends the filters as query parameters', async () => {
    const queries: Record<string, string>[] = [];
    server.use(
      rest.get(sessionsUrl, (req, res, ctx) => {
        queries.push(Object.fromEntries(req.url.searchParams));
        return res(ctx.json({ count: 130, results: [session()] }));
      }),
    );
    const wrapper = mount(VoiceCallHistory, { global: { stubs } });
    await flushPromises();
    expect(queries).toEqual([
      { offset: '0', limit: '25', include_test: 'false' },
    ]);
    expect(
      wrapper.get(testId('testVoiceHistoryCount')).attributes('data-count'),
    ).toBe('130');

    await wrapper.get(testId('testVoiceHistoryStatus')).setValue('completed');
    await flushPromises();
    await wrapper.get(testId('testVoiceHistoryHasCase')).setValue('false');
    await flushPromises();
    await wrapper.get(testId('testVoiceHistoryFlag')).setValue('second_case');
    await flushPromises();
    await wrapper.get(testId('testVoiceHistoryIncludeTest')).setValue(true);
    await flushPromises();

    expect(queries.at(-1)).toEqual({
      offset: '0',
      limit: '25',
      status: 'completed',
      has_case: 'false',
      flag: 'second_case',
      include_test: 'true',
    });
  });

  it('searches after the typing stops', async () => {
    const queries: Record<string, string>[] = [];
    server.use(
      rest.get(sessionsUrl, (req, res, ctx) => {
        queries.push(Object.fromEntries(req.url.searchParams));
        return res(ctx.json({ count: 0, results: [] }));
      }),
    );
    const wrapper = mount(VoiceCallHistory, { global: { stubs } });
    await flushPromises();
    await wrapper.get(testId('testVoiceHistorySearch')).setValue('R12');
    expect(queries).toHaveLength(1);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await flushPromises();
    expect(queries).toHaveLength(2);
    expect(queries[1]).toMatchObject({ search: 'R12', offset: '0' });
  });

  it('shows every case, the flags and the open issues of a call', async () => {
    server.use(
      rest.get(sessionsUrl, (_req, res, ctx) =>
        res(
          ctx.json({
            count: 1,
            results: [
              session({
                status: 'completed',
                cases: [
                  { id: 55, case_number: 'R12', incident_id: 248 },
                  { id: 56, case_number: 'R13', incident_id: 248 },
                ],
                flags: ['second_case', 'approximate_location', 'mystery_flag'],
                review_id: 9,
                open_issues: 2,
              }),
            ],
          }),
        ),
      ),
    );
    const wrapper = mount(VoiceCallHistory, { global: { stubs } });
    await flushPromises();
    const row = wrapper.get(testId('testDataItem1Content'));

    const links = row.findAll(testId('testVoiceCaseLink'));
    expect(links.map((link) => link.text())).toEqual(['R12', 'R13']);
    expect(
      row
        .findAllComponents(RouterLinkStub)
        .find((link: { text: () => string }) => link.text() === 'R13')
        ?.props('to'),
    ).toBe('/incident/248/work/56/edit');
    expect(row.get(testId('testVoiceExtraCases')).text()).toBe('+1');
    expect(row.findAll('[data-flag]').map((pill) => pill.text())).toEqual([
      '~~Second case',
      '~~Approximate location',
      '~~Mystery flag',
    ]);
    expect(row.get(testId('testVoiceHistoryIssues')).text()).toContain('open');
  });
});

describe('VoiceCallHistory detail', () => {
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

  it('lists every case and flag, and the decision timeline in plain words', async () => {
    const wrapper = await mountDetail({
      status: 'completed',
      cases: [
        { id: 55, case_number: 'R12', incident_id: 248 },
        { id: 56, case_number: 'R13', incident_id: 248 },
      ],
      flags: ['callback_offered', 'error'],
      decisions: [
        {
          turn: 1,
          at: '2026-10-10T12:00:20Z',
          caller_text: 'This is ridiculous.',
          route: 'callback_offer',
          callback: 'declined',
          intake_answer: false,
          service_question: false,
          rules_applied: [
            'offer_after_second_frustration',
            'short_reply_is_not_frustration',
            'offer_waits_for_caller_need',
            'brand_new_rule',
          ],
          actions: ['keep_asking'],
        },
        {
          turn: 2,
          at: null,
          caller_text: 'My name is John.',
          route: 'intake',
          callback: '',
          intake_answer: true,
          service_question: false,
          rules_applied: [],
          actions: [],
        },
      ],
    });
    const body = wrapper.get(testId('testVoiceCallDetail'));
    expect(
      body.findAll(testId('testVoiceCaseLink')).map((link) => link.text()),
    ).toEqual(['R12', 'R13']);
    expect(body.findAll('[data-flag]').map((pill) => pill.text())).toEqual([
      '~~Callback offered',
      '~~Error',
    ]);

    const rows = body.findAll(testId('testVoiceDecision'));
    expect(rows).toHaveLength(2);
    expect(rows[0].get(testId('testVoiceDecisionCaller')).text()).toBe(
      'This is ridiculous.',
    );
    expect(rows[0].get(testId('testVoiceDecisionRoute')).text()).toBe(
      'Callback offer',
    );
    expect(
      rows[0].findAll(testId('testVoiceDecisionRule')).map((r) => r.text()),
    ).toEqual([
      '~~Waited for 2nd frustration',
      '~~Short reply, no offer',
      '~~Need not known yet',
      '~~Brand new rule',
    ]);
    expect(rows[1].find(testId('testVoiceDecisionRule')).exists()).toBe(false);
  });
});

describe('VoiceCallHistory auditor link', () => {
  it('links a reviewed call to the Call Auditor', async () => {
    const wrapper = await mountDetail({ review_id: 12 });
    expect(
      wrapper.find('[data-testid="testVoiceCallAuditorLink"]').exists(),
    ).toBe(true);
    const without = await mountDetail({ review_id: undefined });
    expect(
      without.find('[data-testid="testVoiceCallAuditorLink"]').exists(),
    ).toBe(false);
  });
});
