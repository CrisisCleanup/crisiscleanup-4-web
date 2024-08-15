import Language from '../../models/Language';
import Filter from './Filter';
import { i18n } from '@/modules/i18n';

export default class PhoneOutboundLanguageFilter extends Filter {
  packFunction() {
    const packed: Record<any, any> = {};
    if (this.data.length > 0) {
      packed.language__in = this.data.join(',');
    }
    return packed;
  }

  unpackFunction(data: Record<string, unknown>): void {
    // Split the string into an array of numbers
    this.data = data.language__in
      ? (data.language__in as string).split(',').map(Number)
      : [];
  }

  getCount() {
    return this.data.length;
  }

  getFilterLabels() {
    const labels: Record<string, unknown> = {};
    for (const key of this.data) {
      const { id, name_t } = Language.find(key)!;
      labels[id] = name_t;
    }
    return labels;
  }

  removeField(identifier: string) {
    this.data = this.data.filter((id: string) => id !== identifier);
    this.data = [...this.data];
  }
}
