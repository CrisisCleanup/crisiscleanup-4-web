import { describe, expect, test, beforeEach, beforeAll, vi } from 'vitest';
import Worksite from '@/models/Worksite';
import Organization from '@/models/Organization';
import User from '@/models/User';
import WorkType from '@/models/WorkType';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import { createStore } from 'vuex';
import enums from '@/store/modules/enums';

describe('models > Worksite', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(Worksite);
    database.register(Organization);
    database.register(User);
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
    Worksite.deleteAll();
  });

  test('Worksite model has the correct entity name', () => {
    expect(Worksite.entity).toBe('worksites');
  });

  test('Worksite model has correct default fields', () => {
    const worksite = new Worksite();
    expect(worksite.id).toBe(null);
    expect(worksite.address).toBe('');
    expect(worksite.location).toBe(null);
    expect(worksite.case_number).toBe(null);
    expect(worksite.city).toBe(null);
    expect(worksite.county).toBe(null);
    expect(worksite.form_data).toEqual([]);
    expect(worksite.postal_code).toBe(null);
    expect(worksite.map_location).toBe(null);
    expect(worksite.incident).toBe(null);
    expect(worksite.name).toBe(null);
    expect(worksite.state).toBe(null);
    expect(worksite.work_types).toBe(null);
    expect(worksite.key_work_type).toBe(null);
    expect(worksite.what3words).toBe(null);
    expect(worksite.notes).toEqual([]);
    expect(worksite.files).toBe(null);
    expect(worksite.time).toBe(null);
    expect(worksite.flags).toEqual([]);
    expect(worksite.events).toBe(null);
    expect(worksite.reported_by).toBe(null);
    expect(worksite.phone1).toBe(null);
    expect(worksite.phone2).toBe(null);
    expect(worksite.email).toBe(null);
    expect(worksite.updated_at).toBe(null);
    expect(worksite.favorite).toBe(null);
    expect(worksite.auto_contact_frequency_t).toBe(null);
    expect(worksite.language).toBe(null);
  });

  test('computed property: full_address', () => {
    const worksite = new Worksite({
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postal_code: '12345',
    });
    expect(worksite.full_address).toBe('123 Main St, Anytown, CA 12345');
  });

  test('computed property: short_address', () => {
    const worksite = new Worksite({
      address: '123 Main St',
      city: 'Anytown',
    });
    expect(worksite.short_address).toBe('123 Main St, Anytown');
  });

  test('computed property: latitude', () => {
    const worksiteWithLocation = new Worksite({
      location: { coordinates: [100, 200] },
    });
    const worksiteWithoutLocation = new Worksite();
    expect(worksiteWithLocation.latitude).toBe(200);
    expect(worksiteWithoutLocation.latitude).toBe(10);
  });

  test('computed property: longitude', () => {
    const worksiteWithLocation = new Worksite({
      location: { coordinates: [100, 200] },
    });
    const worksiteWithoutLocation = new Worksite();
    expect(worksiteWithLocation.longitude).toBe(100);
    expect(worksiteWithoutLocation.longitude).toBe(10);
  });

  test('computed property: total_volunteers', () => {
    const worksite = new Worksite({
      time: [{ volunteers: 2 }, { volunteers: 3 }],
    });
    expect(worksite.total_volunteers).toBe(5);
  });

  test('computed property: total_time', () => {
    const timeEntries = [
      { seconds: 3600, volunteers: 1 },
      { seconds: 1800, volunteers: 2 },
    ];
    const worksite = new Worksite({ time: timeEntries });
    expect(worksite.total_time).toBe('2h 0m'); // secondsToHm should be mocked accordingly

    const worksite2 = new Worksite({ time: null });
    expect(worksite2.total_time).toBe(null);
  });

  test('computed property: formFields', () => {
    const formData = [
      { field_key: 'field1', field_value: 'value1' },
      { field_key: 'field2', field_value: 'value2' },
    ];
    const worksite = new Worksite({ form_data: formData });
    expect(worksite.formFields).toEqual({ field1: 'value1', field2: 'value2' });

    const worksite2 = new Worksite({ form_data: null });
    expect(worksite2.formFields).toEqual({});
  });

  test('computed property: isHighPriority', () => {
    const worksiteWithHighPriority = new Worksite({
      flags: [{ is_high_priority: true }],
    });
    const worksiteWithoutHighPriority = new Worksite({
      flags: [{ is_high_priority: false }],
    });
    expect(worksiteWithHighPriority.isHighPriority).toBe(true);
    expect(worksiteWithoutHighPriority.isHighPriority).toBe(false);
  });

  test('computed property: isFavorite', () => {
    const favoriteWorksite = new Worksite({ favorite: true });
    const nonFavoriteWorksite = new Worksite();
    expect(favoriteWorksite.isFavorite).toBe(true);
    expect(nonFavoriteWorksite.isFavorite).toBe(false);
  });

  describe('Worksite > static method: getWorkType', () => {
    beforeAll(() => {
      enums.getters = {
        workTypeCommercialValues: {
          type1: 10,
          type2: 5,
          type3: 15,
          type4: 20,
        },
      };
    });

    test('returns the only work type if there is only one work type', () => {
      const workTypes = [{ work_type: 'type1', claimed_by: 1 }];
      const organization = { id: 1 };
      const result = Worksite.getWorkType(workTypes, {}, organization);
      expect(result.work_type).toBe('type1');
    });

    test('returns the highest value work type if no filters are applied', () => {
      const workTypes = [
        { work_type: 'type1', claimed_by: 1 },
        { work_type: 'type2', claimed_by: null },
        { work_type: 'type3', claimed_by: 1 },
      ];
      const organization = { id: 1 };
      const result = Worksite.getWorkType(workTypes, {}, organization);
      expect(result.work_type).toBe('type3');
    });

    test('returns the only filtered type if only one type matches the filter', () => {
      const workTypes = [
        { work_type: 'type1', claimed_by: 1 },
        { work_type: 'type2', claimed_by: null },
        { work_type: 'type3', claimed_by: 1 },
      ];
      const organization = { id: 1 };
      const result = Worksite.getWorkType(
        workTypes,
        { fields: { type1: true } },
        organization,
      );
      expect(result.work_type).toBe('type1');
    });

    test('returns the highest value filtered type if multiple types match the filter', () => {
      const workTypes = [
        { work_type: 'type1', claimed_by: 1 },
        { work_type: 'type2', claimed_by: null },
        { work_type: 'type3', claimed_by: 1 },
      ];
      const organization = { id: 1 };
      const result = Worksite.getWorkType(
        workTypes,
        { fields: { type1: true, type2: true } },
        organization,
      );
      expect(result.work_type).toBe('type1');
    });

    test('returns claimed type filtered by organization if multiple filtered types are claimed', () => {
      const workTypes = [
        { work_type: 'type1', claimed_by: 2 },
        { work_type: 'type2', claimed_by: 2 },
        { work_type: 'type3', claimed_by: 1 },
        { work_type: 'type4', claimed_by: 1 },
      ];
      const organization = { id: 1 };
      const result = Worksite.getWorkType(
        workTypes,
        { fields: { type3: true, type4: true } },
        organization,
      );
      expect(result.work_type).toBe('type4');
    });

    test('returns highest value unclaimed type if no claimed type matches the filter', () => {
      const workTypes = [
        { work_type: 'type1', claimed_by: 2 },
        { work_type: 'type2', claimed_by: null },
        { work_type: 'type3', claimed_by: null },
      ];
      const organization = { id: 1 };
      const result = Worksite.getWorkType(
        workTypes,
        { fields: { type2: true, type3: true } },
        organization,
      );
      expect(result.work_type).toBe('type3');
    });

    test('returns highest value unclaimed type if claimed type does not match organization', () => {
      const workTypes = [
        { work_type: 'type1', claimed_by: 2 },
        { work_type: 'type2', claimed_by: null },
      ];
      const organization = { id: 1 };
      const result = Worksite.getWorkType(workTypes, {}, organization);
      expect(result.work_type).toBe('type2');
    });

    test('returns highest value claimed type if multiple types are claimed', () => {
      const workTypes = [
        { work_type: 'type1', claimed_by: 1 },
        { work_type: 'type2', claimed_by: 1 },
      ];
      const organization = { id: 1 };
      const result = Worksite.getWorkType(workTypes, {}, organization);
      expect(result.work_type).toBe('type1');
    });

    test('returns unclaimed type if no type is claimed and filter does not match', () => {
      const workTypes = [
        { work_type: 'type1', claimed_by: null },
        { work_type: 'type2', claimed_by: null },
      ];
      const organization = { id: 1 };
      const result = Worksite.getWorkType(
        workTypes,
        { fields: { type3: true } },
        organization,
      );
      expect(result.work_type).toBe('type1');
    });

    test('returns filtered type if claimed type does not match and filter matches', () => {
      const workTypes = [
        { work_type: 'type1', claimed_by: 2 },
        { work_type: 'type2', claimed_by: 2 },
        { work_type: 'type3', claimed_by: null },
      ];
      const organization = { id: 1 };
      const result = Worksite.getWorkType(
        workTypes,
        { fields: { type2: true, type3: true } },
        organization,
      );
      expect(result.work_type).toBe('type3');
    });

    test('returns the first highest value type if all types are unclaimed and filter does not match', () => {
      const workTypes = [
        { work_type: 'type1', claimed_by: null },
        { work_type: 'type2', claimed_by: null },
        { work_type: 'type3', claimed_by: null },
      ];
      const organization = { id: 1 };
      const result = Worksite.getWorkType(
        workTypes,
        { fields: { type4: true } },
        organization,
      );
      expect(result.work_type).toBe('type3');
    });
  });

  test('api action: claimWorksite', async () => {
    const actions = Worksite.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.claimWorksite('worksite-id', ['work-type']);

    expect(postMock).toHaveBeenCalledWith(
      '/worksites/worksite-id/claim',
      { work_types: ['work-type'] },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: unclaimWorksite', async () => {
    const actions = Worksite.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.unclaimWorksite('worksite-id', ['work-type'], 'status');

    expect(postMock).toHaveBeenCalledWith(
      '/worksites/worksite-id/unclaim',
      { work_types: ['work-type'], status: 'status' },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: releaseWorkType', async () => {
    const actions = Worksite.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.releaseWorkType(
      'worksite-id',
      ['work-type'],
      'unclaim-reason',
    );

    expect(postMock).toHaveBeenCalledWith(
      '/worksites/worksite-id/release',
      { work_types: ['work-type'], unclaim_reason: 'unclaim-reason' },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: requestWorksite', async () => {
    const actions = Worksite.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.requestWorksite(
      'worksite-id',
      ['work-type'],
      'request-reason',
    );

    expect(postMock).toHaveBeenCalledWith(
      '/worksites/worksite-id/request_take',
      { work_types: ['work-type'], requested_reason: 'request-reason' },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: addNote', async () => {
    const actions = Worksite.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.addNote('worksite-id', 'note-content');

    expect(postMock).toHaveBeenCalledWith(
      '/worksites/worksite-id/notes',
      { note: 'note-content' },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: addTime', async () => {
    const actions = Worksite.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.addTime('worksite-id', 3600, 2);

    expect(postMock).toHaveBeenCalledWith(
      '/time',
      {
        worksite: 'worksite-id',
        seconds: 3600,
        volunteers: 2,
      },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: updateTimeEntry', async () => {
    const actions = Worksite.api();
    const patchMock = vi
      .spyOn(actions, 'patch')
      .mockResolvedValue({ data: {} });

    await actions.updateTimeEntry('time-entry-id', 3600, 2);

    expect(patchMock).toHaveBeenCalledWith(
      '/time/time-entry-id',
      {
        seconds: 3600,
        volunteers: 2,
      },
      { save: false },
    );

    patchMock.mockRestore();
  });

  test('api action: addFile', async () => {
    const actions = Worksite.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.addFile('worksite-id', 'file-content');

    expect(postMock).toHaveBeenCalledWith(
      '/worksites/worksite-id/files',
      {
        file: 'file-content',
      },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: deleteFile', async () => {
    const actions = Worksite.api();
    const deleteMock = vi
      .spyOn(actions, 'delete')
      .mockResolvedValue({ data: {} });

    await actions.deleteFile('worksite-id', 'file-content');

    expect(deleteMock).toHaveBeenCalledWith(
      '/worksites/worksite-id/files',
      {
        data: { file: 'file-content' },
      },
      { save: false },
    );

    deleteMock.mockRestore();
  });

  test('api action: searchWorksites', async () => {
    const actions = Worksite.api();
    const getMock = vi
      .spyOn(actions, 'get')
      .mockResolvedValue({ response: { data: [] } });

    await actions.searchWorksites('search-query', 'incident-id');

    expect(getMock).toHaveBeenCalledWith(
      '/worksites?fields=id,name,address,case_number,postal_code,city,state,incident,work_types&limit=5&search=search-query&incident=incident-id',
      {
        dataKey: 'results',
      },
      { save: false },
    );

    getMock.mockRestore();
  });
});
