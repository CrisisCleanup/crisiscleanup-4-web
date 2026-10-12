import { describe, expect, it } from 'vitest';
import {
  findEvidence,
  parseSpeechTurns,
  placeDecisions,
  seekSeconds,
} from '@/hooks/voice/voiceTranscript';
import {
  type SessionDecision,
  flagClasses,
  flagLabel,
  humanize,
  ruleLabel,
} from '@/hooks/voice/voiceSessions';
import { correctionStatusLabel } from '@/hooks/voice/voiceReviews';
import type { VoiceCorrection } from '@/hooks/voice/voiceReviews';

describe('parseSpeechTurns', () => {
  it('keeps speech, drops tool lines and joins a speaker', () => {
    const turns = parseSpeechTurns(
      [
        'assistant: Hello.',
        'assistant: What is your name?',
        'user: John, J-O-H-N',
        'and Smith.',
        '[tool] save_case({"name": "John"})',
        '[tool result] ok',
        'assistant: Thanks.',
      ].join('\n'),
    );
    expect(turns.map((t) => [t.role, t.text])).toEqual([
      ['assistant', 'Hello. What is your name?'],
      ['user', 'John, J-O-H-N and Smith.'],
      ['assistant', 'Thanks.'],
    ]);
    expect(turns.map((t) => t.id)).toEqual([0, 1, 2]);
  });
});

describe('findEvidence', () => {
  const turns = [
    { id: 0, text: 'What is your phone number?' },
    { id: 1, text: 'It is 918 555 0142, thanks.' },
  ];

  it('finds a quote with a speaker label, ignoring case and punctuation', () => {
    const match = findEvidence(turns, 'Caller: "918-555-0142."');
    expect(match?.turnId).toBe(1);
    expect(turns[1].text.slice(match!.start, match!.end)).toBe('918 555 0142');
  });

  it('prefers the longest quoted part', () => {
    const match = findEvidence(turns, '"phone" and "your PHONE number"');
    expect(match?.turnId).toBe(0);
  });

  it('is undefined when the words are not in the call', () => {
    expect(findEvidence(turns, 'Caller: "tarp on roof"')).toBeUndefined();
    expect(findEvidence(turns, '')).toBeUndefined();
  });
});

describe('seekSeconds', () => {
  it('uses the offset of the turn when the API has it', () => {
    expect(seekSeconds({ offset_seconds: 12.5 }, 3, 10, 100)).toBe(12.5);
  });

  it('falls back to the place of the line in the call', () => {
    expect(seekSeconds({ offset_seconds: null }, 5, 10, 120)).toBe(60);
    expect(seekSeconds({ offset_seconds: null }, 0, 10, 120)).toBe(0);
  });

  it('gives up when the length is not known', () => {
    expect(seekSeconds({ offset_seconds: null }, 5, 10, Number.NaN)).toBe(
      undefined,
    );
  });
});

describe('labels', () => {
  it('names the decision rules in plain words', () => {
    expect(ruleLabel('offer_after_second_frustration')).toBe(
      '~~Waited for 2nd frustration',
    );
    expect(ruleLabel('short_reply_is_not_frustration')).toBe(
      '~~Short reply, no offer',
    );
    expect(ruleLabel('offer_waits_for_caller_need')).toBe(
      '~~Need not known yet',
    );
  });

  it('humanizes a rule it does not know', () => {
    expect(ruleLabel('caller_wants_a_person')).toBe('~~Caller wants a person');
    expect(humanize('')).toBe('');
  });

  it('labels and colors flags, with a fallback for new ones', () => {
    expect(flagLabel('approximate_location')).toBe('~~Approximate location');
    expect(flagLabel('brand_new_flag')).toBe('~~Brand new flag');
    expect(flagClasses('error')).toContain('red');
    expect(flagClasses('brand_new_flag')).toContain('grey');
  });
});

describe('correctionStatusLabel', () => {
  const base = {
    id: 1,
    kind: 'missed_case',
    status: 'resolved',
    auto: false,
    applied_value: null,
  } as unknown as VoiceCorrection;

  it('says hand-fixed, linked automatically or applied', () => {
    expect(correctionStatusLabel(base)).toBe('~~Fixed by hand');
    expect(correctionStatusLabel({ ...base, auto: true })).toBe(
      '~~Linked automatically',
    );
    expect(correctionStatusLabel({ ...base, status: 'applied' })).toBe(
      '~~Applied',
    );
    expect(correctionStatusLabel({ ...base, status: 'dismissed' })).toBe(
      '~~Dismissed',
    );
  });
});

describe('placeDecisions', () => {
  const turns = [
    { id: 0, role: 'assistant', text: 'How can I help?' },
    { id: 1, role: 'user', text: 'This is ridiculous, I need a tarp.' },
    { id: 2, role: 'assistant', text: 'What is your name?' },
    { id: 3, role: 'user', text: 'My name is John.' },
  ];
  const decision = (turn: number, caller_text: string): SessionDecision => ({
    turn,
    at: null,
    caller_text,
    route: 'intake',
    callback: '',
    intake_answer: false,
    service_question: false,
    rules_applied: [],
    actions: [],
  });

  it('puts a decision under the caller line with its words', () => {
    const { byTurn, unplaced } = placeDecisions(turns, [
      decision(1, 'This is ridiculous'),
      decision(2, 'my name is John'),
    ]);
    expect(byTurn.get(1)?.map((p) => [p.decision.turn, p.exact])).toEqual([
      [1, true],
    ]);
    expect(byTurn.get(3)?.map((p) => [p.decision.turn, p.exact])).toEqual([
      [2, true],
    ]);
    expect(unplaced).toEqual([]);
  });

  it('puts two decisions of one joined line under that line, in order', () => {
    const { byTurn } = placeDecisions(
      [{ id: 0, role: 'user', text: 'Hello there. My name is John.' }],
      [decision(1, 'Hello there'), decision(2, 'My name is John')],
    );
    expect(byTurn.get(0)?.map((p) => p.decision.turn)).toEqual([1, 2]);
  });

  it('falls back to the order of the caller lines, then to unplaced', () => {
    const { byTurn, unplaced } = placeDecisions(turns, [
      decision(1, 'garbled words that match nothing'),
      decision(2, ''),
      decision(3, 'a third caller line that does not exist'),
    ]);
    expect(byTurn.get(1)?.map((p) => [p.decision.turn, p.exact])).toEqual([
      [1, false],
    ]);
    expect(byTurn.get(3)?.map((p) => [p.decision.turn, p.exact])).toEqual([
      [2, false],
    ]);
    expect(unplaced.map((d) => d.turn)).toEqual([3]);
  });
});
