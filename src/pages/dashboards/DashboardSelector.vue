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
  // {
  //   name: t('dashboard.command_center'),
  //   path: 'command-center',
  //   description: t('dashboard.command_center_description'),
  //   icon: 'command-center-dashboard',
  // },
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
    class="flex flex-col justify-between"
    data-testid="testDashboarddiv"
  >
    <header
      class="text-3xl flex items-center justify-center bg-crisiscleanup-dashboard-blue text-white h-20 w-full"
    >
      {{ $t('dashboard.selector_welcome') }}
    </header>

    <main class="h-[80vh] flex flex-col justify-center mt-5 items-center">
      <p class="mb-4 mx-2 md:text-2xl text-center md:w-3/6">
        {{ $t('dashboard.selector_welcome_description') }}
      </p>

      <div class="flex flex-col gap-2">
        <div
          v-for="dashboard in availableDashboards"
          :key="dashboard.path"
          class="dashboard-option-tile"
          @click="
            () => {
              selectedDashboard = dashboard.path;
              goToSelectedDashboard();
            }
          "
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
      </div>
    </main>
    <DashboardFooter />
  </div>
</template>

<style scoped>
.dashboard-option-tile {
  @apply transition duration-300 bg-white p-5 mx-2 rounded-lg border-2 flex items-start gap-4 cursor-pointer border-gray-200;
}
.dashboard-option-tile:hover {
  @apply bg-crisiscleanup-light-smoke border-primary-light;
}
</style>
