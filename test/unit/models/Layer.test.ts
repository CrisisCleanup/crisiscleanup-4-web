import { describe, expect, test, beforeEach, beforeAll, vi } from 'vitest';
import Layer from '@/models/Layer';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > Layer', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  // Before all tests, install VuexORM and VuexORMAxios
  beforeAll(() => {
    database = new Database();
    database.register(Layer);

    // Install VuexORM with Axios plugin
    VuexORM.use(VuexORMAxios, {
      axios,
      baseURL: `${import.meta.env.VITE_APP_API_BASE_URL}`,
    });

    // Create the Vuex Store
    store = createStore({
      plugins: [VuexORM.install(database)],
    });
  });

  // Before each test, clean up the store
  beforeEach(() => {
    Layer.deleteAll();
  });

  test('Layer model has the correct entity name', () => {
    expect(Layer.entity).toBe('layers');
  });

  test('Layer model has correct default fields', () => {
    const layer = new Layer();

    expect(layer.id).toBe('');
    expect(layer.title).toBe('');
    expect(layer.type).toBeNull();
    expect(layer.description).toBe('');
    expect(layer.locations).toEqual([]);
    expect(layer.available_to).toEqual([]);
  });

  test('fetchById API action sends a get request to the correct endpoint', async () => {
    const mockId = '123';
    const mockLayerData = { id: mockId, title: 'Test Layer', type: 'type1' };

    const actions = Layer.api();
    const getMock = vi
      .spyOn(actions, 'get')
      .mockResolvedValue({ data: mockLayerData });

    const response = await actions.fetchById(mockId);

    expect(getMock).toHaveBeenCalledWith(`/layers/${mockId}`);
    expect(response.data).toEqual(mockLayerData);

    getMock.mockRestore();
  });
});
