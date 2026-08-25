import { describe, expect, test, vi } from 'vitest';
import { packWorksiteFilters } from '@/utils/data_filters/worksiteFilters';

vi.mock('@/hooks', () => ({
  useCurrentUser: () => ({
    currentUser: {
      value: {
        organization: {
          id: 'organization_id',
        },
      },
    },
  }),
}));

vi.mock('@/filters', () => ({
  getWorkTypeName: (key: string) => key,
  snakeToTitleCase: (key: string) => key,
}));

describe('packWorksiteFilters', () => {
  test('returns an empty query for missing or empty filters', () => {
    expect(packWorksiteFilters()).toEqual({});
    expect(packWorksiteFilters(null)).toEqual({});
    expect(packWorksiteFilters({})).toEqual({});
  });

  test('packs persisted filter data into query parameters', () => {
    const raw = {
      fields: { name: 'fields', data: { trees: true, tarp: false } },
    };
    expect(packWorksiteFilters(raw)).toEqual({
      work_type__work_type__in: 'trees',
    });
  });

  test('ignores filter entries with no data', () => {
    const raw = {
      fields: { name: 'fields' },
      statuses: { name: 'statuses', data: {} },
    };
    expect(packWorksiteFilters(raw)).toEqual({});
  });
});
