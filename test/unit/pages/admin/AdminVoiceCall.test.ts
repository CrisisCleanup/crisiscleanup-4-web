import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as VueRouter from 'vue-router';
import BaseButton from '@/components/BaseButton.vue';
import AdminVoiceCall from '@/pages/admin/AdminVoiceCall.vue';
import adminRoutes from '@/pages/admin/routes';
import { server } from '../../../setupTests';

// A reactive route, and a replace that sets its query, like the real router.
const nav = vi.hoisted(() => ({
  route: undefined as unknown as {
    params: Record<string, unknown>;
    query: Record<string, string>;
  },
  replace: vi.fn(),
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof VueRouter>()),
  useRouter: () => ({
    resolve: (path: string) => ({ href: path }),
    replace: nav.replace,
  }),
  useRoute: () => nav.route,
}));

const confirmDialog = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useDialogs', () => ({
  default: () => ({ confirm: confirmDialog }),
}));

const api = import.meta.env.VITE_APP_API_BASE_URL;
const sessionsUrl = `${api}/admins/voice_console/sessions`;
const reviewsUrl = `${api}/admins/voice_reviews`;
const stubs = {
  components: { BaseButton },
  stubs: {
    Spinner: true,
    RouterLink: RouterLinkStub,
    VoiceReviewCaseForm: true,
  },
};

const TRANSCRIPT = [
  'assistant: What is your name?',
  'user: John, J-O-H-N.',
  'assistant: Thanks.',
].join('\n');

function testId(id: string) {
  return `[data-testid="${id}"]`;
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 3,
    call_id: 'call-3',
    created_at: '2026-10-10T12:00:00Z',
    ended_at: '2026-10-10T12:03:00Z',
    duration_seconds: 180,
    status: 'completed',
    referral: '',
    language: 'en',
    is_test: false,
    model: 'gpt-live-1',
    voice: 'marin',
    estimated_cost_usd: 0.25,
    incident: 'Medium Flood',
    incident_id: 248,
    case_number: 'R12',
    worksite_id: 55,
    cases: [{ id: 55, case_number: 'R12', incident_id: 248 }],
    flags: ['callback_offered'],
    review_id: 7,
    open_issues: 1,
    transcript: TRANSCRIPT,
    error: '',
    speech_turns: [
      {
        id: 0,
        role: 'assistant',
        text: 'What is your name?',
        offset_seconds: 1,
      },
      { id: 1, role: 'user', text: 'John, J-O-H-N.', offset_seconds: 4 },
      { id: 2, role: 'assistant', text: 'Thanks.', offset_seconds: 8 },
    ],
    decisions: [],
    ...overrides,
  };
}

function review(status = 'open') {
  return {
    id: 7,
    status: 'done',
    model: 'gpt-6-luna',
    summary: 'Name misspelled.',
    error: '',
    reviewed_at: '2026-10-11T12:00:00Z',
    session: {
      id: 3,
      call_id: 'call-3',
      status: 'completed',
      language: 'en',
      ended_at: null,
    },
    incident_id: 248,
    worksite: { id: 55, case_number: 'R12' },
    cases: [{ id: 55, case_number: 'R12', incident_id: 248 }],
    flags: [],
    corrections: [
      {
        id: 1,
        kind: 'name',
        simple: true,
        field: 'name',
        current_value: 'Jon Smith',
        suggested_value: 'John Smith',
        reason: 'The caller spelled the name.',
        evidence: 'Caller: "John, J-O-H-N."',
        confidence: 0.95,
        status,
      },
    ],
    case_snapshot: {},
    transcript: TRANSCRIPT,
    audio_url: 'https://signed.example/3.ogg',
  };
}

const requested: string[] = [];
function serve(sessionData: object, reviewData?: object) {
  server.use(
    rest.get(`${sessionsUrl}/3`, (req, res, ctx) => {
      requested.push(req.url.pathname);
      return res(ctx.json(sessionData));
    }),
    rest.get(`${reviewsUrl}/7`, (req, res, ctx) => {
      requested.push(req.url.pathname);
      return res(ctx.json(reviewData));
    }),
  );
}

const mounted: { unmount: () => void }[] = [];
async function mountPage() {
  const wrapper = mount(AdminVoiceCall, {
    global: stubs,
    attachTo: document.body,
  });
  mounted.push(wrapper);
  await flushPromises();
  return wrapper;
}

function linkTo(wrapper: Awaited<ReturnType<typeof mountPage>>, id: string) {
  return wrapper
    .findAllComponents(RouterLinkStub)
    .find((link) => link.attributes('data-testid') === id)
    ?.props('to');
}

function shown(wrapper: Awaited<ReturnType<typeof mountPage>>, id: string) {
  const pane = wrapper.find(testId(id));
  return pane.exists() && pane.attributes('style') !== 'display: none;';
}

beforeEach(() => {
  requested.length = 0;
  nav.route = reactive({ params: { sessionId: '3' }, query: {} });
  nav.replace.mockReset();
  nav.replace.mockImplementation((to: { query?: Record<string, string> }) => {
    nav.route.query = to.query ?? {};
  });
  document.body.innerHTML = '';
});
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
});

describe('AdminVoiceCall header', () => {
  it('loads the call and then its review, and shows the call at a glance', async () => {
    serve(session(), review());
    const wrapper = await mountPage();
    expect(requested).toEqual([
      '/admins/voice_console/sessions/3',
      '/admins/voice_reviews/7',
    ]);
    const header = wrapper.get(testId('testVoiceCallHeader')).text();
    expect(header).toContain('call-3');
    expect(header).toContain('R12');
    expect(header).toContain('3:00');
    expect(header).toContain('$0.250');
    expect(wrapper.findAll('[data-flag]').map((pill) => pill.text())).toEqual([
      '~~Callback offered',
    ]);
  });

  it('does not ask for a review when the call has none', async () => {
    serve(session({ review_id: null, open_issues: 0 }));
    await mountPage();
    expect(requested).toEqual(['/admins/voice_console/sessions/3']);
  });
});

const HISTORY_LINK = {
  to: { name: 'nav.voice_console', query: { view: 'calls' } },
  label: '~~Call history',
};
const AUDITOR_LINK = {
  to: { name: 'nav.voice_reviews' },
  label: '~~Call Auditor',
};

function links(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  const read = (id: string) => ({
    to: linkTo(wrapper, id),
    label: wrapper.get(testId(id)).text().replace('← ', ''),
  });
  return {
    back: read('testVoiceCallBackLink'),
    other: read('testVoiceCallOtherListLink'),
  };
}

describe('AdminVoiceCall back link', () => {
  it('goes back to the call history when it has no origin', async () => {
    serve(session(), review());
    const wrapper = await mountPage();
    expect(wrapper.get(testId('testVoiceCallBackLink')).text()).toBe(
      '← ~~Call history',
    );
    expect(links(wrapper)).toEqual({ back: HISTORY_LINK, other: AUDITOR_LINK });
  });

  it('goes back to the call history when it came from there', async () => {
    nav.route.query = { from: 'calls' };
    serve(session(), review());
    expect(links(await mountPage())).toEqual({
      back: HISTORY_LINK,
      other: AUDITOR_LINK,
    });
  });

  it('goes back to the Call Auditor when it came from there', async () => {
    nav.route.query = { from: 'auditor' };
    serve(session(), review());
    const wrapper = await mountPage();
    expect(wrapper.get(testId('testVoiceCallBackLink')).text()).toBe(
      '← ~~Call Auditor',
    );
    expect(links(wrapper)).toEqual({ back: AUDITOR_LINK, other: HISTORY_LINK });
  });

  it('ignores an origin it does not know', async () => {
    nav.route.query = { from: 'nonsense' };
    serve(session(), review());
    expect(links(await mountPage()).back).toEqual(HISTORY_LINK);
  });

  it('keeps the origin when the tab changes', async () => {
    nav.route.query = { from: 'auditor' };
    serve(session(), review());
    const wrapper = await mountPage();
    await wrapper.get(testId('testVoiceCallTab-debug')).trigger('click');
    expect(nav.replace).toHaveBeenLastCalledWith({
      query: { from: 'auditor', tab: 'debug' },
    });
    expect(links(wrapper).back).toEqual(AUDITOR_LINK);
  });
});

describe('AdminVoiceCall tabs', () => {
  it('opens on the review when the call has open issues', async () => {
    serve(session(), review());
    const wrapper = await mountPage();
    expect(shown(wrapper, 'testVoiceCallReviewPane')).toBe(true);
    expect(wrapper.find(testId('testVoiceCallConversation')).exists()).toBe(
      false,
    );
    expect(wrapper.get(testId('testVoiceCallOpenIssues')).text()).toBe(
      '~~{n} open',
    );
    expect(wrapper.get(testId('testVoiceReviewSummary')).text()).toBe(
      'Name misspelled.',
    );
  });

  it.each([
    ['all issues are closed', { open_issues: 0 }],
    ['the call has no review', { review_id: null, open_issues: 0 }],
  ])('opens on the conversation when %s', async (_name, overrides) => {
    serve(session(overrides), review('applied'));
    const wrapper = await mountPage();
    expect(shown(wrapper, 'testVoiceCallConversation')).toBe(true);
    expect(wrapper.find(testId('testVoiceCallReviewPane')).exists()).toBe(
      false,
    );
  });

  it('keeps the tab in the URL and follows it', async () => {
    serve(session(), review());
    const wrapper = await mountPage();

    await wrapper.get(testId('testVoiceCallTab-debug')).trigger('click');
    expect(nav.replace).toHaveBeenLastCalledWith({ query: { tab: 'debug' } });
    expect(shown(wrapper, 'testVoiceCallDebug')).toBe(true);
    expect(shown(wrapper, 'testVoiceCallReviewPane')).toBe(false);
    expect(
      wrapper.get(testId('testVoiceCallTab-debug')).attributes('aria-selected'),
    ).toBe('true');
  });

  it('opens the tab named in the URL, also over the default', async () => {
    nav.route.query = { tab: 'conversation' };
    serve(session(), review());
    const wrapper = await mountPage();
    expect(shown(wrapper, 'testVoiceCallConversation')).toBe(true);
    expect(wrapper.find(testId('testVoiceCallReviewPane')).exists()).toBe(
      false,
    );
  });

  it('ignores a tab name it does not know', async () => {
    nav.route.query = { tab: 'nonsense' };
    serve(session({ open_issues: 0 }), review('applied'));
    const wrapper = await mountPage();
    expect(shown(wrapper, 'testVoiceCallConversation')).toBe(true);
  });

  it('keeps a tab it has shown, so the recording goes on playing', async () => {
    nav.route.query = { tab: 'conversation' };
    serve(session(), review());
    const wrapper = await mountPage();
    const audio = wrapper.get(testId('testVoiceReviewAudio')).element;
    await wrapper.get(testId('testVoiceCallTab-review')).trigger('click');
    await wrapper.get(testId('testVoiceCallTab-conversation')).trigger('click');
    expect(wrapper.get(testId('testVoiceReviewAudio')).element).toBe(audio);
  });
});

describe('AdminVoiceCall conversation', () => {
  it('plays the recording of the review and marks the chosen finding', async () => {
    serve(session(), review());
    const wrapper = await mountPage();
    await wrapper.get(testId('testVoiceCorrection')).trigger('click');
    await wrapper.get(testId('testVoiceCallTab-conversation')).trigger('click');

    expect(wrapper.get(testId('testVoiceReviewAudio')).attributes('src')).toBe(
      'https://signed.example/3.ogg',
    );
    expect(wrapper.get(testId('testVoiceEvidenceMark')).text()).toBe(
      'John, J-O-H-N',
    );
  });

  it('says there is no recording link when the call has no review', async () => {
    nav.route.query = { tab: 'conversation' };
    serve(session({ review_id: null, open_issues: 0 }));
    const wrapper = await mountPage();
    expect(wrapper.find(testId('testVoiceReviewAudio')).exists()).toBe(false);
    expect(wrapper.find(testId('testVoiceNoRecording')).exists()).toBe(true);
    expect(wrapper.findAll(testId('testVoiceTranscriptLine'))).toHaveLength(3);
  });
});

describe('AdminVoiceCall without a review', () => {
  beforeEach(() => {
    nav.route.query = { tab: 'review' };
  });

  it('offers a review, and queues the same force review as the auditor', async () => {
    const posted: unknown[] = [];
    serve(session({ review_id: null, open_issues: 0 }));
    server.use(
      rest.post(`${reviewsUrl}/backfill`, async (req, res, ctx) => {
        posted.push(await req.json());
        return res(ctx.json({ dry_run: false, count: 1, session_ids: [3] }));
      }),
    );
    const wrapper = await mountPage();
    expect(wrapper.get(testId('testVoiceCallNoReview')).text()).toContain(
      'This call has no review yet',
    );
    await wrapper.get(testId('testVoiceCallReviewThis')).trigger('click');
    await flushPromises();

    expect(posted).toEqual([{ session: 3, force: true }]);
    expect(wrapper.find(testId('testVoiceCallQueued')).exists()).toBe(true);
  });

  it('shows the review when it lands', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    try {
      serve(session({ review_id: null, open_issues: 0 }));
      server.use(
        rest.post(`${reviewsUrl}/backfill`, (_req, res, ctx) =>
          res(ctx.json({ dry_run: false, count: 1, session_ids: [3] })),
        ),
      );
      const wrapper = await mountPage();
      await wrapper.get(testId('testVoiceCallReviewThis')).trigger('click');
      await flushPromises();

      // The review is there on the next look.
      serve(session(), review());
      await vi.advanceTimersByTimeAsync(5000);
      await flushPromises();
      expect(wrapper.find(testId('testVoiceCallNoReview')).exists()).toBe(
        false,
      );
      expect(wrapper.get(testId('testVoiceReviewSummary')).text()).toBe(
        'Name misspelled.',
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('admin routes', () => {
  it('has a page for one call next to the auditor, under the admin layout', () => {
    const [admin] = adminRoutes;
    const children = admin.children as { path: string; name: string }[];
    expect(admin.meta).toMatchObject({ admin: true });
    expect(children.map((route) => [route.path, route.name])).toEqual(
      expect.arrayContaining([
        ['voice_reviews/:reviewId?', 'nav.voice_reviews'],
        ['voice_calls/:sessionId', 'nav.voice_call'],
      ]),
    );
  });
});
