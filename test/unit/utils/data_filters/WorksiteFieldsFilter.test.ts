import { describe, expect, test } from 'vitest';
import WorksiteFieldsFilter from '@/utils/data_filters/WorksiteFieldsFilter';

vi.mock('@/filters', () => ({
  getWorkTypeName: (key: string) => {
    const mockNames = {
      workType1: 'Work Type 1',
      workType2: 'Work Type 2',
      workType3: 'Work Type 3',
    };
    return mockNames[key] || key;
  },
}));

describe('WorksiteFieldsFilter', () => {
  test('packFunction should return packed data when values are present', () => {
    const worksiteFieldsFilter = new WorksiteFieldsFilter('test', {
      workType1: true,
      workType2: false,
      workType3: true,
    });
    const packed = worksiteFieldsFilter.packFunction();
    expect(packed).toEqual({ work_type__work_type__in: 'workType1,workType3' });
  });

  test('packFunction should return an empty object when no values are present', () => {
    const worksiteFieldsFilter = new WorksiteFieldsFilter('test', {
      workType1: false,
      workType2: false,
    });
    const packed = worksiteFieldsFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return the count of true values', () => {
    const worksiteFieldsFilter = new WorksiteFieldsFilter('test', {
      workType1: true,
      workType2: false,
      workType3: true,
    });
    const count = worksiteFieldsFilter.getCount();
    expect(count).toBe(2);
  });

  test('getCount should return 0 when no values are true', () => {
    const worksiteFieldsFilter = new WorksiteFieldsFilter('test', {
      workType1: false,
      workType2: false,
    });
    const count = worksiteFieldsFilter.getCount();
    expect(count).toBe(0);
  });

  test('getCount should return 0 when data is undefined', () => {
    const worksiteFieldsFilter = new WorksiteFieldsFilter('test', undefined);
    const count = worksiteFieldsFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct labels', () => {
    const worksiteFieldsFilter = new WorksiteFieldsFilter('test', {
      workType1: true,
      workType2: false,
      workType3: true,
    });
    const labels = worksiteFieldsFilter.getFilterLabels();
    expect(labels).toEqual({
      workType1: 'worksiteFilters.work_type: Work Type 1',
      workType3: 'worksiteFilters.work_type: Work Type 3',
    });
  });

  test('removeField should set the field to false', () => {
    const worksiteFieldsFilter = new WorksiteFieldsFilter('test', {
      workType1: true,
      workType2: true,
    });
    worksiteFieldsFilter.removeField('workType1');
    expect(worksiteFieldsFilter.data).toEqual({
      workType1: false,
      workType2: true,
    });
  });
});
