import { describe, expect, test, beforeEach, beforeAll, vi } from 'vitest';
import WorksiteRequest from '@/models/WorksiteRequest';
import Organization from '@/models/Organization';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import moment from 'moment';
import type { Store } from 'vuex';
import { createStore } from 'vuex';
import * as useCurrentUser from '@/hooks/useCurrentUser';

describe('models > WorksiteRequest', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(WorksiteRequest);
    database.register(Organization);

    VuexORM.use(VuexORMAxios, {
      axios,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      baseURL: `${import.meta.env.VITE_APP_API_BASE_URL}`,
    });

    store = createStore({
      plugins: [VuexORM.install(database)],
    });
  });

  beforeEach(() => {
    WorksiteRequest.deleteAll();
  });

  test('WorksiteRequest model has the correct entity name', () => {
    expect(WorksiteRequest.entity).toBe('worksite_requests');
  });

  test('WorksiteRequest model has correct default fields', () => {
    const worksiteRequest = new WorksiteRequest();
    expect(worksiteRequest.id).toBe('');
    expect(worksiteRequest.worksite_work_type).toBe(null);
    expect(worksiteRequest.worksite).toBe(null);
    expect(worksiteRequest.case_number).toBe(null);
    expect(worksiteRequest.requested_by).toBe(null);
    expect(worksiteRequest.requested_by_org).toBe(null);
    expect(worksiteRequest.requested_to_org).toBe(null);
    expect(worksiteRequest.token_expiration).toBe(null);
    expect(worksiteRequest.created_at).toBe(null);
    expect(worksiteRequest.approved_at).toBe(null);
    expect(worksiteRequest.rejected_at).toBe(null);
    expect(worksiteRequest.accepted_rejected_reason).toBe(null);
  });

  test('computed property: status', () => {
    const currentRequest = new WorksiteRequest({
      token_expiration: moment().add(1, 'days').toISOString(),
    });
    const expiredRequest = new WorksiteRequest({
      token_expiration: moment().subtract(1, 'days').toISOString(),
    });
    expect(currentRequest.status).toBe('Requested');
    expect(expiredRequest.status).toBe('Expired');
  });

  test('computed property: last_action', () => {
    const approvedRequest = new WorksiteRequest({
      approved_at: '2023-01-01T00:00:00Z',
    });
    const rejectedRequest = new WorksiteRequest({
      rejected_at: '2023-01-01T00:00:00Z',
    });
    const createdRequest = new WorksiteRequest({
      created_at: '2023-01-01T00:00:00Z',
      token_expiration: moment().add(1, 'days').toISOString(),
    });
    const expiredRequest = new WorksiteRequest({
      token_expiration: moment().subtract(1, 'days').toISOString(),
    });

    expect(approvedRequest.last_action).toBe('01/01/2023 12:00 (Approved)');
    expect(rejectedRequest.last_action).toBe('01/01/2023 12:00 (Rejected)');
    expect(createdRequest.last_action).toBe('01/01/2023 12:00 (Created)');
    expect(expiredRequest.last_action).toBe('Expired');
  });

  test('computed property: next_action', () => {
    const approvedRequest = new WorksiteRequest({
      approved_at: '2023-01-01T00:00:00Z',
    });
    const rejectedRequest = new WorksiteRequest({
      rejected_at: '2023-01-01T00:00:00Z',
    });
    const currentRequest = new WorksiteRequest({
      token_expiration: moment().add(1, 'days').toISOString(),
    });
    const expiredRequest = new WorksiteRequest({
      token_expiration: moment().subtract(1, 'days').toISOString(),
    });

    expect(approvedRequest.next_action).toBe('');
    expect(rejectedRequest.next_action).toBe('');
    expect(currentRequest.next_action).toBe(
      `${moment(currentRequest.token_expiration).format(
        'DD/MM/YYYY hh:mm',
      )} (Auto approval)`,
    );
    expect(expiredRequest.next_action).toBe('');
  });

  test('computed property: has_response', () => {
    const approvedRequest = new WorksiteRequest({
      approved_at: '2023-01-01T00:00:00Z',
    });
    const rejectedRequest = new WorksiteRequest({
      rejected_at: '2023-01-01T00:00:00Z',
    });
    const pendingRequest = new WorksiteRequest();

    expect(approvedRequest.has_response).toBe(true);
    expect(rejectedRequest.has_response).toBe(true);
    expect(pendingRequest.has_response).toBe(false);
  });

  test('api action: acceptRequest', async () => {
    const actions = WorksiteRequest.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.acceptRequest('request-id', 'AcceptReason');

    expect(postMock).toHaveBeenCalledWith(
      '/worksite_requests/request-id/respond',
      {
        action: 'approve',
        accepted_rejected_reason: 'AcceptReason',
      },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: rejectRequest', async () => {
    const actions = WorksiteRequest.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.rejectRequest('request-id', 'RejectReason');

    expect(postMock).toHaveBeenCalledWith(
      '/worksite_requests/request-id/respond',
      {
        action: 'reject',
        accepted_rejected_reason: 'RejectReason',
      },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: archiveWorksiteRequest', async () => {
    const actions = WorksiteRequest.api();
    const updateCurrentUserMock = vi.fn().mockResolvedValue({});
    vi.spyOn(useCurrentUser, 'default').mockReturnValue({
      updateCurrentUser: updateCurrentUserMock,
      userPreferences: {
        value: {
          archived_worksite_requests: [],
        },
      },
    } as any);

    await actions.archiveWorksiteRequest('request-id');

    expect(updateCurrentUserMock).toHaveBeenCalledWith({
      preferences: {
        archived_worksite_requests: ['request-id'],
      },
    });

    vi.restoreAllMocks();
  });

  test('api action: cancelRequest', async () => {
    const actions = WorksiteRequest.api();
    const deleteMock = vi
      .spyOn(actions, 'delete')
      .mockResolvedValue({ data: {} });

    await actions.cancelRequest('request-id');

    expect(deleteMock).toHaveBeenCalledWith('/worksite_requests/request-id', {
      save: false,
    });

    deleteMock.mockRestore();
  });
});
