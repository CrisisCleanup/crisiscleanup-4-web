import { flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VoiceAutoFix from '@/components/admin/voice/VoiceAutoFix.vue';
import { server } from '../../../setupTests';
import {
  mountReviewPane,
  reviewPaneGlobal,
} from '../../fixtures/voiceReviewPane';

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ resolve: (path: string) => ({ href: path }) }),
  useRoute: () => ({ params: {}, query: {} }),
}));

const confirmDialog = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useDialogs', () => ({
  default: () => ({ confirm: confirmDialog }),
}));

const reviewsUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_reviews`;
const stubs = reviewPaneGlobal;

function testId(id: string) {
  return `[data-testid="${id}"]`;
}

function correction(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    kind: 'name',
    simple: true,
    field: 'name',
    current_value: 'Jon Smith',
    suggested_value: 'John Smith',
    reason: 'The caller spelled the name.',
    evidence: 'Caller: "John, J-O-H-N."',
    confidence: 0.95,
    status: 'open',
    auto: false,
    acted_by_name: '',
    left_for_review: null,
    dismiss_reason: '',
    can_undo: false,
    ...overrides,
  };
}

function review(corrections = [correction()], overrides = {}) {
  return {
    id: 7,
    status: 'done',
    model: 'gpt-6-luna',
    summary: 'Summary.',
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
    cases: [{ id: 55, case_number: 'R12', incident_id: 248 }],
    flags: [],
    corrections,
    case_snapshot: {},
    transcript: [
      'assistant: What is your name?',
      'user: John, J-O-H-N.',
      'assistant: And your phone?',
      'user: 918 555 0142.',
    ].join('\n'),
    audio_url: 'https://signed.example/3.ogg',
    ...overrides,
  };
}

async function mountReview(data: ReturnType<typeof review>) {
  const wrapper = mountReviewPane(data);
  await flushPromises();
  mounted.push(wrapper);
  return wrapper;
}

// A review that stays mounted would still hear the keys of the next test.
const mounted: { unmount: () => void }[] = [];
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
});

beforeEach(() => {
  confirmDialog.mockReset();
  document.body.innerHTML = '';
});

describe('correction card', () => {
  it('shows who did the work and what was left for a person', async () => {
    const wrapper = await mountReview(
      review([
        correction({
          id: 1,
          status: 'applied',
          auto: true,
          acted_by_name: 'Auto fixer',
        }),
        correction({
          id: 2,
          status: 'applied',
          acted_by_name: 'Dana Admin',
          can_undo: true,
        }),
        correction({
          id: 3,
          kind: 'missed_case',
          simple: false,
          status: 'resolved',
          auto: true,
        }),
        correction({ id: 4, kind: 'note', status: 'resolved' }),
        correction({
          id: 5,
          kind: 'address',
          left_for_review: 'The reviewer is not confident enough.',
        }),
      ]),
    );
    const cards = wrapper.findAll(testId('testVoiceCorrection'));
    const byId = (id: number) =>
      cards.find((card) => card.attributes('data-correction-id') === `${id}`)!;

    expect(byId(1).find(testId('testVoiceCorrectionAuto')).exists()).toBe(true);
    expect(byId(1).find(testId('testVoiceCorrectionBy')).exists()).toBe(true);
    expect(byId(2).find(testId('testVoiceCorrectionAuto')).exists()).toBe(
      false,
    );
    expect(byId(2).find(testId('testVoiceCorrectionBy')).exists()).toBe(true);
    expect(byId(3).find(testId('testVoiceCorrectionBy')).exists()).toBe(false);
    expect(byId(3).get(testId('testVoiceCorrectionStatus')).text()).toBe(
      '~~Linked automatically',
    );
    expect(byId(4).get(testId('testVoiceCorrectionStatus')).text()).toBe(
      '~~Fixed by hand',
    );
    expect(byId(5).find(testId('testVoiceCorrectionLeft')).exists()).toBe(true);
    expect(
      byId(5).get(testId('testVoiceCorrectionLeftReason')).text(),
    ).toContain('not confident enough');
    // Only the fix that can still be undone has the button.
    expect(wrapper.findAll(testId('testVoiceCorrectionUndo'))).toHaveLength(1);
  });

  it('undoes a fix after a confirmation', async () => {
    const posts: string[] = [];
    server.use(
      rest.post(`${reviewsUrl}/corrections/2/undo`, (req, res, ctx) => {
        posts.push(req.url.pathname);
        return res(ctx.json(correction({ id: 2, status: 'open' })));
      }),
    );
    const wrapper = await mountReview(
      review([correction({ id: 2, status: 'applied', can_undo: true })]),
    );
    // Said no: nothing is sent.
    confirmDialog.mockResolvedValueOnce('no');
    await wrapper.get(testId('testVoiceCorrectionUndo')).trigger('click');
    await flushPromises();
    expect(posts).toEqual([]);

    confirmDialog.mockResolvedValueOnce('yes');
    await wrapper.get(testId('testVoiceCorrectionUndo')).trigger('click');
    await flushPromises();
    expect(posts).toHaveLength(1);
    expect(wrapper.find(testId('testVoiceCorrectionUndo')).exists()).toBe(
      false,
    );
    expect(wrapper.find(testId('testVoiceCorrectionApply')).exists()).toBe(
      true,
    );
  });

  it('shows the API reason when the case changed and the undo is refused', async () => {
    server.use(
      rest.post(`${reviewsUrl}/corrections/2/undo`, (_req, res, ctx) =>
        res(
          ctx.status(409),
          ctx.json({ error: 'The case changed after this fix.' }),
        ),
      ),
    );
    const wrapper = await mountReview(
      review([correction({ id: 2, status: 'applied', can_undo: true })]),
    );
    confirmDialog.mockResolvedValueOnce('yes');
    await wrapper.get(testId('testVoiceCorrectionUndo')).trigger('click');
    await flushPromises();
    expect(wrapper.get(testId('testVoiceCorrectionProblem')).text()).toBe(
      'The case changed after this fix.',
    );
    expect(wrapper.find(testId('testVoiceCorrectionUndo')).exists()).toBe(true);
  });

  it('asks why before it dismisses, with four reasons', async () => {
    const bodies: unknown[] = [];
    server.use(
      rest.post(
        `${reviewsUrl}/corrections/1/dismiss`,
        async (req, res, ctx) => {
          bodies.push(await req.json());
          return res(
            ctx.json(
              correction({
                status: 'dismissed',
                dismiss_reason: 'already_fixed',
              }),
            ),
          );
        },
      ),
    );
    const wrapper = await mountReview(review());
    expect(wrapper.find(testId('testVoiceCorrectionReason')).exists()).toBe(
      false,
    );
    await wrapper.get(testId('testVoiceCorrectionDismiss')).trigger('click');
    const options = wrapper
      .get(testId('testVoiceCorrectionReason'))
      .findAll('option')
      .map((option) => option.attributes('value'));
    expect(options).toEqual([
      'reviewer_wrong',
      'already_fixed',
      'not_needed',
      'other',
    ]);
    await wrapper
      .get(testId('testVoiceCorrectionReason'))
      .setValue('already_fixed');
    await wrapper
      .get(testId('testVoiceCorrectionDismissConfirm'))
      .trigger('click');
    await flushPromises();
    expect(bodies).toEqual([{ reason: 'already_fixed' }]);
    expect(
      wrapper.get(testId('testVoiceCorrectionDismissReason')).text(),
    ).toContain('Already fixed');
  });
});

describe('every case of the call', () => {
  it('links a second case so it opens in a new tab', async () => {
    const wrapper = await mountReview(
      review([], {
        cases: [
          { id: 55, case_number: 'R12', incident_id: 248 },
          { id: 56, case_number: 'R13', incident_id: 248 },
        ],
      }),
    );
    const links = wrapper.findAll(testId('testVoiceReviewOpenCase'));
    expect(links.map((link) => link.attributes('href'))).toEqual([
      '/incident/248/work/55/edit',
      '/incident/248/work/56/edit',
    ]);
  });
});

describe('evidence', () => {
  it('tells the page the quoted words of a finding that is hovered or chosen', async () => {
    const heard: (string | undefined)[] = [];
    const wrapper = mountReviewPane(review(), {
      onEvidence: (text) => heard.push(text),
    });
    mounted.push(wrapper);
    await flushPromises();

    await wrapper.get(testId('testVoiceCorrection')).trigger('mouseenter');
    await wrapper.get(testId('testVoiceCorrection')).trigger('mouseleave');
    // A click on the card keeps it chosen.
    await wrapper.get(testId('testVoiceCorrection')).trigger('click');
    expect(heard).toEqual([
      'Caller: "John, J-O-H-N."',
      undefined,
      'Caller: "John, J-O-H-N."',
    ]);
  });
});

describe('keyboard', () => {
  function press(key: string, target: EventTarget = document.body) {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    return flushPromises();
  }

  const two = () => [
    correction({ id: 1 }),
    correction({ id: 2, kind: 'phone', field: 'phone1', evidence: '' }),
  ];

  it('moves between findings with j and k', async () => {
    const wrapper = await mountReview(review(two()));
    const active = () =>
      wrapper
        .findAll(testId('testVoiceCorrection'))
        .filter((card) => card.attributes('data-active'))
        .map((card) => card.attributes('data-correction-id'));
    expect(active()).toEqual([]);
    await press('j');
    expect(active()).toEqual(['1']);
    await press('j');
    expect(active()).toEqual(['2']);
    await press('j');
    expect(active()).toEqual(['2']);
    await press('k');
    expect(active()).toEqual(['1']);
  });

  it('applies the chosen one-click fix with a', async () => {
    const applied: string[] = [];
    server.use(
      rest.post(`${reviewsUrl}/corrections/2/apply`, (req, res, ctx) => {
        applied.push(req.url.pathname);
        return res(ctx.json(correction({ id: 2, status: 'applied' })));
      }),
    );
    const wrapper = await mountReview(review(two()));
    await press('a');
    expect(applied).toEqual([]);
    await press('j');
    await press('j');
    await press('a');
    expect(applied).toHaveLength(1);
    expect(wrapper.text()).toContain('Applied');
  });

  it('opens the dismiss reasons with d', async () => {
    const wrapper = await mountReview(review(two()));
    await press('j');
    await press('d');
    expect(
      wrapper.findAll(testId('testVoiceCorrectionReasonPicker')),
    ).toHaveLength(1);
  });

  it('ignores keys while the person types', async () => {
    const wrapper = await mountReview(review(two()));
    const input = document.createElement('input');
    document.body.append(input);
    await press('j', input);
    expect(
      wrapper
        .findAll(testId('testVoiceCorrection'))
        .some((card) => card.attributes('data-active')),
    ).toBe(false);
    input.remove();
  });
});

describe('VoiceAutoFix', () => {
  it('counts first, and applies only after a confirmation', async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      rest.post(`${reviewsUrl}/auto_fix`, async (req, res, ctx) => {
        const body = await req.json();
        bodies.push(body);
        return res(
          ctx.json({
            reviews: 30,
            linked: 2,
            applied: 5,
            dry_run: body.dry_run,
          }),
        );
      }),
    );
    const wrapper = mount(VoiceAutoFix, { global: stubs });
    await wrapper.get(testId('testVoiceAutoFixSince')).setValue('2026-10-01');

    await wrapper.get(testId('testVoiceAutoFixPreview')).trigger('click');
    await flushPromises();
    expect(bodies).toEqual([{ since: '2026-10-01', dry_run: true }]);
    expect(wrapper.find(testId('testVoiceAutoFixApply')).exists()).toBe(true);

    confirmDialog.mockResolvedValueOnce('no');
    await wrapper.get(testId('testVoiceAutoFixApply')).trigger('click');
    await flushPromises();
    expect(bodies).toHaveLength(1);

    confirmDialog.mockResolvedValueOnce('yes');
    await wrapper.get(testId('testVoiceAutoFixApply')).trigger('click');
    await flushPromises();
    expect(bodies.at(-1)).toEqual({ since: '2026-10-01', dry_run: false });
    expect(wrapper.emitted('done')).toHaveLength(1);
    expect(wrapper.find(testId('testVoiceAutoFixApply')).exists()).toBe(false);
  });

  it('offers nothing to apply when the count is zero', async () => {
    server.use(
      rest.post(`${reviewsUrl}/auto_fix`, (_req, res, ctx) =>
        res(ctx.json({ reviews: 4, linked: 0, applied: 0, dry_run: true })),
      ),
    );
    const wrapper = mount(VoiceAutoFix, { global: stubs });
    await wrapper.get(testId('testVoiceAutoFixPreview')).trigger('click');
    await flushPromises();
    expect(wrapper.find(testId('testVoiceAutoFixCounts')).exists()).toBe(true);
    expect(wrapper.find(testId('testVoiceAutoFixApply')).exists()).toBe(false);
  });
});
