import { beforeAll, describe, expect, test } from 'vitest';
import Organization from '@/models/Organization';
import Incident from '@/models/Incident';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > Organization', () => {
  let database: VuexORM.Database;
  let store: Store<any>;
  beforeAll(() => {
    database = new Database();
    database.register(Organization);
    database.register(Incident);
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
    Organization.deleteAll();
    Incident.deleteAll();
  });
  test('has valid resource name', () => {
    expect(Organization.entity).toMatch('organizations');
  });
  test('has correct default fields', () => {
    const organization = new Organization();
    expect(organization.id).toBe('');
    expect(organization.name).toBe('');
    expect(organization.url).toBe('');
    expect(organization.facebook).toBe('');
    expect(organization.twitter).toBe('');
    expect(organization.affiliates).toEqual([]);
    expect(organization.primary_location).toBe(null);
    expect(organization.secondary_location).toBe(null);
    expect(organization.type_t).toBe(null);
    expect(organization.user_count).toBe(null);
    expect(organization.incidents).toBe(null);
    expect(organization.approved_incidents).toBe(null);
    expect(organization.approved_roles).toBe(null);
    expect(organization.pending_incidents).toBe(null);
    expect(organization.incident_primary_contacts).toBe(null);
    expect(organization.primary_contacts).toBe(null);
    expect(organization.files).toBe(null);
    expect(organization.custom_ops_message).toBe(null);
    expect(organization.custom_legal_tos).toBe(null);
    expect(organization.custom_legal_survivor_waiver).toBe(null);
    expect(organization.address).toBe(null);
    expect(organization.city).toBe(null);
    expect(organization.state).toBe(null);
    expect(organization.postal_code).toBe(null);
    expect(organization.phone1).toBe(null);
    expect(organization.phone2).toBe(null);
    expect(organization.email).toBe(null);
    expect(organization.donate_url).toBe(null);
    expect(organization.is_active).toBe(null);
    expect(organization.is_verified).toBe(null);
  });
  test('computed property: incident_list', () => {
    Incident.insert({
      data: [
        { id: 1, name: 'Incident 1' },
        { id: 2, name: 'Incident 2' },
      ],
    });
    const organization = new Organization({ incidents: [1, 2] });
    expect(organization.incident_list.length).toBe(2);
  });
  test('computed property: logo_url', () => {
    const organization = new Organization({
      files: [
        {
          file_type_t: 'fileTypes.logo',
          small_thumbnail_url: 'http://example.com/logo.jpg',
        },
      ],
    });
    expect(organization.logo_url).toBe('http://example.com/logo.jpg');
    const organizationWithoutLogo = new Organization({
      files: [{ file_type_t: 'fileTypes.other' }],
    });
    expect(organizationWithoutLogo.logo_url).toBe('');
  });
  test('has api actions', () => {
    expect(Organization.api()).toMatchInlineSnapshot(`
      Request {
        "addFile": [Function],
        "approve": [Function],
        "clearApproval": [Function],
        "config": {
          "save": true,
        },
        "deleteFile": [Function],
        "model": [Function],
        "notify": [Function],
        "reject": [Function],
      }
    `);
  });
  test('has correct api actions', () => {
    const actions = Organization.api();
    // Mock the post and delete methods
    const postMock = vi
      .spyOn(actions, 'post')
      .mockImplementation(() => Promise.resolve());
    const deleteMock = vi
      .spyOn(actions, 'delete')
      .mockImplementation(() => Promise.resolve());
    // Test addFile action
    actions.addFile('org-id', 'file-content', 'file-type');
    expect(postMock).toHaveBeenCalledWith(
      '/organizations/org-id/files',
      {
        file: 'file-content',
        type_t: 'file-type',
      },
      { save: false },
    );
    // Test deleteFile action
    actions.deleteFile('org-id', 'file-content');
    expect(deleteMock).toHaveBeenCalledWith('/organizations/org-id/files', {
      data: { file: 'file-content' },
      save: false,
    });
    // Test approve action
    actions.approve('org-id', 'reason');
    expect(postMock).toHaveBeenCalledWith(
      '/organizations/org-id/approve',
      { approve_reject_reason_t: 'reason' },
      { save: false },
    );
    // Test reject action
    actions.reject('org-id', 'reason', 'note');
    expect(postMock).toHaveBeenCalledWith(
      '/organizations/org-id/reject',
      { approve_reject_reason_t: 'reason', rejection_note: 'note' },
      { save: false },
    );
    // Restore the original methods
    postMock.mockRestore();
    deleteMock.mockRestore();
  });
});
