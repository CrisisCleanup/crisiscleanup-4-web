import type { I18n, VueI18n } from 'vue-i18n';

export default class Filter {
  name: string;
  data: any;

  constructor(name: string, data: any) {
    this.name = name;
    this.data = data;
  }

  private get i18n() {
    return inject('i18n') as I18n<VueI18n>;
  }

  packFunction() {
    throw new Error(this.i18n.global.t('info.error_pack_function'));
  }

  getCount() {
    throw new Error(this.i18n.global.t('info.error_get_count'));
  }

  getFilterLabels() {
    throw new Error(this.i18n.global.t('info.error_get_filter_labels'));
  }

  removeField(identifier: string) {
    throw new Error(this.i18n.global.t('info.error_remove_field'));
  }

  get count() {
    return this.getCount();
  }

  get labels() {
    return this.getFilterLabels();
  }
}
