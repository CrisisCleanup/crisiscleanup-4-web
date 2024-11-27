<script setup lang="ts">
import SimpleMap from '@/components/SimpleMap.vue';

import axios from 'axios';
import * as L from 'leaflet';
import type { PixiLayer } from '@/utils/types/map';
import { mapAttribution, mapTileLayer } from '@/utils/map';

const props = defineProps<{
  location: string;
}>();

const currentLocation = ref<any>(null);
const map = ref<L.Map | null>(null);

const getLocation = async () => {
  const { data } = await axios.get(`locations/${props.location}`);
  currentLocation.value = data;
};

async function applyLocation() {
  const location = currentLocation.value;
  const geojsonFeature = {
    type: 'Feature',
    properties: location?.attr,
    geometry: location?.poly || location?.geom || location?.point,
  } as any;
  const polygon = L.geoJSON(geojsonFeature, {
    weight: '1',
    onEachFeature(_: never, layer: L.Layer & PixiLayer) {
      layer.location_id = props.location;
    },
  } as any);
  polygon.addTo(map.value);
  map.value.fitBounds(polygon.getBounds());
}
onMounted(async () => {
  map.value = new L.Map('map', {
    zoomControl: false,
  }).setView([35.746_512_259_918_5, -96.411_509_631_256_56], 3);

  L.tileLayer(mapTileLayer, {
    attribution: mapAttribution,
    detectRetina: false,
    maxZoom: 18,
    noWrap: false,
  }).addTo(map.value);
  await getLocation();
  await applyLocation();
});
</script>

<template>
  <div class="relative">
    <SimpleMap />
  </div>
</template>

<style scoped></style>
