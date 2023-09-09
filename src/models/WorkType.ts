import CCUModel from '@/models/base';

export default class WorkType extends CCUModel {
  static entity = 'work_types';

  work_type!: string;
  claimed_by!: number;
  phase!: number;
  status!: string;
  recur!: string;
  next_recur_at!: Date | undefined;

  static fields() {
    return {
      id: this.attr(null),
      work_type: this.string(''),
      claimed_by: this.number(null),
      phase: this.number(null),
      status: this.string(''),
      recur: this.string(''),
      next_recur_at: this.attr(null),
    };
  }
}
