/**
 * Overall metrics of the voice intake line (`/admins/voice_console/metrics`):
 * each metric over 1 hour, 3 hours, a day, a week and 30 days, with the change
 * since the window before it, and a trend of buckets for one window.
 */
import axios from 'axios';
import { getErrorMessage } from '@/utils/errors';

export type MetricFormat = 'count' | 'percent' | 'seconds' | 'usd';
export type MetricWindow = '1h' | '3h' | '24h' | '7d' | '30d';
export type MetricValues = Partial<Record<MetricWindow, number | null>>;

export interface Metric {
  key: string;
  label: string;
  format: MetricFormat;
  values: MetricValues;
  previous: MetricValues;
}

export interface MetricsResponse {
  generated_at: string;
  windows: MetricWindow[];
  metrics: Metric[];
}

export interface TrendBucket {
  start: string;
  calls: number;
  cases_created: number;
  callback_offers: number;
  errors: number;
  open_issues: number;
}

export type TrendSeries = Exclude<keyof TrendBucket, 'start'>;

export const REFRESH_MS = 60_000;

export function metricsUrl(path = '') {
  return `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_console/metrics${
    path ? `/${path}` : ''
  }`;
}

export const WINDOW_LABELS: Record<MetricWindow, string> = {
  '1h': '~~1 hour',
  '3h': '~~3 hours',
  '24h': '~~1 day',
  '7d': '~~1 week',
  '30d': '~~30 days',
};

export const COST_GROUP = '~~Cost';

export const METRIC_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: '~~Volume',
    keys: ['calls', 'intake_calls', 'cases_created', 'second_cases'],
  },
  {
    title: '~~Outcomes',
    keys: ['case_rate', 'abandoned', 'missed_cases', 'avg_duration'],
  },
  {
    title: '~~Callbacks',
    keys: ['callback_offers', 'callback_accept_rate', 'callback_requests'],
  },
  {
    title: '~~Quality',
    keys: [
      'errors',
      'save_retries',
      'approximate_locations',
      'reviews_done',
      'open_issues',
      'auto_fixes',
      'manual_fixes',
    ],
  },
  { title: COST_GROUP, keys: ['cost_usd', 'cost_per_case', 'cost_per_call'] },
];

/** The metrics that get a large card at the top. */
export const HEADLINE_KEYS = [
  'calls',
  'cases_created',
  'case_rate',
  'callback_accept_rate',
  'open_issues',
  'cost_per_case',
  'cost_per_call',
];

/** The series the trend chart can draw, in the order of its picker. */
export const TREND_SERIES: TrendSeries[] = [
  'calls',
  'cases_created',
  'callback_offers',
  'errors',
  'open_issues',
];

/** One plain line on what a metric means. */
export const METRIC_HINTS: Record<string, string> = {
  calls: '~~Every call to the line, including status checks',
  intake_calls: '~~Calls that were not only a status check',
  cases_created: '~~Cases the line saved from calls',
  second_cases: '~~Extra cases saved on the same call',
  case_rate: '~~Cases created per intake call',
  abandoned: '~~Callers who hung up before a case was saved',
  missed_cases: '~~Cases the reviewer found the line should have saved',
  avg_duration: '~~How long a call lasts, on average',
  callback_offers: '~~Calls where the line offered a callback',
  callback_accept_rate: '~~Callback offers that the caller accepted',
  callback_requests: '~~Calls where the caller asked for a callback',
  errors: '~~Calls that ended with an error',
  save_retries: '~~Calls where saving a case needed another try',
  approximate_locations: '~~Calls saved with a guessed address',
  reviews_done: '~~Calls the Call Auditor has reviewed',
  open_issues: '~~Problems found in calls that are not fixed yet',
  auto_fixes: '~~Problems the Call Auditor fixed by itself',
  manual_fixes: '~~Problems a person fixed',
  cost_usd: '~~Voice model and Luna cost of the calls',
  cost_per_case: '~~Estimated cost for each case created',
  cost_per_call: '~~Average model cost of a call',
};

/** A rise in these is bad news. */
const UP_IS_BAD = new Set([
  'abandoned',
  'missed_cases',
  'errors',
  'save_retries',
  'approximate_locations',
  'open_issues',
  'cost_per_case',
  'cost_per_call',
  'cost_projection',
  'callback_offers',
]);
/** A rise or fall in these says nothing about how the line does. */
const NEUTRAL = new Set(['cost_usd', 'avg_duration']);

const METRIC_WINDOWS = Object.keys(WINDOW_LABELS) as MetricWindow[];

function costPerCall(cost?: number | null, calls?: number | null) {
  return cost && calls ? cost / calls : null;
}

/**
 * The metrics with the average cost of a call added: the cost of the window
 * over its calls, and the same for the window before. A dash (null) when a
 * window has no calls or no cost. Unchanged when the API has no cost or
 * calls, or already sends this metric.
 */
export function withCostPerCall(metrics: Metric[]): Metric[] {
  const cost = metrics.find((metric) => metric.key === 'cost_usd');
  const calls = metrics.find((metric) => metric.key === 'calls');
  if (!cost || !calls || metrics.some((m) => m.key === 'cost_per_call')) {
    return metrics;
  }
  const ratio = (side: 'values' | 'previous'): MetricValues =>
    Object.fromEntries(
      METRIC_WINDOWS.map((window) => [
        window,
        costPerCall(cost[side]?.[window], calls[side]?.[window]),
      ]),
    );
  return [
    ...metrics,
    {
      key: 'cost_per_call',
      label: 'Avg cost per call',
      format: 'usd',
      values: ratio('values'),
      previous: ratio('previous'),
    },
  ];
}

export interface MetricGroup {
  title: string;
  metrics: Metric[];
}

/** The metrics in groups; unknown keys go last, in a group of their own. */
export function groupMetrics(metrics: Metric[]): MetricGroup[] {
  const byKey = new Map(metrics.map((metric) => [metric.key, metric]));
  const known = new Set(METRIC_GROUPS.flatMap((group) => group.keys));
  const groups: MetricGroup[] = METRIC_GROUPS.map((group) => ({
    title: group.title,
    metrics: group.keys.flatMap((key) => byKey.get(key) ?? []),
  }));
  groups.push({
    title: '~~Other',
    metrics: metrics.filter((metric) => !known.has(metric.key)),
  });
  return groups.filter((group) => group.metrics.length > 0);
}

const usdFormats = [3, 2, 0].map(
  (digits) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }),
);

/** Dollars: 3 decimals under $1, 2 up to $999.99, none from $1,000 up. */
function formatUsd(value: number): string {
  const size = Math.abs(value);
  // Pick by the rounded value, so $999.996 shows as $1,000 and not $1000.00.
  if (size >= 999.5) return usdFormats[2].format(value);
  if (size >= 0.9995) return usdFormats[1].format(value);
  return usdFormats[0].format(value);
}

/**
 * A value as the table shows it. Percent values are fractions: 0.625 is 62.5%.
 */
export function formatMetricValue(
  value: number | null | undefined,
  format: MetricFormat,
): string {
  if (value === null || value === undefined) return '—';
  switch (format) {
    case 'percent': {
      const percent = value * 100;
      return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`;
    }
    case 'seconds': {
      return value < 60
        ? `${Math.round(value)}s`
        : `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`;
    }
    case 'usd': {
      return formatUsd(value);
    }
    default: {
      return value.toLocaleString();
    }
  }
}

export type DeltaTone = 'good' | 'bad' | 'neutral';

export interface MetricDelta {
  direction: 'up' | 'down' | 'flat';
  /** "+12%", "-3 pts", "new" or "0" */
  text: string;
  tone: DeltaTone;
}

/**
 * The change of a window against the window before it. Counts, seconds and
 * money change by percent; a percent metric changes in points. Undefined when
 * either side is unknown.
 */
export function metricDelta(
  metric: Pick<Metric, 'key' | 'format'>,
  current: number | null | undefined,
  previous: number | null | undefined,
): MetricDelta | undefined {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined
  ) {
    return undefined;
  }
  const diff = current - previous;
  if (Math.abs(diff) < 1e-9) {
    return { direction: 'flat', text: '0', tone: 'neutral' };
  }
  const direction = diff > 0 ? 'up' : 'down';
  let tone: DeltaTone = 'neutral';
  if (!NEUTRAL.has(metric.key)) {
    const upIsBad = UP_IS_BAD.has(metric.key);
    tone = diff > 0 === upIsBad ? 'bad' : 'good';
  }
  const sign = diff > 0 ? '+' : '-';
  let text: string;
  if (metric.format === 'percent') {
    text = `${sign}${Math.abs(diff * 100)
      .toFixed(1)
      .replace(/\.0$/, '')} pts`;
  } else if (previous === 0) {
    text = 'new';
  } else {
    text = `${sign}${Math.round(Math.abs(diff / previous) * 100)}%`;
  }
  return { direction, text, tone };
}

/** How many hours each window spans. */
export const WINDOW_HOURS: Record<MetricWindow, number> = {
  '1h': 1,
  '3h': 3,
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
};

/** Windows this short swing a lot, so a projection from them is rough. */
export const SHORT_WINDOWS: MetricWindow[] = ['1h', '3h'];

const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;

export interface CostProjection {
  perDay: number;
  perWeek: number;
  perMonth: number;
  perCall: number;
  /** Calls per day at the rate of the window. */
  callsPerDay: number;
  /** The projection used the caller's expected calls, not the window's rate. */
  usesExpectedCalls: boolean;
  /** Daily run rate against the window before; not given for expected calls. */
  change?: MetricDelta;
}

/** A positive number of calls per day from text; undefined for anything else. */
export function parseExpectedCalls(text: string): number | undefined {
  const value = Number.parseFloat(text);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * What the cost of a window comes to per day, week (7 days) and month
 * (30 days) if the line keeps that rate. With `expectedCallsPerDay` the
 * projection is the cost of one call times those calls instead. Undefined when
 * the window has no calls or no cost.
 */
export function projectCost(input: {
  cost: number | null | undefined;
  calls: number | null | undefined;
  window: MetricWindow;
  previousCost?: number | null;
  expectedCallsPerDay?: number;
}): CostProjection | undefined {
  const { cost, calls, window, previousCost, expectedCallsPerDay } = input;
  if (!cost || !calls || cost < 0 || calls < 0) return undefined;
  const daysInWindow = WINDOW_HOURS[window] / 24;
  const callsPerDay = calls / daysInWindow;
  const perCall = cost / calls;
  const usesExpectedCalls = expectedCallsPerDay !== undefined;
  const perDay = usesExpectedCalls
    ? perCall * expectedCallsPerDay
    : cost / daysInWindow;
  const change =
    usesExpectedCalls || previousCost === null || previousCost === undefined
      ? undefined
      : metricDelta(
          { key: 'cost_projection', format: 'usd' },
          perDay,
          previousCost / daysInWindow,
        );
  return {
    perDay,
    perWeek: perDay * DAYS_IN_WEEK,
    perMonth: perDay * DAYS_IN_MONTH,
    perCall,
    callsPerDay,
    usesExpectedCalls,
    change,
  };
}

/** "just now", "42 s ago", "3 min ago". */
export function timeAgo(since: Date | number, now: Date | number): string {
  const seconds = Math.max(0, Math.round((Number(now) - Number(since)) / 1000));
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} s ago`;
  return `${Math.floor(seconds / 60)} min ago`;
}

/** Bucket label for the trend chart. */
export function bucketLabel(start: string, window: MetricWindow): string {
  const date = new Date(start);
  return window === '7d' || window === '30d'
    ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export const DEFAULT_WINDOW: MetricWindow = '24h';

/**
 * Load the metrics and the trend, and load them again every minute while
 * the page is visible. The window is in the URL (?window=7d) so it links.
 */
export function useVoiceOverview() {
  const route = useRoute();
  const router = useRouter();
  const fromUrl = Object.keys(WINDOW_LABELS).find(
    (key) => key === route.query.window,
  ) as MetricWindow | undefined;
  const includeTest = ref(false);
  const windowKey = ref<MetricWindow>(fromUrl ?? DEFAULT_WINDOW);
  const overview = ref<MetricsResponse>();
  const trend = ref<TrendBucket[]>([]);
  const loading = ref(false);
  const error = ref('');
  const updatedAt = ref<Date>();
  const now = useNow({ interval: 15_000 });
  const visibility = useDocumentVisibility();

  async function loadTrend() {
    const { data } = await axios.get<{ buckets: TrendBucket[] }>(
      metricsUrl('trend'),
      {
        params: {
          window: windowKey.value,
          include_test: includeTest.value,
        },
      },
    );
    trend.value = data.buckets;
  }

  async function load() {
    loading.value = true;
    error.value = '';
    try {
      const [metrics] = await Promise.all([
        axios.get<MetricsResponse>(metricsUrl(), {
          params: { include_test: includeTest.value },
        }),
        loadTrend(),
      ]);
      overview.value = metrics.data;
      updatedAt.value = new Date();
    } catch (error_) {
      error.value = getErrorMessage(error_);
    } finally {
      loading.value = false;
    }
  }

  // Every window is in the metrics already: a new window only loads the trend.
  async function changeWindow(next: MetricWindow) {
    windowKey.value = next;
    void router.replace({ query: { ...route.query, window: next } });
    try {
      await loadTrend();
    } catch (error_) {
      error.value = getErrorMessage(error_);
    }
  }

  useIntervalFn(() => {
    if (visibility.value === 'visible') void load();
  }, REFRESH_MS);
  // Back on the tab after a long time away: do not wait for the next tick.
  watch(visibility, (state: string) => {
    if (
      state === 'visible' &&
      (!updatedAt.value || Date.now() - updatedAt.value.getTime() >= REFRESH_MS)
    ) {
      void load();
    }
  });
  watch(includeTest, () => void load());

  const updatedAgo = computed(() =>
    updatedAt.value ? timeAgo(updatedAt.value, now.value) : '',
  );

  onMounted(load);

  return {
    includeTest,
    window: windowKey,
    overview,
    trend,
    loading,
    error,
    updatedAt,
    updatedAgo,
    load,
    changeWindow,
  };
}
