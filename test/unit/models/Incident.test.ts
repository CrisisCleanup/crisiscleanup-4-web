import { beforeAll, describe, expect, test } from 'vitest';
import Incident from '@/models/Incident';
import Location from '@/models/Location';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import moment from 'moment';
import { DISASTER_ICONS } from '@/constants';
import type { Store } from 'vuex';

describe('models > Incident', () => {
  let database: VuexORM.Database;
  let store: Store<any>;
  beforeAll(() => {
    database = new Database();
    database.register(Incident);
    database.register(Location);
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
    Incident.deleteAll();
    Location.deleteAll();
  });
  test('has valid resource name', () => {
    expect(Incident.entity).toMatch('incidents');
  });
  test('has correct default fields', () => {
    const incident = new Incident();
    expect(incident.id).toBe('');
    expect(incident.case_label).toBe('');
    expect(incident.timezone).toBe('');
    expect(incident.form_fields).toBe(null);
    expect(incident.geofence).toBe(null);
    expect(incident.short_name).toBe(null);
    expect(incident.name).toBe(null);
    expect(incident.start_at).toBe(null);
    expect(incident.uuid).toBe(null);
    expect(incident.extent).toBe(null);
    expect(incident.incident_type).toBe(null);
    expect(incident.color).toBe(null);
    expect(incident.locations).toBe(null);
    expect(incident.turn_on_release).toBe(false);
    expect(incident.auto_contact).toBe(false);
    expect(incident.active_phone_number).toBe(null);
    expect(incident.created_work_types).toEqual([]);
    expect(incident.is_archived).toBe(false);
    expect(incident.incident_center).toBe(null);
  });
  test('computed property: incidentImage', () => {
    const incidentType = 'flood';
    DISASTER_ICONS['flood'] = 'flood-icon';
    const incident = new Incident({ incident_type: incidentType });
    expect(incident.incidentImage).toBe('flood-icon');
  });
  test('computed property: start_at_moment', () => {
    const startAt = '2023-01-01T00:00:00Z';
    const incident = new Incident({ start_at: startAt });
    expect(incident.start_at_moment?.isSame(moment(startAt))).toBe(true);
    const incidentWithoutStartAt = new Incident();
    expect(incidentWithoutStartAt.start_at_moment).toBe(null);
  });
  test('computed property: locationModels', () => {
    Location.insert({
      data: [
        { id: 1, name: 'Location 1' },
        { id: 2, name: 'Location 2' },
      ],
    });
    const incident = new Incident({
      locations: [{ location: 1 }, { location: 2 }],
    });
    expect(incident.locationModels.length).toBe(2);
  });
  test('computed property: phase', () => {
    const formFields = [{ phase: 'response' }];
    const incident = new Incident({ form_fields: formFields });
    expect(incident.phase).toBe('response');
    const incidentWithoutFormFields = new Incident();
    expect(incidentWithoutFormFields.phase).toBe(null);
  });
  test('computed property: friendlyName', () => {
    const incidentWithShortName = new Incident({
      short_name: 'short_name_example',
    });
    expect(incidentWithShortName.friendlyName).toBe('Short Name Example');
    const incidentWithoutShortName = new Incident({ name: 'Incident Name' });
    expect(incidentWithoutShortName.friendlyName).toBe('Incident Name');
  });
  test('has api actions', () => {
    expect(Incident.api()).toMatchInlineSnapshot(`
      Request {
        "addFile": [Function],
        "addLocation": [Function],
        "config": {
          "save": true,
        },
        "fetchById": [Function],
        "model": [Function],
        "removeLocation": [Function],
      }
    `);
  });
  test('has correct api actions', () => {
    const actions = Incident.api();
    // Mock the get, post, and delete methods
    const getMock = vi
      .spyOn(actions, 'get')
      .mockImplementation(() =>
        Promise.resolve({ response: { data: { locations: [] } } }),
      );
    const postMock = vi
      .spyOn(actions, 'post')
      .mockImplementation(() => Promise.resolve());
    const deleteMock = vi
      .spyOn(actions, 'delete')
      .mockImplementation(() => Promise.resolve());
    // Test fetchById action
    actions.fetchById('incident-id');
    expect(getMock).toHaveBeenCalledWith(
      '/incidents/incident-id?fields=id,case_label,form_fields,geofence,short_name,name,start_at,uuid,incident_type,color,locations,turn_on_release,created_work_types,auto_contact,active_phone_number',
    );
    // Test addLocation action
    actions.addLocation('incident-id', { id: 1, name: 'Location 1' });
    expect(postMock).toHaveBeenCalledWith(
      '/incidents/incident-id/locations',
      {
        location: { id: 1, name: 'Location 1' },
      },
      { save: false },
    );
    // Test removeLocation action
    actions.removeLocation('incident-id', { id: 1, name: 'Location 1' });
    expect(deleteMock).toHaveBeenCalledWith(
      '/incidents/incident-id/locations',
      {
        data: {
          location: { id: 1, name: 'Location 1' },
        },
        save: false,
      },
    );
    // Restore the original methods
    getMock.mockRestore();
    postMock.mockRestore();
    deleteMock.mockRestore();
  });
});
