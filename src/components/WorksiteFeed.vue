<template>
  <div
    ref="feed"
    class="feed overflow-auto p-3 mt-16 md:mt-0 relative md:min-h-[calc(100vh-13rem)] md:h-[calc(100vh-13rem)]"
  >
    <template v-if="currentFeedItem">
      <transition :name="slideDirection" mode="out-in" :style="cssVars">
        <div :key="currentFeedItem.id" class="worksite">
          <div
            class="bg-white p-4 rounded-lg shadow worksite-card mb-16 md:mb-0"
          >
            <div class="flex justify-between">
              <div>
                <h2 class="text-xl font-semibold cursor-pointer">
                  {{ currentFeedItem.case_number }}
                </h2>
                <p class="text-crisiscleanup-dark-400 mb-3">
                  {{ currentDistance }}
                </p>
              </div>
              <div class="flex flex-col items-end mt-1">
                <div v-if="isHighPriority" class="text-red-500 font-semibold">
                  {{ $t('worksiteMap.high_priority') }}
                  <font-awesome-icon
                    :icon="['fas', 'exclamation-triangle']"
                    class="mr-1"
                  />
                </div>
                <div class="text-crisiscleanup-dark-500">
                  {{ completionPercentage }}% {{ $t('worksiteFeed.complete') }}
                </div>
              </div>
            </div>
            <div v-if="claimedByOrg" class="mb-5">
              <div class="bg-primary-light w-fit py-1 px-4 rounded-full">
                {{ $t('caseView.claimed_by_my_org') }}
              </div>
            </div>
            <div class="text-crisiscleanup-dark-400 mb-3">
              <div class="font-bold">{{ $t('worksiteFeed.contact') }}</div>
              <div>
                <font-awesome-icon icon="user" :alt="$t('worksiteFeed.user')" />
                {{ currentFeedItem.name }}
              </div>
              <div>
                <font-awesome-icon
                  icon="phone"
                  :alt="$t('formLabels.phone1')"
                />
                <a
                  :href="`tel:${currentFeedItem.phone1}`"
                  class="ml-1 underline text-crisiscleanup-dark-blue"
                >
                  {{ formatNationalNumber(currentFeedItem.phone1) }}
                </a>
              </div>
            </div>
            <div class="mb-3">
              <div class="font-bold">{{ $t('formLabels.work_types') }}</div>
              <div class="flex flex-wrap">
                <template
                  v-for="workType in currentFeedItem.work_types"
                  :key="workType.id"
                >
                  <div
                    class="bg-crisiscleanup-dark-100 rounded-full px-3 py-1 mr-2 mb-2"
                  >
                    <div v-html="getWorktypeSVG(workType, 24)"></div>
                  </div>
                </template>
              </div>
            </div>
            <template
              v-for="(file, idx) in currentFeedItem.files"
              :key="file.id"
            >
              <div class="flex justify-center w-full mb-2">
                <img
                  :src="file.large_thumbnail_url"
                  class="object-cover rounded-lg"
                  @click="showImages(currentFeedItem, idx)"
                />
              </div>
              <div
                v-if="getMostRecentWorksiteNote(currentFeedItem, idx)?.note"
                class="p-4"
              >
                <div class="flex items-center justify-start">
                  <div>
                    <span class="text-5xl text-gray-600">&ldquo;</span>
                    <p class="text-xl text-gray-800 font-semibold -mt-4">
                      {{
                        getMostRecentWorksiteNote(currentFeedItem, idx)?.note
                      }}
                    </p>
                    <span class="text-5xl text-gray-600">&rdquo;</span>
                  </div>
                </div>
                <div class="flex w-full">
                  <div class="flex gap-2 items-center">
                    <div class="text-sm text-gray-600">
                      <span class="text-crisiscleanup-dark-400">
                        <template
                          v-if="
                            getMostRecentWorksiteNote(currentFeedItem, idx)
                              ?.is_survivor
                          "
                        >
                          {{ currentFeedItem.name }}
                        </template>
                        <template v-else>
                          <UserDetailsTooltip
                            :user="
                              getMostRecentWorksiteNote(currentFeedItem, idx)
                                ?.created_by
                            "
                          />
                        </template>
                      </span>
                    </div>
                    <div class="text-sm text-gray-600">
                      {{
                        moment(
                          getMostRecentWorksiteNote(currentFeedItem, idx)
                            ?.created_at,
                        ).fromNow()
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </transition>
      <div
        class="fixed bottom-0 flex items-center justify-center w-full md:sticky"
      >
        <div class="flex items-center mb-20 md:mb-0 h-16" role="group">
          <base-button
            :action="prevFeedItem"
            :disabled="currentFeedItemIndex === 0"
            :alt="$t('worksiteFeed.prev')"
            class="h-10 text-white bg-crisiscleanup-dark-400 hover:bg-gray-400 px-3 py-2 rounded-l-md border border-r-0 border-gray-400 transition duration-300 ease-in-out focus:outline-none"
          >
            <font-awesome-icon :icon="['fas', 'arrow-left']" class="mr-1" />
            {{ $t('worksiteFeed.prev') }}
          </base-button>

          <base-button
            class="bg-primary-light px-5 py-2 border border-black transition duration-300 ease-in-out focus:outline-none rounded h-12"
            :action="() => $emit('loadCase', currentFeedItem)"
            :alt="$t('worksiteFeed.view')"
          >
            {{ $t('worksiteFeed.view') }}
          </base-button>

          <base-button
            :action="nextFeedItem"
            :disabled="currentFeedItemIndex === worksites.length - 1"
            class="h-10 text-white bg-crisiscleanup-dark-400 hover:bg-gray-400 px-3 py-2 rounded-r-md border border-l-0 border-gray-400 transition duration-300 ease-in-out focus:outline-none"
            :alt="$t('worksiteFeed.next')"
          >
            {{ $t('worksiteFeed.next') }}
            <font-awesome-icon :icon="['fas', 'arrow-right']" class="ml-1" />
          </base-button>
        </div>
      </div>
    </template>

    <template v-if="isLoading && !currentFeedItem">
      <div class="flex justify-center items-center h-full">
        <spinner />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import axios from 'axios';
import type * as L from 'leaflet';

import type Worksite from '@/models/Worksite';
import { useCurrentIncident } from '@/hooks';
import moment from 'moment';
import BaseButton from '@/components/BaseButton.vue';
import Spinner from '@/components/Spinner.vue';
import * as turf from '@turf/turf';
import useCurrentUser from '@/hooks/useCurrentUser';
import { formatNationalNumber } from '@/filters';
import useWorktypeImages from '@/hooks/worksite/useWorktypeImages';
// eslint-disable-next-line import/no-unresolved
import { api as viewerApi } from 'v-viewer';
import type { Portal } from '@/models/types';
import User from '@/models/User';
import UserDetailsTooltip from '@/components/user/DetailsTooltip.vue';

const WORKSITES_LIMIT = 10;

const props = defineProps<{
  currentUserLocation: L.LatLng;
}>();

const { currentUser } = useCurrentUser();
const { getWorktypeSVG } = useWorktypeImages();
const store = useStore();
const portal = store.getters['enums/portal'] as Portal;

const worksites = ref<Worksite[]>([]);
const offset = ref(0); // Offset for pagination
const isLoading = ref(false); // To prevent multiple simultaneous fetches
const hasMore = ref(true); // To know if there are more items to load
const { currentIncidentId } = useCurrentIncident();
const currentLocation = turf.point([
  props.currentUserLocation.lng,
  props.currentUserLocation.lat,
]);

const currentFeedItemIndex = ref<number>(0);
const currentFeedItem = computed(
  () => worksites.value[currentFeedItemIndex.value],
);
const currentDistance = computed(() => {
  if (!currentFeedItem.value) return;

  const worksiteLocation = turf.point(
    currentFeedItem.value.location.coordinates,
  );

  const unitSystem = portal?.attr?.measurement_system || 'imperial';
  const units = unitSystem === 'imperial' ? 'miles' : 'kilometers';

  const distance = turf.distance(currentLocation, worksiteLocation, { units });
  return `${distance.toFixed(2)} ${units} away`;
});

const isHighPriority = computed(() => {
  if (!currentFeedItem.value) return false;

  return currentFeedItem.value.flags.some((flag) => flag.is_high_priority);
});

const isFavorite = computed(() => {
  if (!currentFeedItem.value) return false;
  return Boolean(currentFeedItem.value.favorite);
});

const completionPercentage = computed(() => {
  if (!currentFeedItem.value) return 0;

  const total = currentFeedItem.value.work_types.length;
  const completed = currentFeedItem.value.work_types.filter((workType) =>
    workType.status.includes('closed'),
  ).length;

  return Math.round((completed / total) * 100);
});

const claimedByOrg = computed(() => {
  if (!currentFeedItem.value) return false;

  return currentFeedItem.value.work_types.some(
    (workType) => workType.claimed_by === currentUser.value.organization.id,
  );
});

const showImages = (worksite: Worksite, index: number) => {
  const images = worksite.files.map((file) => {
    return {
      src: file.large_thumbnail_url,
      'data-source': file.large_thumbnail_url,
    };
  });
  viewerApi({
    options: {
      toolbar: true,
      url: 'data-source',
      initialViewIndex: index,
    },
    images: images,
  });
};

function preloadImage(url) {
  const img = new Image();
  img.src = url;
}

const loadMoreWorksites = async () => {
  if (isLoading.value || !hasMore.value) return;
  isLoading.value = true;
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/worksites`,
      {
        params: {
          limit: WORKSITES_LIMIT,
          offset: offset.value,
          fields:
            'id,name,case_number,files,notes,work_types,favorite,flags,location',
          feed: `${currentLocation.geometry.coordinates[0]},${currentLocation.geometry.coordinates[1]},${currentIncidentId.value}`,
        },
      },
    );

    const userIds = [];
    if (response.data.results && Array.isArray(response.data.results)) {
      if (response.data.results.length < WORKSITES_LIMIT) {
        hasMore.value = false;
      }

      worksites.value.push(...response.data.results);
      offset.value += response.data.results.length;

      for (const worksite of worksites.value) {
        if (worksite.notes) {
          for (const note of worksite.notes) {
            userIds.push(note.created_by);
          }
        }
      }
      for (const worksite of worksites.value) {
        for (const file of worksite.files) {
          preloadImage(file.large_thumbnail_url);
        }
      }
    }
    if (userIds.length > 0) {
      await User.api().get(`/users?id__in=${userIds.join(',')}`, {
        dataKey: 'results',
      });
    }
  } catch (error) {
    console.error('Error fetching worksites:', error);
    // Handle error appropriately
  } finally {
    isLoading.value = false;
  }
};

const getUser = (id: number) => {
  return User.find(id);
};

const nextFeedItem = () => {
  if (currentFeedItemIndex.value < worksites.value.length - 1) {
    currentFeedItemIndex.value++;
  }
  if (worksites.value.length - currentFeedItemIndex.value <= 4) {
    loadMoreWorksites();
  }
};

const prevFeedItem = () => {
  if (currentFeedItemIndex.value > 0) {
    currentFeedItemIndex.value--;
  }
};

const getMostRecentWorksiteNote = (worksite, idx) => {
  if (!worksite.notes || worksite.notes.length === 0) return null;

  const sortedNotes = worksite.notes.sort((a, b) => {
    if (a.is_survivor && !b.is_survivor) {
      return -1;
    } else if (!a.is_survivor && b.is_survivor) {
      return 1;
    } else {
      return moment(b.created_at).diff(moment(a.created_at));
    }
  });

  // Return the note at the specified index, if it exists
  return sortedNotes[idx] || null;
};

defineEmits(['loadCase']);

const feed = ref<HTMLElement | null>(null);
const { direction } = useSwipe(feed);

watchEffect(() => {
  if (direction.value === 'right') {
    prevFeedItem();
  } else if (direction.value === 'left') {
    nextFeedItem();
  }
});

const slideDirection = computed(() => {
  return direction.value === 'right' ? 'slide-right' : 'slide-left';
});

const cssVars = computed(() => {
  const distance = '30px'; // Adjust as needed
  return {
    '--slide-transform':
      direction.value === 'right' ? `-${distance}` : distance,
  };
});

onMounted(async () => {
  await loadMoreWorksites();
  if (worksites.value.length > 0) {
    currentFeedItemIndex.value = 0;
  }
});
</script>

<style scoped lang="scss">
.feed {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media screen and (max-width: theme('screens.sm')) {
  .slide-left-enter-active,
  .slide-right-enter-active,
  .slide-left-leave-active,
  .slide-right-leave-active {
    transition:
      opacity 0.5s ease,
      transform 0.5s ease;
    will-change: transform;
  }

  .slide-left-enter,
  .slide-right-leave-to {
    opacity: 0;
    transform: translateX(var(--slide-transform));
  }

  .slide-left-leave-to,
  .slide-right-enter {
    opacity: 0;
    transform: translateX(calc(-1 * var(--slide-transform)));
  }

  .slide-left-enter-to,
  .slide-left-leave,
  .slide-right-enter-to,
  .slide-right-leave {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
