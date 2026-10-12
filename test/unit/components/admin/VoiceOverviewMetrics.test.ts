import { flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BaseButton from '@/components/BaseButton.vue';
import VoiceOverviewMetrics from '@/components/admin/voice/VoiceOverviewMetrics.vue';
import { server } from '../../../setupTests';

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
    key: 'cost_usd',
    label: 'Model cost',
    format: 'usd',
    values: { ...values(null), '24h': 12.5 },
    previous: { ...values(null), '24h': 10 },
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

afterEach(() => {
  vi.useRealTimers();
});

describe('VoiceOverviewMetrics', () => {
  it('shows a row per metric and a column per window, formatted', async () => {
    mockApi({ metrics: [], trend: [] });
    const wrapper = await mountOverview();

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
    expect(wrapper.find('table').exists()).toBe(false);
  });
});
