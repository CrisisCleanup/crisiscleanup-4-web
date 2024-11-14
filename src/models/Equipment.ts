import CCUModel from '@/models/base';
import type { Fields } from '@vuex-orm/core';
import { i18n } from '@/modules/i18n';

export default class Equipment extends CCUModel {
  static entity = 'equipment';

  static fields(): Fields {
    return {
      id: this.attr(''),
      fema_cost_code: this.string(''),
      list_order: this.attr(null),
      specifications: this.attr(null),
      fema_rates: this.attr(null),
      is_common: this.attr(null),
      selected_count: this.attr(null),
      name_t: this.attr(null),
    };
  }

  get name() {
    let text = i18n.global.t(this.name_t);
    if (this.specifications) {
      if (this.specifications.capacity_t) {
        text += ' - ' + i18n.global.t(this.specifications.capacity_t);
      }
      if (this.specifications.hp_t) {
        text += ' - ' + i18n.global.t(this.specifications.hp_t);
      }
      if (this.specifications.specification_t) {
        text += ' - ' + i18n.global.t(this.specifications.specification_t);
      }
      if (this.specifications.notes_t) {
        text += ' - ' + i18n.global.t(this.specifications.notes_t);
      }
    }
    return text;
  }

  fema_cost_code!: string;
  list_order!: number;
  specifications!: {
    hp_t: string;
    notes_t: string;
    capacity_t: string;
    specification_t: string;
  };
  fema_rates!: Record<string, any>;
  is_common!: boolean;
  selected_count!: number;
  name_t!: string;
}
