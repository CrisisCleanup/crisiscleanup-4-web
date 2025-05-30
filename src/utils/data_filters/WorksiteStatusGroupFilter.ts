import { i18n } from '@/modules/i18n';
import { snakeToTitleCase } from '../../filters';
import enums from '../../store/modules/enums';
import User from '../../models/User';
import { store } from '../../store';
import Filter from './Filter';
import { useCurrentUser } from '@/hooks';

export default class WorksiteStatusGroupFilter extends Filter {
  packFunction() {
    const currentUserStore = useCurrentUser();
    const currentUser = currentUserStore.currentUser.value;
    const packed: Record<string, unknown> = {};
    if (this.data.unclaimed) {
      packed.work_type__claimed_by__isnull = true;
    }

    if (this.data.claimed_by_org) {
      packed.work_type__claimed_by = currentUser.organization.id;
    }

    if (this.data.claimed_by_me) {
      packed.work_type__user_claimed_by = currentUser.id;
    }

    if (this.data.reported_by_org) {
      packed.reported_by = currentUser.organization.id;
    }

    if (this.data.open) {
      enums.state.statuses.filter((status) => status.primary_state === 'open');
      const openStatuses = enums.state.statuses.filter(
        (status) => status.primary_state === 'open',
      );
      packed.work_type__status__in = openStatuses
        .map((status) => status.status)
        .join(',');
    }

    if (this.data.closed) {
      const closedStatuses = enums.state.statuses.filter(
        (status) => status.primary_state === 'closed',
      );
      packed.work_type__status__in = closedStatuses
        .map((status) => status.status)
        .join(',');
    }

    return packed;
  }

  getCount() {
    if (!this.data) {
      return 0;
    }

    const statusGroupEntries = Object.entries(this.data).filter(([, value]) => {
      return Boolean(value);
    });
    return statusGroupEntries.length;
  }

  getFilterLabels() {
    const labels = {} as Record<string, string>;
    for (const [key] of Object.entries(this.data).filter(([, value]) => {
      return Boolean(value);
    })) {
      labels[key] = `${i18n.global.t(
        'worksiteFilters.status',
      )}: ${snakeToTitleCase(key)}`;
    }

    return labels;
  }

  removeField(identifier: string) {
    this.data[identifier] = false;
    this.data = { ...(this.data as Record<string, unknown>) };
  }
}
