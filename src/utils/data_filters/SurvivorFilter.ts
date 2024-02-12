import { i18n } from '@/modules/i18n';
import Filter from './Filter';

export default class SurvivorFilter extends Filter {
  packFunction() {
    const packed: Record<any, any> = {};
    if (this.data.member_of_my_organization) {
      packed.member_of_my_organization = this.data.member_of_my_organization;
    }

    return packed;
  }

  getCount() {
    if (!this.data.member_of_my_organization) {
      return 0;
    }

    return 1;
  }

  getFilterLabels() {
    if (!this.data.member_of_my_organization) {
      return {};
    }

    return {
      my_team: i18n.global.t('actions.member_of_my_org'),
    };
  }

  removeField() {
    this.data.member_of_my_organization = false;
    this.data = { ...this.data };
  }
}
