<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue';
import DashboardFooter from '@/components/dashboard/DashboardFooter.vue';
import { useCurrentIncident } from '@/hooks';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import useCurrentUser from '@/hooks/useCurrentUser';
import { snakeCase } from 'lodash';

const { t } = useI18n();
const { currentIncidentId } = useCurrentIncident();
const router = useRouter();
const $toasted = useToast();
const { updateCurrentUser, userPreferences } = useCurrentUser();
const loading = ref(true);

const availableDashboards = [
  {
    name: t('dashboard.default'),
    path: 'default',
    description: t('dashboard.default_description'),
    icon: 'default-dashboard',
  },
  {
    name: t('dashboard.phone_volunteer'),
    path: 'phone-volunteer',
    description: t('dashboard.phone_volunteer_description'),
    icon: 'phone-volunteer-dashboard',
  },
];

const selectedDashboard = ref('');

const goToSelectedDashboard = async () => {
  await updateCurrentUser({
    preferences: {
      ...userPreferences.value,
      dashboard: selectedDashboard.value,
    },
  });
  if (selectedDashboard.value) {
    await router.push(
      `/incident/${currentIncidentId.value}/dashboard/${snakeCase(selectedDashboard.value)}`,
    );
  } else {
    $toasted.error(t('info.please_select_dashboard'));
  }
};

onMounted(async () => {
  if (userPreferences.value?.dashboard) {
    selectedDashboard.value = userPreferences.value.dashboard;
    await goToSelectedDashboard();
  } else {
    selectedDashboard.value = availableDashboards[0].path;
    loading.value = false;
  }
});
</script>

<template>
  <div
    v-if="!loading"
    class="flex flex-col justify-between h-full"
    data-testid="testDashboarddiv"
  >
    <header
      class="text-3xl flex items-center justify-center bg-crisiscleanup-dashboard-blue text-white h-20 w-full"
    >
      {{ $t('dashboard.selector_welcome') }} {{ currentIncidentId }}
    </header>

    <main class="flex flex-col justify-center mt-5 items-center">
      <p class="mb-4">
        {{ $t('dashboard.selector_welcome_description') }}
      </p>

      <div class="flex flex-col gap-2">
        <div
          v-for="dashboard in availableDashboards"
          :key="dashboard.path"
          class="bg-white p-5 rounded-lg border flex items-start gap-4 cursor-pointer hover:bg-crisiscleanup-light-smoke"
          :class="
            selectedDashboard === dashboard.path
              ? 'border-2 border-primary-light'
              : 'border-2 border-gray-200'
          "
          @click="() => (selectedDashboard = dashboard.path)"
        >
          <ccu-icon
            :type="dashboard.icon"
            class="text-crisiscleanup-dashboard-blue"
            size="xl"
          />
          <div>
            <h2 class="font-bold text-lg">{{ dashboard.name }}</h2>
            <p>{{ dashboard.description }}</p>
          </div>
        </div>

        <base-button
          :action="goToSelectedDashboard"
          variant="solid"
          class="my-2 p-2"
          data-testid="testContinueButton"
        >
          {{ $t('actions.continue') }}
        </base-button>
      </div>
    </main>

    <footer>
      <DashboardFooter />
    </footer>
  </div>
</template>

<style scoped></style>
