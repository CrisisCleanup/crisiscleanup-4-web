import moment from 'moment';
import { omitBy, isNull } from 'lodash';
import { i18n } from '@/modules/i18n';
import Filter from './Filter';

interface WorksiteDatesFilterPacked {
  created_at__gt?: string;
  created_at__lt?: string;
  updated_at__gt?: string;
  updated_at__lt?: string;
}
export default class WorksiteDatesFilter extends Filter {
  get isCreatedAtGtValid() {
    return this.data?.created?.[0] && moment(this.data?.created?.[0]).isValid();
  }

  get isCreatedAtLtValid() {
    return this.data?.created?.[1] && moment(this.data?.created?.[1]).isValid();
  }

  get isUpdatedAtGtValid() {
    return this.data?.updated?.[0] && moment(this.data?.updated?.[0]).isValid();
  }

  get isUpdatedAtLtValid() {
    return this.data?.updated?.[1] && moment(this.data?.updated?.[1]).isValid();
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
