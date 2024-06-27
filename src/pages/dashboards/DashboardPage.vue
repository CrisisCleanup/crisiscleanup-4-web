<template>
  <div class="flex flex-col h-screen" data-testid="testDashboarddiv">
    <div
      v-if="loadingActionItems && !allDataLoaded"
      class="h-screen flex items-center justify-center"
    >
      <spinner size="lg" />
    </div>
    <div
      v-else
      class="flex flex-col w-full flex-grow"
      data-testid="testMainContent"
    >
      <header
        class="bg-white border p-6 items-center gap-3 flex justify-between"
        data-testid="testHeader"
      >
        <div class="flex items-center gap-2" data-testid="testHeaderLeft">
          <ccu-icon
            :type="`${kebabCase($route.path.split('/').pop())}-dashboard`"
            class="text-crisiscleanup-dashboard-blue"
            size="xl"
            data-testid="testDashboardIcon"
          />
          <h1 class="text-2xl" data-testid="testDashboardTitle">
            {{ $t($route.name) }}
          </h1>
          <base-button
            :action="goToDashboardSelector"
            variant="text-dark"
            data-testid="testSwitchButton"
          >
            {{ $t('actions.switch') }}
          </base-button>
        </div>
        <div class="flex items-center" data-testid="testHeaderRight">
          <RedeployRequest data-testid="testRedeployRequest" />
          <InviteUsers class="mx-1" data-testid="testInviteUsers" />
          <spinner v-show="loadingActionItems && allDataLoaded" size="lg" />
        </div>
      </header>

      <main
        class="flex-grow overflow-auto bg-gray-100 border-l border-r"
        data-testid="testMain"
      >
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          data-testid="testGrid"
        >
          <section class="bg-white p-5 border-r" data-testid="testLeftSection">
            <UserProfileCard
              class="mb-5"
              :user="currentUser"
              data-testid="testUserProfileCard"
            />
            <h2
              class="font-bold text-lg mb-3"
              data-testid="testActionItemsTitle"
            >
              Action Items
            </h2>
            <div
              v-for="item in actionItems"
              :key="item.id"
              class="mb-2 flex flex-col gap-1"
              data-testid="testActionItem"
            >
              <p
                class="text-crisiscleanup-dark-blue font-semibold text-sm"
                data-testid="testActionItemTitle"
              >
                {{ item.title }}
              </p>
              <p
                class="text-xs text-gray-500"
                data-testid="testActionItemTimestamp"
              >
                {{ momentFromNow(item.timestamp) }}
              </p>
              <div
                class="actions flex items-center justify-start gap-1"
                data-testid="testActionItemActions"
              >
                <base-button
                  v-for="action in item.actions"
                  :key="action.title"
                  :variant="action.variant"
                  size="small"
                  class="rounded-full"
                  :action="() => performAction(action.action)"
                  data-testid="testActionButton"
                >
                  {{ action.title }}
                </base-button>
              </div>
            </div>
          </section>

          <section
            class="col-span-3 bg-white md:col-span-1 lg:col-span-3"
            data-testid="testRightSection"
          >
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

      <DashboardFooter
        data-testid="testDashboardFooter"
        class="flex flex-shrink"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import UserProfileCard from '@/components/UserProfileCard.vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import BaseButton from '@/components/BaseButton.vue';
import { momentFromNow } from '@/filters';
import { useCurrentIncident } from '@/hooks';
import { useDashboardActionItems } from '@/hooks/useDashboardActionItems';
import { useToast } from 'vue-toastification';
import useNavigation from '@/hooks/useNavigation';
import _, { kebabCase } from 'lodash';
import DashboardFooter from '@/components/dashboard/DashboardFooter.vue';
import InviteUsers from '@/components/modals/InviteUsers.vue';
import RedeployRequest from '@/components/modals/RedeployRequest.vue';

const { currentUser, userPreferences, updateCurrentUser } = useCurrentUser();
const { currentIncidentId } = useCurrentIncident();
const router = useRouter();

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

const goToDashboardSelector = async () => {
  const newPreferences = {
    ...userPreferences.value,
  };
  delete newPreferences.dashboard;
  await updateCurrentUser({
    preferences: newPreferences,
  });
  await router.push(`/dashboard`);
};

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

[data-testid='testDashboarddiv'] {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

[data-testid='testMainContent'] {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

[data-testid='testMain'] {
  flex-grow: 1;
}

/* Add any custom styles or override Tailwind styles if needed */
</style>
