import { describe, expect, it } from 'vitest';
import {
  bucketLabel,
  formatMetricValue,
  groupMetrics,
  metricDelta,
  parseExpectedCalls,
  forecastCost,
  groupByLocalHour,
  hourLabel,
  projectToday,
  scaleToExpectedCalls,
  typicalDay,
  timeAgo,
  withCostPerCall,
  type CostProfile,
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

/** A profile of the 168 hours before `end`, with calls and cost per hour. */
function profileBefore(
  end: string,
  hour: (start: Date) => { calls: number; cost_usd: number },
): CostProfile {
  const last = Date.parse(end);
  return {
    days: 7,
    hours: Array.from({ length: 168 }, (_, index) => {
      const start = new Date(last - (168 - index) * 3_600_000);
      return { start: start.toISOString(), ...hour(start) };
    }),
  };
}

/** Calls rise from 6 to 9 in the evening (UTC) and cost $0.05 a call. */
function eveningProfile(end: string) {
  return profileBefore(end, (start) => {
    const calls = start.getUTCHours() >= 18 && start.getUTCHours() < 21 ? 4 : 0;
    return { calls, cost_usd: calls * 0.05 };
  });
}

describe('groupByLocalHour', () => {
  it('groups the hours of the profile by the hour of day in the zone', () => {
    const profile = eveningProfile('2026-10-12T15:00:00Z');
    const utc = groupByLocalHour(profile, 'UTC');
    expect(utc).toHaveLength(24);
    expect(utc.map((hour) => hour.calls)).toEqual(
      Array.from({ length: 24 }, (_, hour) =>
        hour >= 18 && hour < 21 ? 4 : 0,
      ),
    );
    expect(utc[18].cost).toBeCloseTo(0.2);

    // New York is UTC-4 in October: 18 to 21 UTC is 14 to 17 there.
    const newYork = groupByLocalHour(profile, 'America/New_York');
    expect(
      newYork.flatMap((hour, index) => (hour.calls ? [index] : [])),
    ).toEqual([14, 15, 16]);
    expect(newYork[14]).toEqual(utc[18]);
  });

  it('takes the mean of hours that fall in the same local hour', () => {
    const profile = profileBefore('2026-10-12T00:00:00Z', (start) => {
      const day = start.getUTCDate();
      return { calls: day, cost_usd: day / 10 };
    });
    // Days 5 to 11 of October: the mean day is 8.
    const [midnight] = groupByLocalHour(profile, 'UTC');
    expect(midnight.calls).toBeCloseTo(8);
    expect(midnight.cost).toBeCloseTo(0.8);
  });

  it('counts a repeated hour as it is when clocks go back', () => {
    // 1 AM happens twice on 2026-11-01 in New York (EDT, then EST).
    const profile = profileBefore('2026-11-02T05:00:00Z', () => ({
      calls: 1,
      cost_usd: 0.5,
    }));
    const hourly = groupByLocalHour(profile, 'America/New_York');
    const hours = profile.hours.filter((hour) =>
      hour.start.startsWith('2026-11-01T0'),
    );
    expect(hours).toHaveLength(10);
    // Every local hour has a mean of 1 call: 8 hours of 1 AM, divided by 8.
    expect(hourly.every((hour) => hour.calls === 1 && hour.cost === 0.5)).toBe(
      true,
    );
  });

  it('keeps a mean when clocks go forward and an hour is missing', () => {
    // 2 AM does not exist on 2026-03-08 in New York.
    const profile = profileBefore('2026-03-09T04:00:00Z', () => ({
      calls: 2,
      cost_usd: 1,
    }));
    const hourly = groupByLocalHour(profile, 'America/New_York');
    expect(hourly.every((hour) => hour.calls === 2 && hour.cost === 1)).toBe(
      true,
    );
  });

  it('puts a half hour zone hour in the local hour it starts in', () => {
    // 18:00 UTC is 23:30 in Kolkata (UTC+5:30).
    const hourly = groupByLocalHour(
      eveningProfile('2026-10-12T15:00:00Z'),
      'Asia/Kolkata',
    );
    expect(
      hourly.flatMap((hour, index) => (hour.calls ? [index] : [])),
    ).toEqual([0, 1, 23]);
  });

  it('is empty for an hour with no profile hours', () => {
    const hourly = groupByLocalHour({ days: 7, hours: [] }, 'UTC');
    expect(hourly).toEqual(
      Array.from({ length: 24 }, () => ({ calls: 0, cost: 0 })),
    );
  });
});

describe('typicalDay and scaleToExpectedCalls', () => {
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    calls: hour < 12 ? 2 : 0,
    cost: hour < 12 ? 0.5 : 0,
  }));

  it('adds up the 24 hours', () => {
    expect(typicalDay(hourly)).toEqual({ calls: 24, cost: 6 });
  });

  it('sizes the day to the expected calls and keeps its shape', () => {
    const scaled = scaleToExpectedCalls(hourly, 48);
    expect(typicalDay(scaled)).toEqual({ calls: 48, cost: 12 });
    expect(scaled[0]).toEqual({ calls: 4, cost: 1 });
    expect(scaled[12]).toEqual({ calls: 0, cost: 0 });
  });

  it('leaves a day with no calls as it is', () => {
    const quiet = hourly.map(() => ({ calls: 0, cost: 0 }));
    expect(scaleToExpectedCalls(quiet, 50)).toBe(quiet);
  });
});

describe('projectToday', () => {
  const zone = 'America/New_York';

  it('adds the cost so far today to the typical cost of the hours left', () => {
    // 2026-10-12T15:30Z is 11:30 in New York. Today began at 04:00Z.
    const profile = eveningProfile('2026-10-12T15:00:00Z');
    const hourly = groupByLocalHour(profile, zone);
    // Today so far (local 0 to 10) had no calls. Left: 14, 15, 16 at $0.20.
    expect(
      projectToday(profile, hourly, Date.parse('2026-10-12T15:30:00Z'), zone),
    ).toBeCloseTo(0.6);

    // At 19:30Z (15:30 local) the 14 o'clock hour is spent: $0.20 so far.
    const later = eveningProfile('2026-10-12T19:00:00Z');
    expect(
      projectToday(
        later,
        groupByLocalHour(later, zone),
        Date.parse('2026-10-12T19:30:00Z'),
        zone,
      ),
    ).toBeCloseTo(0.2 + 0.4);
  });

  it('counts the hours of the local day, not of the UTC day', () => {
    // 02:30Z on Oct 13 is 22:30 on Oct 12 in New York: 22:00 and 23:00 are
    // left. The profile hour of 2026-10-12T20Z (16:00 local) cost $1 and
    // counts for today; the hour of 03:00Z Oct 12 (23:00 on Oct 11) does not.
    const profile = profileBefore('2026-10-13T02:00:00Z', (start) => ({
      calls: 1,
      cost_usd: start.toISOString() === '2026-10-12T20:00:00.000Z' ? 1 : 0.1,
    }));
    const hourly = groupByLocalHour(profile, zone);
    const soFar = profile.hours
      .filter(
        (hour) =>
          hour.start >= '2026-10-12T04:00' && hour.start < '2026-10-13T02:00',
      )
      .reduce((total, hour) => total + hour.cost_usd, 0);
    expect(soFar).toBeCloseTo(1 + 0.1 * 21);
    expect(
      projectToday(profile, hourly, Date.parse('2026-10-13T02:30:00Z'), zone),
    ).toBeCloseTo(soFar + hourly[22].cost + hourly[23].cost);
  });

  it('follows the real hours on a day with a clock change', () => {
    // 2026-11-01 in New York has 25 hours. At 00:30 EDT (04:30Z) all of them
    // are left, and the repeated 1 AM counts twice.
    const profile = profileBefore('2026-11-01T04:00:00Z', () => ({
      calls: 1,
      cost_usd: 1,
    }));
    const hourly = groupByLocalHour(profile, zone);
    expect(
      projectToday(profile, hourly, Date.parse('2026-11-01T04:30:00Z'), zone),
    ).toBeCloseTo(25);
  });
});

describe('forecastCost', () => {
  const zone = 'America/New_York';
  const now = Date.parse('2026-10-12T15:30:00Z');
  const profile = eveningProfile('2026-10-12T15:00:00Z');

  it('projects the typical day, week and 30 days', () => {
    // 12 calls and $0.60 a day at $0.05 a call.
    const forecast = forecastCost(profile, { now, zone });
    expect(forecast).toMatchObject({
      callsPerDay: 12,
      usesExpectedCalls: false,
      currentHour: 11,
    });
    expect(forecast?.perDay).toBeCloseTo(0.6);
    expect(forecast?.perWeek).toBeCloseTo(4.2);
    expect(forecast?.perMonth).toBeCloseTo(18);
    expect(forecast?.perCall).toBeCloseTo(0.05);
    expect(forecast?.today).toBeCloseTo(0.6);
    expect(forecast?.hourly[14].cost).toBeCloseTo(0.2);
  });

  it('sizes the projection to the expected calls, not what was spent', () => {
    // Twice the calls: twice the cost for the hours left. The cost so far
    // today is a fact and stays.
    const spent = profileBefore('2026-10-12T15:00:00Z', (start) => {
      const calls =
        start.getUTCHours() >= 18 && start.getUTCHours() < 21 ? 4 : 0;
      const today = start.getTime() >= Date.parse('2026-10-12T04:00:00Z');
      return { calls, cost_usd: calls * 0.05 + (today ? 0.01 : 0) };
    });
    const typical = forecastCost(spent, { now, zone });
    const doubled = forecastCost(spent, { now, zone, expectedCallsPerDay: 24 });
    expect(doubled?.usesExpectedCalls).toBe(true);
    expect(doubled?.callsPerDay).toBe(12);
    expect(doubled?.perCall).toBe(typical?.perCall);
    // 11 hours of today so far cost $0.01 each: $0.11.
    expect(typical?.today).toBeCloseTo(0.11 + 0.6);
    expect(doubled?.today).toBeCloseTo(0.11 + 1.2);
    expect(doubled?.perDay).toBeCloseTo((typical?.perDay ?? 0) * 2);
    expect(doubled?.perMonth).toBeCloseTo((doubled?.perDay ?? 0) * 30);
    expect(doubled?.hourly[14].calls).toBeCloseTo(8);
  });

  it('is undefined when the profile has no calls or no cost', () => {
    expect(forecastCost({ days: 7, hours: [] }, { now, zone })).toBeUndefined();
    const quiet = profileBefore('2026-10-12T15:00:00Z', () => ({
      calls: 0,
      cost_usd: 0,
    }));
    expect(forecastCost(quiet, { now, zone })).toBeUndefined();
    const free = profileBefore('2026-10-12T15:00:00Z', () => ({
      calls: 1,
      cost_usd: 0,
    }));
    expect(forecastCost(free, { now, zone })).toBeUndefined();
  });
});

describe('hourLabel', () => {
  it('names an hour of the day', () => {
    expect(hourLabel(0)).toMatch(/^(12\s?AM|0|00)$/);
    expect(hourLabel(18)).toMatch(/^(6\s?PM|18)$/);
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
