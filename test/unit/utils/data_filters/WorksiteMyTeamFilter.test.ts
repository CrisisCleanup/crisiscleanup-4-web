import { describe, expect, test } from 'vitest';
import WorksiteMyTeamFilter from '@/utils/data_filters/WorksiteMyTeamFilter';

describe('WorksiteMyTeamFilter', () => {
  test('packFunction should return packed data when my_team is true', () => {
    const worksiteMyTeamFilter = new WorksiteMyTeamFilter('test', {
      my_team: true,
    });
    const packed = worksiteMyTeamFilter.packFunction();
    expect(packed).toEqual({ my_team: true });
  });

  test('packFunction should return an empty object when my_team is false', () => {
    const worksiteMyTeamFilter = new WorksiteMyTeamFilter('test', {
      my_team: false,
    });
    const packed = worksiteMyTeamFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return 1 when my_team is true', () => {
    const worksiteMyTeamFilter = new WorksiteMyTeamFilter('test', {
      my_team: true,
    });
    const count = worksiteMyTeamFilter.getCount();
    expect(count).toBe(1);
  });

  test('getCount should return 0 when my_team is false', () => {
    const worksiteMyTeamFilter = new WorksiteMyTeamFilter('test', {
      my_team: false,
    });
    const count = worksiteMyTeamFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct label when my_team is true', () => {
    const worksiteMyTeamFilter = new WorksiteMyTeamFilter('test', {
      my_team: true,
    });
    const labels = worksiteMyTeamFilter.getFilterLabels();
    expect(labels).toEqual({
      my_team: 'worksiteFilters.my_team',
    });
  });

  test('getFilterLabels should return an empty object when my_team is false', () => {
    const worksiteMyTeamFilter = new WorksiteMyTeamFilter('test', {
      my_team: false,
    });
    const labels = worksiteMyTeamFilter.getFilterLabels();
    expect(labels).toEqual({});
  });

  test('removeField should set my_team field to false', () => {
    const worksiteMyTeamFilter = new WorksiteMyTeamFilter('test', {
      my_team: true,
    });
    worksiteMyTeamFilter.removeField('my_team');
    expect(worksiteMyTeamFilter.data).toEqual({
      my_team: false,
    });
  });
});
