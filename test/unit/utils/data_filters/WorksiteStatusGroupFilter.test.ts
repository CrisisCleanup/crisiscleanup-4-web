import { beforeAll, describe, expect, test, vi } from 'vitest';
import WorksiteStatusGroupFilter from '@/utils/data_filters/WorksiteStatusGroupFilter';
import enums from '@/store/modules/enums';

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

describe('WorksiteStatusGroupFilter', () => {
  beforeAll(() => {
    enums.state = {
      statuses: [
        {
          status_name_t: 'open_status_1',
          status: 'open_status_1',
          primary_state: 'open',
        },
        {
          status_name_t: 'open_status_2',
          status: 'open_status_2',
          primary_state: 'open',
        },
        {
          status_name_t: 'closed_status_1',
          status: 'closed_status_1',
          primary_state: 'closed',
        },
        {
          status_name_t: 'closed_status_2',
          status: 'closed_status_2',
          primary_state: 'closed',
        },
      ],
    } as any;
  });

  test('packFunction should return packed data based on filter criteria', () => {
    const worksiteStatusGroupFilter = new WorksiteStatusGroupFilter('test', {
      unclaimed: true,
      claimed_by_org: true,
      reported_by_org: true,
      open: true,
    });
    const packed = worksiteStatusGroupFilter.packFunction();
    expect(packed).toEqual({
      work_type__claimed_by__isnull: true,
      work_type__claimed_by: 'organization_id',
      reported_by: 'organization_id',
      work_type__status__in: 'open_status_1,open_status_2',
    });
  });

  test('packFunction should return packed data with closed statuses', () => {
    const worksiteStatusGroupFilter = new WorksiteStatusGroupFilter('test', {
      closed: true,
    });
    const packed = worksiteStatusGroupFilter.packFunction();
    expect(packed).toEqual({
      work_type__status__in: 'closed_status_1,closed_status_2',
    });
  });

  test('packFunction should return an empty object when no data is provided', () => {
    const worksiteStatusGroupFilter = new WorksiteStatusGroupFilter('test', {});
    const packed = worksiteStatusGroupFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return the count of true values', () => {
    const worksiteStatusGroupFilter = new WorksiteStatusGroupFilter('test', {
      unclaimed: true,
      claimed_by_org: true,
      reported_by_org: false,
    });
    const count = worksiteStatusGroupFilter.getCount();
    expect(count).toBe(2);
  });

  test('getCount should return 0 when no values are true', () => {
    const worksiteStatusGroupFilter = new WorksiteStatusGroupFilter('test', {
      unclaimed: false,
      claimed_by_org: false,
    });
    const count = worksiteStatusGroupFilter.getCount();
    expect(count).toBe(0);
  });

  test('getCount should return 0 when data is undefined', () => {
    const worksiteStatusGroupFilter = new WorksiteStatusGroupFilter(
      'test',
      undefined,
    );
    const count = worksiteStatusGroupFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct labels', () => {
    const worksiteStatusGroupFilter = new WorksiteStatusGroupFilter('test', {
      unclaimed: true,
      claimed_by_org: true,
      reported_by_org: true,
      open: true,
    });
    const labels = worksiteStatusGroupFilter.getFilterLabels();
    expect(labels).toEqual({
      unclaimed: 'worksiteFilters.status: Unclaimed',
      claimed_by_org: 'worksiteFilters.status: Claimed By Org',
      reported_by_org: 'worksiteFilters.status: Reported By Org',
      open: 'worksiteFilters.status: Open',
    });
  });

  test('removeField should set the specific field to false', () => {
    const worksiteStatusGroupFilter = new WorksiteStatusGroupFilter('test', {
      unclaimed: true,
      claimed_by_org: true,
    });
    worksiteStatusGroupFilter.removeField('claimed_by_org');
    expect(worksiteStatusGroupFilter.data).toEqual({
      unclaimed: true,
      claimed_by_org: false,
    });
  });
});
