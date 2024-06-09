import { describe, expect, test, beforeEach, beforeAll } from 'vitest';
import Role from '@/models/Role';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > Role', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
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
    Role.deleteAll();
  });

  test('Role model has the correct entity name', () => {
    expect(Role.entity).toBe('roles');
  });

  test('Role model has correct default fields', () => {
    const role = new Role();
    expect(role.id).toBe('');
    expect(role.name_t).toBe('');
    expect(role.description_t).toBe('');
    expect(role.level).toBe(null);
    expect(role.is_default).toBe(null);
  });
});
