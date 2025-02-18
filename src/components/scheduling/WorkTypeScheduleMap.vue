<template>
  <div class="relative w-full h-full">
    <div
      id="appointments-map"
      data-testid="appointmentsMapDiv"
      class="absolute top-0 left-0 right-0 bottom-0"
    />
  </div>
</template>

<script setup lang="ts">
import * as L from 'leaflet';
import { mapTileLayer, mapAttribution } from '@/utils/map';
import type { WorkTypeSchedule } from '@/models/types';
import useWorktypeImages from '@/hooks/worksite/useWorktypeImages';

const props = defineProps({
  schedules: {
    type: Array as PropType<WorkTypeSchedule[]>,
    default: () => [],
  },
});

const emit = defineEmits(['workTypeScheduleClick']);

const map = ref<L.Map | null>(null);
const mapLoading = ref(false);
const { getBasicWorktypeSVG } = useWorktypeImages();

onMounted(() => {
  loadMap();
});

async function loadMap() {
  mapLoading.value = true;
  map.value = L.map('appointments-map', { zoomControl: false }).setView(
    [35.746_512_259_918_5, -96.411_509_631_256_56],
    4,
  );

  L.tileLayer(mapTileLayer, {
    attribution: mapAttribution,
    maxZoom: 18,
  }).addTo(map.value);

  const bounds = L.latLngBounds([]);

  props.schedules.forEach((appt: WorkTypeSchedule) => {
    // Get coordinates or fallback to defaults
    const coords = appt.worksite_location?.coordinates || [-96.4, 35.7];
    const latLng = L.latLng(coords[1], coords[0]);

    // Use nested work types if available, otherwise fallback to legacy work_type_key
    let workTypeKey = appt.work_type_key;
    if (appt.worksite_work_types && appt.worksite_work_types.length > 0) {
      workTypeKey = appt.worksite_work_types[0].work_type_key;
    }

    const markerSvg = getBasicWorktypeSVG(workTypeKey, 35);
    const divIcon = L.divIcon({
      className: 'leaflet-data-marker',
      html: markerSvg,
      iconAnchor: [12, 32],
      iconSize: [30, 30],
      popupAnchor: [0, -28],
    });

    const marker = L.marker(latLng, { icon: divIcon }).addTo(map.value);

    marker.on('click', () => {
      emit('workTypeScheduleClick', appt);
    });

    bounds.extend(latLng);
  });

  if (props.schedules.length > 0) {
    map.value.fitBounds(bounds, { padding: [50, 50] });
  }

  map.value.attributionControl.setPosition('bottomright');

  await nextTick(() => {
    map.value?.panBy([1, 0]);
  });

  mapLoading.value = false;
}
</script>

<style scoped>
.leaflet-data-marker svg {
  width: 20px;
  height: 20px;
}
</style>
