import { beforeAll, describe, expect, test } from 'vitest';
import InvitationRequest from '@/models/InvitationRequest';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import moment from 'moment';
import type { Store } from 'vuex';
import * as useCurrentUser from '@/hooks/useCurrentUser';

describe('models > InvitationRequest', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(InvitationRequest);
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
    // Clear the store before each test
    InvitationRequest.deleteAll();
  });

  test('has valid resource name', () => {
    expect(InvitationRequest.entity).toMatch('invitation_requests');
  });

  test('has correct default fields', () => {
    const invitationRequest = new InvitationRequest();
    expect(invitationRequest.id).toBe('');
    expect(invitationRequest.email).toBe('');
    expect(invitationRequest.first_name).toBe('');
    expect(invitationRequest.last_name).toBe('');
    expect(invitationRequest.invitation_token).toBe(null);
    expect(invitationRequest.mobile).toBe(null);
    expect(invitationRequest.requested_to).toBe(null);
    expect(invitationRequest.requested_to_organization).toBe(null);
    expect(invitationRequest.requested_at).toBe(null);
    expect(invitationRequest.approved_at).toBe(null);
    expect(invitationRequest.rejected_at).toBe(null);
  });

  test('computed property: full_name', () => {
    const invitationRequest = new InvitationRequest({
      first_name: 'John',
      last_name: 'Doe',
    });
    expect(invitationRequest.full_name).toBe('John Doe');
  });

  test('computed property: requested_at_moment', () => {
    const requestedAt = '2023-01-01T00:00:00Z';
    const invitationRequest = new InvitationRequest({
      requested_at: requestedAt,
    });
    expect(invitationRequest.requested_at_moment).toBe(
      moment(requestedAt).format('DD/MM/YYYY'),
    );
    const invitationRequestWithoutRequestedAt = new InvitationRequest();
    expect(invitationRequestWithoutRequestedAt.requested_at_moment).toBe('');
  });

  test('has api actions', () => {
    expect(InvitationRequest.api()).toMatchInlineSnapshot(`
      Request {
        "acceptInvitationRequest": [Function],
        "archiveInvitationRequest": [Function],
        "config": {
          "save": true,
        },
        "model": [Function],
        "rejectInvitationRequest": [Function],
      }
    `);
  });

  test('has correct api actions', () => {
    const actions = InvitationRequest.api();
    // Mock the post method
    const postMock = vi
      .spyOn(actions, 'post')
      .mockImplementation(() => Promise.resolve());
    // Test acceptInvitationRequest action
    const invitationRequest = new InvitationRequest({
      id: 'request-id',
      invitation_token: 'token',
    });
    actions.acceptInvitationRequest(invitationRequest);
    expect(postMock).toHaveBeenCalledWith(
      '/invitation_requests/request-id/approve',
      {
        invitation_token: 'token',
      },
      { save: false },
    );
    // Test rejectInvitationRequest action
    actions.rejectInvitationRequest(invitationRequest);
    expect(postMock).toHaveBeenCalledWith(
      '/invitation_requests/request-id/reject',
      {
        invitation_token: 'token',
      },
      { save: false },
    );
    // Restore the original method
    postMock.mockRestore();
  });

  test('api action: archiveInvitationRequest', async () => {
    const actions = InvitationRequest.api();
    const updateCurrentUserMock = vi.fn();
    const userPreferencesMock = computed(() => ({
      archived_invitation_requests: null,
    }));

    vi.spyOn(useCurrentUser, 'default').mockReturnValue({
      updateCurrentUser: updateCurrentUserMock,
      userPreferences: userPreferencesMock,
    } as any);

    const invitationRequest = new InvitationRequest({ id: 'request-id' });
    await actions.archiveInvitationRequest(invitationRequest);

    expect(updateCurrentUserMock).toHaveBeenCalledWith({
      preferences: {
        archived_invitation_requests: null,
        archived_worksite_requests: ['request-id'],
      },
    });
  });
});
