import { i18n } from '@/modules/i18n';
import Filter from './Filter';
import { useCurrentUser } from '@/hooks';

export default class UserLocationsFilter extends Filter {
  packFunction() {
    const currentUserStore = useCurrentUser();
    const currentUser = currentUserStore.currentUser.value;
    const packed: Record<string, any> = {};
    if (this.data.organization_primary_location) {
      if (packed.locations) {
        packed.locations += `,${currentUser.organization.primary_location}`;
      } else {
        packed.locations = currentUser.organization.primary_location;
      }
    }

    if (this.data.organization_secondary_location) {
      if (packed.locations) {
        packed.locations += `,${currentUser.organization.secondary_location}`;
      } else {
        packed.locations = currentUser.organization.secondary_location;
      }
    }

    const locationEntries = Object.entries(this.data).filter(([key, value]) => {
      return (
        Boolean(value) &&
        ![
          'organization_primary_location',
          'organization_secondary_location',
          'search_locations',
        ].includes(key)
      );
    });
    if (locationEntries.length > 0) {
      const locations = locationEntries.map(([id]) => {
        return id;
      });
      if (packed.locations) {
        packed.locations += `,${locations.join(',')}`;
      } else {
        packed.locations = locations.join(',');
      }
    }

    const searchLocationIds = this.data.search_locations || [];
    if (searchLocationIds.length > 0) {
      if (packed.locations) {
        packed.locations += `,${searchLocationIds.join(',')}`;
      } else {
        packed.locations = searchLocationIds.join(',');
      }
    }

    return packed;
  }

  getCount() {
    const filteredRoles = Object.entries(this.data).filter(([, value]) => {
      return Boolean(value);
    });
    return filteredRoles.length;
  }

  getFilterLabels() {
    const labels: Record<string, unknown> = {};
    for (const [key] of Object.entries(this.data).filter(([, value]) => {
      return Boolean(value);
    })) {
      labels[key] = `Location: ${key}`;
      if (key === 'organization_primary_location') {
        labels[key] = i18n.global.t('worksiteFilters.in_primary_response_area');
      }

      if (key === 'organization_secondary_location') {
        labels[key] = i18n.global.t(
          'worksiteFilters.in_secondary_response_area',
        );
      }

      if (key === 'search_locations') {
        labels[key] =
          `Search Locations: ${this.data.search_locations.join(',')}`;
      }
    }

    return labels;
  }

  removeField(identifier: string) {
    this.data[identifier] = false;
    this.data = { ...this.data };
  }
}
