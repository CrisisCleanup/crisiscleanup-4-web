import moment from '@/utils/dates';
import { omitBy, isNull } from 'lodash';
import { i18n } from '@/modules/i18n';
import Filter from './Filter';

interface WorksiteDatesFilterPacked {
  created_at__gt?: string;
  created_at__lt?: string;
  updated_at__gt?: string;
  updated_at__lt?: string;
}
function isDateLike(value: unknown): boolean {
  if (value === null || value === undefined || typeof value === 'boolean') {
    return false;
  }
  return moment(value as never).isValid();
}

export default class WorksiteDatesFilter extends Filter {
  get isCreatedAtGtValid() {
    return (
      Boolean(this.data?.created?.[0]) && isDateLike(this.data?.created?.[0])
    );
  }

  get isCreatedAtLtValid() {
    return (
      Boolean(this.data?.created?.[1]) && isDateLike(this.data?.created?.[1])
    );
  }

  get isUpdatedAtGtValid() {
    return (
      Boolean(this.data?.updated?.[0]) && isDateLike(this.data?.updated?.[0])
    );
  }

  get isUpdatedAtLtValid() {
    return (
      Boolean(this.data?.updated?.[1]) && isDateLike(this.data?.updated?.[1])
    );
  }

  packFunction() {
    const packed: WorksiteDatesFilterPacked = {};
    if (this.isCreatedAtGtValid) {
      packed.created_at__gt = moment(this.data.created[0]).format('YYYY-MM-DD');
    }

    if (this.isCreatedAtLtValid) {
      packed.created_at__lt = moment(this.data.created[1]).format('YYYY-MM-DD');
    }

    if (this.isUpdatedAtGtValid) {
      packed.updated_at__gt = moment(this.data.updated[0]).format('YYYY-MM-DD');
    }

    if (this.isUpdatedAtLtValid) {
      packed.updated_at__lt = moment(this.data.updated[1]).format('YYYY-MM-DD');
    }

    return packed;
  }

  getCount() {
    return Object.keys(this.data).length;
  }

  getFilterLabels() {
    if (Object.keys(this.data).length === 0) {
      return {};
    }

    return omitBy(
      {
        created_start: this.isCreatedAtGtValid
          ? `${i18n.global.t('worksiteFilters.from')}: ${moment(
              this.data.created[0],
            ).format('YYYY-MM-DD')}`
          : null,
        created_end: this.isCreatedAtLtValid
          ? `${i18n.global.t('worksiteFilters.to')}: ${moment(
              this.data.created[1],
            ).format('YYYY-MM-DD')}`
          : null,
        updated_start: this.isUpdatedAtGtValid
          ? `${i18n.global.t('worksiteFilters.from')}: ${moment(
              this.data.updated[0],
            ).format('YYYY-MM-DD')}`
          : null,
        updated_end: this.isUpdatedAtLtValid
          ? `${i18n.global.t('worksiteFilters.to')}: ${moment(
              this.data.updated[1],
            ).format('YYYY-MM-DD')}`
          : null,
      },
      isNull,
    );
  }

  removeField(identifier: string) {
    this.data[identifier] = false;
    this.data = { ...this.data };
  }
}
