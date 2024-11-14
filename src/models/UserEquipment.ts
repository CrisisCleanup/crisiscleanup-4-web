import CCUModel from '@/models/base';

export default class UserEquipment extends CCUModel {
  static entity = 'user_equipment';

  id!: number;
  equipment!: number;
  user!: number;

  static fields() {
    return {
      id: this.attr(''),
      equipment: this.attr(null),
      user: this.attr(null),
      created_at: this.attr(null),
      updated_at: this.attr(null),
    };
  }
}
