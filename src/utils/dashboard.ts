import WorksiteRequest from '@/models/WorksiteRequest';
import axios from 'axios';
import type { UserTransfersResponse } from '@/models/types';
import { getApiUrl } from '@/utils/helpers';
import Worksite from '@/models/Worksite';
import { getQueryString } from '@/utils/urls';
import InvitationRequest from '@/models/InvitationRequest';
import { loadCasesCached } from '@/utils/worksite';
import User from '@/models/User';
import Organization from '@/models/Organization';

interface DashboardStatisticsFilter {
  incidentId: number;
}

interface DashboardStatisticsResponse {
  total_commercial_value: number;
  total_value_completed: number;
  total_cases: number;
  total_claimed_cases: number;
  total_unclaimed_cases: number;
  total_closed_cases: number;
  total_open_cases: number;
  members_served: number;
  active_users_today: number;
}
async function getWorksiteRequests() {
  await WorksiteRequest.deleteAll();
  const results = await WorksiteRequest.api().get(`/worksite_requests`, {
    dataKey: 'results',
  });
  return results.entities.worksite_requests || [];
}

async function getUserTransferRequests() {
  const response = await axios.get<UserTransfersResponse>(
    getApiUrl('/transfer_requests'),
  );
  const userIds = response.data.results.map((r) => r.user);
  const organizationIds = [
    ...response.data.results.map((r) => r.origin_organization),
    ...response.data.results.map((r) => r.target_organization),
  ];
  await User.fetchOrFindId(userIds);
  await Organization.fetchOrFindId(organizationIds);

  return response.data.results;
}

async function getClaimedWorksites(incident, organization) {
  const params = {
    incident: incident,
    work_type__claimed_by: organization,
    fields:
      'id,name,address,case_number,work_types,city,state,county,flags,location,incident,postal_code,reported_by,form_data,updated_at',
  };

  const results = await Worksite.api().get(
    `/worksites?${getQueryString(params)}`,
    {
      dataKey: 'results',
    },
  );

  return results.entities.worksites || [];
}

async function getInvitationRequests() {
  const results = await InvitationRequest.api().get(`/invitation_requests`, {
    dataKey: 'results',
  });
  return results.entities.invitation_requests || [];
}

async function getWorksites(incident) {
  const response = await loadCasesCached({
    incident: incident,
  });
  return response.results;
}

async function getEngagementData(filter: Record<string, any>) {
  const { start_date, end_date, incident } = filter;
  const params = {
    start_date: start_date.format('YYYY-MM-DD'),
    end_date: end_date.format('YYYY-MM-DD'),
  };
  if (incident) {
    params.incident = incident;
  }

  const queryString = getQueryString(params);

  return axios.get(
    `${
      import.meta.env.VITE_APP_API_BASE_URL
    }/reports_data/pp_engagement?${queryString}`,
  );
}

async function getDashboardStatistics(filter: {
  incidentId: number | undefined;
}): Promise<DashboardStatisticsResponse> {
  const params = { incident: filter.incidentId };

  try {
    const response = await axios.get<DashboardStatisticsResponse>(
      `${import.meta.env.VITE_APP_API_BASE_URL}/organizations/stats`,
      {
        params,
        headers: {
          accept: 'application/json',
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard statistics:', error);
    throw error;
  }
}

async function acceptInvitationRequest(
  request: InvitationRequest,
  cb: () => unknown,
) {
  await InvitationRequest.api().acceptInvitationRequest(request);
  if (cb) {
    await cb();
  }
}

async function rejectInvitationRequest(
  request: InvitationRequest,
  cb: () => unknown,
) {
  await InvitationRequest.api().rejectInvitationRequest(request);
  if (cb) {
    await cb();
  }
}

async function archiveInvitationRequest(
  request: InvitationRequest,
  cb: () => unknown,
) {
  await InvitationRequest.api().archiveInvitationRequest(request);
  if (cb) {
    await cb();
  }
}

async function acceptWorksiteRequest(requestId: string, cb: () => unknown) {
  await WorksiteRequest.api().acceptRequest(requestId);
  if (cb) {
    await cb();
  }
}

async function rejectWorksiteRequest(requestId: string, cb: () => unknown) {
  await WorksiteRequest.api().rejectRequest(requestId);
  if (cb) {
    await cb();
  }
}

async function archiveWorksiteRequest(requestId: string, cb: () => unknown) {
  await WorksiteRequest.api().archiveWorksiteRequest(requestId);
  if (cb) {
    await cb();
  }
}

export {
  getWorksiteRequests,
  getUserTransferRequests,
  getClaimedWorksites,
  getInvitationRequests,
  getWorksites,
  getEngagementData,
  getDashboardStatistics,
  acceptInvitationRequest,
  rejectInvitationRequest,
  archiveInvitationRequest,
  acceptWorksiteRequest,
  rejectWorksiteRequest,
  archiveWorksiteRequest,
};
