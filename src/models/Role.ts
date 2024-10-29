import CCUModel from '@/models/base';

export default class Role extends CCUModel {
  static entity = 'roles';
  static adminRoleId = 1;
  static phoneAgentRoleId = 7;

  id!: number;
  name_t!: string;
  description_t!: string;
  is_active!: boolean;
  permissions!: Record<string, unknown>;
  is_default!: boolean;
  level!: number;
  list_order!: number;
  is_public!: boolean;
  history!: any;

  get isPhoneAgentRole() {
    return this.id === Role.phoneAgentRoleId;
  }

  static fields() {
    return {
      id: this.attr(''),
      name_t: this.string(''),
      description_t: this.string(''),
      level: this.attr(null),
      is_default: this.attr(null),
    };
  }
}
