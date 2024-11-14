import { describe, expect, test, beforeEach, beforeAll } from 'vitest';
import LocationType from '@/models/LocationType';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > LocationType', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(LocationType);

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
    LocationType.deleteAll();
  });

  test('LocationType model has the correct entity name', () => {
    expect(LocationType.entity).toBe('location_types');
  });

  test('LocationType model has correct default fields', () => {
    const locationType = new LocationType();
    expect(locationType.id).toBe(null);
    expect(locationType.key).toBe(null);
    expect(locationType.name_t).toBe(null);
    expect(locationType.description_t).toBe(null);
  });
});
