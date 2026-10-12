import { ref } from 'vue';
import axios from 'axios';

/**
 * Worksites that are probably in the wrong incident
 * (`/admins/misplaced_worksites`). The API finds them with the
 * `wrong_incident()` geofence check and caches the result.
 */
export interface MisplacedWorksite {
  current_incident_id: number;
  created_ago: string;
  worksite_id: number;
  city: string | null;
  state: string | null;
  current_incident_name: string;
  time_after_incident: string;
  url: string;
  incident_id_contained: number;
  move_to_this_incident: string;
  time_after_contained_incident: string;
  user_name: string | null;
  user_email: string | null;
  user_mobile: string | null;
  organization: string | null;
  latitude: number;
  longitude: number;
}

const baseUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/misplaced_worksites`;

/** Shared so the admin tab title follows the page. */
export const misplacedCount = ref<number>();

export async function fetchMisplacedWorksites(refresh = false) {
  const { data } = await axios.get<{
    count: number;
    results: MisplacedWorksite[];
  }>(baseUrl, { params: refresh ? { refresh: 1 } : {} });
  misplacedCount.value = data.count;
  return data.results;
}

/** Mark the worksite as in the correct incident, so the check skips it. */
export async function ignoreMisplacedWorksite(worksiteId: number) {
  await axios.post(`${baseUrl}/${worksiteId}/ignore`);
}

/**
 * Move the worksite with the standard worksite update. The API gives it a new
 * case number and moves its form answers and work types. The name and address
 * go with it, because the update recomputes their search keys.
 */
export async function moveMisplacedWorksite(
  worksiteId: number,
  incidentId: number,
) {
  const url = `${import.meta.env.VITE_APP_API_BASE_URL}/worksites/${worksiteId}`;
  const { data: worksite } = await axios.get<Record<string, unknown>>(url);
  const fields = [
    'name',
    'address',
    'city',
    'county',
    'state',
    'postal_code',
  ] as const;
  await axios.patch(url, {
    incident: incidentId,
    skip_duplicate_check: true,
    ...Object.fromEntries(
      fields.filter((key) => worksite[key]).map((key) => [key, worksite[key]]),
    ),
  });
}
