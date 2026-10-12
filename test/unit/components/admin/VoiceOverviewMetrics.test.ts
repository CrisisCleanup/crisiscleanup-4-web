import { flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BaseButton from '@/components/BaseButton.vue';
import VoiceOverviewMetrics from '@/components/admin/voice/VoiceOverviewMetrics.vue';
import { server } from '../../../setupTests';

// The time frame is in the URL (?window=...).
const nav = vi.hoisted(() => ({
  query: {} as Record<string, string>,
  replace: vi.fn(),
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({ query: nav.query }),
  useRouter: () => ({ replace: nav.replace }),
}));

const baseUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_console/metrics`;
const WINDOWS = ['1h', '3h', '24h', '7d', '30d'];

function values(base: number | null) {
  return Object.fromEntries(
    WINDOWS.map((window, index) => [
      window,
      base === null ? null : base * (index + 1),
    ]),
  );
}

const METRICS = [
  {
    key: 'calls',
    label: 'Calls',
    format: 'count',
    values: values(10),
    previous: { ...values(10), '24h': 60 },
  },
  {
    key: 'cases_created',
    label: 'Cases created',
    format: 'count',
    values: values(5),
    previous: values(5),
  },
  {
    key: 'case_rate',
    label: 'Case rate',
    format: 'percent',
    values: { ...values(null), '24h': 0.625 },
    previous: { ...values(null), '24h': 0.5 },
  },
  {
    key: 'errors',
    label: 'Errors',
    format: 'count',
    values: { ...values(null), '24h': 3 },
    previous: { ...values(null), '24h': 1 },
  },
  {
    key: 'second_cases',
    label: 'Second cases',
    format: 'count',
    values: values(1),
    previous: { ...values(1), '24h': 0 },
  },
  {
    key: 'cost_usd',
    label: 'Est. cost',
    format: 'usd',
    values: { ...values(null), '1h': 0.5, '24h': 12.5, '7d': 70 },
    previous: { ...values(null), '1h': 0.25, '24h': 10, '7d': 70 },
  },
];

function overview() {
  return {
    generated_at: '2026-10-12T12:00:00Z',
    windows: WINDOWS,
    metrics: METRICS,
  };
}

const BUCKETS = [
  { start: '2026-10-12T10:00:00Z', calls: 2, cases_created: 1 },
  { start: '2026-10-12T11:00:00Z', calls: 8, cases_created: 4 },
  { start: '2026-10-12T12:00:00Z', calls: 0, cases_created: 0 },
].map((bucket) => ({
  callback_offers: 0,
  errors: 0,
  open_issues: 0,
  ...bucket,
}));

interface Seen {
  metrics: URLSearchParams[];
  trend: URLSearchParams[];
}

function mockApi(seen: Seen) {
  server.use(
    rest.get(baseUrl, (req, res, ctx) => {
      seen.metrics.push(req.url.searchParams);
      return res(ctx.json(overview()));
    }),
    rest.get(`${baseUrl}/trend`, (req, res, ctx) => {
      seen.trend.push(req.url.searchParams);
      return res(ctx.json({ buckets: BUCKETS }));
    }),
  );
}

function testId(id: string) {
  return `[data-testid="${id}"]`;
}

async function mountOverview() {
  const wrapper = mount(VoiceOverviewMetrics, {
    global: { components: { BaseButton }, stubs: { Spinner: true } },
  });
  await flushPromises();
  return wrapper;
}

async function openCompare(wrapper: Awaited<ReturnType<typeof mountOverview>>) {
  await wrapper.get(testId('testVoiceCompareToggle')).trigger('click');
}

function projected(
  wrapper: Awaited<ReturnType<typeof mountOverview>>,
  id: string,
) {
  return wrapper.get(testId(`testVoiceProjection-${id}`)).text();
}

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
  nav.query = {};
  nav.replace.mockClear();
});

describe('VoiceOverviewMetrics', () => {
  it('shows a row per metric and a column per window, formatted', async () => {
    mockApi({ metrics: [], trend: [] });
    const wrapper = await mountOverview();
    await openCompare(wrapper);

    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual([
      '~~Metric',
      ...WINDOWS,
    ]);
    const cell = (key: string, window: string) =>
      wrapper.get(testId(`testVoiceMetricCell-${key}-${window}`));
    expect(cell('calls', '7d').get(testId('testVoiceMetricValue')).text()).toBe(
      '40',
    );
    expect(
      cell('case_rate', '24h').get(testId('testVoiceMetricValue')).text(),
    ).toBe('62.5%');
    expect(
      cell('cost_usd', '24h').get(testId('testVoiceMetricValue')).text(),
    ).toBe('$12.50');
    // No value in a window: a dash, and no change next to it.
    expect(cell('errors', '1h').text()).toBe('—');
    // The group titles are rows of their own.
    expect(wrapper.text()).toContain('Volume');
    expect(wrapper.text()).toContain('Quality');
  });

  it('colors the change by whether up is good', async () => {
    mockApi({ metrics: [], trend: [] });
    const wrapper = await mountOverview();
    await openCompare(wrapper);
    const delta = (key: string) =>
      wrapper
        .get(testId(`testVoiceMetricCell-${key}-24h`))
        .get(testId('testVoiceMetricDelta'));

    // Calls fell by half: bad. Case rate rose 12.5 points: good.
    expect(delta('calls').attributes('data-tone')).toBe('bad');
    expect(delta('calls').text()).toContain('-50%');
    expect(delta('case_rate').attributes('data-tone')).toBe('good');
    expect(delta('case_rate').text()).toContain('+12.5 pts');
    // Errors rose: bad. Cost rose: neutral.
    expect(delta('errors').attributes('data-tone')).toBe('bad');
    expect(delta('cost_usd').attributes('data-tone')).toBe('neutral');
  });

  it('leaves test calls out, and loads again with them', async () => {
    const seen: Seen = { metrics: [], trend: [] };
    mockApi(seen);
    const wrapper = await mountOverview();
    expect(seen.metrics.map((p) => p.get('include_test'))).toEqual(['false']);

    await wrapper.get(testId('testVoiceOverviewIncludeTest')).setValue(true);
    await flushPromises();
    expect(seen.metrics.map((p) => p.get('include_test'))).toEqual([
      'false',
      'true',
    ]);
    expect(seen.trend.at(-1)?.get('include_test')).toBe('true');
  });

  it('draws the trend, and a new window loads only the trend', async () => {
    const seen: Seen = { metrics: [], trend: [] };
    mockApi(seen);
    const wrapper = await mountOverview();
    expect(seen.trend.map((p) => p.get('window'))).toEqual(['24h']);
    const bars = wrapper.findAll(testId('testVoiceTrendBar'));
    expect(bars.map((bar) => bar.attributes('data-value'))).toEqual([
      '2',
      '8',
      '0',
    ]);
    // The tallest bar is full height; an empty bucket has no height.
    expect(bars[1].attributes('style')).toContain('height: 100%');
    expect(bars[2].attributes('style')).toContain('height: 0%');

    await wrapper.get(testId('testVoiceWindow-7d')).trigger('click');
    await flushPromises();
    expect(seen.trend.map((p) => p.get('window'))).toEqual(['24h', '7d']);
    expect(seen.metrics).toHaveLength(1);
    expect(nav.replace).toHaveBeenCalledWith({ query: { window: '7d' } });

    await wrapper.get(testId('testVoiceTrendSeries')).setValue('cases_created');
    expect(
      wrapper
        .findAll(testId('testVoiceTrendBar'))
        .map((bar) => bar.attributes('data-value')),
    ).toEqual(['1', '4', '0']);
  });

  it('refreshes by button and every minute while the page is visible', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const seen: Seen = { metrics: [], trend: [] };
    mockApi(seen);
    const wrapper = await mountOverview();
    expect(seen.metrics).toHaveLength(1);
    expect(wrapper.get(testId('testVoiceOverviewUpdated')).text()).toContain(
      'Updated',
    );

    await wrapper.get(testId('testVoiceOverviewRefresh')).trigger('click');
    await flushPromises();
    expect(seen.metrics).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(60_000);
    await flushPromises();
    expect(seen.metrics).toHaveLength(3);

    // Hidden: the tick does nothing.
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(60_000);
    await flushPromises();
    expect(seen.metrics).toHaveLength(3);

    delete (document as { visibilityState?: string }).visibilityState;
    wrapper.unmount();
  });

  it('shows why the metrics did not load', async () => {
    server.use(
      rest.get(baseUrl, (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'boom' })),
      ),
      rest.get(`${baseUrl}/trend`, (_req, res, ctx) =>
        res(ctx.json({ buckets: [] })),
      ),
    );
    const wrapper = await mountOverview();
    expect(wrapper.find(testId('testVoiceOverviewError')).exists()).toBe(true);
    expect(wrapper.find(testId('testVoiceCard-calls')).exists()).toBe(false);
  });

  it('shows cards for the day, with the change and a hint', async () => {
    mockApi({ metrics: [], trend: [] });
    const wrapper = await mountOverview();
    const card = (key: string) => wrapper.get(testId(`testVoiceCard-${key}`));

    expect(
      wrapper.get(testId('testVoiceWindow-24h')).attributes(),
    ).toMatchObject({ 'aria-pressed': 'true' });
    // Headline cards first; the rest in their groups.
    expect(
      wrapper
        .get(testId('testVoiceHeadlines'))
        .findAll('[data-testid^="testVoiceCard-"]'),
    ).toHaveLength(4);
    expect(wrapper.get(testId('testVoiceGroup-~~Volume')).text()).toContain(
      'Second cases',
    );
    expect(card('case_rate').get(testId('testVoiceCardValue')).text()).toBe(
      '62.5%',
    );
    expect(card('case_rate').get(testId('testVoiceCardHint')).text()).toBe(
      '~~Cases created per intake call',
    );
    expect(card('calls').get(testId('testVoiceCardValue')).text()).toBe('30');
    expect(card('calls').get(testId('testVoiceCardDelta')).text()).toContain(
      '-50%',
    );
    expect(
      card('calls').get(testId('testVoiceCardDelta')).attributes('data-tone'),
    ).toBe('bad');
    expect(card('cost_usd').text()).toContain('Est. cost');
    // The window before had none: new.
    expect(
      card('second_cases').get(testId('testVoiceCardDelta')).text(),
    ).toContain('new');
    // The compare table is closed.
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it('shows the cards and the trend of the picked time frame', async () => {
    const seen: Seen = { metrics: [], trend: [] };
    mockApi(seen);
    const wrapper = await mountOverview();

    await wrapper.get(testId('testVoiceWindow-7d')).trigger('click');
    await flushPromises();

    expect(
      wrapper.get(testId('testVoiceWindow-7d')).attributes('aria-pressed'),
    ).toBe('true');
    expect(
      wrapper
        .get(testId('testVoiceCard-calls'))
        .get(testId('testVoiceCardValue'))
        .text(),
    ).toBe('40');
    // Seven days have no value for case rate: a dash.
    expect(
      wrapper
        .get(testId('testVoiceCard-case_rate'))
        .get(testId('testVoiceCardValue'))
        .text(),
    ).toBe('—');
    expect(seen.trend.at(-1)?.get('window')).toBe('7d');
  });

  it('starts on the time frame in the URL', async () => {
    nav.query = { window: '30d' };
    const seen: Seen = { metrics: [], trend: [] };
    mockApi(seen);
    const wrapper = await mountOverview();
    expect(seen.trend.map((p) => p.get('window'))).toEqual(['30d']);
    expect(
      wrapper
        .get(testId('testVoiceCard-calls'))
        .get(testId('testVoiceCardValue'))
        .text(),
    ).toBe('50');
  });

  it('draws the trend of the series of the card that is clicked', async () => {
    mockApi({ metrics: [], trend: [] });
    const wrapper = await mountOverview();
    const values = () =>
      wrapper
        .findAll(testId('testVoiceTrendBar'))
        .map((bar) => bar.attributes('data-value'));
    expect(values()).toEqual(['2', '8', '0']);

    await wrapper.get(testId('testVoiceCard-cases_created')).trigger('click');
    expect(values()).toEqual(['1', '4', '0']);
    expect(
      (wrapper.get(testId('testVoiceTrendSeries')).element as HTMLSelectElement)
        .value,
    ).toBe('cases_created');
    expect(
      wrapper
        .get(testId('testVoiceCard-cases_created'))
        .attributes('aria-pressed'),
    ).toBe('true');
    expect(
      wrapper.get(testId('testVoiceCard-calls')).attributes('aria-pressed'),
    ).toBe('false');

    // A card that is not a series is not a button.
    expect(wrapper.get(testId('testVoiceCard-case_rate')).element.tagName).toBe(
      'DIV',
    );
  });

  it('keeps the table of all time frames behind a toggle', async () => {
    mockApi({ metrics: [], trend: [] });
    const wrapper = await mountOverview();
    const toggle = wrapper.get(testId('testVoiceCompareToggle'));
    expect(toggle.attributes('aria-expanded')).toBe('false');
    expect(wrapper.find('table').exists()).toBe(false);

    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(wrapper.find('table').exists()).toBe(true);

    await toggle.trigger('click');
    expect(wrapper.find('table').exists()).toBe(false);
  });

  describe('average cost per call', () => {
    const card = (wrapper: Awaited<ReturnType<typeof mountOverview>>) =>
      wrapper
        .get(testId('testVoiceHeadlines'))
        .get(testId('testVoiceCard-cost_per_call'));

    it('is a headline card with the change against the window before', async () => {
      mockApi({ metrics: [], trend: [] });
      const wrapper = await mountOverview();

      // 24h: $12.50 over 30 calls. The day before: $10 over 60 calls.
      expect(card(wrapper).text()).toContain('Avg cost per call');
      expect(card(wrapper).get(testId('testVoiceCardValue')).text()).toBe(
        '$0.417',
      );
      const delta = card(wrapper).get(testId('testVoiceCardDelta'));
      expect(delta.text()).toContain('+150%');
      expect(delta.attributes('data-tone')).toBe('bad');

      await wrapper.get(testId('testVoiceWindow-7d')).trigger('click');
      await flushPromises();
      expect(card(wrapper).get(testId('testVoiceCardValue')).text()).toBe(
        '$1.75',
      );
      expect(
        card(wrapper).get(testId('testVoiceCardDelta')).attributes('data-tone'),
      ).toBe('neutral');

      // No cost in 30 days: a dash.
      await wrapper.get(testId('testVoiceWindow-30d')).trigger('click');
      await flushPromises();
      expect(card(wrapper).get(testId('testVoiceCardValue')).text()).toBe('—');
    });

    it('is a row of the compare table too', async () => {
      mockApi({ metrics: [], trend: [] });
      const wrapper = await mountOverview();
      await openCompare(wrapper);
      expect(
        wrapper
          .get(testId('testVoiceMetricCell-cost_per_call-1h'))
          .get(testId('testVoiceMetricValue'))
          .text(),
      ).toBe('$0.050');
    });
  });

  describe('cost projection', () => {
    it('projects the cost of the picked time frame, and follows a new one', async () => {
      mockApi({ metrics: [], trend: [] });
      const wrapper = await mountOverview();

      // 24h: $12.50 over 30 calls.
      expect(wrapper.get(testId('testVoiceProjectionBasis')).text()).toBe(
        '~~At the last {window} rate',
      );
      expect(projected(wrapper, 'day')).toBe('$12.50');
      expect(projected(wrapper, 'week')).toBe('$87.50');
      expect(projected(wrapper, 'month')).toBe('$375.00');
      expect(projected(wrapper, 'call')).toBe('$0.417');
      // $10 the day before: up 25%, and up is bad.
      const change = wrapper.get(testId('testVoiceProjectionChange'));
      expect(change.text()).toContain('+25%');
      expect(change.attributes('data-tone')).toBe('bad');
      expect(
        wrapper.find(testId('testVoiceProjectionShortHint')).exists(),
      ).toBe(false);

      // 7d: $70 over 40 calls is $10 a day, as in the week before.
      await wrapper.get(testId('testVoiceWindow-7d')).trigger('click');
      await flushPromises();
      expect(projected(wrapper, 'day')).toBe('$10.00');
      expect(projected(wrapper, 'week')).toBe('$70.00');
      expect(projected(wrapper, 'month')).toBe('$300.00');
      expect(projected(wrapper, 'call')).toBe('$1.75');
      expect(
        wrapper
          .get(testId('testVoiceProjectionChange'))
          .attributes('data-tone'),
      ).toBe('neutral');

      // 1h: $0.50 in an hour is $12 a day; the hour before cost half.
      await wrapper.get(testId('testVoiceWindow-1h')).trigger('click');
      await flushPromises();
      expect(projected(wrapper, 'day')).toBe('$12.00');
      expect(projected(wrapper, 'month')).toBe('$360.00');
      expect(projected(wrapper, 'call')).toBe('$0.050');
      expect(wrapper.get(testId('testVoiceProjectionChange')).text()).toContain(
        '+100%',
      );
      expect(wrapper.get(testId('testVoiceProjectionShortHint')).text()).toBe(
        '~~Short window: projection is rough',
      );
      expect(wrapper.get(testId('testVoiceCostProjection')).text()).toContain(
        'Excludes phone and LiveKit',
      );
    });

    it('shows a dash for a time frame with no cost', async () => {
      mockApi({ metrics: [], trend: [] });
      const wrapper = await mountOverview();
      await wrapper.get(testId('testVoiceWindow-30d')).trigger('click');
      await flushPromises();

      expect(wrapper.find(testId('testVoiceProjection-day')).exists()).toBe(
        false,
      );
      expect(wrapper.get(testId('testVoiceProjectionEmpty')).text()).toContain(
        '—',
      );
      expect(wrapper.find(testId('testVoiceExpectedCalls')).exists()).toBe(
        false,
      );
    });

    it('projects expected calls per day, and remembers them', async () => {
      mockApi({ metrics: [], trend: [] });
      const wrapper = await mountOverview();
      const input = wrapper.get(testId('testVoiceExpectedCalls'));
      // The default is the calls per day of the time frame.
      expect(input.attributes('placeholder')).toBe('30');

      await input.setValue('100');
      // $0.4167 a call times 100 calls; no change against the day before.
      expect(projected(wrapper, 'day')).toBe('$41.67');
      expect(projected(wrapper, 'week')).toBe('$291.67');
      expect(projected(wrapper, 'month')).toBe('$1,250');
      expect(projected(wrapper, 'call')).toBe('$0.417');
      expect(wrapper.find(testId('testVoiceProjectionChange')).exists()).toBe(
        false,
      );
      expect(localStorage.getItem('voiceCostExpectedCallsPerDay')).toBe('100');

      // Not a number: back to the rate of the time frame.
      await input.setValue('abc');
      expect(projected(wrapper, 'day')).toBe('$12.50');

      await input.setValue('');
      expect(localStorage.getItem('voiceCostExpectedCallsPerDay')).toBeNull();
    });

    it('starts with the expected calls kept on the device', async () => {
      localStorage.setItem('voiceCostExpectedCallsPerDay', '60');
      mockApi({ metrics: [], trend: [] });
      const wrapper = await mountOverview();
      expect(
        (
          wrapper.get(testId('testVoiceExpectedCalls'))
            .element as HTMLInputElement
        ).value,
      ).toBe('60');
      expect(projected(wrapper, 'day')).toBe('$25.00');
    });
  });
});
