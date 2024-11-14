import { describe, expect, test } from 'vitest';
import WorksiteFlagsFilter from '@/utils/data_filters/WorksiteFlagsFilter';

describe('WorksiteFlagsFilter', () => {
  test('packFunction should return packed data when values are present', () => {
    const worksiteFlagsFilter = new WorksiteFlagsFilter('test', {
      flag1: true,
      flag2: false,
      flag3: true,
    });
    const packed = worksiteFlagsFilter.packFunction();
    expect(packed).toEqual({ flags: 'flag1,flag3' });
  });

  test('packFunction should return an empty object when no values are present', () => {
    const worksiteFlagsFilter = new WorksiteFlagsFilter('test', {
      flag1: false,
      flag2: false,
    });
    const packed = worksiteFlagsFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return the count of true values', () => {
    const worksiteFlagsFilter = new WorksiteFlagsFilter('test', {
      flag1: true,
      flag2: false,
      flag3: true,
    });
    const count = worksiteFlagsFilter.getCount();
    expect(count).toBe(2);
  });

  test('getCount should return 0 when no values are true', () => {
    const worksiteFlagsFilter = new WorksiteFlagsFilter('test', {
      flag1: false,
      flag2: false,
    });
    const count = worksiteFlagsFilter.getCount();
    expect(count).toBe(0);
  });

  test('getCount should return 0 when data is undefined', () => {
    const worksiteFlagsFilter = new WorksiteFlagsFilter('test', undefined);
    const count = worksiteFlagsFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct labels', () => {
    const worksiteFlagsFilter = new WorksiteFlagsFilter('test', {
      flag1: true,
      flag2: false,
      flag3: true,
    });
    const labels = worksiteFlagsFilter.getFilterLabels();
    expect(labels).toEqual({
      flag1: 'worksiteFilters.flag: flag1',
      flag3: 'worksiteFilters.flag: flag3',
    });
  });

  test('removeField should set the field to false', () => {
    const worksiteFlagsFilter = new WorksiteFlagsFilter('test', {
      flag1: true,
      flag2: true,
    });
    worksiteFlagsFilter.removeField('flag1');
    expect(worksiteFlagsFilter.data).toEqual({
      flag1: false,
      flag2: true,
    });
  });
});
