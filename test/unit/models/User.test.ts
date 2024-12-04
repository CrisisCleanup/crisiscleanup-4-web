import { beforeAll, describe, expect, test } from 'vitest';
import User from '@/models/User';
import Role from '@/models/Role';
import { i18n } from '@/modules/i18n';
import { getUserAvatarLink } from '@/utils/urls';
import Language from '@/models/Language';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > User', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(User);
    database.register(Role);
    database.register(Language);
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
    Role.deleteAll();
    Language.deleteAll();
    User.deleteAll();
  });

  test('has valid resource name', () => {
    expect(User.entity).toMatch('users');
  });

  test('has correct default fields', () => {
    const user = new User();
    expect(user.id).toBe('');
    expect(user.first_name).toBe('');
    expect(user.last_name).toBe('');
    expect(user.email).toBe('');
    expect(user.mobile).toBe('');
    expect(user.roles).toBe(null);
    expect(user.active_roles).toBe(null);
    expect(user.files).toBe(null);
    expect(user.organization).toBe(null);
    expect(user.states).toEqual({});
    expect(user.preferences).toEqual({});
    expect(user.permissions).toEqual({});
    expect(user.beta_features).toEqual({});
    expect(user.sign_in_count).toEqual({});
    expect(user.current_sign_in_at).toEqual({});
    expect(user.primary_language).toBe(null);
    expect(user.secondary_language).toBe(null);
    expect(user.accepted_terms_timestamp).toBe(null);
    expect(user.accepted_terms).toBe(null);
    expect(user.social).toEqual({});
    expect(user.referring_user).toEqual({});
    expect(user.lineage).toEqual([]);
  });

  test('computed property: hasProfilePicture', () => {
    const user = new User({
      files: [{ file_type_t: 'fileTypes.user_profile_picture' }],
    });
    const userWithoutProfilePicture = new User({
      files: [{ file_type_t: 'fileTypes.other' }],
    });
    const userWithoutFiles = new User({
      files: [],
    });
    expect(user.hasProfilePicture).toBe(1);
    expect(userWithoutProfilePicture.hasProfilePicture).toBe(0);
    expect(userWithoutFiles.hasProfilePicture).toBe(false);
  });

  test('computed property: profilePictureUrl', () => {
    const user = new User({
      first_name: 'John',
      files: [
        {
          file_type_t: 'fileTypes.user_profile_picture',
          large_thumbnail_url: 'http://example.com/pic.jpg',
        },
      ],
    });
    expect(user.profilePictureUrl).toBe('http://example.com/pic.jpg');
    const userWithoutProfilePicture = new User({
      first_name: 'John',
      files: [{ file_type_t: 'fileTypes.other' }],
    });
    expect(userWithoutProfilePicture.profilePictureUrl).toBe(
      getUserAvatarLink('John'),
    );
  });

  test('computed property: currentRole', () => {
    Role.insert({ data: [{ id: 1, name_t: 'Admin' }] });
    const user = new User({ active_roles: [1] });
    expect(user.currentRole.name_t).toBe('Admin');
  });

  test('computed property: highestRole', () => {
    Role.insert({
      data: [
        { id: 1, name_t: 'Admin', level: 2 },
        { id: 2, name_t: 'User', level: 1 },
      ],
    });
    const user = new User({ active_roles: [1, 2] });
    expect(user.highestRole.name_t).toBe('Admin');
  });

  test('computed property: allRoles', () => {
    Role.insert({
      data: [
        { id: 1, name_t: 'Admin', level: 2 },
        { id: 2, name_t: 'User', level: 1 },
      ],
    });
    const user = new User({ active_roles: [1, 2] });
    expect(user.allRoles.length).toBe(2);
  });

  test('computed property: allRolesNames', () => {
    i18n.global.t = (key) => key; // Mock translation function
    Role.insert({
      data: [
        { id: 1, name_t: 'role.admin', level: 2 },
        { id: 2, name_t: 'role.user', level: 1 },
      ],
    });
    const user = new User({ active_roles: [1, 2] });
    expect(user.allRolesNames).toBe('role.user, role.admin');
  });

  test('computed property: referringUser', () => {
    User.insert({ data: [{ id: 1, first_name: 'Referrer' }] });
    const user = new User({ referring_user: 1 });
    expect(user.referringUser?.first_name).toBe('Referrer');
  });

  test('computed property: languages', () => {
    Language.insert({
      data: [
        { id: 1, name_t: 'English' },
        { id: 2, name_t: 'Spanish' },
      ],
    });
    const user = new User({ primary_language: 1, secondary_language: 2 });
    expect(user.languages.length).toBe(2);
  });

  test('computed property: languageIds', () => {
    Language.insert({
      data: [
        { id: 1, name_t: 'English' },
        { id: 2, name_t: 'Spanish' },
      ],
    });
    const user = new User({ primary_language: 1, secondary_language: 2 });
    expect(user.languageIds.length).toBe(2);
  });

  test('computed property: languageNames', () => {
    i18n.global.t = (key) => key; // Mock translation function
    Language.insert({
      data: [
        { id: 1, name_t: 'language.english' },
        { id: 2, name_t: 'language.spanish' },
      ],
    });
    const user = new User({ primary_language: 1, secondary_language: 2 });
    expect(user.languageNames).toBe('language.english, language.spanish');
  });

  test('computed property: notificationSettings', () => {
    const user = new User({
      preferences: { notification_settings: { has_notifications: true } },
    });
    expect(user.notificationSettings.has_notifications).toBe(true);
    const userWithoutNotificationSettings = new User();
    expect(
      userWithoutNotificationSettings.notificationSettings.has_notifications,
    ).toBe(false);
  });

  test('computed property: full_name', () => {
    const user = new User({ first_name: 'John', last_name: 'Doe' });
    expect(user.full_name).toBe('John Doe');
  });

  test('computed property: facebook', () => {
    const user = new User({ social: { facebook: 'john.doe' } });
    expect(user.facebook).toBe('john.doe');
  });

  test('computed property: twitter', () => {
    const user = new User({ social: { twitter: 'john_doe' } });
    expect(user.twitter).toBe('john_doe');
  });

  test('computed property: isAdmin', () => {
    const user = new User({ active_roles: [1] });
    expect(user.isAdmin).toBe(true);
    const userNotAdmin = new User({ active_roles: [2] });
    expect(userNotAdmin.isAdmin).toBe(false);
  });

  test('computed property: isPrimaryContact', () => {
    const user = new User({ active_roles: [3] });
    expect(user.isPrimaryContact).toBe(true);
    const userNotPrimaryContact = new User({ active_roles: [2] });
    expect(userNotPrimaryContact.isPrimaryContact).toBe(false);
  });

  test('method: getStatesForIncident', () => {
    const user = new User({
      states: { incidents: { '1': { state: 'active' } } },
    });
    expect(user.getStatesForIncident('1')).toEqual({ state: 'active' });
    expect(user.getStatesForIncident('2')).toEqual(user.states);
    expect(user.getStatesForIncident('2', false)).toBe(null);
  });

  test('has api actions', () => {
    expect(User.api()).toMatchInlineSnapshot(`
      Request {
        "acceptInvite": [Function],
        "addFile": [Function],
        "config": {
          "save": true,
        },
        "deleteFile": [Function],
        "inviteUser": [Function],
        "model": [Function],
        "orphan": [Function],
        "sendInvitationReport": [Function],
      }
    `);
  });

  test('has correct api actions', () => {
    const actions = User.api();
    // Mock the post and patch methods
    const postMock = vi
      .spyOn(actions, 'post')
      .mockImplementation(() => Promise.resolve());
    const patchMock = vi
      .spyOn(actions, 'patch')
      .mockImplementation(() => Promise.resolve());
    const deleteMock = vi
      .spyOn(actions, 'delete')
      .mockImplementation(() => Promise.resolve());
    // Test inviteUser action
    actions.inviteUser('test@example.com', 'Test Organization', true);
    expect(postMock).toHaveBeenCalledWith(
      '/invitations',
      {
        invitee_email: 'test@example.com',
        organization: 'Test Organization',
        organization_does_not_exist: true,
      },
      { save: false },
    );
    // Test acceptInvite action
    actions.acceptInvite({
      token: 'test-token',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password123',
      mobile: '1234567890',
      title: 'Mr.',
    });
    expect(postMock).toHaveBeenCalledWith(
      '/invitations/accept',
      {
        invitation_token: 'test-token',
        first_name: 'John',
        last_name: 'Doe',
        password: 'password123',
        mobile: '1234567890',
        title: 'Mr.',
      },
      { save: false },
    );
    // Test orphan action
    actions.orphan('user-id');
    expect(patchMock).toHaveBeenCalledWith('/users/user-id/orphan');
    // Test addFile action
    actions.addFile('user-id', 'file-content', 'file-type');
    expect(postMock).toHaveBeenCalledWith(
      '/users/user-id/files',
      {
        file: 'file-content',
        type_t: 'file-type',
      },
      { save: false },
    );
    // Test deleteFile action
    actions.deleteFile('user-id', 'file-content');
    expect(deleteMock).toHaveBeenCalledWith(
      '/users/user-id/files',
      {
        data: { file: 'file-content' },
      },
      { save: false },
    );
    // Restore the original methods
    postMock.mockRestore();
    patchMock.mockRestore();
    deleteMock.mockRestore();
  });
});
