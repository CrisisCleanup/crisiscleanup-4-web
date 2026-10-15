import * as L from 'leaflet';
import type { Sprite, Container } from 'pixi.js';
import type { LatLng } from 'leaflet';
import { throttle } from 'lodash';
import { getMarkerLayer } from '../../utils/map';
import useRenderedMarkers, { type MapMarkerSprite } from './useRenderedMarkers';
import useEmitter from '@/hooks/useEmitter';
import { templates } from '@/icons/icons_templates';
import { i18n } from '@/modules/i18n';
import { store } from '@/store';
import type { LayerGroup, MarkerLayer } from '@/utils/types/map';
import type Worksite from '@/models/Worksite';

export interface MapMarkersUtils {
  setupMarkers: (
    worksiteMarkers: Array<Sprite & Worksite>,
    visibleIds: string[],
  ) => { workTypes: Record<string, boolean>; sprites: MapMarkerSprite[] };
  getMarkerSprites: () => MapMarkerSprite[];
  addMarkerToMap: (location: LatLng) => void;
  jumpToCase: (worksite: Worksite | undefined, showPopup: boolean) => void;
  loadMarker: (marker: Sprite & Worksite, index: number) => void;
}

export default function useMapMarkers(
  map: L.Map,
  onMarkerClick: (marker: Sprite & Worksite) => void,
  getPixiContainer: () => Container | undefined,
  removeLayer: (key: string) => void,
): MapMarkersUtils {
  const addToVisited = (wId: number) =>
    store.commit('worksite/addVisitedWorksite', wId);

  let worksiteLayer: MarkerLayer | undefined;
  let renderer: ReturnType<typeof useRenderedMarkers> | undefined;
  let casesById = new Map<string, Sprite & Worksite>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let disposed = false;

  const later = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!disposed) callback();
    }, delay);
    timers.add(timer);
  };
  map.once('unload', () => {
    disposed = true;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    addCursor.cancel();
  });

  const handleMapClick = (event: L.LeafletMouseEvent) => {
    const marker = renderer?.findMarker(event.latlng);
    if (!marker) return;
    const worksite = casesById.get(marker.id);
    if (!worksite) return;
    onMarkerClick(worksite);
    addToVisited(Number(marker.id));
    renderer?.renderMarkerSprite(worksite, 0);
  };

  let hoveredId: string | undefined;
  const addCursor = throttle((event: L.LeafletMouseEvent) => {
    const marker = renderer?.findMarker(event.latlng);
    const overlay = (
      worksiteLayer as (MarkerLayer & { _container?: HTMLElement }) | undefined
    )?._container;
    if (!overlay || hoveredId === marker?.id) return;
    hoveredId = marker?.id;
    overlay.classList.toggle('cursor-pointer', Boolean(marker));
    overlay.title = marker?.case_number || '';
  }, 32);

  const setupMarkers = (
    worksiteMarkers: Array<Sprite & Worksite>,
    visibleIds: string[],
  ) => {
    if (disposed) return { workTypes: {}, sprites: [] };
    casesById = new Map(
      worksiteMarkers.map((marker) => [String(marker.id), marker]),
    );
    if (renderer) {
      renderer.updateMarkers(worksiteMarkers, visibleIds);
    } else {
      worksiteLayer = getMarkerLayer([], map, {});
      worksiteLayer.addTo(map);
      renderer = useRenderedMarkers(map, worksiteMarkers, visibleIds);
      map.on('click', handleMapClick);
      map.on('mousemove', addCursor);
      worksiteLayer.once('remove', () => {
        map.off('click', handleMapClick);
        map.off('mousemove', addCursor);
        addCursor.cancel();
        renderer = undefined;
        worksiteLayer = undefined;
        casesById.clear();
      });
    }
    hoveredId = undefined;
    const overlay = (
      worksiteLayer as MarkerLayer & { _container?: HTMLElement }
    )._container;
    overlay?.classList.remove('cursor-pointer');
    if (overlay) overlay.title = '';
    return { workTypes: renderer.workTypes, sprites: renderer.sprites };
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

    later(() => {
      if (container) {
        container.visible = true;
      }
      worksiteLayer?.requestRedraw();
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
      addToVisited(Number(worksite.id));
      const marker = casesById.get(String(worksite.id));
      if (marker) renderer?.renderMarkerSprite(marker, 0);

      if (showPopup) {
        const popup = L.popup({ className: 'pixi-popup' });
        popup
          .setLatLng([worksite.latitude, worksite.longitude])
          .setContent(`<b>${worksite.name} (${worksite.case_number}</b>)`)
          .openOn(map);
        later(() => {
          map.closePopup();
        }, 5000);
      }

      later(() => {
        container.visible = true;
        worksiteLayer?.requestRedraw();
      }, 400);
    }
  };

  return {
    setupMarkers,
    getMarkerSprites: () => renderer?.sprites || [],
    addMarkerToMap,
    jumpToCase,
    loadMarker: (marker, index) => {
      casesById.set(String(marker.id), marker);
      renderer?.renderMarkerSprite(marker, index);
    },
  };
}
