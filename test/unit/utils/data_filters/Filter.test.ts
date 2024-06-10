import { describe, expect, test, vi } from 'vitest';
import { i18n } from '@/modules/i18n';
import Filter from '@/utils/data_filters/Filter';

describe('Filter', () => {
  const name = 'testFilter';
  const data = { key: 'value' };

  test('constructor initializes name and data', () => {
    const filter = new Filter(name, data);
    expect(filter.name).toBe(name);
    expect(filter.data).toBe(data);
  });

  test('packFunction throws error with correct message', () => {
    const filter = new Filter(name, data);
    vi.spyOn(i18n.global, 't').mockReturnValue('Pack function error');
    expect(() => filter.packFunction()).toThrow('Pack function error');
  });

  test('getCount throws error with correct message', () => {
    const filter = new Filter(name, data);
    vi.spyOn(i18n.global, 't').mockReturnValue('Get count error');
    expect(() => filter.getCount()).toThrow('Get count error');
  });

  test('getFilterLabels throws error with correct message', () => {
    const filter = new Filter(name, data);
    vi.spyOn(i18n.global, 't').mockReturnValue('Get filter labels error');
    expect(() => filter.getFilterLabels()).toThrow('Get filter labels error');
  });

  test('removeField throws error with correct message', () => {
    const filter = new Filter(name, data);
    vi.spyOn(i18n.global, 't').mockReturnValue('Remove field error');
    expect(() => filter.removeField('identifier')).toThrow(
      'Remove field error',
    );
  });

  test('count getter calls getCount', () => {
    const filter = new Filter(name, data);
    const getCountSpy = vi.spyOn(filter, 'getCount');
    expect(() => filter.count).toThrow(); // Trigger getter
    expect(getCountSpy).toHaveBeenCalled();
  });

  test('labels getter calls getFilterLabels', () => {
    const filter = new Filter(name, data);
    const getFilterLabelsSpy = vi.spyOn(filter, 'getFilterLabels');
    expect(() => filter.labels).toThrow(); // Trigger getter
    expect(getFilterLabelsSpy).toHaveBeenCalled();
  });
});
