import * as L from 'leaflet';
import {
  mapTileLayer,
  mapAttribution,
  mapTileLayerDark,
} from '../../utils/map';
import { store } from '@/store';
import type { Portal } from '@/models/types';
import '@/external/Leaflet.GoogleMutant/index';

// Add type declarations for Google Maps mutant
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace L {
    namespace gridLayer {
      function googleMutant(options?: {
        type: 'roadmap' | 'satellite';
      }): L.GridLayer;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

const DEFAULT_MAP_BOUNDS = [
  [17.644_022_027_872_726, -122.783_144_702_938_76],
  [50.792_047_064_406_866, -69.872_988_452_938_74],
];

export interface MapInstanceUtils {
  map: L.Map;
  switchTileLayer: () => void;
  getCurrentTileLayer: () => L.Layer | null;
}

export default function useMapInstance(
  mapId: string,
  useGoogleMaps = false,
  mapBounds: any = null,
): MapInstanceUtils {
  const portal = store.getters['enums/portal'] as Portal;

  // Create map instance
  const map = new L.Map(mapId, {
    zoomControl: false,
  }).fitBounds(
    mapBounds || portal.attr.default_map_bounds || DEFAULT_MAP_BOUNDS,
  );

  // Tile layer management
  const mapLayerConfigs = [
    () => {
      // Check if Google Mutant is available
      if (L.gridLayer.googleMutant) {
        return L.gridLayer.googleMutant({ type: 'roadmap' });
      } else {
        console.warn(
          'Google Mutant not available, falling back to default tile layer',
        );
        return L.tileLayer(mapTileLayer, {
          attribution: mapAttribution,
          detectRetina: false,
          maxZoom: 18,
          noWrap: false,
        });
      }
    },
    () => {
      // Check if Google Mutant is available
      if (L.gridLayer.googleMutant) {
        return L.gridLayer.googleMutant({ type: 'satellite' });
      } else {
        console.warn(
          'Google Mutant not available, falling back to default tile layer',
        );
        return L.tileLayer(mapTileLayer, {
          attribution: mapAttribution,
          detectRetina: false,
          maxZoom: 18,
          noWrap: false,
        });
      }
    },
    () =>
      L.tileLayer(mapTileLayer, {
        attribution: mapAttribution,
        detectRetina: false,
        maxZoom: 18,
        noWrap: false,
      }),
    () =>
      L.tileLayer(mapTileLayerDark, {
        attribution: mapAttribution,
        detectRetina: false,
        maxZoom: 18,
        noWrap: false,
      }),
  ];

  let currentLayerIndex = useGoogleMaps ? 0 : 2;
  let currentTileLayer: L.Layer | null = null;

  // Initialize tile layer asynchronously to avoid blocking UI
  setTimeout(() => {
    try {
      currentTileLayer = mapLayerConfigs[currentLayerIndex]().addTo(map);
    } catch (error) {
      console.error('Failed to create initial tile layer:', error);
      // Fallback to basic tile layer
      currentLayerIndex = 2;
      currentTileLayer = mapLayerConfigs[currentLayerIndex]().addTo(map);
    }
  }, 0);

  const switchTileLayer = () => {
    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
    }
    currentLayerIndex = (currentLayerIndex + 1) % mapLayerConfigs.length;
    currentTileLayer = mapLayerConfigs[currentLayerIndex]().addTo(map);
  };

  const getCurrentTileLayer = () => currentTileLayer;

  return {
    map,
    switchTileLayer,
    getCurrentTileLayer,
  };
}
