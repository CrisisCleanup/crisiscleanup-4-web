import { describe, expect, it } from 'vitest';
import {
  bucketLabel,
  formatMetricValue,
  groupMetrics,
  metricDelta,
  parseExpectedCalls,
  projectCost,
  timeAgo,
  withCostPerCall,
  type Metric,
} from '@/hooks/voice/voiceMetrics';

function metric(key: string, format: Metric['format'] = 'count'): Metric {
  return { key, label: key, format, values: {}, previous: {} };
}

describe('formatMetricValue', () => {
  it('formats each kind of metric', () => {
    expect(formatMetricValue(1234, 'count')).toBe('1,234');
    expect(formatMetricValue(0.625, 'percent')).toBe('62.5%');
    expect(formatMetricValue(0.5, 'percent')).toBe('50%');
    expect(formatMetricValue(45, 'seconds')).toBe('45s');
    expect(formatMetricValue(134, 'seconds')).toBe('2m 14s');
    expect(formatMetricValue(12.5, 'usd')).toBe('$12.50');
    expect(formatMetricValue(0.1843, 'usd')).toBe('$0.184');
  });

  it('formats dollars by size, with thousands separators', () => {
    expect(formatMetricValue(0.058, 'usd')).toBe('$0.058');
    expect(formatMetricValue(0, 'usd')).toBe('$0.000');
    expect(formatMetricValue(3.45, 'usd')).toBe('$3.45');
    expect(formatMetricValue(999.4, 'usd')).toBe('$999.40');
    expect(formatMetricValue(1250, 'usd')).toBe('$1,250');
    expect(formatMetricValue(11_700.4, 'usd')).toBe('$11,700');
    expect(formatMetricValue(1_234_567, 'usd')).toBe('$1,234,567');
    // A value that rounds up to the next size takes the format of that size.
    expect(formatMetricValue(0.9997, 'usd')).toBe('$1.00');
    expect(formatMetricValue(999.7, 'usd')).toBe('$1,000');
  });

  it('shows a dash when there is no value', () => {
    expect(formatMetricValue(null, 'count')).toBe('—');
    expect(formatMetricValue(undefined, 'usd')).toBe('—');
  });

  it('shows zero as a value', () => {
    expect(formatMetricValue(0, 'count')).toBe('0');
    expect(formatMetricValue(0, 'percent')).toBe('0%');
  });
});

describe('metricDelta', () => {
  it('is green when a good metric rises and red when it falls', () => {
    expect(metricDelta(metric('cases_created'), 12, 10)).toEqual({
      direction: 'up',
      text: '+20%',
      tone: 'good',
    });
    expect(metricDelta(metric('cases_created'), 5, 10)).toMatchObject({
      direction: 'down',
      text: '-50%',
      tone: 'bad',
    });
  });

  it.each([
    'abandoned',
    'missed_cases',
    'errors',
    'save_retries',
    'approximate_locations',
    'open_issues',
    'cost_per_case',
    'callback_offers',
  ])('is red when %s rises and green when it falls', (key) => {
    expect(metricDelta(metric(key), 3, 2)?.tone).toBe('bad');
    expect(metricDelta(metric(key), 1, 2)?.tone).toBe('good');
  });

  it.each(['cost_usd', 'avg_duration'])('is neutral for %s', (key) => {
    expect(metricDelta(metric(key, 'usd'), 3, 2)?.tone).toBe('neutral');
    expect(metricDelta(metric(key, 'usd'), 1, 2)?.tone).toBe('neutral');
  });

  it('shows a percent metric as points', () => {
    expect(metricDelta(metric('case_rate', 'percent'), 0.75, 0.7)).toEqual({
      direction: 'up',
      text: '+5 pts',
      tone: 'good',
    });
    expect(
      metricDelta(metric('callback_accept_rate', 'percent'), 0.4, 0.55),
    ).toMatchObject({ text: '-15 pts', tone: 'bad' });
  });

  it('is flat when nothing changed and silent when a side is unknown', () => {
    expect(metricDelta(metric('calls'), 4, 4)).toEqual({
      direction: 'flat',
      text: '0',
      tone: 'neutral',
    });
    expect(metricDelta(metric('calls'), null, 4)).toBeUndefined();
    const unknown = undefined as number | undefined;
    expect(metricDelta(metric('calls'), 4, unknown)).toBeUndefined();
  });

  it('says new when the window before had none', () => {
    expect(metricDelta(metric('errors'), 3, 0)).toEqual({
      direction: 'up',
      text: 'new',
      tone: 'bad',
    });
  });
});

describe('groupMetrics', () => {
  it('puts metrics in their groups, in order, and unknown keys last', () => {
    const groups = groupMetrics([
      metric('cost_per_case'),
      metric('mystery'),
      metric('calls'),
      metric('errors'),
      metric('cases_created'),
    ]);
    expect(groups.map((g) => [g.title, g.metrics.map((m) => m.key)])).toEqual([
      ['~~Volume', ['calls', 'cases_created']],
      ['~~Quality', ['errors']],
      ['~~Cost', ['cost_per_case']],
      ['~~Other', ['mystery']],
    ]);
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-10-12T12:00:00Z');
  it('speaks in seconds, then minutes', () => {
    expect(timeAgo(new Date('2026-10-12T11:59:57Z'), now)).toBe('just now');
    expect(timeAgo(new Date('2026-10-12T11:59:15Z'), now)).toBe('45 s ago');
    expect(timeAgo(new Date('2026-10-12T11:56:00Z'), now)).toBe('4 min ago');
  });
});

describe('bucketLabel', () => {
  it('labels long windows by day and short windows by time', () => {
    const start = '2026-10-12T15:30:00Z';
    expect(bucketLabel(start, '7d')).toMatch(/Oct/);
    expect(bucketLabel(start, '1h')).toMatch(/\d/);
    expect(bucketLabel(start, '1h')).not.toMatch(/Oct/);
  });
});

describe('projectCost', () => {
  it('projects the rate of a one hour window', () => {
    // $0.50 in an hour over 10 calls.
    const projection = projectCost({ cost: 0.5, calls: 10, window: '1h' });
    expect(projection).toMatchObject({
      perDay: 12,
      perWeek: 84,
      perMonth: 360,
      perCall: 0.05,
      callsPerDay: 240,
      usesExpectedCalls: false,
    });
  });

  it('scales by the length of the window', () => {
    expect(projectCost({ cost: 3, calls: 3, window: '3h' })?.perDay).toBe(24);
    expect(projectCost({ cost: 12, calls: 5, window: '24h' })?.perDay).toBe(12);
    expect(projectCost({ cost: 70, calls: 40, window: '7d' })?.perDay).toBe(10);
    expect(projectCost({ cost: 300, calls: 90, window: '30d' })).toMatchObject({
      perDay: 10,
      perWeek: 70,
      perMonth: 300,
      callsPerDay: 3,
    });
  });

  it('has no projection without calls or cost', () => {
    const window = '24h';
    expect(projectCost({ cost: 5, calls: 0, window })).toBeUndefined();
    expect(projectCost({ cost: 0, calls: 5, window })).toBeUndefined();
    expect(projectCost({ cost: null, calls: 5, window })).toBeUndefined();
    expect(projectCost({ cost: 5, calls: null, window })).toBeUndefined();
    expect(projectCost({ cost: undefined, calls: undefined, window })).toBe(
      undefined,
    );
  });

  it('compares the daily rate with the window before; up is bad', () => {
    const rise = projectCost({
      cost: 12,
      calls: 5,
      window: '24h',
      previousCost: 8,
    });
    expect(rise?.change).toEqual({
      direction: 'up',
      text: '+50%',
      tone: 'bad',
    });
    const fall = projectCost({
      cost: 6,
      calls: 5,
      window: '7d',
      previousCost: 12,
    });
    expect(fall?.change).toMatchObject({ direction: 'down', tone: 'good' });
    expect(
      projectCost({ cost: 6, calls: 5, window: '7d', previousCost: 0 })?.change
        ?.text,
    ).toBe('new');
    expect(
      projectCost({ cost: 6, calls: 5, window: '7d', previousCost: null })
        ?.change,
    ).toBeUndefined();
  });

  it('projects cost per call times the expected calls per day', () => {
    // $12.50 over 30 calls in a day is $0.41667 a call.
    const projection = projectCost({
      cost: 12.5,
      calls: 30,
      window: '24h',
      previousCost: 10,
      expectedCallsPerDay: 60,
    });
    expect(projection?.perDay).toBeCloseTo(25);
    expect(projection?.perWeek).toBeCloseTo(175);
    expect(projection?.perMonth).toBeCloseTo(750);
    expect(projection?.perCall).toBeCloseTo(12.5 / 30);
    expect(projection?.usesExpectedCalls).toBe(true);
    // The rate of the window is no longer what is shown: no change.
    expect(projection?.change).toBeUndefined();
  });
});

describe('parseExpectedCalls', () => {
  it('reads a positive number', () => {
    expect(parseExpectedCalls('120')).toBe(120);
    expect(parseExpectedCalls(' 2.5 ')).toBe(2.5);
  });

  it('ignores anything else', () => {
    for (const text of ['', 'abc', '0', '-4', 'NaN', 'Infinity']) {
      expect(parseExpectedCalls(text)).toBeUndefined();
    }
  });
});

describe('withCostPerCall', () => {
  const cost: Metric = {
    key: 'cost_usd',
    label: 'Est. cost',
    format: 'usd',
    values: { '1h': 1, '24h': 12, '7d': 0 },
    previous: { '1h': 3, '24h': 6 },
  };
  const calls: Metric = {
    key: 'calls',
    label: 'Calls',
    format: 'count',
    values: { '1h': 4, '24h': 6, '7d': 10, '30d': 0 },
    previous: { '1h': 3, '24h': 0 },
  };

  it('adds cost over calls for each window and the window before', () => {
    const added = withCostPerCall([calls, cost]).at(-1);
    expect(added).toMatchObject({
      key: 'cost_per_call',
      format: 'usd',
      values: { '1h': 0.25, '24h': 2 },
      previous: { '1h': 1 },
    });
    // No calls, no cost or no value: a dash, never zero or infinity.
    expect(added?.values['7d']).toBeNull();
    expect(added?.values['30d']).toBeNull();
    expect(added?.previous['24h']).toBeNull();
    expect(added?.previous['3h']).toBeNull();
  });

  it('colors a rise in it as bad', () => {
    expect(metricDelta(metric('cost_per_call', 'usd'), 0.5, 0.25)?.tone).toBe(
      'bad',
    );
    expect(metricDelta(metric('cost_per_call', 'usd'), 0.2, 0.25)?.tone).toBe(
      'good',
    );
  });

  it('leaves the metrics alone without cost or calls, or with the metric', () => {
    expect(withCostPerCall([calls])).toEqual([calls]);
    expect(withCostPerCall([cost])).toEqual([cost]);
    const own = metric('cost_per_call', 'usd');
    const all = [calls, cost, own];
    expect(withCostPerCall(all)).toBe(all);
  });
});
