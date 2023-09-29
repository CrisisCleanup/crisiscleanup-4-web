import { describe, expect, type Mock, test, vi } from 'vitest';
import { isValidActiveHotline, getIncidentPhoneNumbers } from '@/filters';
import { parsePhoneNumber } from 'libphonenumber-js';

vi.mock('libphonenumber-js');

describe('filters >> isValidActiveHotline', () => {
  test('with an array of phone numbers', () => {
    const phoneNumbers = ['1234567890', '0987654321'];
    expect(isValidActiveHotline(phoneNumbers)).toBe(true);
  });

  test('with a single phone number', () => {
    const phoneNumber = '1234567890';
    expect(isValidActiveHotline(phoneNumber)).toBe(true);
  });

  test('with an empty array', () => {
    const phoneNumbers: string[] = [];
    expect(isValidActiveHotline(phoneNumbers)).toBe(false);
  });

  test('with a falsy value', () => {
    const phoneNumber = '';
    expect(isValidActiveHotline(phoneNumber)).toBe(false);
  });
});

describe('filters >> getIncidentPhoneNumbers', () => {
  beforeEach(() => {
    (parsePhoneNumber as Mock).mockImplementation((mobile: string) => ({
      formatNational: vi.fn(() => mobile),
    }));
  });

  test('with an array of phone numbers', () => {
    const incident = {
      active_phone_number: ['1234567890', '0987654321'],
    };
    expect(getIncidentPhoneNumbers(incident)).toBe('1234567890, 0987654321');
  });

  test('with a single phone number', () => {
    const incident = { active_phone_number: '1234567890' };
    expect(getIncidentPhoneNumbers(incident)).toBe('1234567890');
  });

  test('with an empty array', () => {
    const incident = { active_phone_number: [] as string[] };
    expect(getIncidentPhoneNumbers(incident)).toBe('');
  });

  test('with a falsy value', () => {
    const incident = { active_phone_number: '' };
    expect(getIncidentPhoneNumbers(incident)).toBe('');
  });
});
