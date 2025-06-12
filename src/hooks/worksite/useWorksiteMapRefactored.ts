import type { Sprite } from 'pixi.js';
import type { LatLng } from 'leaflet';
import useMapInstance, { type MapInstanceUtils } from './useMapInstance';
import useMapLayers, { type MapLayersUtils } from './useMapLayers';
import useMapMarkers, { type MapMarkersUtils } from './useMapMarkers';
import useMapLocations, { type MapLocationsUtils } from './useMapLocations';
import type Worksite from '@/models/Worksite';
import type Location from '@/models/Location';

export interface MapUtils
  extends Omit<MapInstanceUtils, 'map'>,
    MapLayersUtils,
    Omit<MapMarkersUtils, 'setupMarkers'>,
    MapLocationsUtils {
  getMap: () => L.Map;
  reloadMap: (
    newMarkers: Array<Sprite & Worksite>,
    visibleIds: string[],
  ) => void;
}

export default function useWorksiteMap(
  markers: Array<Sprite & Worksite>,
  visibleMarkerIds: string[],
  onMarkerClick: (marker: Sprite & Worksite) => void,
  onLoadMarkers: (fn: { workTypes: Record<string, any> }, map: L.Map) => void,
  useGoogleMaps = false,
  mapBounds = null,
  mapId = 'map',
): MapUtils {
  // Initialize map instance
  const { map, switchTileLayer, getCurrentTileLayer } = useMapInstance(
    mapId,
    useGoogleMaps,
    mapBounds,
  );

  // Initialize layer management
  const layerUtils = useMapLayers(map);

  // Initialize marker management
  const markerUtils = useMapMarkers(
    map,
    onMarkerClick,
    layerUtils.getPixiContainer,
    layerUtils.removeLayer,
  );

  // Initialize location management
  const locationUtils = useMapLocations(map);

  // Reload function for updating markers
  const reloadMap = (
    newMarkers: Array<Sprite & Worksite>,
    visibleIds: string[],
  ) => {
    if (map) {
      const result = markerUtils.setupMarkers(newMarkers, visibleIds);
      onLoadMarkers(result, map);
    }
  };

  // Initialize markers on first load - defer to next tick to avoid blocking UI
  // Also provide immediate feedback with empty result to prevent blocking
  onLoadMarkers({ workTypes: {} }, map);

  setTimeout(() => {
    const result = markerUtils.setupMarkers(markers, visibleMarkerIds);
    onLoadMarkers(result, map);
  }, 0);

  // Get map function
  const getMap = () => map;

  // Return composed utilities
  return {
    getMap,
    switchTileLayer,
    getCurrentTileLayer,
    ...layerUtils,
    ...markerUtils,
    ...locationUtils,
    reloadMap,
  };
}
