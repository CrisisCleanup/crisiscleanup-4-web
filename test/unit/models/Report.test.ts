import { describe, expect, test, beforeEach, beforeAll, vi } from 'vitest';
import Report from '@/models/Report';
import Role from '@/models/Role';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import moment from 'moment';
import type { Store } from 'vuex';

describe('models > Report', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(Report);
    database.register(Role);

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
    Report.deleteAll();
  });

  test('Report model has the correct entity name', () => {
    expect(Report.entity).toBe('reports');
  });

  test('Report model has correct default fields', () => {
    const report = new Report();
    expect(report.id).toBe('');
    expect(report.name_t).toBe(null);
    expect(report.description_t).toBe(null);
    expect(report.report_key).toBe(null);
    expect(report.inputs).toBe(null);
    expect(report.output_formats).toBe(null);
    expect(report.files).toBe(null);
    expect(report.paid_for_statement).toBe(null);
    expect(report.created_at).toBe(null);
  });

  test('computed property: isSponsored', () => {
    const sponsoredReport = new Report({ paid_for_statement: 'Sponsored' });
    const unsponsoredReport = new Report();
    expect(sponsoredReport.isSponsored).toBe(true);
    expect(unsponsoredReport.isSponsored).toBe(false);
  });

  test('computed property: created', () => {
    const report = new Report({ created_at: '2023-01-01T00:00:00Z' });
    expect(report.created.format('YYYY-MM-DD')).toBe('2023-01-01');
    const reportWithoutCreatedAt = new Report();
    expect(reportWithoutCreatedAt.created.isValid()).toBe(false);
  });

  test('api action: addFile', async () => {
    const actions = Report.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.addFile('report-id', 'file-content', 'file-type');

    expect(postMock).toHaveBeenCalledWith(
      '/reports/report-id/files',
      {
        file: 'file-content',
        type_t: 'file-type',
      },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: deleteFile', async () => {
    const actions = Report.api();
    const deleteMock = vi
      .spyOn(actions, 'delete')
      .mockResolvedValue({ data: {} });

    await actions.deleteFile('report-id', 'file-content');

    expect(deleteMock).toHaveBeenCalledWith(
      '/reports/report-id/files',
      {
        data: { file: 'file-content' },
      },
      { save: false },
    );

    deleteMock.mockRestore();
  });
});
