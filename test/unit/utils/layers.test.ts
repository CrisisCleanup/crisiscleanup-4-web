import { describe, expect, test } from 'vitest';
import { searchLayers } from '@/utils/layers';

describe('layers >> searchLayers', () => {
  const layers = [
    { id: 1, name: 'Dane County' },
    { id: 2, name: 'Door County' },
    { id: 3, name: 'Wisconsin' },
    { id: 1, name: 'Dane County' },
  ];

  test('returns layers whose name contains the query, ignoring case', () => {
    expect(searchLayers(layers, 'COUNTY')).toEqual([
      { id: 1, name: 'Dane County' },
      { id: 2, name: 'Door County' },
    ]);
  });

  test('ignores spaces around the query', () => {
    expect(searchLayers(layers, '  wis ')).toEqual([
      { id: 3, name: 'Wisconsin' },
    ]);
  });

  test('returns nothing for an empty query', () => {
    expect(searchLayers(layers, '   ')).toEqual([]);
  });
});
