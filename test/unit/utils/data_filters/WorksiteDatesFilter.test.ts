import { describe, expect, test } from 'vitest';
import WorksiteDatesFilter from '@/utils/data_filters/WorksiteDatesFilter';

describe('WorksiteDatesFilter', () => {
  test('packFunction should return packed data with formatted dates', () => {
    const data = {
      created: [new Date('2022-01-01'), new Date('2022-01-31')],
      updated: [new Date('2022-02-01'), new Date('2022-02-28')],
    };
    const filter = new WorksiteDatesFilter('test', data);
    const packed = filter.packFunction();
    expect(packed).toEqual({
      created_at__gt: '2022-01-01',
      created_at__lt: '2022-01-31',
      updated_at__gt: '2022-02-01',
      updated_at__lt: '2022-02-28',
    });
  });

  test('packFunction should handle missing created or updated dates', () => {
    const data = {
      created: [new Date('2022-01-01')],
      updated: [undefined, new Date('2022-02-28')],
    };
    const filter = new WorksiteDatesFilter('test', data);
    const packed = filter.packFunction();
    expect(packed).toEqual({
      created_at__gt: '2022-01-01',
      updated_at__lt: '2022-02-28',
    });
  });

  test('getCount should return the number of entries in data', () => {
    const data = {
      created: [new Date('2022-01-01'), new Date('2022-01-31')],
      updated: [new Date('2022-02-01'), new Date('2022-02-28')],
    };
    const filter = new WorksiteDatesFilter('test', data);
    expect(filter.getCount()).toBe(2);
  });

  test('getFilterLabels should return appropriate labels for created and updated dates', () => {
    const data = {
      created: [new Date('2022-01-01'), new Date('2022-01-31')],
      updated: [new Date('2022-02-01'), new Date('2022-02-28')],
    };
    const filter = new WorksiteDatesFilter('test', data);
    const labels = filter.getFilterLabels();
    expect(labels).toEqual({
      created_start: 'worksiteFilters.from: 2022-01-01',
      created_end: 'worksiteFilters.to: 2022-01-31',
      updated_start: 'worksiteFilters.from: 2022-02-01',
      updated_end: 'worksiteFilters.to: 2022-02-28',
    });
  });

  test('getFilterLabels should return an empty object if no dates are provided', () => {
    const data = {};
    const filter = new WorksiteDatesFilter('test', data);
    expect(filter.getFilterLabels()).toEqual({});
  });

  test('getFilterLabels should return an empty object if invalid dates are provided', () => {
    const data = {
      created: ['', true],
      updated: [undefined, false],
    };
    const filter = new WorksiteDatesFilter('test', data);
    expect(filter.getFilterLabels()).toEqual({});
  });

  test('removeField should set the specified date field to false', () => {
    const data = {
      created: [new Date('2022-01-01'), new Date('2022-01-31')],
      updated: [new Date('2022-02-01'), new Date('2022-02-28')],
    };
    const filter = new WorksiteDatesFilter('test', data);
    filter.removeField('created');
    expect(filter.data).toEqual({
      created: false,
      updated: [new Date('2022-02-01'), new Date('2022-02-28')],
    });
  });
});
