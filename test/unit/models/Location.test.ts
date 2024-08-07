import { describe, expect, test, beforeEach, beforeAll, vi } from 'vitest';
import Location from '@/models/Location';
import LocationType from '@/models/LocationType';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > Location', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(Location);
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
    Location.deleteAll();
  });

  test('Location model has the correct entity name', () => {
    expect(Location.entity).toBe('locations');
  });

  test('Location model has correct default fields', () => {
    const location = new Location();
    expect(location.id).toBe('');
    expect(location.name).toBe('');
    expect(location.notes).toBe('');
    expect(location.shared).toBe('shared');
    expect(location.type).toBe(null);
    expect(location.geom).toBe(null);
    expect(location.poly).toBe(null);
    expect(location.attr).toBe(null);
    expect(location.point).toBe(null);
    expect(location.joins).toBe(null);
  });

  test('computed property: location_type', () => {
    LocationType.insert({
      data: { id: '1', name_t: 'Headquarters' },
    });
    const location = new Location({ type: '1' });
    expect(location.location_type?.name_t).toBe('Headquarters');
  });

  test('api action: fetchById', async () => {
    const actions = Location.api();
    const getMock = vi.spyOn(actions, 'get').mockResolvedValue({ data: {} });

    await actions.fetchById('location-id');

    expect(getMock).toHaveBeenCalledWith('/locations/location-id');

    getMock.mockRestore();
  });

  test('api action: download', async () => {
    const actions = Location.api();
    const requestMock = vi
      .spyOn(actions, 'request')
      .mockResolvedValue({ data: {} });

    await actions.download('location-id');

    expect(requestMock).toHaveBeenCalledWith({
      url: '/locations/location-id/download',
      method: 'GET',
      responseType: 'blob',
      save: false,
    });

    requestMock.mockRestore();
  });
});
