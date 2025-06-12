import * as L from 'leaflet';
import type { Container } from 'pixi.js';
import type { LatLng, HeatLayer } from 'leaflet';
import { getMarkerLayer } from '../../utils/map';
import { getErrorMessage } from '@/utils/errors';
import type { LayerGroup, PixiLayer } from '@/utils/types/map';

export interface MapLayersUtils {
  removeLayer: (key: string) => void;
  getPixiContainer: () => Container | undefined;
  getCurrentMarkerLayer: () => (L.Layer & PixiLayer) | undefined;
  addHeatMap: (points: LatLng[]) => void;
  removeHeatMap: () => void;
  hideMarkers: () => void;
  showMarkers: () => void;
  removeLocationLayers: () => void;
}

export default function useMapLayers(map: L.Map): MapLayersUtils {
  const removeLayer = (key: string) => {
    map.eachLayer((layer) => {
      if ((layer as L.Layer & PixiLayer).key === key) {
        map.removeLayer(layer);
        try {
          if ('destroy' in layer && typeof layer.destroy === 'function') {
            layer.destroy();
          }
        } catch (error) {
          console.error('Error destroying map layer', layer, error);
          getErrorMessage(error);
        }
      }
    });
  };

  const getPixiContainer = (): Container | undefined => {
    let container: Container | undefined = undefined;
    map.eachLayer((layer) => {
      if ((layer as L.Layer & PixiLayer).key === 'marker_layer') {
        container = (layer as L.Layer & PixiLayer)._pixiContainer;
      }
    });
    return container;
  };

  const getCurrentMarkerLayer = (): (L.Layer & PixiLayer) | undefined => {
    let l: (L.Layer & PixiLayer) | undefined = undefined;
    map.eachLayer((layer) => {
      if ((layer as L.Layer & PixiLayer).key === 'marker_layer') {
        l = layer as L.Layer & PixiLayer;
      }
    });
    return l;
  };

  const addHeatMap = (points: LatLng[]) => {
    const heatLayer = L.heatLayer(points, {
      radius: 35,
    }).addTo(map);
    (heatLayer as HeatLayer & PixiLayer).key = 'heat_layer';
  };

  const removeHeatMap = () => {
    removeLayer('heat_layer');
  };

  const hideMarkers = () => {
    const currentMarkerLayer = getCurrentMarkerLayer();
    if (currentMarkerLayer) {
      currentMarkerLayer._pixiContainer.visible = false;
      map.panBy([1, 0]);
    }
  };

  const showMarkers = () => {
    const currentMarkerLayer = getCurrentMarkerLayer();
    if (currentMarkerLayer) {
      currentMarkerLayer._pixiContainer.visible = true;
      map.panBy([1, 0]);
    }
  };

  const removeLocationLayers = () => {
    map.eachLayer((layer) => {
      if ((layer as L.Layer & PixiLayer).location_id) {
        map.removeLayer(layer);
      }
    });
  };

  return {
    removeLayer,
    getPixiContainer,
    getCurrentMarkerLayer,
    addHeatMap,
    removeHeatMap,
    hideMarkers,
    showMarkers,
    removeLocationLayers,
  };
}
