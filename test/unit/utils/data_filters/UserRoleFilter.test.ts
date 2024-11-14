import { describe, expect, test, vi } from 'vitest';
import UserRoleFilter from '@/utils/data_filters/UserRoleFilter';

vi.mock('@/models/Role', () => ({
  default: {
    find: vi.fn((id: string) => ({
      id,
      name_t: `Role ${id}`,
    })),
  },
}));

describe('UserRoleFilter', () => {
  test('packFunction should return packed data with role IDs', () => {
    const userRoleFilter = new UserRoleFilter('test', {
      role1: true,
      role2: false,
      role3: true,
    });
    const packed = userRoleFilter.packFunction();
    expect(packed).toEqual({ role: 'role1,role3' });
  });

  test('packFunction should return an empty object when no roles are selected', () => {
    const userRoleFilter = new UserRoleFilter('test', {
      role1: false,
      role2: false,
    });
    const packed = userRoleFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return the correct number of selected roles', () => {
    const userRoleFilter = new UserRoleFilter('test', {
      role1: true,
      role2: false,
      role3: true,
    });
    const count = userRoleFilter.getCount();
    expect(count).toBe(2);
  });

  test('getCount should return 0 when no roles are selected', () => {
    const userRoleFilter = new UserRoleFilter('test', {
      role1: false,
      role2: false,
    });
    const count = userRoleFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct labels for selected roles', () => {
    const userRoleFilter = new UserRoleFilter('test', {
      role1: true,
      role2: false,
      role3: true,
    });
    const labels = userRoleFilter.getFilterLabels();
    expect(labels).toEqual({
      role1: 'Role role1',
      role3: 'Role role3',
    });
  });

  test('getFilterLabels should return an empty object when no roles are selected', () => {
    const userRoleFilter = new UserRoleFilter('test', {
      role1: false,
      role2: false,
    });
    const labels = userRoleFilter.getFilterLabels();
    expect(labels).toEqual({});
  });

  test('removeField should set role to false', () => {
    const userRoleFilter = new UserRoleFilter('test', {
      role1: true,
      role2: true,
    });
    userRoleFilter.removeField('role1');
    expect(userRoleFilter.data).toEqual({ role1: false, role2: true });
  });
});
