import { describe, expect, test, beforeEach, beforeAll, vi } from 'vitest';
import UserRole from '@/models/UserRole';
import Role from '@/models/Role';
import type User from '@/models/User';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > UserRole', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(UserRole);
    database.register(Role);

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
    UserRole.deleteAll();
  });

  test('UserRole model has the correct entity name', () => {
    expect(UserRole.entity).toBe('user_roles');
  });

  test('UserRole model has correct default fields', () => {
    const userRole = new UserRole();
    expect(userRole.id).toBe('');
    expect(userRole.user_role).toBe(null);
    expect(userRole.user).toBe(null);
    expect(userRole.approve_rejected_notes).toBe(null);
    expect(userRole.approved_by).toBe(null);
    expect(userRole.rejected_by).toBe(null);
  });

  test('computed property: role', () => {
    Role.insert({ data: { id: 1, name_t: 'Admin' } });
    const userRole = new UserRole({ user_role: 1 });
    expect(userRole.role?.name_t).toBe('Admin');
  });

  test('computed property: role_name', () => {
    Role.insert({ data: { id: 1, name_t: 'Admin' } });
    const userRole = new UserRole({ user_role: 1 });
    expect(userRole.role_name).toBe('Admin');
  });

  test('computed property: isApproved', () => {
    const approvedUserRole = new UserRole({ approved_by: { id: 1 } });
    const pendingUserRole = new UserRole();
    expect(approvedUserRole.isApproved).toBe(true);
    expect(pendingUserRole.isApproved).toBe(false);
  });

  test('api action: acceptRequest', async () => {
    const actions = UserRole.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    const userRole = new UserRole({ id: 1 });
    await actions.acceptRequest(userRole, 'Approved for good reason');

    expect(postMock).toHaveBeenCalledWith(
      '/user_roles/1/respond',
      {
        action: 'approve',
        approve_rejected_notes: 'Approved for good reason',
      },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: rejectRequest', async () => {
    const actions = UserRole.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    const userRole = new UserRole({ id: 1 });
    await actions.rejectRequest(userRole, 'Rejected for good reason');

    expect(postMock).toHaveBeenCalledWith(
      '/user_roles/1/respond',
      {
        action: 'reject',
        approve_rejected_notes: 'Rejected for good reason',
      },
      { save: false },
    );

    postMock.mockRestore();
  });
});
