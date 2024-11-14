import { describe, expect, test } from 'vitest';
import WorksiteListsFilter from '@/utils/data_filters/WorksiteListsFilter';

const data = {
  include_lists: [
    { id: 1, name: 'Included List 1' },
    { id: 2, name: 'Included List 2' },
  ],
  exclude_lists: [
    { id: 3, name: 'Excluded List 1' },
    { id: 4, name: 'Excluded List 2' },
  ],
};

describe('WorksiteListsFilter', () => {
  test('packFunction should return packed data when lists are present', () => {
    const worksiteListsFilter = new WorksiteListsFilter('test', data);
    const packed = worksiteListsFilter.packFunction();
    expect(packed).toEqual({ include_lists: '1,2', exclude_lists: '3,4' });
  });

  test('packFunction should return an empty object when no lists are present', () => {
    const emptyData = {
      include_lists: [],
      exclude_lists: [],
    };
    const worksiteListsFilter = new WorksiteListsFilter('test', emptyData);
    const packed = worksiteListsFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return the count of lists', () => {
    const worksiteListsFilter = new WorksiteListsFilter('test', data);
    const count = worksiteListsFilter.getCount();
    expect(count).toBe(4);
  });

  test('getCount should return 0 when no lists are present', () => {
    const emptyData = {
      include_lists: [],
      exclude_lists: [],
    };
    const worksiteListsFilter = new WorksiteListsFilter('test', emptyData);
    const count = worksiteListsFilter.getCount();
    expect(count).toBe(0);
  });

  test('getCount should return 0 when data is undefined', () => {
    const worksiteListsFilter = new WorksiteListsFilter('test', undefined);
    const count = worksiteListsFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct labels', () => {
    const worksiteListsFilter = new WorksiteListsFilter('test', data);
    const labels = worksiteListsFilter.getFilterLabels();
    expect(labels).toEqual({
      1: 'list.list: Included List 1',
      2: 'list.list: Included List 2',
      3: 'list.minus_list: Excluded List 1',
      4: 'list.minus_list: Excluded List 2',
    });
  });

  test('removeField should remove the field from include_lists', () => {
    const worksiteListsFilter = new WorksiteListsFilter('test', data);
    worksiteListsFilter.removeField('1');
    expect(worksiteListsFilter.data.include_lists).not.toEqual(
      expect.arrayContaining([{ id: 1, name: 'Included List 1' }]),
    );
  });

  test('removeField should remove the field from exclude_lists', () => {
    const worksiteListsFilter = new WorksiteListsFilter('test', data);
    worksiteListsFilter.removeField('3');
    expect(worksiteListsFilter.data.exclude_lists).not.toEqual(
      expect.arrayContaining([{ id: 3, name: 'Excluded List 1' }]),
    );
  });
});
