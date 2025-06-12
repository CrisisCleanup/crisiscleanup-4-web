import * as L from 'leaflet';
import type { Sprite } from 'pixi.js';
import type { LatLng } from 'leaflet';
import { getMarkerLayer } from '../../utils/map';
import useRenderedMarkers from './useRenderedMarkers';
import useEmitter from '@/hooks/useEmitter';
import { templates } from '@/icons/icons_templates';
import { i18n } from '@/modules/i18n';
import { store } from '@/store';
import type { LayerGroup, PixiLayer } from '@/utils/types/map';
import type Worksite from '@/models/Worksite';

export interface MapMarkersUtils {
  setupMarkers: (
    worksiteMarkers: Array<Sprite & Worksite>,
    visibleIds: string[],
  ) => { workTypes: Record<string, any>; sprites: any };
  addMarkerToMap: (location: LatLng) => void;
  jumpToCase: (worksite: Worksite | undefined, showPopup: boolean) => void;
  loadMarker: (marker: Sprite & Worksite, index: number) => void;
}

export default function useMapMarkers(
  map: L.Map,
  onMarkerClick: (marker: Sprite & Worksite) => void,
  getPixiContainer: () => any,
  removeLayer: (key: string) => void,
): MapMarkersUtils {
  const addToVisited = (wId: number) =>
    store.commit('worksite/addVisitedWorksite', wId);

  // Setup markers function
  const setupMarkers = (
    worksiteMarkers: Array<Sprite & Worksite>,
    visibleIds: string[],
  ) => {
    // Clean up existing event handlers
    map.off('click');
    map.off('mousemove');

    removeLayer('marker_layer');
    const worksiteLayer = getMarkerLayer([], map, {});
    worksiteLayer.addTo(map);

    const { workTypes, findMarker, renderMarkerSprite } = useRenderedMarkers(
      map,
      worksiteMarkers,
      visibleIds,
    );

    // Click handler - match original logic exactly
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const marker = findMarker(e.latlng);
      if (marker) {
        // Find the actual worksite marker
        const markerToRerender =
          worksiteMarkers.find((m) => m.id.toString() === marker.id) ?? marker;
        if (markerToRerender) {
          // Cast marker to match expected type (same as original)
          onMarkerClick(markerToRerender as any);
          addToVisited(Number(marker.id));

          try {
            renderMarkerSprite(
              markerToRerender as any,
              (markerToRerender as any).index || 0,
            );
          } catch (error) {
            console.error(error);
          }
          map.panBy([1, 0]);
        }
      }
    };

    map.on('click', handleMapClick);

    // Cursor handling - match original logic
    function addCursor(e: L.LeafletMouseEvent) {
      const marker = findMarker(e.latlng);
      const container = (worksiteLayer as any)._container;

      if (marker && container) {
        L.DomUtil.addClass(container, 'cursor-pointer');
        container.setAttribute('title', marker.case_number);
      } else if (container) {
        L.DomUtil.removeClass(container, 'cursor-pointer');
        container.setAttribute('title', '');
      }
    }

    map.on('mousemove', L.Util.throttle(addCursor as any, 32, {}));
    map.panBy([1, 0]);

    return {
      workTypes,
      sprites: getPixiContainer()?.children,
      loadMarker: renderMarkerSprite,
    };
  };

  const addMarkerToMap = async (location: LatLng) => {
    removeLayer('temp_markers');
    const { emitter } = useEmitter();

    let markerLocation = location;
    const container = getPixiContainer();
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

    if (container) {
      container.visible = false;
    }

    map.setView([markerLocation.lat, markerLocation.lng], 15);
    marker
      .bindTooltip(i18n.global.t('casesVue.drag_pin_to_correct_location'), {
        direction: 'top',
        offset: L.point({ x: 0, y: -40 }),
      })
      .openTooltip();

    setTimeout(() => {
      if (container) {
        container.visible = true;
      }
      map.panBy([1, 0]);
    }, 400);
  };

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

  return {
    setupMarkers,
    addMarkerToMap,
    jumpToCase,
    loadMarker: (marker, index) => {}, // Will be set by setupMarkers
  };
}
