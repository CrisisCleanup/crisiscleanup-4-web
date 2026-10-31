import { ref } from 'vue';
import axios from 'axios';

/**
 * Outreach admin console (`/admins/outreach_console`) and the switches the app
 * reads (`/outreach_flags`). Nothing here emails a real contact.
 */
export interface OutreachFlags {
  environment: boolean;
  master: boolean;
  dry_run: boolean;
  discovery: boolean;
  sending: boolean;
  report_pdf: boolean;
  social_monitoring: boolean;
  subscriptions: boolean;
  media: boolean;
  work_admin: boolean;
}

export interface OutreachContact {
  id: number;
  name: string;
  kind: string;
  email: string;
  lat: number | null;
  lng: number | null;
  incident: number | null;
  is_demo: boolean;
}

export interface RingStats {
  miles: number;
  total: number;
  open: number;
  claimed: number;
  closed: number;
  new: number;
  closed_recently: number;
}

export interface OutreachPreview {
  subject: string;
  case_points: number;
  map_svg: string;
  stats: { rings: RingStats[] };
}

export interface OutreachLogRow {
  id: number;
  contact: string | null;
  result: string;
  detail: string;
  subject: string;
  created_at: string;
}

export interface DueCampaign {
  campaign: number;
  contact: string;
  incident: string;
  last_sent_at: string | null;
  has_email: boolean;
}

const root = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/outreach_console`;

/** Shared so the rest of the app can follow the switches. */
export const outreachFlags = ref<OutreachFlags>();

export async function fetchOutreachFlags() {
  const { data } = await axios.get<OutreachFlags>(
    `${import.meta.env.VITE_APP_API_BASE_URL}/outreach_flags`,
  );
  outreachFlags.value = data;
  return data;
}

export async function getSwitches() {
  const { data } = await axios.get<OutreachFlags>(`${root}/flags`);
  outreachFlags.value = data;
  return data;
}

export async function setSwitches(values: Partial<OutreachFlags>) {
  const { data } = await axios.post<OutreachFlags>(`${root}/flags`, values);
  outreachFlags.value = data;
  return data;
}

export async function listContacts() {
  const { data } = await axios.get<OutreachContact[]>(`${root}/contacts`);
  return data;
}

export async function createDemo(body: {
  lat: number;
  lng: number;
  cases: number;
}) {
  const { data } = await axios.post<{
    incident_id: number;
    cases: number;
    contact_ids: number[];
  }>(`${root}/create_demo`, body);
  return data;
}

export async function clearDemo() {
  const { data } = await axios.post<{
    incidents: number;
    worksite_rows: number;
    contacts: number;
  }>(`${root}/clear_demo`);
  return data;
}

const ids = (contactId: number, incidentId: number) => ({
  contact_id: contactId,
  incident_id: incidentId,
});

export async function previewReport(contactId: number, incidentId: number) {
  const { data } = await axios.get<OutreachPreview>(`${root}/preview`, {
    params: ids(contactId, incidentId),
  });
  return data;
}

export async function previewEmailHtml(contactId: number, incidentId: number) {
  const { data } = await axios.get<string>(`${root}/preview_email`, {
    params: ids(contactId, incidentId),
    responseType: 'text',
  });
  return data;
}

export async function previewPdf(contactId: number, incidentId: number) {
  const { data } = await axios.get<Blob>(`${root}/preview_pdf`, {
    params: ids(contactId, incidentId),
    responseType: 'blob',
  });
  return data;
}

/** Sends to any address; the subject says TEST. */
export async function sendTestEmail(
  contactId: number,
  incidentId: number,
  to: string,
) {
  const { data } = await axios.post<{ sent_to: string; subject: string }>(
    `${root}/send_test`,
    { ...ids(contactId, incidentId), to },
  );
  return data;
}

export async function enroll(incidentId: number, contactIds: number[]) {
  const { data } = await axios.post<{ enrolled: number }>(`${root}/enroll`, {
    incident_id: incidentId,
    contact_ids: contactIds,
  });
  return data;
}

export async function dispatchPreview() {
  const { data } = await axios.get<DueCampaign[]>(`${root}/dispatch_preview`);
  return data;
}

export async function runDispatcher() {
  const { data } = await axios.post<{
    results: { contact: string; result: string; detail: string }[];
  }>(`${root}/dispatch`);
  return data.results;
}

export async function sendLog() {
  const { data } = await axios.get<OutreachLogRow[]>(`${root}/log`);
  return data;
}
