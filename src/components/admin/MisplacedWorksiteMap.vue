<template>
  <div>
    <div ref="mapElement" class="h-80 w-full" data-testid="testMisplacedMap" />
    <div
      class="mt-1 text-xs text-crisiscleanup-grey-700"
      data-testid="testMisplacedNearbyCount"
    >
      <template v-if="nearbyFailed">
        {{ $t('~~Could not load nearby cases.') }}
      </template>
      <template v-else-if="nearbyCount === undefined">
        {{ $t('~~Loading nearby cases...') }}
      </template>
      <template v-else>
        {{
          $t('~~{count} other cases in this incident within {km} km', {
            count: nearbyCount,
            km: NEARBY_METERS / 1000,
          })
        }}
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import * as L from 'leaflet';
import Incident from '@/models/Incident';
import { mapAttribution, mapTileLayer } from '@/utils/map';

/**
 * One incident around a worksite, at a fixed zoom, for comparison: the
 * incident area and the incident's other cases nearby. A case alone in an
 * area is probably in the wrong incident.
 */
const props = defineProps<{
  incidentId: number;
  worksiteId: number;
  latitude: number;
  longitude: number;
}>();

const ZOOM = 12;
const NEARBY_METERS = 15_000;
const mapElement = ref<HTMLElement>();
const nearbyCount = ref<number>();
const nearbyFailed = ref(false);
let map: L.Map | undefined;
let marker: L.Marker | undefined;
let boundaryLayer: L.GeoJSON | undefined;
let nearbyLayer: L.LayerGroup | undefined;

function center() {
  map?.setView([props.latitude, props.longitude], ZOOM, { animate: false });
}

function showPin() {
  if (!map) return;
  marker?.remove();
  marker = L.marker([props.latitude, props.longitude], {
    zIndexOffset: 1000,
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
  // A newer worksite may be selected while this one loads.
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

/** The incident's other cases nearest the worksite. */
async function showNearby() {
  nearbyLayer?.remove();
  nearbyLayer = undefined;
  nearbyCount.value = undefined;
  const key = `${props.incidentId}:${props.worksiteId}`;
  // The Work page map's endpoint, limited to cases near the worksite.
  const { data } = await axios.get<{
    results: { id: number; location?: { coordinates?: number[] } }[];
  }>(`${import.meta.env.VITE_APP_API_BASE_URL}/worksites_all`, {
    params: {
      incident: props.incidentId,
      center_coordinates: `${props.longitude},${props.latitude},${NEARBY_METERS}`,
    },
  });
  if (!map || key !== `${props.incidentId}:${props.worksiteId}`) return;
  const others = data.results.filter(
    (worksite) =>
      worksite.id !== props.worksiteId && worksite.location?.coordinates,
  );
  nearbyLayer = L.layerGroup(
    others.map((worksite) => {
      const [lng, lat] = worksite.location!.coordinates!;
      return L.circleMarker([lat, lng], {
        radius: 4,
        color: '#ffffff',
        weight: 1,
        fillColor: '#4b5563',
        fillOpacity: 0.85,
        interactive: false,
      });
    }),
  ).addTo(map);
  nearbyCount.value = others.length;
}

function showWorksite() {
  showPin();
  nearbyFailed.value = false;
  showNearby().catch(() => {
    nearbyFailed.value = true;
  });
}

onMounted(() => {
  if (!mapElement.value) return;
  // The page scrolls past the maps; zoom with the buttons.
  map = new L.Map(mapElement.value, { scrollWheelZoom: false });
  L.tileLayer(mapTileLayer, { attribution: mapAttribution }).addTo(map);
  void showBoundaries();
  showWorksite();
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

watch(
  () => [props.incidentId, props.worksiteId, props.latitude, props.longitude],
  showWorksite,
);
watch(() => props.incidentId, showBoundaries);
</script>
