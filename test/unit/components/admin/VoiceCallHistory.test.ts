import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import VoiceCallHistory from '@/components/admin/voice/VoiceCallHistory.vue';
import { server } from '../../../setupTests';

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: nav.push }),
}));

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
      query: { tab: 'review' },
    });
  });
});
