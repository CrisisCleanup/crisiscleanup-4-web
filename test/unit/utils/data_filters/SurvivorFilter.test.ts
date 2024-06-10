import { describe, expect, test, vi } from 'vitest';
import SurvivorFilter from '@/utils/data_filters/SurvivorFilter';

describe('SurvivorFilter', () => {
  test('packFunction should return packed data when member_of_my_organization is present', () => {
    const survivorFilter = new SurvivorFilter('test', {
      member_of_my_organization: true,
    });
    const packed = survivorFilter.packFunction();
    expect(packed).toEqual({ member_of_my_organization: true });
  });

  test('packFunction should return an empty object when member_of_my_organization is not present', () => {
    const survivorFilter = new SurvivorFilter('test', {
      member_of_my_organization: false,
    });
    const packed = survivorFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return 1 when member_of_my_organization is true', () => {
    const survivorFilter = new SurvivorFilter('test', {
      member_of_my_organization: true,
    });
    const count = survivorFilter.getCount();
    expect(count).toBe(1);
  });

  test('getCount should return 0 when member_of_my_organization is false', () => {
    const survivorFilter = new SurvivorFilter('test', {
      member_of_my_organization: false,
    });
    const count = survivorFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct label when member_of_my_organization is true', () => {
    const survivorFilter = new SurvivorFilter('test', {
      member_of_my_organization: true,
    });
    const labels = survivorFilter.getFilterLabels();
    expect(labels).toEqual({ my_team: 'actions.member_of_my_org' });
  });

  test('getFilterLabels should return an empty object when member_of_my_organization is false', () => {
    const survivorFilter = new SurvivorFilter('test', {
      member_of_my_organization: false,
    });
    const labels = survivorFilter.getFilterLabels();
    expect(labels).toEqual({});
  });

  test('removeField should set member_of_my_organization to false', () => {
    const survivorFilter = new SurvivorFilter('test', {
      member_of_my_organization: true,
    });
    survivorFilter.removeField();
    expect(survivorFilter.data).toEqual({ member_of_my_organization: false });
  });
});
