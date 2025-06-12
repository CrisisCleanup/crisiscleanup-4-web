import * as L from 'leaflet';
import Location from '../../models/Location';
import type { PixiLayer } from '@/utils/types/map';

export interface MapLocationsUtils {
  fitLocation: (location: Location) => void;
  getLocationCenter: (location: Location) => L.LatLng | null;
  applyLocation: (locationId: string, value: boolean) => Promise<void>;
  applyTeamGeoJson: (
    teamId: string,
    value: boolean,
    geom: any,
  ) => Promise<void>;
}

export default function useMapLocations(map: L.Map): MapLocationsUtils {
  const fitLocation = (location: Location) => {
    if (map) {
      const geojsonFeature = {
        type: 'Feature',
        properties: location.attr,
        geometry: location.poly || location.geom || location.point,
      } as any;

      const polygon = L.geoJSON(geojsonFeature, {
        weight: '1',
        onEachFeature(_: never, layer: L.Layer & PixiLayer) {
          layer.location_id = location.id;
        },
      } as any);

      map.fitBounds(polygon.getBounds());
    }
  };

  const getLocationCenter = (location: Location): L.LatLng | null => {
    if (!location) {
      return null;
    }

    // Create a geojson feature from the location
    const geojsonFeature = {
      type: 'Feature',
      properties: location.attr,
      geometry: location.poly || location.geom || location.point,
    } as any;

    // Convert the geojson feature to a Leaflet layer
    const layer = L.geoJSON(geojsonFeature);

    // Get the center of the layer's bounds
    return layer.getBounds().getCenter();
  };

  const applyLocation = async (locationId: string, value: boolean) => {
    if (value && map) {
      await Location.api().fetchById(locationId);
      const location = Location.find(locationId) as any;

      const geojsonFeature = {
        type: 'Feature',
        properties: location?.attr,
        geometry: location?.poly || location?.geom || location?.point,
      } as any;

      const polygon = L.geoJSON(geojsonFeature, {
        weight: '1',
        onEachFeature(_: never, layer: L.Layer & PixiLayer) {
          layer.location_id = locationId;
        },
      } as any);

      polygon.addTo(map);
      map.fitBounds(polygon.getBounds());
    } else {
      map.eachLayer((layer) => {
        if (
          (layer as L.Layer & PixiLayer).location_id &&
          (layer as L.Layer & PixiLayer).location_id === locationId
        ) {
          map.removeLayer(layer);
        }
      });
    }
  };

  const applyTeamGeoJson = async (
    teamId: string,
    value: boolean,
    geom: any,
  ) => {
    if (value && map) {
      const geojsonFeature = {
        type: 'Feature',
        properties: {},
        geometry: geom,
      } as any;

      const polygon = L.geoJSON(geojsonFeature, {
        weight: '1',
        onEachFeature(_: never, layer: L.Layer & PixiLayer) {
          layer.location_id = teamId;
        },
      } as any);

      polygon.addTo(map);
      map.fitBounds(polygon.getBounds());
    } else {
      map.eachLayer((layer) => {
        if (
          (layer as L.Layer & PixiLayer).location_id &&
          (layer as L.Layer & PixiLayer).location_id === teamId
        ) {
          map.removeLayer(layer);
        }
      });
    }
  };

  return {
    fitLocation,
    getLocationCenter,
    applyLocation,
    applyTeamGeoJson,
  };
}
