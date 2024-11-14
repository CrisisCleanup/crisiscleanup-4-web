import Equipment from '../../models/Equipment';
import Filter from './Filter';
import { i18n } from '@/modules/i18n';

export default class UserEquipmentFilter extends Filter {
  packFunction() {
    const packed: Record<any, any> = {};
    const filteredEquipments = this.data;
    if (filteredEquipments.length > 0) {
      packed.equipment = filteredEquipments
        .map((equipmentId: string) => equipmentId)
        .join(',');
    }
    return packed;
  }

  getCount() {
    return this.data.length;
  }

  getFilterLabels() {
    const labels: Record<string, unknown> = {};
    for (const key of this.data) {
      const { id, name } = Equipment.find(key)!;
      labels[id] = name;
    }
    return labels;
  }

  removeField(identifier: string) {
    this.data = this.data.filter(
      (equipmentId: string) => equipmentId !== identifier,
    );
    this.data = [...this.data];
  }
}
