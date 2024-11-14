import { i18n } from '@/modules/i18n';
import Filter from './Filter';

export default class FormDataFilter extends Filter {
  packFunction() {
    const packed: Record<any, any> = {};
    const dataEntries = Object.entries(this.data).filter(([, value]) => {
      return Boolean(value);
    });
    if (dataEntries.length > 0) {
      packed.form_data = dataEntries
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return value
              .map((v: any) => {
                return `${key}:${v}`;
              })
              .join(',');
          }

          return `${key}:${value}`;
        })
        .join(',');
    }

    return packed;
  }

  getCount() {
    if (!this.data) {
      return 0;
    }

    const dataEntries = Object.entries(this.data).filter(([, value]) => {
      return Boolean(value);
    });
    return dataEntries.length;
  }

  getFilterLabels() {
    const labels: Record<any, any> = {};
    for (const [key, value] of Object.entries(this.data).filter(([, value]) => {
      return Boolean(value);
    })) {
      const localeMessages = i18n.global.t(`formLabels.${key}`);
      labels[key] = Array.isArray(value)
        ? `${localeMessages}: ${value
            .map((v: any) => {
              return i18n.global.t(String(v));
            })
            .join(', ')}`
        : `${localeMessages}: ${i18n.global.t(String(value))}`;
    }

    return labels;
  }

  removeField(identifier: string) {
    this.data[identifier] = false;
    this.data = { ...this.data };
  }
}
