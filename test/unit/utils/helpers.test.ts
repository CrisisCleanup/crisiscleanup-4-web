import { describe, expect, test, vi } from 'vitest';
import {
  nFormatter,
  convertRemToPixels,
  numeral,
  formatCmsItem,
  isLandscape,
  getApiUrl,
  generateHash,
} from '@/utils/helpers';

describe('utils > helpers', () => {
  test('nFormatter', () => {
    const inputs = [
      [-100, -100],
      [0, 0],
      [1, 1],
      [1000, '1K'],
      [10_000, '10K'],
      [100_000, '100K'],
      [1_000_000, '1M'],
      [10_000_000, '10M'],
      [100_000_000, '100M'],
      [1_000_000_000, '1G'],
      [10_000_000_000, '10G'],
      [100_000_000_000, '100G'],
      [null, 0],
      [undefined, 0],
    ];
    for (const [input, expected] of inputs) {
      expect(nFormatter(input as number)).toBe(expected);
    }
  });

  test('convertRemToPixels', () => {
    // mock getComputedStyle
    window.getComputedStyle = (): any => ({
      fontSize: '16px',
    });
    const inputs = [
      [0, 0],
      [1, 16],
      [2, 32],
      [3, 48],
      [4, 64],
      [5, 80],
      [6, 96],
    ];
    for (const [input, expected] of inputs) {
      const result = convertRemToPixels(input);
      expect(result).toBe(expected);
    }
  });

  test('numeral', () => {
    const r0 = numeral(1000, 'currency');
    const r1 = numeral(1000, 'percentage');
    const r2 = numeral(1000);
    expect(r0).toBe('$1,000');
    expect(r1).toBe('100,000%');
    expect(r2).toBe('1,000');
  });

  test('formatCmsItem', () => {
    const r0 = formatCmsItem('hello {world}');
    expect(r0).toBe('hello world');
  });

  test('generateHash', () => {
    const str = 'test';
    vi.mock('crypto-js', () => ({
      MD5(s: string) {
        return `hashed:${s}`;
      },
    }));
    const result = generateHash(str);
    expect(result).toMatchInlineSnapshot('"hashed:test"');
  });

  test('getApiUrl', () => {
    import.meta.env.VITE_APP_API_BASE_URL = 'https://test.ccu.org';
    const endpoint = '/test';
    const result = getApiUrl(endpoint);
    expect(result).toMatchInlineSnapshot('"https://test.ccu.org/test"');
  });
});
