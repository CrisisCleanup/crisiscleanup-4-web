<template>
  <div ref="mapElement" class="h-80 w-full" data-testid="testMisplacedMap" />
</template>

<script setup lang="ts">
import * as L from 'leaflet';
import Incident from '@/models/Incident';
import { mapAttribution, mapTileLayer } from '@/utils/map';

/** One incident's area around a worksite, at a fixed zoom, for comparison. */
const props = defineProps<{
  incidentId: number;
  latitude: number;
  longitude: number;
}>();

const ZOOM = 12;
const mapElement = ref<HTMLElement>();
let map: L.Map | undefined;
let marker: L.Marker | undefined;
let boundaryLayer: L.GeoJSON | undefined;

function center() {
  map?.setView([props.latitude, props.longitude], ZOOM, { animate: false });
}

function showPin() {
  if (!map) return;
  marker?.remove();
  marker = L.marker([props.latitude, props.longitude], {
    icon: L.divIcon({
      className: 'crisiscleanup-map-marker',
      html: '<div class="h-4 w-4 rounded-full border-2 border-white bg-crisiscleanup-red-700 shadow"></div>',
      iconAnchor: [8, 8],
    }),
  }).addTo(map);
  center();
}

async function showBoundaries() {
  boundaryLayer?.remove();
  boundaryLayer = undefined;
  const incidentId = props.incidentId;
  await Incident.api().fetchById(String(incidentId));
  // A newer row may be selected while this one loads.
  if (!map || incidentId !== props.incidentId) return;
  const incident = Incident.find(String(incidentId)) as
    | { locationModels?: { poly?: object; geom?: object }[] }
    | undefined;
  const features = (incident?.locationModels ?? []).flatMap((location) => {
    const geometry = location.poly ?? location.geom;
    return geometry ? [{ type: 'Feature', properties: {}, geometry }] : [];
  });
  boundaryLayer = L.geoJSON(features as never, {
    style: { color: '#2f80ed', weight: 2, fillOpacity: 0.08 },
    interactive: false,
  }).addTo(map);
}

onMounted(() => {
  if (!mapElement.value) return;
  map = new L.Map(mapElement.value);
  L.tileLayer(mapTileLayer, { attribution: mapAttribution }).addTo(map);
  showPin();
  void showBoundaries();
});

// The layout can settle after the map starts; Leaflet must measure again.
useResizeObserver(mapElement, () => {
  map?.invalidateSize();
  center();
});

onBeforeUnmount(() => {
  map?.remove();
  map = undefined;
});

watch(() => [props.latitude, props.longitude], showPin);
watch(() => props.incidentId, showBoundaries);
</script>
