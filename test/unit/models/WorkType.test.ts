import { describe, expect, test, beforeEach, beforeAll } from 'vitest';
import WorkType from '@/models/WorkType';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > WorkType', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(WorkType);

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
    WorkType.deleteAll();
  });

  test('WorkType model has the correct entity name', () => {
    expect(WorkType.entity).toBe('work_types');
  });

  test('WorkType model has correct default fields', () => {
    const workType = new WorkType();
    expect(workType.id).toBe(null);
    expect(workType.work_type).toBe('');
    expect(workType.claimed_by).toBe(null);
    expect(workType.phase).toBe(null);
    expect(workType.status).toBe('');
    expect(workType.recur).toBe('');
    expect(workType.next_recur_at).toBe(null);
  });
});
