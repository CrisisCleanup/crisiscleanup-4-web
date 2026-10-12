/**
 * After-call reviews of voice intake calls (`/admins/voice_reviews/...`).
 *
 * A reviewer model compares each call's transcript with the saved case and
 * stores corrections. Simple ones (name, phone, address, email, note) apply
 * with one click; the rest describe a hand edit.
 */

import type { SpeechTurn } from './voiceSessions';

export interface VoiceCorrection {
  id: number;
  kind: string;
  simple: boolean;
  field: string;
  current_value: unknown;
  suggested_value: unknown;
  reason: string;
  evidence: string;
  confidence: number;
  status: 'open' | 'applied' | 'resolved' | 'dismissed';
  before_value: unknown;
  applied_value: unknown;
  acted_by: number | null;
  acted_at: string | null;
  /** The Call Auditor applied it without a person. */
  auto?: boolean;
  acted_by_name?: string;
  /** Why an automatic fix did not run: the finding waits for a person. */
  left_for_review?: string | null;
  dismiss_reason?: string;
  /** The case still has what the fix wrote, so the fix can be undone. */
  can_undo?: boolean;
}

export interface VoiceReview {
  id: number;
  status: 'pending' | 'done' | 'failed';
  model: string;
  summary: string;
  error: string;
  reviewed_at: string | null;
  session: {
    id: number;
    call_id: string;
    status: string;
    language: string;
    ended_at: string | null;
  };
  incident_id: number | null;
  worksite: { id: number; case_number: string } | null;
  /** Every case of the call; a second address makes a second case. */
  cases?: { id: number; case_number: string; incident_id: number }[];
  flags?: string[];
  corrections: VoiceCorrection[];
}

export interface VoiceReviewWithTranscript extends VoiceReview {
  case_snapshot: Record<string, unknown> | null;
  transcript: string;
  /** A 30-minute link to the call recording, or null if none was stored. */
  audio_url: string | null;
  /** The spoken turns with their time in the recording, when the API has them. */
  speech_turns?: SpeechTurn[];
}

export type CorrectionAction = 'apply' | 'dismiss' | 'resolve' | 'undo';

export type DismissReason =
  | 'reviewer_wrong'
  | 'already_fixed'
  | 'not_needed'
  | 'other';

export const DISMISS_REASONS: Record<DismissReason, string> = {
  reviewer_wrong: '~~The reviewer was wrong',
  already_fixed: '~~Already fixed',
  not_needed: '~~Not needed',
  other: '~~Other',
};

export function voiceReviewUrl(path = '') {
  return `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_reviews${
    path ? `/${path}` : ''
  }`;
}

export const ADDRESS_PARTS = [
  'address',
  'city',
  'state',
  'postal_code',
] as const;

export const KIND_LABELS: Record<string, string> = {
  name: '~~Name',
  phone: '~~Phone',
  address: '~~Address',
  email: '~~Email',
  note: '~~Missing note',
  work_type: '~~Work type',
  form_field: '~~Form field',
  missed_case: '~~Missed case',
  duplicate_case: '~~Duplicate case',
  wrong_incident: '~~Wrong incident',
  missed_callback: '~~Missed callback',
  missed_sms: '~~Missed text message',
};

/** One line of text for a stored value; an address is an object of parts. */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') {
    // A missed case carries a short summary next to the case details.
    if ('summary' in value)
      return String((value as { summary: string }).summary);
    const { address, city, state, postal_code } = value as Record<
      string,
      string
    >;
    return [address, city, [state, postal_code].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ');
  }
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/** What a finished correction says about who did it. */
export function correctionStatusLabel(correction: VoiceCorrection): string {
  if (
    correction.kind === 'wrong_incident' &&
    correction.status === 'resolved' &&
    correction.applied_value
  ) {
    return '~~Moved';
  }
  if (correction.status === 'resolved' && correction.auto) {
    return correction.kind === 'missed_case'
      ? '~~Linked automatically'
      : '~~Fixed automatically';
  }
  return (
    (
      {
        applied: '~~Applied',
        resolved: '~~Fixed by hand',
        dismissed: '~~Dismissed',
      } as Record<string, string>
    )[correction.status] ?? correction.status
  );
}

/** A reviewed call's cases; old reviews list only the first. */
export function reviewCases(review: VoiceReview) {
  if (review.cases?.length) return review.cases;
  return review.worksite && review.incident_id
    ? [
        {
          id: review.worksite.id,
          case_number: review.worksite.case_number,
          incident_id: review.incident_id,
        },
      ]
    : [];
}

export function caseUrl(review: VoiceReview) {
  return review.worksite && review.incident_id
    ? `/incident/${review.incident_id}/work/${review.worksite.id}/edit`
    : undefined;
}

/** The parts of an incident form field that the auditor uses. */
export interface FormFieldInfo {
  field_key: string;
  html_type: string;
  if_selected_then_work_type?: string | null;
}

/** One change to make in the case form, before the admin saves it. */
export interface FormChange {
  target: 'worksite' | 'form';
  key: string;
  value: unknown;
}

const YES_NO_TYPES = new Set(['checkbox', 'h5']);

function toFormValue(field: FormFieldInfo, raw: unknown) {
  if (YES_NO_TYPES.has(field.html_type)) {
    return (
      raw === true || ['true', 'yes', '1'].includes(String(raw).toLowerCase())
    );
  }
  return raw;
}

/**
 * The case form changes for one suggestion, or undefined when the form
 * cannot hold it (a missed callback, a wrong incident, ...). After an
 * address change the caller must find the new map location.
 */
export function formChanges(
  correction: Pick<VoiceCorrection, 'kind' | 'field'>,
  value: unknown,
  formFields: FormFieldInfo[],
): FormChange[] | undefined {
  const { kind, field } = correction;
  if (['name', 'phone', 'email'].includes(kind)) {
    return [{ target: 'worksite', key: field, value }];
  }
  if (kind === 'address') {
    const parts = (value ?? {}) as Record<string, string>;
    return ADDRESS_PARTS.map((part) => ({
      target: 'worksite',
      key: part,
      value: parts[part] ?? '',
    }));
  }
  if (kind === 'form_field') {
    const formField = formFields.find((f) => f.field_key === field);
    return formField
      ? [{ target: 'form', key: field, value: toFormValue(formField, value) }]
      : undefined;
  }
  if (kind === 'work_type') {
    // A work type comes from its form section and the questions in it.
    const linked = formFields.filter(
      (f) => f.if_selected_then_work_type === field,
    );
    if (value === 'remove') {
      return linked.length > 0
        ? linked.map((f) => ({
            target: 'form',
            key: f.field_key,
            value: YES_NO_TYPES.has(f.html_type) ? false : '',
          }))
        : undefined;
    }
    const section =
      linked.find((f) => f.html_type === 'h5') ??
      linked.find((f) => f.html_type === 'checkbox');
    return section
      ? [{ target: 'form', key: section.field_key, value: true }]
      : undefined;
  }
  return undefined;
}

/** Where a wrong-incident case can move (checked by the API against the
 * incident areas that contain the case location). */
export function incidentMove(
  correction: VoiceCorrection,
): { incidentId: number; name: string } | undefined {
  const value = correction.suggested_value as
    | { incident_id?: number; incident_name?: string }
    | undefined;
  return correction.kind === 'wrong_incident' &&
    typeof value === 'object' &&
    value?.incident_id
    ? { incidentId: value.incident_id, name: value.incident_name ?? '' }
    : undefined;
}

/** Case details the reviewer took from a call that made no case. */
export interface MissedCaseDetails {
  name: string;
  phone1: string;
  phone2: string;
  email: string;
  address: Record<(typeof ADDRESS_PARTS)[number], string> | null;
  form_answers: { key: string; value: string }[];
  notes: string;
}

export function missedCaseDetails(
  correction: VoiceCorrection,
): MissedCaseDetails | undefined {
  const value = correction.suggested_value as
    | { details?: MissedCaseDetails }
    | undefined;
  return typeof value === 'object' && value?.details
    ? value.details
    : undefined;
}

/** Values for a new case form (`WorksiteForm` `dataPrefill`). */
export function missedCasePrefill(
  details: MissedCaseDetails | undefined,
  formFields: FormFieldInfo[],
): Record<string, unknown> {
  if (!details) return {};
  const byKey = new Map(formFields.map((f) => [f.field_key, f]));
  return {
    name: details.name,
    phone1: details.phone1,
    phone2: details.phone2,
    email: details.email,
    ...details.address,
    form_data: details.form_answers
      .filter((answer) => byKey.has(answer.key))
      .map((answer) => ({
        field_key: answer.key,
        field_value: toFormValue(byKey.get(answer.key)!, answer.value),
      })),
    // Pending notes are saved after the case is created.
    notes: details.notes
      ? [
          {
            id: 'voice-review-note',
            note: details.notes,
            created_at: new Date().toISOString(),
            pending: true,
          },
        ]
      : [],
  };
}

/** An existing case that may be the same request as a missed call. */
export interface DuplicateMatch {
  id: number;
  case_number: string;
  name: string;
  match_reasons: string[];
  incident: { id: number; name: string };
}

/** Possible duplicates the API found for a missed case. */
export function possibleDuplicates(
  correction: VoiceCorrection,
): DuplicateMatch[] {
  const value = correction.suggested_value as
    | { duplicates?: DuplicateMatch[] }
    | undefined;
  return correction.kind === 'missed_case' && typeof value === 'object'
    ? (value?.duplicates ?? [])
    : [];
}

/** The open missed-case issue of a call without a case, if any. */
export function openMissedCase(review: VoiceReview) {
  return review.worksite
    ? undefined
    : review.corrections.find(
        (c) => c.kind === 'missed_case' && c.status === 'open',
      );
}

export function duplicateUrl(match: DuplicateMatch) {
  return `/incident/${match.incident.id}/work/${match.id}/edit`;
}

/** One result of POST create_missed_cases. */
export interface MissedCaseResult {
  status: 'created' | 'duplicate' | 'skipped' | 'failed';
  case_number?: string;
  worksite_id?: number;
  incident_id?: number;
  duplicates?: DuplicateMatch[];
  error?: string;
}

/** Google's version of an address (POST /admins/voice_reviews/geocode). */
export interface FoundAddress {
  address: string;
  city: string;
  state: string;
  postal_code: string;
  county: string;
  /** [longitude, latitude] */
  location: [number, number];
  what3words: string;
  pluscode: string;
}

/** The case fields that follow a found address, besides its four parts. */
export function addressExtras(found: FoundAddress): FormChange[] {
  return [
    ...(found.county
      ? [{ target: 'worksite' as const, key: 'county', value: found.county }]
      : []),
    {
      target: 'worksite',
      key: 'location',
      value: { type: 'Point', coordinates: found.location },
    },
    { target: 'worksite', key: 'what3words', value: found.what3words },
    { target: 'worksite', key: 'pluscode', value: found.pluscode },
  ];
}

/** The answer of POST auto_fix. */
export interface AutoFixResult {
  /** Reviews the auto-fixer looked at. */
  reviews: number;
  /** Missed cases linked to a case that already exists. */
  linked: number;
  /** Findings applied to cases. */
  applied: number;
  dry_run: boolean;
}
