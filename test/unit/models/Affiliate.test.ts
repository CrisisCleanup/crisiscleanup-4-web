import { beforeAll, describe, expect, test } from 'vitest';
import Affiliate from '@/models/Affiliate';
import Organization from '@/models/Organization';
import User from '@/models/User';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > Affiliate', () => {
  let database: VuexORM.Database;
  let store: Store<any>;
  beforeAll(() => {
    database = new Database();
    database.register(Affiliate);
    database.register(Organization);
    database.register(User);
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
    Affiliate.deleteAll();
    Organization.deleteAll();
    User.deleteAll();
  });
  test('has valid resource name', () => {
    expect(Affiliate.entity).toMatch('organization_affiliate_requests');
  });
  test('has correct default fields', () => {
    const affiliate = new Affiliate();
    expect(affiliate.id).toBe('');
    expect(affiliate.organization).toBe(null);
    expect(affiliate.affiliate).toBe(null);
    expect(affiliate.requested_by).toBe(null);
    expect(affiliate.requested_at).toBe(null);
    expect(affiliate.approved_by).toBe(null);
    expect(affiliate.approved_at).toBe(null);
    expect(affiliate.rejected_by).toBe(null);
    expect(affiliate.rejected_at).toBe(null);
    expect(affiliate.request_notes).toBe(null);
  });
  test('computed property: affiliate_organization', () => {
    Organization.insert({ data: [{ id: 1, name: 'Org 1' }] });
    const affiliate = new Affiliate({ affiliate: 1 });
    expect(affiliate.affiliate_organization?.name).toBe('Org 1');
  });
  test('computed property: status', () => {
    const user = new User({ id: 1, first_name: 'John' });
    User.insert({ data: user });
    const affiliateApproved = new Affiliate({ approved_by: user });
    expect(affiliateApproved.status).toBe('Affiliated');
    const affiliatePending = new Affiliate();
    expect(affiliatePending.status).toBe('Pending');
  });
  test('has api actions', () => {
    expect(Affiliate.api()).toMatchInlineSnapshot(`
      Request {
        "acceptRequest": [Function],
        "config": {
          "save": true,
        },
        "model": [Function],
        "rejectRequest": [Function],
      }
    `);
  });
  test('has correct api actions', () => {
    const actions = Affiliate.api();
    // Mock the post method
    const postMock = vi
      .spyOn(actions, 'post')
      .mockImplementation(() => Promise.resolve());
    // Test acceptRequest action
    const affiliate = new Affiliate({ id: 'affiliate-id' });
    actions.acceptRequest(affiliate);
    expect(postMock).toHaveBeenCalledWith(
      '/organization_affiliate_requests/affiliate-id/respond',
      {
        action: 'approve',
      },
      { save: false },
    );
    // Test rejectRequest action
    actions.rejectRequest(affiliate);
    expect(postMock).toHaveBeenCalledWith(
      '/organization_affiliate_requests/affiliate-id/respond',
      {
        action: 'reject',
      },
      { save: false },
    );
    // Restore the original method
    postMock.mockRestore();
  });
});
