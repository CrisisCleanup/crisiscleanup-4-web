import { flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as VueRouter from 'vue-router';
import BaseButton from '@/components/BaseButton.vue';
import AdminVoiceReviews from '@/pages/admin/AdminVoiceReviews.vue';
import AjaxTable from '@/components/AjaxTable.vue';
import { formatValue } from '@/hooks/voice/voiceReviews';
import { server } from '../../../setupTests';
import { mountReviewPane } from '../../fixtures/voiceReviewPane';

// A reactive route and a push that sets its params, like the real router.
const nav = vi.hoisted(() => ({
  route: undefined as unknown as { params: Record<string, unknown> },
  push: vi.fn(),
  replace: vi.fn(),
}));
vi.mock('vue-router', async (importOriginal) => {
  const { reactive } = await import('vue');
  nav.route = reactive({ params: {} });
  nav.push.mockImplementation((to: { params?: Record<string, unknown> }) => {
    nav.route.params = to.params ?? {};
  });
  return {
    ...(await importOriginal<typeof VueRouter>()),
    useRouter: () => ({
      resolve: (path: string) => ({ href: path }),
      push: nav.push,
      replace: nav.replace,
    }),
    useRoute: () => nav.route,
  };
});

const confirmDialog = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useDialogs', () => ({
  default: () => ({ confirm: confirmDialog }),
}));

const baseUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_reviews`;
const stubs = {
  components: { BaseButton },
  stubs: { Spinner: true, RouterLink: true, VoiceReviewCaseForm: true },
};

function correction(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    kind: 'name',
    simple: true,
    field: 'name',
    current_value: 'Jon Smith',
    suggested_value: 'John Smith',
    reason: 'The caller spelled the name.',
    evidence: 'John, J-O-H-N.',
    confidence: 0.95,
    status: 'open',
    ...overrides,
  };
}

function review(corrections = [correction()]) {
  return {
    id: 7,
    status: 'done',
    model: 'gpt-6-luna',
    summary: 'Name misspelled; tarp not recorded.',
    error: '',
    reviewed_at: '2026-10-11T12:00:00Z',
    session: {
      id: 3,
      call_id: 'call-3',
      status: 'completed',
      language: 'en',
      ended_at: '2026-10-11T11:58:00Z',
    },
    incident_id: 248,
    worksite: { id: 55, case_number: 'R12' },
    corrections,
    case_snapshot: { name: 'Jon Smith' },
    transcript: 'user: John, J-O-H-N.',
    audio_url: 'https://signed.example/3.ogg',
  };
}

function testId(id: string) {
  return `[data-testid="${id}"]`;
}

describe('formatValue', () => {
  it('joins address parts and marks empty values', () => {
    expect(
      formatValue({
        address: '21 Oak St',
        city: 'Tulsa',
        state: 'OK',
        postal_code: '74103',
      }),
    ).toBe('21 Oak St, Tulsa, OK 74103');
    expect(formatValue('')).toBe('—');
  });
});

describe('VoiceReviewDetail', () => {
  it('splits one-click fixes from hand edits and applies one fix', async () => {
    const data = review([
      correction(),
      correction({
        id: 2,
        kind: 'work_type',
        simple: false,
        field: 'tarp',
        current_value: '',
        suggested_value: 'add',
      }),
    ]);
    server.use(
      rest.post(`${baseUrl}/corrections/1/apply`, (_req, res, ctx) =>
        res(ctx.json(correction({ status: 'applied' }))),
      ),
    );
    const wrapper = mountReviewPane(data);
    await flushPromises();

    expect(wrapper.text()).toContain('Name misspelled');
    expect(wrapper.text()).toContain('Contact fixes: accept or edit');
    expect(wrapper.text()).toContain('Suggestions: edit the case');
    expect(
      wrapper.findAll('[data-testid="testVoiceCorrectionApply"]'),
    ).toHaveLength(1);
    expect(
      wrapper.findAll('[data-testid="testVoiceCorrectionResolve"]'),
    ).toHaveLength(1);

    await wrapper.get(testId('testVoiceCorrectionApply')).trigger('click');
    await flushPromises();
    expect(
      wrapper.findAll('[data-testid="testVoiceCorrectionApply"]'),
    ).toHaveLength(0);
    expect(wrapper.text()).toContain('Applied');
  });

  it('shows why the API refused a fix', async () => {
    server.use(
      rest.post(`${baseUrl}/corrections/1/apply`, (_req, res, ctx) =>
        res(
          ctx.status(409),
          ctx.json({
            error:
              'The case changed after the review. Check it and edit by hand.',
          }),
        ),
      ),
    );
    const wrapper = mountReviewPane(review());
    await flushPromises();
    await wrapper.get(testId('testVoiceCorrectionApply')).trigger('click');
    await flushPromises();
    expect(wrapper.get(testId('testVoiceCorrectionProblem')).text()).toContain(
      'The case changed after the review',
    );
  });
});

describe('AdminVoiceReviews', () => {
  it('lists open issues and counts earlier calls before it queues them', async () => {
    const posted: unknown[] = [];
    server.use(
      rest.get(baseUrl, (req, res, ctx) => {
        expect(req.url.searchParams.get('correction_status')).toBe('open');
        // The paged table asks for one page and reads the total count.
        expect(req.url.searchParams.get('offset')).toBe('0');
        expect(req.url.searchParams.get('limit')).toBe('50');
        return res(ctx.json({ count: 120, results: [review()] }));
      }),
      rest.post(`${baseUrl}/backfill`, async (req, res, ctx) => {
        const body = await req.json();
        posted.push(body);
        return res(
          ctx.json({
            dry_run: body.dry_run,
            count: 4,
            session_ids: [1, 2, 3, 4],
          }),
        );
      }),
    );
    const wrapper = mount(AdminVoiceReviews, { global: stubs });
    await flushPromises();

    const row = wrapper.get(testId('testDataItem7Content'));
    expect(row.text()).toContain('R12');
    expect(row.text()).toContain('Name');
    expect(
      wrapper.get(testId('testVoiceReviewCount')).attributes('data-count'),
    ).toBe('120');

    await row.trigger('click');
    // The row opens the page of its call, on the review tab.
    expect(nav.push).toHaveBeenLastCalledWith({
      name: 'nav.voice_call',
      params: { sessionId: 3 },
      query: { tab: 'review', from: 'auditor' },
    });

    await wrapper.get(testId('testVoiceReviewCheck')).trigger('click');
    await flushPromises();
    await wrapper.get(testId('testVoiceReviewQueue')).trigger('click');
    await flushPromises();
    expect(posted).toEqual([
      expect.objectContaining({ dry_run: true }),
      expect.objectContaining({ dry_run: false }),
    ]);
  });
});

describe('AdminVoiceReviews old links', () => {
  beforeEach(() => {
    nav.route.params = {};
    nav.replace.mockReset();
  });

  it('sends a review id to the page of its call', async () => {
    server.use(
      rest.get(`${baseUrl}/7`, (_req, res, ctx) => res(ctx.json(review()))),
    );
    nav.route.params = { reviewId: '7' };
    mount(AdminVoiceReviews, { global: stubs });
    await flushPromises();
    expect(nav.replace).toHaveBeenCalledWith({
      name: 'nav.voice_call',
      params: { sessionId: 3 },
      query: { tab: 'review', from: 'auditor' },
    });
  });

  it('goes back to the list when the review is gone', async () => {
    server.use(
      rest.get(`${baseUrl}/7`, (_req, res, ctx) =>
        res(ctx.status(404), ctx.json({ error: 'Not found' })),
      ),
    );
    nav.route.params = { reviewId: '7' };
    mount(AdminVoiceReviews, { global: stubs });
    await flushPromises();
    expect(nav.replace).toHaveBeenCalledWith({ name: 'nav.voice_reviews' });
  });

  it('shows the list when there is no review id', async () => {
    server.use(
      rest.get(baseUrl, (_req, res, ctx) =>
        res(ctx.json({ count: 0, results: [] })),
      ),
    );
    const wrapper = mount(AdminVoiceReviews, { global: stubs });
    await flushPromises();
    expect(nav.replace).not.toHaveBeenCalled();
    expect(wrapper.find(testId('testVoiceReviewTable')).exists()).toBe(true);
  });
});

describe('VoiceReviewDetail actions', () => {
  it('opens the case in a new tab', async () => {
    const data = review([
      correction({ id: 2, kind: 'work_type', simple: false, field: 'tarp' }),
    ]);
    const wrapper = mountReviewPane(data);
    await flushPromises();

    const open = wrapper.get(testId('testVoiceCorrectionOpenCase'));
    expect(open.attributes('href')).toBe('/incident/248/work/55/edit');
    expect(open.attributes('target')).toBe('_blank');
    expect(wrapper.find(testId('testVoiceCorrectionApply')).exists()).toBe(
      false,
    );
    expect(wrapper.text()).toContain('This is a suggestion');
    expect(wrapper.get(testId('testVoiceCorrectionAfter')).text()).toBe(
      '~~Add tarp',
    );
  });

  it('sends an edited address instead of the suggestion', async () => {
    const suggested = {
      address: '21 Oak St',
      city: 'Tulsa',
      state: 'OK',
      postal_code: '74103',
    };
    const bodies: unknown[] = [];
    server.use(
      rest.post(`${baseUrl}/corrections/1/apply`, async (req, res, ctx) => {
        const body: { value: Record<string, string> } = await req.json();
        bodies.push(body);
        return res(
          ctx.json(
            correction({
              kind: 'address',
              status: 'applied',
              before_value: { ...suggested, address: '12 Oak St' },
              applied_value: body.value,
            }),
          ),
        );
      }),
    );
    const wrapper = mountReviewPane(
      review([
        correction({
          kind: 'address',
          field: 'address',
          current_value: { ...suggested, address: '12 Oak St' },
          suggested_value: suggested,
        }),
      ]),
    );
    await flushPromises();

    await wrapper.get(testId('testVoiceCorrectionEdit')).trigger('click');
    await flushPromises();
    await wrapper
      .get(testId('testVoiceCorrectionInput-address'))
      .setValue('23 Oak St');
    await wrapper.get(testId('testVoiceCorrectionApplyEdit')).trigger('click');
    await flushPromises();

    expect(bodies).toEqual([{ value: { ...suggested, address: '23 Oak St' } }]);
    expect(wrapper.get(testId('testVoiceCorrectionBefore')).text()).toContain(
      '12 Oak St',
    );
    expect(wrapper.get(testId('testVoiceCorrectionAfter')).text()).toContain(
      '23 Oak St',
    );
  });
});

describe('AdminVoiceReviews issue type filter', () => {
  it('asks the API for one kind of issue', async () => {
    const queries: Record<string, string | null>[] = [];
    server.use(
      rest.get(baseUrl, (req, res, ctx) => {
        queries.push({
          correction_status: req.url.searchParams.get('correction_status'),
          kind: req.url.searchParams.get('kind') ?? '',
        });
        return res(ctx.json({ count: 0, results: [] }));
      }),
    );
    const wrapper = mount(AdminVoiceReviews, { global: stubs });
    await flushPromises();

    await wrapper.get(testId('testVoiceReviewKindFilter')).setValue('address');
    await flushPromises();
    await wrapper.get(testId('testVoiceReviewFilter')).setValue('all');
    await flushPromises();

    expect(queries).toEqual([
      { correction_status: 'open', kind: '' },
      { correction_status: 'open', kind: 'address' },
      { correction_status: '', kind: 'address' },
    ]);
  });
});

const DUPLICATE = {
  id: 77,
  case_number: 'Q77',
  name: 'John Smith',
  match_reasons: ['same_address'],
  incident: { id: 248, name: 'Medium Flood' },
};

function missedReview(id: number, duplicates: unknown[] = []) {
  return {
    ...review([
      correction({
        id: id * 10,
        kind: 'missed_case',
        simple: false,
        field: '',
        suggested_value: { summary: 'Tree on roof', duplicates },
      }),
    ]),
    id,
    worksite: undefined,
  };
}

describe('AdminVoiceReviews missed cases', () => {
  beforeEach(() => {
    nav.route.params = {};
  });

  it('marks a possible duplicate and bulk-creates the checked missed cases', async () => {
    const posted: unknown[] = [];
    server.use(
      rest.get(baseUrl, (_req, res, ctx) =>
        res(
          ctx.json({
            count: 2,
            results: [missedReview(1, [DUPLICATE]), missedReview(2)],
          }),
        ),
      ),
      rest.post(`${baseUrl}/create_missed_cases`, async (req, res, ctx) => {
        posted.push(await req.json());
        return res(
          ctx.json({
            results: {
              10: { status: 'duplicate', duplicates: [DUPLICATE] },
              20: {
                status: 'created',
                worksite_id: 5,
                case_number: 'Q501',
                incident_id: 248,
              },
            },
          }),
        );
      }),
    );
    const wrapper = mount(AdminVoiceReviews, { global: stubs });
    await flushPromises();

    expect(
      wrapper
        .get(testId('testDataItem1Content'))
        .find(testId('testVoiceReviewDuplicatePill'))
        .exists(),
    ).toBe(true);
    expect(
      wrapper
        .get(testId('testDataItem2Content'))
        .find(testId('testVoiceReviewDuplicatePill'))
        .exists(),
    ).toBe(false);
    expect(wrapper.find(testId('testVoiceReviewBulkCreate')).exists()).toBe(
      false,
    );

    wrapper
      .findComponent(AjaxTable)
      .vm.$emit('selectionChanged', new Set([1, 2]));
    await flushPromises();
    confirmDialog.mockResolvedValueOnce('yes');
    await wrapper.get(testId('testVoiceReviewBulkCreate')).trigger('click');
    await flushPromises();

    expect(posted).toEqual([{ correction_ids: [10, 20] }]);
    const results = wrapper.get(testId('testVoiceReviewBulkResults'));
    const created = results.get('[data-status="created"] a');
    expect(created.text()).toContain('Q501');
    expect(created.attributes('href')).toBe('/incident/248/work/5/edit');
    const link = results.get('[data-status="duplicate"] a');
    expect(link.attributes('href')).toBe('/incident/248/work/77/edit');
    expect(link.attributes('target')).toBe('_blank');
  });
});

describe('VoiceReviewDetail missed case duplicates', () => {
  it('links the possible duplicate on the card', async () => {
    const wrapper = mountReviewPane(missedReview(7, [DUPLICATE]));
    await flushPromises();
    const box = wrapper.get(testId('testVoiceCorrectionDuplicates'));
    expect(box.text()).toContain('Q77');
    expect(box.get('a').attributes('href')).toBe('/incident/248/work/77/edit');
  });
});

describe('Call Auditor review again', () => {
  it('re-runs one call and can include reviewed calls in a backfill', async () => {
    const posted: unknown[] = [];
    server.use(
      rest.post(`${baseUrl}/backfill`, async (req, res, ctx) => {
        posted.push(await req.json());
        return res(ctx.json({ dry_run: false, count: 1, session_ids: [3] }));
      }),
    );
    const detail = mountReviewPane(review());
    await flushPromises();
    await detail.get(testId('testVoiceReviewAgain')).trigger('click');
    await flushPromises();
    expect(posted).toEqual([{ session: 3, force: true }]);

    server.use(
      rest.get(baseUrl, (_req, res, ctx) =>
        res(ctx.json({ count: 0, results: [] })),
      ),
    );
    const list = mount(AdminVoiceReviews, { global: stubs });
    await flushPromises();
    await list.get(testId('testVoiceReviewForce')).setValue(true);
    await list.get(testId('testVoiceReviewCheck')).trigger('click');
    await flushPromises();
    expect(posted.at(-1)).toMatchObject({ dry_run: true, force: true });
  });
});
