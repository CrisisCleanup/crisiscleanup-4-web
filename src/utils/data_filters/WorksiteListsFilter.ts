import { i18n } from '@/modules/i18n';
import Filter from './Filter';

export default class WorksiteListsFilter extends Filter {
  packFunction() {
    const packed = {} as Record<string, any>;

    if (this.data.include_lists.length > 0) {
      packed.include_lists = this.data.include_lists.map((l) => l.id).join(',');
    }

    if (this.data.exclude_lists.length > 0) {
      packed.exclude_lists = this.data.exclude_lists.map((l) => l.id).join(',');
    }

    return packed;
  }

  getCount() {
    if (!this.data) {
      return 0;
    }

    return this.data.include_lists.length + this.data.exclude_lists.length;
  }

  getFilterLabels() {
    const labels = {} as Record<string, string>;
    for (const list of this.data.include_lists) {
      labels[list.id] = `${i18n.global.t('list.list')}: ${list.name}`;
    }

    for (const list of this.data.exclude_lists) {
      labels[list.id] = `${i18n.global.t('list.minus_list')}: ${list.name}`;
    }

    return labels;
  }

  removeField(identifier: string) {
    this.data.include_lists = this.data.include_lists.filter(
      (list) => String(list.id) !== identifier,
    );
    this.data.exclude_lists = this.data.exclude_lists.filter(
      (list) => String(list.id) !== identifier,
    );
    this.data = { ...this.data };
  }
}
