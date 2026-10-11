/**
 * After-call reviews of voice intake calls (`/admins/voice_reviews/...`).
 *
 * A reviewer model compares each call's transcript with the saved case and
 * stores corrections. Simple ones (name, phone, address, email, note) apply
 * with one click; the rest describe a hand edit.
 */

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
  corrections: VoiceCorrection[];
}

export interface VoiceReviewWithTranscript extends VoiceReview {
  case_snapshot: Record<string, unknown> | null;
  transcript: string;
  /** A 30-minute link to the call recording, or null if none was stored. */
  audio_url: string | null;
}

export type CorrectionAction = 'apply' | 'dismiss' | 'resolve';

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

export function caseUrl(review: VoiceReview) {
  return review.worksite && review.incident_id
    ? `/incident/${review.incident_id}/work/${review.worksite.id}/edit`
    : undefined;
}
