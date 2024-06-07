import { beforeAll, describe, expect, test } from 'vitest';
import EventLog from '@/models/EventLog';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > EventLog', () => {
  let database: VuexORM.Database;
  let store: Store<any>;
  beforeAll(() => {
    database = new Database();
    database.register(EventLog);
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
    EventLog.deleteAll();
  });
  test('has valid resource name', () => {
    expect(EventLog.entity).toMatch('event_logs');
  });
  test('has correct default fields', () => {
    const eventLog = new EventLog();
    expect(eventLog.attr).toBe('');
    expect(eventLog.incident).toBe('');
    expect(eventLog.url).toBe('');
    expect(eventLog.event_key).toEqual({});
  });
  test('has api actions', () => {
    expect(EventLog.api()).toMatchInlineSnapshot(`
      Request {
        "config": {
          "save": true,
        },
        "create": [Function],
        "model": [Function],
      }
    `);
  });
  test('has correct api actions', () => {
    const actions = EventLog.api();
    // Mock the post method
    const postMock = vi
      .spyOn(actions, 'post')
      .mockImplementation(() => Promise.resolve());
    // Test create action
    actions.create('event-key', 'incident-id', 'http://example.com', {
      key: 'value',
    });
    expect(postMock).toHaveBeenCalledWith(
      '/event_logs',
      {
        event_key: 'event-key',
        incident: 'incident-id',
        url: 'http://example.com',
        attr: { key: 'value' },
      },
      { save: false },
    );
    // Restore the original method
    postMock.mockRestore();
  });
});
