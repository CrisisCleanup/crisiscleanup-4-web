import { beforeAll, describe, expect, test } from 'vitest';
import Team from '@/models/Team';
import User from '@/models/User';
import Incident from '@/models/Incident';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > Team', () => {
  let database: VuexORM.Database;
  let store: Store<any>;
  beforeAll(() => {
    database = new Database();
    database.register(Team);
    database.register(User);
    database.register(Incident);
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
    Team.deleteAll();
    User.deleteAll();
    Incident.deleteAll();
  });
  test('has valid resource name', () => {
    expect(Team.entity).toMatch('teams');
  });
  test('has correct default fields', () => {
    const team = new Team();
    expect(team.id).toBe('');
    expect(team.name).toBe('');
    expect(team.notes).toBe(null);
    expect(team.users).toEqual([]);
    expect(team.assigned_work_types).toEqual([]);
    expect(team.cases_area).toEqual({});
    expect(team.incident).toBe(null);
  });
  test('has api actions', () => {
    expect(Team.api()).toMatchInlineSnapshot(`
      Request {
        "config": {
          "save": true,
        },
        "fetchById": [Function],
        "getCasesArea": [Function],
        "model": [Function],
      }
    `);
  });
  test('has correct api actions', () => {
    const actions = Team.api();
    // Mock the get method
    const getMock = vi
      .spyOn(actions, 'get')
      .mockImplementation(() => Promise.resolve());
    // Test fetchById action
    actions.fetchById(1);
    expect(getMock).toHaveBeenCalledWith('/teams/1');
    // Test getCasesArea action
    actions.getCasesArea(1, 2);
    expect(getMock).toHaveBeenCalledWith('/teams/1/cases_area?incident=2');
    // Restore the original method
    getMock.mockRestore();
  });
});
