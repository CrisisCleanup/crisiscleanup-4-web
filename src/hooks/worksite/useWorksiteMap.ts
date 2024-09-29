import * as L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import type { Sprite, Container } from 'pixi.js';
import type { LatLng, HeatLayer, LeafletMouseEvent } from 'leaflet';
import {
  getMarkerLayer,
  mapTileLayer,
  mapAttribution,
  mapTileLayerDark,
} from '../../utils/map';
import Location from '../../models/Location';
import useRenderedMarkers from './useRenderedMarkers';
import { i18n } from '@/modules/i18n';
import type { LayerGroup, PixiLayer } from '@/utils/types/map';
import type Worksite from '@/models/Worksite';
import useEmitter from '@/hooks/useEmitter';
import '@/external/Leaflet.GoogleMutant/index';
import { templates } from '@/icons/icons_templates';
import { store } from '@/store';
import { getErrorMessage } from '@/utils/errors';
import type { Portal } from '@/models/types';

export interface MapUtils {
  getMap: () => L.Map;
  getPixiContainer: () => Container | undefined;
  getCurrentMarkerLayer: () => (L.Layer & PixiLayer) | undefined;
  removeLayer: (key: string) => void;
  reloadMap: (
    newMarkers: Array<Sprite & Worksite>,
    visibleIds: string[],
  ) => void;
  addMarkerToMap: (location: LatLng) => void;
  fitLocation: (location: Location) => void;
  getLocationCenter: (location: Location) => LatLng | null;
  jumpToCase: (worksite: Worksite | undefined, showPopup: boolean) => void;
  applyLocation: (locationId: string, value: boolean) => void;
  applyTeamGeoJson: (teamId: string, value: boolean, geom: any) => void;
  addHeatMap: (points: LatLng[]) => void;
  removeHeatMap: () => void;
  loadMarker: (marker: Sprite & Worksite, index: number) => void;
  hideMarkers: () => void;
  showMarkers: () => void;
  switchTileLayer: (useGoogleMaps: boolean) => void;
}

const DEFAULT_MAP_BOUNDS = [
  [17.644_022_027_872_726, -122.783_144_702_938_76],
  [50.792_047_064_406_866, -69.872_988_452_938_74],
];
export default (
  markers: Array<Sprite & Worksite>,
  visibleMarkerIds: string[],
  onMarkerClick: (marker: Sprite & Worksite) => void,
  onLoadMarkers: (fn: { workTypes: Record<string, any> }, map: L.Map) => void,
  useGoogleMaps = false,
  mapBounds = null,
) => {
  const addToVisited = (wId: number) =>
    store.commit('worksite/addVisitedWorksite', wId);
  const portal = store.getters['enums/portal'] as Portal;
  let loadMarker: (marker: Sprite & Worksite, index: number) => void = (
    marker,
    index,
  ) => {};

  let currentTileLayer: L.Layer | null = null;

  const map = L.map('map', {
    zoomControl: false,
  }).fitBounds(
    mapBounds || portal.attr.default_map_bounds || DEFAULT_MAP_BOUNDS,
  );
  currentTileLayer = useGoogleMaps
    ? L.gridLayer.googleMutant({ type: 'roadmap' }).addTo(map)
    : L.tileLayer(mapTileLayer, {
        attribution: mapAttribution,
        detectRetina: false,
        maxZoom: 18,
        noWrap: false,
      }).addTo(map);

  // const switchTileLayer = () => {
  //   if (currentTileLayer) {
  //     map.removeLayer(currentTileLayer);
  //   }
  //   usingGoogleMaps = !usingGoogleMaps;
  //   currentTileLayer = usingGoogleMaps
  //     ? L.gridLayer.googleMutant({ type: 'roadmap' }).addTo(map)
  //     : L.tileLayer(mapTileLayer, {
  //         attribution: mapAttribution,
  //         detectRetina: false,
  //         maxZoom: 18,
  //         noWrap: false,
  //       }).addTo(map);
  // };

  // Array to hold different map layer configurations, not instantiated layers
  const mapLayerConfigs = [
    () => L.gridLayer.googleMutant({ type: 'roadmap' }), // Google Roadmap, instantiated when needed
    () => L.gridLayer.googleMutant({ type: 'satellite' }), // Google Satellite
    () =>
      L.tileLayer(mapTileLayer, {
        // Custom tile layer
        attribution: mapAttribution,
        detectRetina: false,
        maxZoom: 18,
        noWrap: false,
      }),
    () =>
      L.tileLayer(mapTileLayerDark, {
        // Dark theme tile layer
        attribution: mapAttribution,
        detectRetina: false,
        maxZoom: 18,
        noWrap: false,
      }),
  ];

  let currentLayerIndex = useGoogleMaps ? 0 : 2;
  const switchTileLayer = () => {
    if (currentTileLayer) {
      map.removeLayer(currentTileLayer); // Remove current layer
    }

    // Increment the index, reset if it goes beyond the array length
    currentLayerIndex = (currentLayerIndex + 1) % mapLayerConfigs.length;

    // Instantiate and add the new layer to the map
    currentTileLayer = mapLayerConfigs[currentLayerIndex]().addTo(map);
  };

  const removeLayer = (key: string) => {
    map.eachLayer((layer) => {
      if ((layer as L.Layer & PixiLayer).key === key) {
        map.removeLayer(layer);
        try {
          layer.destroy();
        } catch (error) {
          console.error('Error destroying map layer', layer, error);
          getErrorMessage(error);
        }
      }
    });
  };

  function setupMap(
    worksiteMarkers: Array<Sprite & Worksite>,
    visibleIds: string[],
  ) {
    removeLayer('marker_layer');
    const worksiteLayer = getMarkerLayer([], map, {});
    worksiteLayer.addTo(map);
    const { workTypes, findMarker, renderMarkerSprite } = useRenderedMarkers(
      map,
      worksiteMarkers,
      visibleIds,
    );
    loadMarker = renderMarkerSprite;
    map.on('click', (e) => {
      const marker = findMarker(e.latlng);
      if (marker) {
        onMarkerClick(marker);
        addToVisited(marker.id);
        const markerToRerender =
          markers.find((m) => m.id === marker.id) ?? marker;
        try {
          renderMarkerSprite(markerToRerender, markerToRerender.index);
        } catch (error) {
          console.error(error);
        }
        map.panBy([1, 0]);
      }
    });

    function addCursor(e: LeafletMouseEvent) {
      const marker = findMarker(e.latlng);
      if (marker) {
        L.DomUtil.addClass(worksiteLayer._container, 'cursor-pointer');
        worksiteLayer._container.setAttribute('title', marker.case_number);
      } else {
        L.DomUtil.removeClass(worksiteLayer._container, 'cursor-pointer');
        worksiteLayer._container.setAttribute('title', '');
      }
    }

    map.on('mousemove', L.Util.throttle(addCursor as any, 32, {}));
    map.panBy([1, 0]);
    return { workTypes, sprites: getPixiContainer()?.children };
  }

  onLoadMarkers(setupMap(markers, visibleMarkerIds), map);
  const reloadMap = (
    newMarkers: Array<Sprite & Worksite>,
    visibleIds: string[],
  ) => {
    if (map) {
      onLoadMarkers(setupMap(newMarkers, visibleIds), map);
    }
  };

  function getMap() {
    return map;
  }

  function getPixiContainer(): Container | undefined {
    let container = null;
    map.eachLayer((layer) => {
      if ((layer as L.Layer & PixiLayer).key === 'marker_layer') {
        container = (layer as L.Layer & PixiLayer)._pixiContainer;
      }
    });
    return container;
  }

  function getCurrentMarkerLayer(): (L.Layer & PixiLayer) | undefined {
    let l: (L.Layer & PixiLayer) | undefined = null;
    map.eachLayer((layer) => {
      if ((layer as L.Layer & PixiLayer).key === 'marker_layer') {
        l = layer as L.Layer & PixiLayer;
      }
    });
    return l;
  }

  async function addMarkerToMap(location: LatLng) {
    removeLayer('temp_markers');
    const { emitter } = useEmitter();

    let markerLocation = location;
    const container = getPixiContainer() as any;
    if (!markerLocation) {
      markerLocation = map.getCenter();
    }

    const markerGroup = L.layerGroup() as LayerGroup & L.LayerGroup;
    markerGroup.key = 'temp_markers';

    const svgIcon = L.divIcon({
      className: 'crisiscleanup-map-marker',
      html: templates.map_marker,
      iconAnchor: [20, 40],
      iconSize: [50, 50],
    });

    const marker: L.Marker = L.marker(markerLocation, {
      icon: svgIcon,
      draggable: true,
    });
    markerGroup.addTo(map);
    markerGroup.addLayer(marker);

    marker.on('dragend', function (event) {
      emitter.emit('updatedWorksiteLocation', event.target.getLatLng());
    });

    container.visible = false;
    map.setView([markerLocation.lat, markerLocation.lng], 15);
    marker
      .bindTooltip(i18n.global.t('casesVue.drag_pin_to_correct_location'), {
        direction: 'top',
        offset: L.point({ x: 0, y: -40 }),
      })
      .openTooltip();
    setTimeout(() => {
      container.visible = true;
      map.panBy([1, 0]);
    }, 400);
  }

  function fitLocation(location: Location) {
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
  }

  function getLocationCenter(location) {
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
    const center = layer.getBounds().getCenter();

    return center;
  }

  const jumpToCase = async (
    worksite: Worksite | undefined,
    showPopup = true,
  ) => {
    const container = getPixiContainer();
    if (map && worksite && container) {
      container.visible = false;
      map.setView([worksite.latitude, worksite.longitude], 18);
      addToVisited(worksite.id as number);
      if (showPopup) {
        const popup = L.popup({ className: 'pixi-popup' });
        popup
          .setLatLng([worksite.latitude, worksite.longitude])
          .setContent(`<b>${worksite.name} (${worksite.case_number}</b>)`)
          .openOn(map);
        setTimeout(() => {
          map.closePopup();
        }, 5000);
      }

      setTimeout(() => {
        container.visible = true;
        map.panBy([1, 0]);
      }, 400);
    }
  };

  async function applyLocation(locationId: string, value: boolean) {
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
  }

  async function applyTeamGeoJson(teamId: string, value: boolean, geom: any) {
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
  }

  function addHeatMap(points: LatLng[]) {
    // eslint-disable-next-line import/namespace
    const heatLayer = L.heatLayer(points, {
      radius: 35,
    }).addTo(map);
    (heatLayer as HeatLayer & PixiLayer).key = 'heat_layer';
  }

  function removeHeatMap() {
    removeLayer('heat_layer');
  }

  function hideMarkers() {
    const currentMarkerLayer = getCurrentMarkerLayer();
    if (currentMarkerLayer) {
      currentMarkerLayer._pixiContainer.visible = false;
      map.panBy([1, 0]);
    }
  }

  function showMarkers() {
    const currentMarkerLayer = getCurrentMarkerLayer();
    if (currentMarkerLayer) {
      currentMarkerLayer._pixiContainer.visible = true;
      map.panBy([1, 0]);
    }
  }

  const mapUtils: MapUtils = {
    getMap,
    getPixiContainer,
    getCurrentMarkerLayer,
    removeLayer,
    reloadMap,
    addMarkerToMap,
    fitLocation,
    getLocationCenter,
    jumpToCase,
    applyLocation,
    applyTeamGeoJson,
    addHeatMap,
    removeHeatMap,
    loadMarker,
    hideMarkers,
    showMarkers,
    switchTileLayer,
  };
  return mapUtils;
};
