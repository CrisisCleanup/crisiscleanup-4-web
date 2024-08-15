import Incident from '@/models/Incident';
import Filter from './Filter';
import { i18n } from '@/modules/i18n';

export default class PhoneOutboundIncidentFilter extends Filter {
  packFunction() {
    const packed: Record<any, any> = {};
    if (this.data.length > 0) {
      packed.incident_id = this.data.join(',');
    }
    return packed;
  }

  unpackFunction(data: Record<string, unknown>): void {
    // Split the string into an array of numbers
    this.data = data.incident_id
      ? (data.incident_id as string).split(',').map(Number)
      : [];
  }

  getCount() {
    return this.data.length;
  }

  getFilterLabels() {
    const labels: Record<string, unknown> = {};
    for (const key of this.data) {
      const { id, name } = Incident.find(key)!;
      labels[id] = name;
    }
    return labels;
  }

  removeField(identifier: string) {
    this.data = this.data.filter((id: string) => id !== identifier);
    this.data = [...this.data];
  }
}
