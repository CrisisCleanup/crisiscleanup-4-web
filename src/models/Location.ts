import LocationType from './LocationType';
import CCUModel from '@/models/base';

export default class Location extends CCUModel {
  static entity = 'locations';

  id!: string;
  type!: string;
  name!: string;
  notes!: string;
  shared!: string;
  geom!: string | undefined;
  poly!: string | undefined;
  attr!: Record<string, any>;
  point!: string | undefined;
  joins!: string;

  static fields() {
    return {
      id: this.attr(''),
      name: this.string(''),
      notes: this.string(''),
      shared: this.string('shared'),
      type: this.attr(null),
      geom: this.attr(null),
      poly: this.attr(null),
      attr: this.attr(null),
      point: this.attr(null),
      joins: this.attr(null),
    };
  }

  get location_type() {
    return LocationType.find(this.type);
  }

  static apiConfig = {
    actions: {
      fetchById(id: string) {
        return this.get(`/locations/${id}`);
      },
      download(id: string) {
        return this.request({
          url: `/locations/${id}/download`,
          method: 'GET',
          responseType: 'blob',
          save: false,
        });
      },
    } as any,
  };
}
