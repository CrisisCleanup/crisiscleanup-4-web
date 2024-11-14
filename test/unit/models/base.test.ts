import { describe, expect, test, beforeEach, beforeAll, vi } from 'vitest';
import CCUModel from '@/models/base';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios, { type Config } from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';
import { createStore } from 'vuex';

class TestModel extends CCUModel {
  static entity = 'test_models';

  static fields() {
    return {
      ...super.fields(),
      name: this.string(''),
    };
  }

  static apiConfig: Config = {};
}

describe('models > CCUModel', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(TestModel);

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
    TestModel.deleteAll();
  });

  test('CCUModel has correct entity name', () => {
    expect(CCUModel.entity).toBe('');
  });

  test('TestModel inherits from CCUModel and has correct entity name', () => {
    expect(TestModel.entity).toBe('test_models');
  });

  test('CCUModel fields include common fields', () => {
    const fields = TestModel.fields();
    expect(fields).toHaveProperty('id');
    expect(fields).toHaveProperty('invalidated_at');
    expect(fields).toHaveProperty('created_at');
    expect(fields).toHaveProperty('updated_at');
    expect(fields).toHaveProperty('created_by');
    expect(fields).toHaveProperty('updated_by');
  });

  test.todo('CCUModel fetchById method calls API and saves data', async () => {
    const getMock = vi.fn().mockResolvedValue({
      data: { id: '1', name: 'Test Item' },
    });

    // Mock the api method to return an object with the get method mocked
    vi.spyOn(TestModel, 'api').mockImplementation(() => {
      return {
        get: getMock,
      };
    });

    await TestModel.fetchById('1');

    expect(getMock).toHaveBeenCalledWith('/test_models/1', { save: true });

    const item = TestModel.find('1');
    expect(item).toEqual({ id: '1', name: 'Test Item' });
  });

  test.todo(
    'CCUModel fetchOrFindId method fetches missing ids and returns items',
    async () => {
      vi.spyOn(TestModel.api(), 'get').mockResolvedValue({
        response: { data: { results: [{ id: '2', name: 'Test Item 2' }] } },
      });

      const item1 = new TestModel({ id: '1', name: 'Test Item 1' });
      await TestModel.insert({ data: item1 });

      const result = await TestModel.fetchOrFindId(['1', '2']);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Item 1');
      expect(result[1].name).toBe('Test Item 2');
    },
  );

  test.todo(
    'CCUModel fetchAll method fetches all items and saves data',
    async () => {
      const getMock = vi.spyOn(TestModel.api(), 'get').mockResolvedValue({
        response: { data: { results: [{ id: '1', name: 'Test Item 1' }] } },
      });

      await TestModel.fetchAll();

      expect(getMock).toHaveBeenCalledWith('/test_models', {
        dataKey: 'results',
        params: {},
      });

      getMock.mockRestore();
    },
  );

  test.todo(
    'CCUModel fetchOrFindId method returns cached items without fetching if they exist',
    async () => {
      const item = new TestModel({ id: '1', name: 'Test Item' });
      await TestModel.insert({ data: item });

      const getMock = vi.spyOn(TestModel.api(), 'get');

      const result = await TestModel.fetchOrFindId('1');

      expect(result).toEqual(item);
      expect(getMock).not.toHaveBeenCalled();
    },
  );

  test.todo(
    'CCUModel fetchOrFindId method fetches missing items and returns all',
    async () => {
      const item = new TestModel({ id: '1', name: 'Test Item' });
      await TestModel.insert({ data: item });

      const getMock = vi.spyOn(TestModel.api(), 'get').mockResolvedValue({
        response: { data: { results: [{ id: '2', name: 'Test Item 2' }] } },
      });

      const result = await TestModel.fetchOrFindId(['1', '2']);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Item');
      expect(result[1].name).toBe('Test Item 2');
      getMock.mockRestore();
    },
  );
});
