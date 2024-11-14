<template>
  <Home no-hotline>
    <div
      v-if="loading"
      class="flex justify-center items-center h-full bg-crisiscleanup-light-smoke"
    >
      <spinner />
    </div>
    <div v-else class="bg-crisiscleanup-light-smoke p-6 h-full">
      <div
        class="flex items-center gap-0.5 text-base text-crisiscleanup-dark-blue mb-3 underline"
      >
        <font-awesome-icon
          :icon="['fas', 'arrow-left']"
          class="text-primary cursor-pointer"
        />
        <router-link to="/disasters">
          {{ $t('disasters.back_to_active') }}
        </router-link>
      </div>
      <div
        class="text-4xl font-bold mb-6"
        data-testid="testCurrentDisastersHeader"
      >
        {{ $t('disasters.archived_disasters') }}
      </div>
      <div
        v-for="[year, incidents] in sortByRecentIncidentEntries"
        :key="year"
        class="mb-5"
      >
        <div class="text-2xl font-semibold mb-3">{{ year }}</div>
        <div
          v-for="incident in incidents"
          :key="incident.id"
          class="mb-5 border rounded cursor-pointer bg-white"
          @click="$router.push('/disasters/' + incident.id)"
        >
          <div :id="camelCase(incident.short_name)" class="p-5 my-3 block">
            <div
              class="text-2xl font-semibold flex items-center justify-between"
            >
              {{ incident.name }}
              <font-awesome-icon
                :icon="['fas', 'chevron-right']"
                class="cursor-pointer"
              />
            </div>
            <div class="text-lg mb-3 opacity-60">
              {{ moment(incident.start_at).format('MMMM Y') }}
            </div>
            <div
              v-if="
                incident.active_phone_number &&
                incident.active_phone_number.length > 0
              "
              class="flex items-center gap-5 text-base"
            >
              {{ $t('disasters.hotlines') }}
              <div class="flex gap-2">
                <a
                  v-for="number in incident.active_phone_number"
                  :key="number"
                  class="bg-primary-light bg-opacity-30 py-1 px-3 rounded-full"
                  :href="`tel:${number}`"
                >
                  {{ formatNationalNumber(String(number)) }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Home>
</template>

<script setup lang="ts">
import Home from '@/layouts/Home.vue';
import moment from 'moment/moment';
import type Incident from '@/models/Incident';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import useDialogs from '@/hooks/useDialogs';
import { formatNationalNumber } from '@/filters';
import camelCase from 'lodash/camelCase';
import Spinner from '@/components/Spinner.vue';

const { component } = useDialogs();
const route = useRoute();
const incidents = ref<Incident>([]);
const groupedIncidents = ref<Record<string, Incident[]>>({});
const loading = ref(true);

const sortByRecentIncidentEntries = computed(() => {
  return Object.entries(groupedIncidents.value).sort(([yearA], [yearB]) => {
    return Number.parseInt(yearB) - Number.parseInt(yearA);
  });
});

onMounted(async () => {
  loading.value = true;
  const response: AxiosResponse<{ results: Incident[] }> = await axios.get(
    `${
      import.meta.env.VITE_APP_API_BASE_URL
    }/incidents?fields=id,name,short_name,active_phone_number,start_at&limit=500&sort=-start_at`,
  );
  // incidents older than 2 months are considered archived
  const twoMonthsAgo = moment().subtract(2, 'months');
  incidents.value = response.data.results.filter(
    (incident) =>
      incident.start_at && moment(incident.start_at).isBefore(twoMonthsAgo),
  );

  // group incidents by year
  groupedIncidents.value = incidents.value.reduce((acc, incident) => {
    const year = moment(incident.start_at).format('YYYY');
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(incident);
    return acc;
  }, {});
  loading.value = false;
});
</script>

<style scoped></style>
