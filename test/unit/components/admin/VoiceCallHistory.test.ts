import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VoiceCallHistory from '@/components/admin/voice/VoiceCallHistory.vue';
import { server } from '../../../setupTests';

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: nav.push }),
}));

const sessionsUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_console/sessions`;
const metricsUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_console/metrics`;
const stubs = { BaseButton: true, Spinner: true, RouterLink: RouterLinkStub };

const WINDOWS = ['1h', '3h', '24h', '7d', '30d'];
function metric(
  key: string,
  label: string,
  format: string,
  current: number,
  previous: number,
) {
  return {
    key,
    label,
    format,
    values: Object.fromEntries(WINDOWS.map((w) => [w, current])),
    previous: Object.fromEntries(WINDOWS.map((w) => [w, previous])),
  };
}
const METRICS = [
  metric('calls', 'Calls', 'count', 30, 20),
  metric('cases_created', 'Cases created', 'count', 9, 9),
  metric('case_rate', 'Case rate', 'percent', 0.625, 0.5),
  metric('open_issues', 'Open issues', 'count', 2, 4),
];
const metricQueries: Record<string, string>[] = [];

beforeEach(() => {
  metricQueries.length = 0;
  server.use(
    rest.get(metricsUrl, (req, res, ctx) => {
      metricQueries.push(Object.fromEntries(req.url.searchParams));
      return res(
        ctx.json({
          generated_at: '2026-10-10T12:00:00Z',
          windows: WINDOWS,
          metrics: METRICS,
        }),
      );
    }),
  );
});

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

describe('VoiceCallHistory rows', () => {
  async function mountList(overrides: Record<string, unknown> = {}) {
    server.use(
      rest.get(sessionsUrl, (_req, res, ctx) =>
        res(ctx.json({ count: 1, results: [session(overrides)] })),
      ),
    );
    const wrapper = mount(VoiceCallHistory, { global: { stubs } });
    await flushPromises();
    return wrapper;
  }

  it('opens the page of the call when a row is clicked', async () => {
    nav.push.mockClear();
    const wrapper = await mountList();
    await wrapper.get(testId('testDataItem1Content')).trigger('click');
    expect(nav.push).toHaveBeenCalledWith({
      name: 'nav.voice_call',
      params: { sessionId: 1 },
      query: { from: 'calls' },
    });
    // The list has no detail of its own any more.
    expect(wrapper.find(testId('testVoiceCallDetail')).exists()).toBe(false);
  });

  it('links the open issues of a call to its review tab', async () => {
    const wrapper = await mountList({ review_id: 12, open_issues: 2 });
    const link = wrapper
      .get(testId('testDataItem1Content'))
      .getComponent(RouterLinkStub);
    expect(link.props('to')).toEqual({
      name: 'nav.voice_call',
      params: { sessionId: 1 },
      query: { tab: 'review', from: 'calls' },
    });
  });
});

describe('VoiceCallHistory metrics strip', () => {
  async function mountList() {
    server.use(
      rest.get(sessionsUrl, (_req, res, ctx) =>
        res(ctx.json({ count: 0, results: [] })),
      ),
    );
    const wrapper = mount(VoiceCallHistory, { global: { stubs } });
    await flushPromises();
    return wrapper;
  }

  it('shows the calls, case rate and open issues of the last day', async () => {
    const wrapper = await mountList();
    const strip = wrapper.get(testId('testVoiceHistoryStrip'));
    const cards = strip.findAll('[data-testid^="testVoiceCard-"]');
    expect(cards.map((card) => card.attributes('data-testid'))).toEqual([
      'testVoiceCard-calls',
      'testVoiceCard-case_rate',
      'testVoiceCard-open_issues',
    ]);
    expect(
      cards.map((card) => card.get(testId('testVoiceCardValue')).text()),
    ).toEqual(['30', '62.5%', '2']);
    // The change against the day before; fewer open issues is good.
    const deltas = cards.map((card) => card.get(testId('testVoiceCardDelta')));
    expect(deltas.map((delta) => delta.text())).toEqual([
      expect.stringContaining('+50%'),
      expect.stringContaining('+12.5 pts'),
      expect.stringContaining('-50%'),
    ]);
    expect(deltas.map((delta) => delta.attributes('data-tone'))).toEqual([
      'good',
      'good',
      'good',
    ]);
    expect(metricQueries).toEqual([{ include_test: 'false' }]);
  });

  it('links to the overall metrics', async () => {
    const wrapper = await mountList();
    const link = wrapper
      .get(testId('testVoiceHistoryStrip'))
      .getComponent(RouterLinkStub)
      .props('to');
    expect(link).toEqual({
      name: 'nav.voice_console',
      query: { view: 'metrics' },
    });
  });

  it('follows the Include test calls toggle', async () => {
    const wrapper = await mountList();
    await wrapper.get(testId('testVoiceHistoryIncludeTest')).setValue(true);
    await flushPromises();
    expect(metricQueries.at(-1)).toEqual({ include_test: 'true' });
  });

  it('shows no cards when the metrics do not load, and the list still works', async () => {
    server.use(rest.get(metricsUrl, (_req, res, ctx) => res(ctx.status(500))));
    const wrapper = await mountList();
    expect(wrapper.findAll('[data-testid^="testVoiceCard-"]')).toHaveLength(0);
    expect(wrapper.find(testId('testVoiceHistoryCount')).exists()).toBe(true);
  });
});
