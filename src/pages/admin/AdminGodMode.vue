<script setup lang="ts">
import type { UserLocation } from '@/models/types';
import axios from 'axios';
import { getUserLocationLayer, mapTileLayer } from '@/utils/map';
import User from '@/models/User';
import * as L from 'leaflet';
import { momentFromNow } from '@/filters';

interface UserGeoLocation {
  user: string;
  point: {
    type: string;
    coordinates: [number, number];
  };
  updated_at: string;
}

const MAX_ZOOM = 19;

const userLocations = ref<UserLocation[]>([]);
const map = ref();
const { t } = useI18n();

const getAllUserLocations = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/user_geo_locations`,
    {
      params: {
        limit: 1000,
      },
    },
  );
  const transformedData = data.results.map(
    ({ user, point, updated_at }: UserGeoLocation) => ({
      user_id: user,
      location: point?.coordinates,
      timestamp: updated_at ? new Date(updated_at) : null,
    }),
  );

  // only keep the latest location for each user
  const userLocationMap = new Map<number, UserLocation>();
  transformedData.forEach((location: UserLocation) => {
    const existingLocation = userLocationMap.get(location.user_id);
    if (
      !existingLocation ||
      new Date(location.timestamp) > new Date(existingLocation.timestamp)
    ) {
      userLocationMap.set(location.user_id, location);
    }
  });

  return [...userLocationMap.values()];
};

function showUserLocations() {
  const locationLayer = getUserLocationLayer(
    userLocations.value,
    (location: UserLocation) => {
      const user = User.find(location.user_id);
      if (user) {
        const emailSection = user.email
          ? `<div class="text-sm"><a href="mailto:${user.email}" class="ml-1">${user.email}</a></div>`
          : '';
        const mobileSection = user.mobile
          ? `<div class="text-sm"><a href="tel:${user.mobile}" class="ml-1">${user.mobile}</a></div>`
          : '';

        const popup = L.popup({
          closeButton: true,
          closeOnClick: true,
          autoClose: false,
          closeOnEscapeKey: true,
        }).setContent(
          `<div class="flex flex-col items-center">
          <div class="text-sm font-bold">${user.full_name}</div>
          ${emailSection}
          ${mobileSection}
          <div class="text-sm">${user.organization.name}</div>
          <div class="text-xs italic">${t('casesVue.last_seen')} ${momentFromNow(location.timestamp)}</div>
        </div>`,
        );

        popup.setLatLng([location.location[1], location.location[0]]);
        popup.openOn(map.value);
      }
    },
  );

  locationLayer.addTo(map.value);
}

onMounted(async () => {
  userLocations.value = await getAllUserLocations();

  // get all users found in the locations
  const userIds = userLocations.value.map(
    (location: UserLocation) => location.user_id,
  );
  await User.api().get(`/users?id__in=${userIds.join(',')}`, {
    dataKey: 'results',
  });

  map.value = L.map('godModeMap', {
    zoomControl: true,
  }).setView([35.746_512_259_918_5, -96.411_509_631_256_56], 3);
  L.tileLayer(mapTileLayer, {
    maxZoom: MAX_ZOOM,
  }).addTo(map.value);

  showUserLocations();
});
</script>

<template>
  <div id="godModeMap" class="h-full w-full"></div>
</template>

<style scoped></style>
