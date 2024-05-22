<template>
  <div class="flex items-center justify-center md:mb-0 mb-10">
    <div
      v-if="loadingActionItems && !allDataLoaded"
      class="h-screen flex items-center justify-center"
    >
      <spinner size="lg" />
    </div>
    <div v-else class="flex flex-col w-full">
      <header class="bg-white border p-6 flex items-center gap-3">
        <h1 class="text-xl font-semibold">{{ $t($route.name) }}</h1>
        <spinner v-show="loadingActionItems && allDataLoaded" size="lg" />
      </header>

      <main class="flex-grow overflow-auto bg-gray-100 border-l border-r">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <section class="bg-white p-5 border-r">
            <UserProfileCard class="mb-5" :user="currentUser" />
            <h2 class="font-bold text-lg mb-3">Action Items</h2>
            <div
              v-for="item in actionItems"
              :key="item.id"
              class="mb-2 flex flex-col gap-1"
            >
              <p class="text-crisiscleanup-dark-blue font-semibold text-sm">
                {{ item.title }}
              </p>
              <p class="text-xs text-gray-500">
                {{ momentFromNow(item.timestamp) }}
              </p>
              <div class="actions flex items-center justify-start gap-1">
                <base-button
                  v-for="action in item.actions"
                  :key="action.title"
                  :variant="action.variant"
                  size="small"
                  class="rounded-full"
                  :action="() => performAction(action.action)"
                >
                  {{ action.title }}
                </base-button>
              </div>
            </div>
          </section>

          <section class="col-span-3 bg-white md:col-span-1 lg:col-span-3">
            <router-view
              v-if="allDataLoaded"
              :current-incident-id="currentIncidentId"
              :loading-action-items="loadingActionItems"
              :claimed-worksites="claimedWorksites"
              :invitation-requests="invitationRequests"
              :transfer-requests="transferRequests"
              :worksite-requests="worksiteRequests"
              :all-data-loaded="allDataLoaded"
              :fetch-all-data="fetchAllData"
            />
          </section>
        </div>
      </main>

      <DashboardFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UserProfileCard from '@/components/UserProfileCard.vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import BaseButton from '@/components/BaseButton.vue';
import { momentFromNow } from '@/filters';
import { useCurrentIncident } from '@/hooks';
import { useDashboardActionItems } from '@/hooks/useDashboardActionItems';
import { useToast } from 'vue-toastification';
import useNavigation from '@/hooks/useNavigation';
import _ from 'lodash';
import DashboardFooter from '@/components/dashboard/DashboardFooter.vue';

const { currentUser } = useCurrentUser();
const { currentIncidentId, currentIncident } = useCurrentIncident();
const $toasted = useToast();

const { HomeNavigation, FooterNavigation } = useNavigation();
const publicRoutes = computed(() => {
  const _homeSideRoutes = _.keyBy(HomeNavigation, 'key');
  const _homeFooterRoutes = _.keyBy(FooterNavigation, 'key');
  const homeRoutes = { ..._homeSideRoutes, ..._homeFooterRoutes };
  return {
    survivor: { ...homeRoutes.survivor, icon: 'contact' },
    training: homeRoutes.training,
    about: { title: 'publicNav.about_us', route: { name: 'nav.about' } },
    blog: { ...homeRoutes.blog, icon: 'notepad' },
    terms: homeRoutes.terms,
    privacy: homeRoutes.privacy,
  };
});

const performAction = async (action) => {
  await action();
  await fetchAllData();
};

const {
  actionItems,
  claimedWorksites,
  invitationRequests,
  transferRequests,
  worksiteRequests,
  loadingActionItems,
  fetchAllData,
} = useDashboardActionItems(
  currentIncidentId.value,
  currentUser.value?.organization.id,
  currentUser.value,
);

const allDataLoaded = ref(false);

onMounted(() => {
  watch(
    loadingActionItems,
    (newVal) => {
      if (!newVal) {
        allDataLoaded.value = true;
      }
    },
    { immediate: true },
  );

  if (!loadingActionItems) {
    allDataLoaded.value = true;
  }
});
</script>

<style>
.stats-card {
  @apply border flex-1 p-4 shadow rounded-md h-28;
}

.stats-card p {
  @apply text-start;
}

.stats-card p:first-child {
  @apply text-sm font-light;
}

.stats-card p:last-child {
  @apply text-3xl font-light mt-2;
}

.case-svg-container svg {
  width: 20px;
  height: 20px;
}

header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
/* Add any custom styles or override Tailwind styles if needed */
</style>
