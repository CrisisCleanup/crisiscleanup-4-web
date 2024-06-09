import { describe, expect, test, beforeEach, beforeAll } from 'vitest';
import PhoneStatus from '@/models/PhoneStatus';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > PhoneStatus', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(PhoneStatus);

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
    PhoneStatus.deleteAll();
  });

  test('PhoneStatus model has the correct entity name', () => {
    expect(PhoneStatus.entity).toBe('phone_statuses');
  });

  test('PhoneStatus model has correct default fields', () => {
    const phoneStatus = new PhoneStatus();
    expect(phoneStatus.id).toBe('');
    expect(phoneStatus.substatus).toBe('');
    expect(phoneStatus.status).toBe('');
    expect(phoneStatus.primary_state).toBe('');
    expect(phoneStatus.substatus_name_t).toBe('');
    expect(phoneStatus.status_name_t).toBe('');
    expect(phoneStatus.primary_state_name_t).toBe('');
    expect(phoneStatus.completion).toBe(1);
    expect(phoneStatus.try_again_delay).toBe(0);
    expect(phoneStatus.list_order).toBe(0);
  });
});
