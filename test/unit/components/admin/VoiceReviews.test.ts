import { flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import type * as VueRouter from 'vue-router';
import BaseButton from '@/components/BaseButton.vue';
import VoiceReviewDetail from '@/components/admin/voice/VoiceReviewDetail.vue';
import AdminVoiceReviews from '@/pages/admin/AdminVoiceReviews.vue';
import { formatValue } from '@/hooks/voice/voiceReviews';
import { server } from '../../../setupTests';

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof VueRouter>()),
  useRouter: () => ({ resolve: (path: string) => ({ href: path }) }),
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
      rest.get(`${baseUrl}/7`, (_req, res, ctx) => res(ctx.json(data))),
      rest.post(`${baseUrl}/corrections/1/apply`, (_req, res, ctx) =>
        res(ctx.json(correction({ status: 'applied' }))),
      ),
    );
    const wrapper = mount(VoiceReviewDetail, {
      props: { reviewId: 7 },
      global: stubs,
    });
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
      rest.get(`${baseUrl}/7`, (_req, res, ctx) => res(ctx.json(review()))),
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
    const wrapper = mount(VoiceReviewDetail, {
      props: { reviewId: 7 },
      global: stubs,
    });
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
    await flushPromises();
    expect(wrapper.find(testId('testVoiceReviewDetail')).exists()).toBe(true);
    await wrapper
      .get(testId('testVoiceReviewDetail') + ' button')
      .trigger('click');
    await flushPromises();

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

describe('VoiceReviewDetail actions', () => {
  it('plays the recording and opens the case in a new tab', async () => {
    const data = review([
      correction({ id: 2, kind: 'work_type', simple: false, field: 'tarp' }),
    ]);
    server.use(
      rest.get(`${baseUrl}/7`, (_req, res, ctx) => res(ctx.json(data))),
    );
    const wrapper = mount(VoiceReviewDetail, {
      props: { reviewId: 7 },
      global: stubs,
    });
    await flushPromises();

    expect(wrapper.get(testId('testVoiceReviewAudio')).attributes('src')).toBe(
      'https://signed.example/3.ogg',
    );
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
      rest.get(`${baseUrl}/7`, (_req, res, ctx) =>
        res(
          ctx.json(
            review([
              correction({
                kind: 'address',
                field: 'address',
                current_value: { ...suggested, address: '12 Oak St' },
                suggested_value: suggested,
              }),
            ]),
          ),
        ),
      ),
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
    const wrapper = mount(VoiceReviewDetail, {
      props: { reviewId: 7 },
      global: stubs,
    });
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
