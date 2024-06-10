import { describe, expect, test, vi } from 'vitest';
import UserInvitedByFilter from '@/utils/data_filters/UserInvitedByFilter';
import { i18n } from '@/modules/i18n';

describe('UserInvitedByFilter', () => {
  test('packFunction should return packed data with user IDs', () => {
    const users = new Set([
      { id: 1, full_name: 'John Doe' },
      { id: 2, full_name: 'Jane Smith' },
    ]);
    const userInvitedByFilter = new UserInvitedByFilter('test', users);
    const packed = userInvitedByFilter.packFunction();
    expect(packed).toEqual({ referring_user__in: '1,2' });
  });

  test('packFunction should return an empty object when no user IDs are present', () => {
    const users = new Set();
    const userInvitedByFilter = new UserInvitedByFilter('test', users);
    const packed = userInvitedByFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return the correct number of users', () => {
    const users = new Set([
      { id: 1, full_name: 'John Doe' },
      { id: 2, full_name: 'Jane Smith' },
    ]);
    const userInvitedByFilter = new UserInvitedByFilter('test', users);
    const count = userInvitedByFilter.getCount();
    expect(count).toBe(2);
  });

  test('getCount should return 0 when no users are present', () => {
    const users = new Set();
    const userInvitedByFilter = new UserInvitedByFilter('test', users);
    const count = userInvitedByFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct labels for users', () => {
    const users = new Set([
      { id: 1, full_name: 'John Doe' },
      { id: 2, full_name: 'Jane Smith' },
    ]);
    const userInvitedByFilter = new UserInvitedByFilter('test', users);
    vi.spyOn(i18n.global, 't').mockImplementation(
      (key, named) => `${key} ${named?.full_name}`,
    );
    const labels = userInvitedByFilter.getFilterLabels();
    expect(labels).toEqual({
      1: 'userInvitedBy.invited_by John Doe',
      2: 'userInvitedBy.invited_by Jane Smith',
    });
  });

  test('getFilterLabels should return an empty object when no users are present', () => {
    const users = new Set();
    const userInvitedByFilter = new UserInvitedByFilter('test', users);
    const labels = userInvitedByFilter.getFilterLabels();
    expect(labels).toEqual({});
  });

  test('removeField should remove the user with the specified ID', () => {
    const users = new Set([
      { id: 1, full_name: 'John Doe' },
      { id: 2, full_name: 'Jane Smith' },
    ]);
    const userInvitedByFilter = new UserInvitedByFilter('test', users);
    userInvitedByFilter.removeField('1');
    expect(userInvitedByFilter.data).toEqual(
      new Set([{ id: 2, full_name: 'Jane Smith' }]),
    );
  });
});
