import { describe, expect, test } from 'vitest';
import WorksiteMissingWorkTypeFilter from '@/utils/data_filters/WorksiteMissingWorkTypeFilter';

describe('WorksiteMissingWorkTypeFilter', () => {
  test('packFunction should return packed data when missing_work_type is true', () => {
    const worksiteMissingWorkTypeFilter = new WorksiteMissingWorkTypeFilter(
      'test',
      {
        missing_work_type: true,
      },
    );
    const packed = worksiteMissingWorkTypeFilter.packFunction();
    expect(packed).toEqual({ missing_work_type: true });
  });

  test('packFunction should return an empty object when missing_work_type is false', () => {
    const worksiteMissingWorkTypeFilter = new WorksiteMissingWorkTypeFilter(
      'test',
      {
        missing_work_type: false,
      },
    );
    const packed = worksiteMissingWorkTypeFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return the count of true values', () => {
    const worksiteMissingWorkTypeFilter = new WorksiteMissingWorkTypeFilter(
      'test',
      {
        missing_work_type: true,
      },
    );
    const count = worksiteMissingWorkTypeFilter.getCount();
    expect(count).toBe(1);
  });

  test('getCount should return 0 when no values are true', () => {
    const worksiteMissingWorkTypeFilter = new WorksiteMissingWorkTypeFilter(
      'test',
      {
        missing_work_type: false,
      },
    );
    const count = worksiteMissingWorkTypeFilter.getCount();
    expect(count).toBe(0);
  });

  test('getCount should return 0 when data is undefined', () => {
    const worksiteMissingWorkTypeFilter = new WorksiteMissingWorkTypeFilter(
      'test',
      undefined,
    );
    const count = worksiteMissingWorkTypeFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct labels', () => {
    const worksiteMissingWorkTypeFilter = new WorksiteMissingWorkTypeFilter(
      'test',
      {
        missing_work_type: true,
      },
    );
    const labels = worksiteMissingWorkTypeFilter.getFilterLabels();
    expect(labels).toEqual({
      missing_work_type: 'worksiteFilters.status: Missing Work Type',
    });
  });

  test('removeField should set the field to false', () => {
    const worksiteMissingWorkTypeFilter = new WorksiteMissingWorkTypeFilter(
      'test',
      {
        missing_work_type: true,
      },
    );
    worksiteMissingWorkTypeFilter.removeField('missing_work_type');
    expect(worksiteMissingWorkTypeFilter.data).toEqual({
      missing_work_type: false,
    });
  });
});
