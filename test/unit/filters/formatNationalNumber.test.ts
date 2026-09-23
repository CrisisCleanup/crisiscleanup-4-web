import { describe, expect, test } from 'vitest';
import { formatNationalNumber } from '@/filters';

describe('filters >> formatNationalNumber', () => {
  test('formats a US number', () => {
    expect(formatNationalNumber('2025550123')).toBe('(202) 555-0123');
  });

  test('returns text that is not a phone number unchanged', () => {
    expect(formatNationalNumber('N/A')).toBe('N/A');
  });
});
