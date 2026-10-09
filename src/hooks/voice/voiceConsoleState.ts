/**
 * Call state for the admin Voice Console, kept free of LiveKit so it can be
 * unit tested. The voice agent (crisiscleanup-3-api voice_intake/agent.py)
 * sends JSON events on the `cc.intake` text stream; `applyConsoleEvent` folds
 * them into this state.
 */

export type CallLanguage = 'en' | 'es';

export interface CallConfig {
  language: CallLanguage;
  model: string;
  voice: string;
  is_test?: boolean;
}

export interface TranscriptLine {
  id: string;
  at: string; // mm:ss into the call
  who: 'agent' | 'caller' | 'simulated';
  text: string;
  final: boolean;
}

export interface ToolCall {
  at: string;
  name: string;
  arguments: string;
  output: string;
  is_error: boolean;
  ms: number | null;
}

export interface CaseState {
  incident: { id: number; name: string } | null;
  fields: Record<string, string>;
  notes: string[];
  ready: boolean;
  missing: string[];
}

export interface ResponseMetrics {
  at: string;
  ttft: number;
  duration: number;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  estimated_cost_usd: number | null;
}

export interface FinalizedCase {
  case_number: string;
  worksite_id: number;
}

export interface CallState {
  room: string;
  config: CallConfig | null;
  transcript: TranscriptLine[];
  tools: ToolCall[];
  caseState: CaseState;
  metrics: ResponseMetrics[];
  finalized: FinalizedCase | null;
}

export type ConsoleEvent =
  | { kind: 'config'; data: CallConfig }
  | { kind: 'tools'; data: Omit<ToolCall, 'at'>[] }
  | { kind: 'state'; data: CaseState }
  | { kind: 'metrics'; data: Omit<ResponseMetrics, 'at'> }
  | { kind: 'finalized'; data: FinalizedCase };

export function emptyCaseState(): CaseState {
  return { incident: null, fields: {}, notes: [], ready: false, missing: [] };
}

export function createCallState(room = ''): CallState {
  return {
    room,
    config: null,
    transcript: [],
    tools: [],
    caseState: emptyCaseState(),
    metrics: [],
    finalized: null,
  };
}

/** Fold one agent event into the call state. Unknown kinds are ignored. */
export function applyConsoleEvent(
  state: CallState,
  event: ConsoleEvent,
  at: string,
): void {
  switch (event.kind) {
    case 'config': {
      state.config = event.data;
      break;
    }
    case 'tools': {
      for (const tool of event.data) state.tools.push({ ...tool, at });
      break;
    }
    case 'state': {
      state.caseState = { ...emptyCaseState(), ...event.data };
      break;
    }
    case 'metrics': {
      state.metrics.push({ ...event.data, at });
      break;
    }
    case 'finalized': {
      state.finalized = event.data;
      break;
    }
    default: {
      break;
    }
  }
}

/** Parse a `cc.intake` message; null when it is not a console event. */
export function parseConsoleEvent(raw: string): ConsoleEvent | null {
  try {
    const event = JSON.parse(raw) as ConsoleEvent;
    return event && typeof event.kind === 'string' ? event : null;
  } catch {
    return null;
  }
}

/** Add or update one transcript segment (segments stream in as they grow). */
export function upsertTranscript(
  state: CallState,
  line: TranscriptLine,
): TranscriptLine {
  const existing = state.transcript.find((l) => l.id === line.id);
  if (existing) {
    existing.text = line.text;
    existing.final = line.final;
    return existing;
  }
  state.transcript.push(line);
  return line;
}

export interface MetricsSummary {
  last: number | null;
  average: number | null;
  slowest: number | null;
  cost: number | null;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  responses: number;
}

export function summarizeMetrics(metrics: ResponseMetrics[]): MetricsSummary {
  const ttfts = metrics.map((m) => m.ttft).filter((t) => t >= 0);
  const sum = (key: keyof ResponseMetrics) =>
    metrics.reduce((total, m) => total + (Number(m[key]) || 0), 0);
  return {
    last: ttfts.length > 0 ? ttfts.at(-1)! : null,
    average:
      ttfts.length > 0 ? ttfts.reduce((a, b) => a + b, 0) / ttfts.length : null,
    slowest: ttfts.length > 0 ? Math.max(...ttfts) : null,
    cost:
      metrics.length > 0 ? (metrics.at(-1)!.estimated_cost_usd ?? null) : null,
    inputTokens: sum('input_tokens'),
    cachedTokens: sum('cached_tokens'),
    outputTokens: sum('output_tokens'),
    responses: metrics.length,
  };
}

/** Plain-text export of a call: settings, case number, transcript, tools. */
export function callToText(state: CallState): string {
  const lines = [`Room: ${state.room || '(none)'}`];
  if (state.config) {
    lines.push(
      `Model: ${state.config.model} · voice ${state.config.voice} · ${state.config.language}`,
    );
  }
  if (state.finalized) lines.push(`Case: ${state.finalized.case_number}`);
  lines.push('');
  for (const line of state.transcript.filter((l) => l.final)) {
    lines.push(`[${line.at}] ${line.who}: ${line.text}`);
  }
  if (state.tools.length > 0) {
    lines.push('', 'Tool calls:');
    for (const tool of state.tools) {
      lines.push(
        `[${tool.at}] ${tool.name}(${tool.arguments}) -> ${tool.output}`,
      );
    }
  }
  return lines.join('\n');
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function formatSeconds(seconds: number | null): string {
  if (seconds === null) return '—';
  return seconds < 1
    ? `${Math.round(seconds * 1000)} ms`
    : `${seconds.toFixed(2)} s`;
}

export function formatCost(usd: number | null | undefined): string {
  if (usd === null || usd === undefined) return '—';
  return usd < 0.01 ? `${(usd * 100).toFixed(2)}¢` : `$${usd.toFixed(3)}`;
}
