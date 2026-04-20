<template>
  <div ref="mapContainer" class="h-full w-full" />
</template>

<script lang="ts">
import * as L from 'leaflet';
import { nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  destroyLeafletMap,
  mapTileLayer,
  resetLeafletContainer,
} from '@/utils/map';
import '@/external/Leaflet.GoogleMutant/index';
import { templates } from '@/icons/icons_templates';
import type { LeafletEvent } from 'leaflet';

export default defineComponent({
  name: 'LocationViewer',
  props: {
    location: {
      type: Object,
      default() {
        return {};
      },
    },
    useGoogleMaps: {
      type: Boolean,
    },
    allowReposition: {
      type: Boolean,
      default: true,
    },
    customSvgIcon: {
      type: String,
    },
  },
  emits: ['updatedLocation'],
  setup(props, { emit }) {
    const map = ref<L.Map | null>(null);
    const mapContainer = ref<HTMLElement | null>(null);
    const markerLayer = ref(L.layerGroup());
    const { t } = useI18n();

    function createTileLayer() {
      return L.tileLayer(mapTileLayer, {
        minZoom: 15,
        maxZoom: 15,
      });
    }

    function addMarkerToMap() {
      const svgIcon = L.divIcon({
        className: 'crisiscleanup-map-marker',
        html: props.customSvgIcon || templates.map_marker,
        iconAnchor: [20, 40],
        iconSize: [50, 50],
      });

      const markerLocation = props.location;
      if (
        !markerLocation?.coordinates ||
        markerLocation.coordinates[0] == undefined ||
        markerLocation.coordinates[1] == undefined
      ) {
        return;
      }

      markerLayer.value.clearLayers();
      const marker = new (L.marker as any)(
        [markerLocation.coordinates[1], markerLocation.coordinates[0]],
        { draggable: props.allowReposition, icon: svgIcon },
      );
      marker.addTo(markerLayer.value);
      marker.on('dragend', (event: LeafletEvent) => {
        emit('updatedLocation', event.target.getLatLng());
      });
      map.value?.setView(
        [markerLocation.coordinates[1], markerLocation.coordinates[0]],
        15,
      );
      if (props.allowReposition) {
        marker
          .bindTooltip(t('casesVue.drag_pin_to_correct_location'), {
            direction: 'top',
            offset: L.point({ x: 0, y: -40 }),
          })
          .openTooltip();
      }
    }

    onMounted(() => {
      nextTick(async () => {
        if (!mapContainer.value) return;
        resetLeafletContainer(mapContainer.value);
        // eslint-disable-next-line unicorn/no-array-method-this-argument
        map.value = L.map(mapContainer.value, {
          zoomControl: false,
        }).setView([35.746_512_259_918_5, -96.411_509_631_256_56], 3);
        if (props.useGoogleMaps) {
          L.gridLayer
            .googleMutant({ type: 'roadmap' })
            .addTo(map.value as L.Map);
        } else {
          createTileLayer().addTo(map.value as L.Map);
        }

        markerLayer.value.addTo(map.value as L.Map);
        addMarkerToMap();
      });
    });

    onBeforeUnmount(() => {
      destroyLeafletMap(map.value);
      map.value = null;
    });

    return {
      map,
      mapContainer,
      markerLayer,
      createTileLayer,
      addMarkerToMap,
    };
  },
});
</script>

<style scoped></style>
