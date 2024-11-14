import { describe, expect, test } from 'vitest';
import WorksiteStatusFilter from '@/utils/data_filters/WorksiteStatusFilter';

describe('WorksiteStatusFilter', () => {
  test('packFunction should return packed data when status values are present', () => {
    const worksiteStatusFilter = new WorksiteStatusFilter('test', {
      status1: true,
      status2: false,
      status3: true,
    });
    const packed = worksiteStatusFilter.packFunction();
    expect(packed).toEqual({ work_type__status__in: 'status1,status3' });
  });

  test('packFunction should return an empty object when no status values are present', () => {
    const worksiteStatusFilter = new WorksiteStatusFilter('test', {
      status1: false,
      status2: false,
    });
    const packed = worksiteStatusFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return the count of true values', () => {
    const worksiteStatusFilter = new WorksiteStatusFilter('test', {
      status1: true,
      status2: false,
      status3: true,
    });
    const count = worksiteStatusFilter.getCount();
    expect(count).toBe(2);
  });

  test('getCount should return 0 when no values are true', () => {
    const worksiteStatusFilter = new WorksiteStatusFilter('test', {
      status1: false,
      status2: false,
    });
    const count = worksiteStatusFilter.getCount();
    expect(count).toBe(0);
  });

  test('getCount should return 0 when data is undefined', () => {
    const worksiteStatusFilter = new WorksiteStatusFilter('test', undefined);
    const count = worksiteStatusFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct labels', () => {
    const worksiteStatusFilter = new WorksiteStatusFilter('test', {
      status1: true,
      status2: false,
      status3: true,
    });
    const labels = worksiteStatusFilter.getFilterLabels();
    expect(labels).toEqual({
      status1: 'worksiteFilters.status: Status1',
      status3: 'worksiteFilters.status: Status3',
    });
  });

  test('removeField should set the field to false', () => {
    const worksiteStatusFilter = new WorksiteStatusFilter('test', {
      status1: true,
      status2: true,
    });
    worksiteStatusFilter.removeField('status1');
    expect(worksiteStatusFilter.data).toEqual({
      status1: false,
      status2: true,
    });
  });
});
