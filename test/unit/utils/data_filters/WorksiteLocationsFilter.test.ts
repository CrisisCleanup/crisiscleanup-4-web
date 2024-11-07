import { describe, expect, test, vi } from 'vitest';
import UserLocationsFilter from '@/utils/data_filters/WorksiteLocationsFilter';

vi.mock('@/hooks', () => ({
  useCurrentUser: () => ({
    currentUser: {
      value: {
        organization: {
          id: 'organization_id',
          primary_location: 'primary_location',
          secondary_location: 'secondary_location',
        },
      },
    },
  }),
}));

describe('UserLocationsFilter', () => {
  test('packFunction should return packed data with organization locations when values are present', () => {
    const userLocationsFilter = new UserLocationsFilter('test', {
      organization_primary_location: true,
      organization_secondary_location: true,
      location1: true,
      location2: false,
    });
    const packed = userLocationsFilter.packFunction();
    expect(packed).toEqual({
      locations: 'primary_location,secondary_location,location1',
    });
  });

  test('packFunction should return packed data without organization locations when no values are present', () => {
    const userLocationsFilter = new UserLocationsFilter('test', {
      organization_primary_location: false,
      organization_secondary_location: false,
      location1: false,
      location2: false,
    });
    const packed = userLocationsFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return the count of true values', () => {
    const userLocationsFilter = new UserLocationsFilter('test', {
      organization_primary_location: true,
      location1: true,
      location2: false,
    });
    const count = userLocationsFilter.getCount();
    expect(count).toBe(2);
  });

  test('getCount should return 0 when no values are true', () => {
    const userLocationsFilter = new UserLocationsFilter('test', {
      organization_primary_location: false,
      location1: false,
    });
    const count = userLocationsFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct labels', () => {
    const userLocationsFilter = new UserLocationsFilter('test', {
      organization_primary_location: true,
      organization_secondary_location: true,
      location1: true,
    });
    const labels = userLocationsFilter.getFilterLabels();
    expect(labels).toEqual({
      organization_primary_location: 'worksiteFilters.in_primary_response_area',
      organization_secondary_location:
        'worksiteFilters.in_secondary_response_area',
      location1: 'Location: location1',
    });
  });

  test('removeField should set the field to false', () => {
    const userLocationsFilter = new UserLocationsFilter('test', {
      organization_primary_location: true,
      location1: true,
    });
    userLocationsFilter.removeField('location1');
    expect(userLocationsFilter.data).toEqual({
      organization_primary_location: true,
      location1: false,
    });
  });
});
