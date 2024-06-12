import { describe, expect, test, vi } from 'vitest';
import WorksiteTeamsFilter from '@/utils/data_filters/WorksiteTeamsFilter';
import Team from '@/models/Team';

describe('WorksiteTeamsFilter', () => {
  test('packFunction should return packed data when team values are present', () => {
    const worksiteTeamsFilter = new WorksiteTeamsFilter('test', {
      team1: true,
      team2: false,
      team3: true,
    });
    const packed = worksiteTeamsFilter.packFunction();
    expect(packed).toEqual({ teams: 'team1,team3' });
  });

  test('packFunction should return an empty object when no team values are present', () => {
    const worksiteTeamsFilter = new WorksiteTeamsFilter('test', {
      team1: false,
      team2: false,
    });
    const packed = worksiteTeamsFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return the count of true values', () => {
    const worksiteTeamsFilter = new WorksiteTeamsFilter('test', {
      team1: true,
      team2: false,
      team3: true,
    });
    const count = worksiteTeamsFilter.getCount();
    expect(count).toBe(2);
  });

  test('getCount should return 0 when no values are true', () => {
    const worksiteTeamsFilter = new WorksiteTeamsFilter('test', {
      team1: false,
      team2: false,
    });
    const count = worksiteTeamsFilter.getCount();
    expect(count).toBe(0);
  });

  test('getCount should return 0 when data is undefined', () => {
    const worksiteTeamsFilter = new WorksiteTeamsFilter('test', undefined);
    const count = worksiteTeamsFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct labels', () => {
    const findMock = vi.fn((id) => {
      const teams = {
        1: { name: 'Team 1' },
        2: { name: 'Team 2' },
        3: { name: 'Team 3' },
      };
      return teams[id] || null;
    });
    const teamMock = vi.spyOn(Team, 'find').mockImplementation(findMock);
    const worksiteTeamsFilter = new WorksiteTeamsFilter('test', {
      1: true,
      2: false,
      3: true,
    });
    const labels = worksiteTeamsFilter.getFilterLabels();
    expect(labels).toEqual({
      1: 'worksiteFilters.teams: Team 1',
      3: 'worksiteFilters.teams: Team 3',
    });
    teamMock.mockRestore();
  });

  test('removeField should set the field to false', () => {
    const worksiteTeamsFilter = new WorksiteTeamsFilter('test', {
      team1: true,
      team2: true,
    });
    worksiteTeamsFilter.removeField('team1');
    expect(worksiteTeamsFilter.data).toEqual({
      team1: false,
      team2: true,
    });
  });
});
