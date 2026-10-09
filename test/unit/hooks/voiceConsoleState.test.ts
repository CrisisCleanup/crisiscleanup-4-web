import { describe, expect, it } from 'vitest';
import {
  applyConsoleEvent,
  callToText,
  createCallState,
  formatClock,
  formatCost,
  formatSeconds,
  parseConsoleEvent,
  summarizeMetrics,
  upsertTranscript,
} from '@/hooks/voice/voiceConsoleState';

const metric = (ttft: number, cost: number | null = null) => ({
  ttft,
  duration: 2,
  input_tokens: 100,
  output_tokens: 50,
  cached_tokens: 80,
  estimated_cost_usd: cost,
});

describe('voiceConsoleState', () => {
  it('folds agent events into the call state', () => {
    const state = createCallState('voice-intake-abc');
    applyConsoleEvent(
      state,
      {
        kind: 'config',
        data: { language: 'es', model: 'gpt-realtime-2.1-mini', voice: 'echo' },
      },
      '0:01',
    );
    applyConsoleEvent(
      state,
      {
        kind: 'tools',
        data: [
          {
            name: 'record_field',
            arguments: '{"key":"name"}',
            output: 'ok',
            is_error: false,
            ms: 120,
          },
        ],
      },
      '0:05',
    );
    applyConsoleEvent(
      state,
      {
        kind: 'state',
        data: {
          incident: { id: 248, name: 'Medium Flood' },
          fields: { name: 'Tobi Abiodun' },
          notes: [],
          ready: false,
          missing: ['phone'],
        },
      },
      '0:05',
    );
    applyConsoleEvent(
      state,
      { kind: 'finalized', data: { case_number: 'P2454', worksite_id: 9 } },
      '4:00',
    );

    expect(state.config?.language).toBe('es');
    expect(state.tools).toEqual([
      {
        name: 'record_field',
        arguments: '{"key":"name"}',
        output: 'ok',
        is_error: false,
        ms: 120,
        at: '0:05',
      },
    ]);
    expect(state.caseState.incident?.name).toBe('Medium Flood');
    expect(state.caseState.missing).toEqual(['phone']);
    expect(state.finalized?.case_number).toBe('P2454');
  });

  it('ignores messages that are not console events', () => {
    expect(parseConsoleEvent('not json')).toBeNull();
    expect(parseConsoleEvent('{"foo": 1}')).toBeNull();
    expect(parseConsoleEvent('{"kind":"tools","data":[]}')).toEqual({
      kind: 'tools',
      data: [],
    });
  });

  it('updates a streaming transcript segment in place', () => {
    const state = createCallState();
    upsertTranscript(state, {
      id: 's1',
      at: '0:01',
      who: 'agent',
      text: 'Hel',
      final: false,
    });
    upsertTranscript(state, {
      id: 's1',
      at: '0:02',
      who: 'agent',
      text: 'Hello',
      final: true,
    });
    expect(state.transcript).toHaveLength(1);
    expect(state.transcript[0]).toMatchObject({
      text: 'Hello',
      final: true,
      at: '0:01',
    });
  });

  it('summarizes response latency, tokens, and the latest cost', () => {
    const summary = summarizeMetrics([
      { ...metric(0.4, 0.01), at: '0:01' },
      { ...metric(1.6, 0.03), at: '0:10' },
    ]);
    expect(summary.last).toBe(1.6);
    expect(summary.average).toBeCloseTo(1);
    expect(summary.slowest).toBe(1.6);
    expect(summary.cost).toBe(0.03);
    expect(summary.inputTokens).toBe(200);
    expect(summary.cachedTokens).toBe(160);
    expect(summary.responses).toBe(2);
    expect(summarizeMetrics([]).last).toBeNull();
  });

  it('exports final transcript lines and tool calls as text', () => {
    const state = createCallState('voice-intake-abc');
    upsertTranscript(state, {
      id: 'a',
      at: '0:01',
      who: 'agent',
      text: 'Hello',
      final: true,
    });
    upsertTranscript(state, {
      id: 'b',
      at: '0:02',
      who: 'caller',
      text: 'Hi th',
      final: false,
    });
    applyConsoleEvent(
      state,
      {
        kind: 'tools',
        data: [
          {
            name: 'end_call',
            arguments: '{}',
            output: 'noted',
            is_error: false,
            ms: null,
          },
        ],
      },
      '0:03',
    );
    const text = callToText(state);
    expect(text).toContain('Room: voice-intake-abc');
    expect(text).toContain('[0:01] agent: Hello');
    expect(text).not.toContain('Hi th');
    expect(text).toContain('[0:03] end_call({}) -> noted');
  });

  it('formats clock, seconds, and cost', () => {
    expect(formatClock(95)).toBe('1:35');
    expect(formatSeconds(0.369)).toBe('369 ms');
    expect(formatSeconds(2.184)).toBe('2.18 s');
    expect(formatSeconds(null)).toBe('—');
    expect(formatCost(0.304)).toBe('$0.304');
    expect(formatCost(0.0042)).toBe('0.42¢');
    expect(formatCost(null)).toBe('—');
  });
});
