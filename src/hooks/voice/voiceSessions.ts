/**
 * Call history of the Voice Console (`/admins/voice_console/sessions`):
 * row and detail shapes, the labels for call flags, and the readable names
 * of the rules in the decision timeline.
 */

export interface SessionCase {
  id: number;
  case_number: string;
  incident_id: number;
}

export interface SessionRow {
  id: number;
  call_id: string;
  created_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: string;
  referral: string;
  language: string;
  is_test: boolean;
  model: string;
  voice: string;
  estimated_cost_usd: number | null;
  incident: string | null;
  incident_id: number | null;
  case_number: string | null;
  worksite_id: number | null;
  worksite_url?: string | null;
  cases: SessionCase[];
  flags: string[];
  review_id: number | null;
  open_issues: number;
}

export interface SessionDecision {
  turn: number;
  at: string | null;
  caller_text: string;
  route: string;
  callback: string;
  intake_answer: boolean;
  service_question: boolean;
  rules_applied: string[];
  actions: string[];
}

export interface SpeechTurn {
  id: number;
  /** `assistant` or `user` (the API) */
  role: string;
  text: string;
  offset_seconds: number | null;
}

export interface SessionDetail extends SessionRow {
  transcript: string;
  error: string;
  evaluation?: unknown;
  usage?: {
    backend_model?: string;
    backend?: string;
    gpt_live_session_seconds?: number | null;
    gpt_live_voice_cost_usd?: number | null;
    backend_cost_usd?: number | null;
    total_cost_usd?: number | null;
  };
  decisions?: SessionDecision[];
  speech_turns?: SpeechTurn[];
}

export function sessionsUrl(path = '') {
  return `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_console/sessions${
    path ? `/${path}` : ''
  }`;
}

export function caseEditPath(item: {
  case_number?: string;
  id: number;
  incident_id: number;
}) {
  return `/incident/${item.incident_id}/work/${item.id}/edit`;
}

export type FlagTone = 'warn' | 'info' | 'good' | 'bad' | 'neutral';

export const FLAGS: Record<string, { label: string; tone: FlagTone }> = {
  approximate_location: { label: '~~Approximate location', tone: 'warn' },
  spelling_asked: { label: '~~Asked to spell', tone: 'neutral' },
  household_unspecified: { label: '~~Household not given', tone: 'warn' },
  save_retried: { label: '~~Save retried', tone: 'warn' },
  home_questions_skipped: { label: '~~Home questions skipped', tone: 'warn' },
  callback_offered: { label: '~~Callback offered', tone: 'info' },
  callback_requested: { label: '~~Callback requested', tone: 'info' },
  callback_accepted: { label: '~~Callback accepted', tone: 'good' },
  second_case: { label: '~~Second case', tone: 'good' },
  status_lookup: { label: '~~Status lookup', tone: 'neutral' },
  error: { label: '~~Error', tone: 'bad' },
};

export const FLAG_TONE_CLASSES: Record<FlagTone, string> = {
  warn: 'bg-crisiscleanup-yellow-100 text-black',
  info: 'bg-crisiscleanup-chat-blue text-crisiscleanup-dashboard-blue',
  good: 'bg-crisiscleanup-green-100/20 text-crisiscleanup-green-900',
  bad: 'bg-crisiscleanup-red-100/20 text-crisiscleanup-red-800',
  neutral: 'bg-crisiscleanup-grey-100/60 text-crisiscleanup-dark-400',
};

/** `snake_case_key` as a sentence: "Snake case key". */
export function humanize(key: string): string {
  const words = key.replaceAll(/[\s_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : '';
}

export function flagLabel(flag: string): string {
  return FLAGS[flag]?.label ?? `~~${humanize(flag)}`;
}

export function flagClasses(flag: string): string {
  return FLAG_TONE_CLASSES[FLAGS[flag]?.tone ?? 'neutral'];
}

/** What the decision rules did, in the words an admin reads. */
export const RULE_LABELS: Record<string, string> = {
  offer_after_second_frustration: '~~Waited for 2nd frustration',
  short_reply_is_not_frustration: '~~Short reply, no offer',
  offer_waits_for_caller_need: '~~Need not known yet',
};

export function ruleLabel(rule: string): string {
  return RULE_LABELS[rule] ?? `~~${humanize(rule)}`;
}

/** The statuses of a call, for filters and labels. */
export const SESSION_STATUSES: Record<string, string> = {
  completed: '~~Case',
  referred: '~~Referred',
  abandoned: '~~Abandoned',
  failed: '~~Failed',
  in_progress: '~~In progress',
};

export function formatWhen(iso: string | null | undefined) {
  return iso
    ? new Date(iso).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
}
