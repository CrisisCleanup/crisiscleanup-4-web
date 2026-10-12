import { describe, expect, it } from 'vitest';
import {
  bucketLabel,
  formatMetricValue,
  groupMetrics,
  metricDelta,
  timeAgo,
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
