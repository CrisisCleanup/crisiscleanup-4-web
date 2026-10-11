<template>
  <div
    ref="mapElement"
    class="h-48 w-full shrink-0"
    data-testid="testVoiceReviewMiniMap"
  />
</template>

<script setup lang="ts">
import * as L from 'leaflet';
import useEmitter from '@/hooks/useEmitter';
import { mapAttribution, mapTileLayer } from '@/utils/map';

/**
 * The case pin next to the auditor's case form, on the disaster area.
 * Dragging the pin sends `updatedWorksiteLocation`; `WorksiteForm` listens
 * for it and updates the case location, as on the Work page map.
 */
const props = defineProps<{
  /** [longitude, latitude], as the case stores it. */
  coordinates?: number[];
  /** GeoJSON geometries of the disaster area. */
  boundaries?: object[];
}>();

const { emitter } = useEmitter();
const mapElement = ref<HTMLElement>();
let map: L.Map | undefined;
let marker: L.Marker | undefined;
let boundaryLayer: L.GeoJSON | undefined;

function showPin() {
  if (!map) return;
  const [lng, lat] = props.coordinates ?? [];
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    marker?.remove();
    marker = undefined;
    return;
  }
  if (marker) {
    marker.setLatLng([lat, lng]);
    map.panTo([lat, lng], { animate: false });
  } else {
    marker = L.marker([lat, lng], {
      draggable: true,
      icon: L.divIcon({
        className: 'crisiscleanup-map-marker',
        html: '<div class="h-4 w-4 rounded-full border-2 border-white bg-crisiscleanup-red-700 shadow"></div>',
        iconAnchor: [8, 8],
      }),
    }).addTo(map);
    marker.on('dragend', (event: L.DragEndEvent) => {
      emitter.emit(
        'updatedWorksiteLocation',
        (event.target as L.Marker).getLatLng(),
      );
    });
    map.setView([lat, lng], 15, { animate: false });
  }
}

function showBoundaries() {
  if (!map) return;
  boundaryLayer?.remove();
  const features = (props.boundaries ?? []).map((geometry: object) => ({
    type: 'Feature' as const,
    properties: {},
    geometry,
  }));
  if (features.length === 0) return;
  boundaryLayer = L.geoJSON(features as never, {
    style: { color: '#2f80ed', weight: 2, fillOpacity: 0.05 },
    interactive: false,
  }).addTo(map);
  if (!marker) map.fitBounds(boundaryLayer.getBounds(), { animate: false });
}

onMounted(() => {
  if (!mapElement.value) return;
  map = new L.Map(mapElement.value, { zoomControl: true }).setView(
    [39, -96],
    4,
  );
  L.tileLayer(mapTileLayer, { attribution: mapAttribution }).addTo(map);
  showBoundaries();
  showPin();
});

// The review layout settles after the map starts; Leaflet must measure again.
useResizeObserver(mapElement, () => {
  map?.invalidateSize();
  if (marker) map?.panTo(marker.getLatLng(), { animate: false });
});

onBeforeUnmount(() => {
  map?.remove();
  map = undefined;
});

watch(() => props.coordinates, showPin, { deep: true });
watch(() => props.boundaries, showBoundaries);
</script>
