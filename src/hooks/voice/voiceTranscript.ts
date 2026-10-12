/**
 * The spoken turns of a call for the Call Auditor: parse the stored
 * transcript, find the words a finding quotes, and pick where to seek the
 * recording when a line is clicked.
 */
import type { SessionDecision, SpeechTurn } from './voiceSessions';

const SPEECH_PREFIXES = ['assistant: ', 'user: '];
const TOOL_PREFIXES = [
  '[tool] ',
  '[tool result] ',
  '[tool error] ',
  '[tool metadata] ',
];

/**
 * The speech of the stored transcript, one entry for each `assistant: ...` /
 * `user: ...` line. Tool lines and their continuations are left out, and a
 * line without a prefix continues the speech line before it.
 */
function speechEntries(transcript: string) {
  const entries: { role: string; text: string }[] = [];
  let inSpeech = false;
  for (const line of (transcript || '').split('\n')) {
    const prefix = SPEECH_PREFIXES.find((p) => line.startsWith(p));
    if (prefix) {
      entries.push({
        role: prefix.slice(0, -2),
        text: line.slice(prefix.length),
      });
      inSpeech = true;
    } else if (TOOL_PREFIXES.some((p) => line.startsWith(p))) {
      inSpeech = false;
    } else if (inSpeech && entries.length > 0) {
      entries.at(-1)!.text += `\n${line}`;
    }
  }
  return entries;
}

/**
 * The raw speech lines of the call, as stored: no tool lines, no joining of
 * adjacent lines of one speaker.
 */
export function rawSpeechLines(transcript: string) {
  return speechEntries(transcript).map((entry, id) => ({
    id,
    role: entry.role,
    text: entry.text.trimEnd(),
  }));
}

/** The raw speech lines as text, for the clipboard. */
export function rawSpeechText(transcript: string) {
  return rawSpeechLines(transcript)
    .map((line) => `${line.role}: ${line.text}`)
    .join('\n');
}

/**
 * Spoken turns of the stored transcript. Adjacent turns of one speaker are
 * joined, as the API does for `speech_turns`.
 */
export function parseSpeechTurns(transcript: string): SpeechTurn[] {
  const entries = speechEntries(transcript);
  const turns: SpeechTurn[] = [];
  for (const entry of entries) {
    const text = entry.text.replaceAll(/\s+/g, ' ').trim();
    const last = turns.at(-1);
    if (last && last.role === entry.role) {
      last.text = `${last.text} ${text}`.trim();
    } else {
      turns.push({
        id: turns.length,
        role: entry.role,
        text,
        offset_seconds: null,
      });
    }
  }
  return turns;
}

/** Lower-case letters and digits, with runs of anything else as one space. */
function normalize(text: string) {
  const chars: string[] = [];
  const origin: number[] = [];
  let index = 0;
  for (const char of text) {
    if (/[\p{L}\p{N}]/u.test(char)) {
      chars.push(char.toLowerCase());
      origin.push(index);
    } else if (chars.length > 0 && chars.at(-1) !== ' ') {
      chars.push(' ');
      origin.push(index);
    }
    index += char.length;
  }
  return { text: chars.join('').trimEnd(), origin };
}

export interface EvidenceMatch {
  turnId: number;
  /** Character range in the turn's text. */
  start: number;
  end: number;
}

/**
 * Where a finding's evidence is in the call. The evidence is often a quote
 * with a speaker label ("Caller: \"918 555 0142.\""); quoted parts are
 * tried first. Case, punctuation and spacing do not matter.
 */
export function findEvidence(
  turns: Pick<SpeechTurn, 'id' | 'text'>[],
  evidence: string,
): EvidenceMatch | undefined {
  const quoted = [...(evidence || '').matchAll(/["“]([^"”]+)["”]/g)].map(
    (m) => m[1],
  );
  const candidates = (quoted.length > 0 ? quoted : [evidence || ''])
    .map(
      (quote) =>
        normalize(quote.replace(/^\s*(caller|agent|assistant|user)\s*:/i, ''))
          .text,
    )
    .filter((quote) => quote.length >= 3)
    .sort((a, b) => b.length - a.length);
  for (const quote of candidates) {
    for (const turn of turns) {
      const { text, origin } = normalize(turn.text);
      const at = text.indexOf(quote);
      if (at === -1) continue;
      const last = at + quote.length - 1;
      return {
        turnId: turn.id,
        start: origin[at],
        end: origin[last] + 1,
      };
    }
  }
  return undefined;
}

/**
 * Seconds to seek to for one line. The API gives a turn's offset when it
 * has one; otherwise the line's place in the call stands in for the time.
 */
export function seekSeconds(
  turn: Pick<SpeechTurn, 'offset_seconds'>,
  index: number,
  count: number,
  duration: number,
): number | undefined {
  if (typeof turn.offset_seconds === 'number') return turn.offset_seconds;
  return Number.isFinite(duration) && duration > 0 && count > 0
    ? (index / count) * duration
    : undefined;
}

export interface PlacedDecision {
  decision: SessionDecision;
  /** The caller's words were found in the line, not guessed from the order. */
  exact: boolean;
}

/**
 * Put each decision under the caller line it answers. The caller's words
 * decide, searching forward from the last match; when they are not found,
 * the number of the decision picks the caller line in order. A decision that
 * fits no line stays in `unplaced`.
 */
export function placeDecisions(
  turns: Pick<SpeechTurn, 'id' | 'role' | 'text'>[],
  decisions: SessionDecision[],
) {
  const callers = turns
    .filter((turn) => turn.role === 'user')
    .map((turn) => ({ id: turn.id, text: normalize(turn.text).text }));
  const byTurn = new Map<number, PlacedDecision[]>();
  const unplaced: SessionDecision[] = [];
  let cursor = 0;
  for (const decision of decisions) {
    const said = normalize(decision.caller_text || '').text;
    let at =
      said.length >= 2
        ? callers.findIndex(
            (caller, index) => index >= cursor && caller.text.includes(said),
          )
        : -1;
    const exact = at !== -1;
    if (!exact) at = decision.turn - 1;
    const caller = callers[at];
    if (!caller) {
      unplaced.push(decision);
      continue;
    }
    cursor = at;
    byTurn.set(caller.id, [
      ...(byTurn.get(caller.id) ?? []),
      { decision, exact },
    ]);
  }
  return { byTurn, unplaced };
}
