import { beforeAll, describe, expect, test } from 'vitest';
import Invitation from '@/models/Invitation';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import moment from 'moment';
import type { Store } from 'vuex';

describe('models > Invitation', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(Invitation);
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
    Invitation.deleteAll();
  });

  test('has valid resource name', () => {
    expect(Invitation.entity).toMatch('invitations');
  });

  test('has correct default fields', () => {
    const invitation = new Invitation();
    expect(invitation.id).toBe('');
    expect(invitation.invitee_email).toBe('');
    expect(invitation.invitation_token).toBe(null);
    expect(invitation.expires_at).toBe(null);
    expect(invitation.created_at).toBe(null);
    expect(invitation.invited_by).toBe(null);
    expect(invitation.existing_user).toBe(null);
    expect(invitation.organization).toBe(null);
  });

  test('computed property: invitation_date', () => {
    const createdAt = '2023-01-01T00:00:00Z';
    const invitation = new Invitation({ created_at: createdAt });
    expect(invitation.invitation_date).toBe(moment(createdAt).format('L'));
    const invitationWithoutCreatedAt = new Invitation();
    expect(invitationWithoutCreatedAt.invitation_date).toBe('');
  });

  test('computed property: inviter', () => {
    const invitedBy = { first_name: 'John', last_name: 'Doe' };
    const invitation = new Invitation({ invited_by: invitedBy });
    expect(invitation.inviter).toBe('John Doe');
  });

  test('computed property: status', () => {
    const expiredAt = moment().subtract(1, 'day').toISOString();
    const validAt = moment().add(1, 'day').toISOString();
    const expiredInvitation = new Invitation({ expires_at: expiredAt });
    const validInvitation = new Invitation({ expires_at: validAt });
    expect(expiredInvitation.status).toBe('Expired');
    expect(validInvitation.status).toBe('Pending');
  });

  test('has api actions', () => {
    expect(Invitation.api()).toMatchInlineSnapshot(`
      Request {
        "config": {
          "save": true,
        },
        "fetchById": [Function],
        "model": [Function],
        "resendInvitation": [Function],
      }
    `);
  });

  test('has correct api actions', () => {
    const actions = Invitation.api();
    // Mock the post and get methods
    const postMock = vi
      .spyOn(actions, 'post')
      .mockImplementation(() => Promise.resolve());
    const getMock = vi
      .spyOn(actions, 'get')
      .mockImplementation(() => Promise.resolve());
    // Test resendInvitation action
    const invitation = new Invitation({ id: 'invitation-id' });
    actions.resendInvitation(invitation);
    expect(postMock).toHaveBeenCalledWith(
      '/invitations/invitation-id/resend',
      {},
      { save: false },
    );
    // Test fetchById action
    actions.fetchById('invitation-id');
    expect(getMock).toHaveBeenCalledWith('/invitations/invitation-id');
    // Restore the original methods
    postMock.mockRestore();
    getMock.mockRestore();
  });
});
