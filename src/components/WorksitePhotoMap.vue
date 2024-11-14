<template>
  <div id="photoMap" class="absolute top-0 left-0 right-0 bottom-0"></div>
</template>

<script lang="ts">
import { onMounted, defineComponent } from 'vue';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// eslint-disable-next-line import/no-unresolved
import { api as viewerApi } from 'v-viewer';
import { mapTileLayer } from '@/utils/map';

interface DataType {
  id: number;
  case_number: string;
  name: string;
  updated_at: string;
  created_at: string;
  svi: number;
  images: ImageType[];
  location: LocationType;
}

interface ImageType {
  filename: string;
  url: string;
  large_url: string;
}

interface LocationType {
  type: string;
  coordinates: number[];
}

const ICON_SIZE = 75;

const MAX_ZOOM = 19;
export default defineComponent({
  name: 'WorksitePhotoMap',
  props: {
    caseImages: {
      type: Array<DataType>,
      required: true,
    },
  },
  emits: ['loadCase'],
  setup(props, { emit }) {
    const map = ref();
    const jumpToLocation = (lat: number, lng: number) => {
      map.value.setView([lat, lng], MAX_ZOOM);
    };
    onMounted(() => {
      map.value = L.map('photoMap', {
        zoomControl: true,
      }).setView([35.746_512_259_918_5, -96.411_509_631_256_56], 3);
      L.tileLayer(mapTileLayer, {
        maxZoom: MAX_ZOOM,
      }).addTo(map.value);

      // Create a marker cluster group
      const markers = L.markerClusterGroup({
        zoomToBoundsOnClick: true,
        spiderfyDistanceMultiplier: 2,
        animate: true,
        animateAddingMarkers: true,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: false,

        iconCreateFunction: (cluster) => {
          const children = cluster.getAllChildMarkers();

          const randomChild =
            children[Math.floor(Math.random() * children.length)];

          const imageUrl = randomChild.options.icon.options.iconUrl;

          return new L.DivIcon({
            html: `
                <div style="position: relative;">
                    <img src="${imageUrl}" alt="Cluster Image" style="width: ${ICON_SIZE}px; height: ${ICON_SIZE}px; border: solid 4px white; border-radius: 10%">
                    <span style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: white; padding: 2px 5px; border-radius: 60%; font-size: 10px;">${cluster.getChildCount()}</span>
                </div>
            `,
            className: 'custom-cluster-icon',
            iconSize: L.point(ICON_SIZE, ICON_SIZE),
          });
        },
      });

      const flattenImageArray = (
        dataList: DataType[],
      ): Array<Omit<DataType, 'images'> & ImageType> => {
        const flattened: Array<Omit<DataType, 'images'> & ImageType> = [];

        for (const data of dataList) {
          for (const image of data.images) {
            let items = {
              ...data,
              filename: image.filename,
              url: image.url,
              large_url: image.large_url,
              images: undefined,
            };
            flattened.push(items);
          }
        }

        return flattened;
      };

      const markersData = flattenImageArray(props.caseImages).map(
        (caseImage) => {
          return {
            imageUrl: caseImage.url,
            lat: caseImage.location.coordinates[1],
            lng: caseImage.location.coordinates[0],
            ...caseImage,
          };
        },
      );

      for (const data of markersData) {
        const icon = L.icon({
          iconUrl: data.imageUrl,
          iconSize: [ICON_SIZE, ICON_SIZE],
          ...data,
        });

        const marker = L.marker([data.lat, data.lng], { icon: icon });
        markers.addLayer(marker);
      }

      // Add the marker cluster group to the map
      map.value.addLayer(markers);

      function loadImagesAndCase(markersInCluster) {
        const images = markersInCluster.map((marker) => {
          return {
            src: marker.options.icon.options.url,
            'data-source': marker.options.icon.options.large_url,
          };
        });

        viewerApi({
          options: {
            toolbar: true,
            url: 'data-source',
            initialViewIndex: 0,
          },
          images: images,
        });

        emit('loadCase', markersInCluster[0].options.icon.options);
      }

      markers.on('clusterclick', function (event) {
        if (map.value.getZoom() === MAX_ZOOM) {
          const markersInCluster = event.layer.getAllChildMarkers();
          loadImagesAndCase(markersInCluster);
        }
      });

      markers.on('click', function (event) {
        const markersInCluster = [event.layer];
        loadImagesAndCase(markersInCluster);
      });
    });

    return {
      jumpToLocation,
    };
  },
});
</script>

<style>
.marker-cluster {
  transition:
    background-color 0.3s,
    border-radius 0.3s,
    transform 0.3s;
}

.leaflet-marker-icon,
.leaflet-popup {
  transition: transform 0.3s;
}
</style>
