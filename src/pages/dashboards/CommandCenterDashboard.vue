<script setup lang="ts">
import type Team from '@/models/Team';
import Organization from '@/models/Organization';
import axios from 'axios';
import Accordion from '@/components/accordion/Accordion.vue';
import AccordionItem from '@/components/accordion/AccordionItem.vue';
import useWorksiteMap from '@/hooks/worksite/useWorksiteMapRefactored';
import { getWorksites, getDashboardStatistics } from '@/utils/dashboard';
import { useCurrentIncident, useCurrentUser } from '@/hooks';
import SimpleMap from '@/components/SimpleMap.vue';
import { useDashboardActionItems } from '@/hooks/useDashboardActionItems';
import * as L from 'leaflet';
import { INTERACTIVE_ZOOM_LEVEL } from '@/constants';
import Incident from '@/models/Incident';
import { nFormatter } from '@/utils/helpers';
import TeamCompletion from '@/components/dashboard/TeamCompletion.vue';
import DownloadAppBanner from '@/components/dashboard/DownloadAppBanner.vue';
import DownloadAppBannerTeams from '@/components/dashboard/DownloadAppBannerTeams.vue';
import { loadUserLocations } from '@/utils/worksite';
import { getUserLocationLayer } from '@/utils/map';
import type { UserLocation } from '@/models/types';
import User from '@/models/User';
import { momentFromNow } from '@/filters';

const { currentIncidentId, currentIncident } = useCurrentIncident();
const { currentUser } = useCurrentUser();
const { t } = useI18n();

const affiliatedTeams = ref<Team[]>([]);
const userLocations = ref<Record<string, any>>({});
const dashboardStatistics = ref<Record<string, any>>({});
let mapUtils;

const { loadingActionItems } = useDashboardActionItems(
  currentIncidentId.value,
  currentUser.value?.organization.id,
  currentUser.value,
);

const getAffiliates = async () => {
  const response = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/affiliated_teams`,
    {
      params: {
        limit: 500,
        incident: currentIncidentId.value,
      },
    },
  );
  affiliatedTeams.value = response.data.results;

  if (affiliatedTeams.value.length > 0) {
    await Organization.api().get(
      `/organizations?id__in=${affiliatedTeams.value
        .map((team) => team.organization)
        .join(',')}`,
      {
        dataKey: 'results',
      },
    );
  }
};

const teamsByOrganization = computed(() => {
  const teamsByOrg = {} as Record<string, Team[]>;
  for (const team of affiliatedTeams.value) {
    if (!teamsByOrg[team.organization]) {
      teamsByOrg[team.organization] = [];
    }
    teamsByOrg[team.organization].push(team);
  }
  return teamsByOrg;
});

const getOrganizationName = (organizationId: string) => {
  const organization = Organization.find(organizationId);
  return organization ? organization.name : '';
};

function zoomIn() {
  mapUtils?.getMap().zoomIn();
}

function zoomOut() {
  mapUtils?.getMap().zoomOut();
}

function getIncidentCenter() {
  const { incident_center } = Incident.find(
    currentIncidentId.value,
  ) as Incident;
  if (incident_center) {
    return [incident_center.coordinates[1], incident_center.coordinates[0]];
  }
  return [35.746_512_259_918_5, -96.411_509_631_256_56];
}

function goToIncidentCenter() {
  mapUtils?.getMap().setView(getIncidentCenter(), 6);
}

function goToInteractive() {
  mapUtils?.getMap().setView(getIncidentCenter(), INTERACTIVE_ZOOM_LEVEL);
}

onMounted(async () => {
  await getAffiliates();
  await loadUserLocations({}).then((response) => {
    userLocations.value = response;
  });
  getWorksites(currentIncidentId.value).then((worksites) => {
    mapUtils = useWorksiteMap(
      worksites,
      worksites.map((m) => m.id),
      () => {},
      (_, map) => {
        if (currentIncident.incident_center) {
          map.setView(
            [
              currentIncident.incident_center.coordinates[1],
              currentIncident.incident_center.coordinates[0],
            ],
            INTERACTIVE_ZOOM_LEVEL,
          );
        } else {
          map.setView([35.746_512_259_918_5, -96.411_509_631_256_56], 5);
        }
        for (let team of affiliatedTeams.value) {
          L.geoJson(team.cases_area, {
            color: team.color,
          }).addTo(map);
        }
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
              popup.openOn(map);
            }
          },
        );

        locationLayer.addTo(map);
      },
    );
  });
  getDashboardStatistics({ incidentId: currentIncidentId.value })
    .then((data) => {
      dashboardStatistics.value = data;
    })
    .catch((error) => {
      console.error('Error fetching dashboard statistics:', error);
    });
});
</script>

<template>
  <DownloadAppBannerTeams />
  <div class="grid md:grid-cols-2 grid-cols-1 min-h-180 gap-4">
    <!-- Accordion on the left -->
    <div class="p-2 overflow-x-auto">
      <h2 class="font-semibold text-lg mb-3 flex justify-between">
        {{ $t('dashboard.affiliated_organizations') }}
      </h2>
      <Accordion>
        <AccordionItem
          v-for="(teams, organization) in teamsByOrganization"
          :key="organization"
          :name="getOrganizationName(organization)"
          icon-position="left"
          button-classes="w-full text-left px-2 pt-0.5 focus:outline-none flex gap-1 items-center bg-crisiscleanup-light-smoke rounded p-0.5 font-semibold"
          classes="text-sm"
          body-classes="py-1"
          start-open
        >
          <div class="grid grid-cols-3 text-xs gap-2">
            <!-- Header Row -->
            <div
              class="col-span-3 grid gap-1 grid-cols-3 font-semibold bg-crisiscleanup-light-smoke rounded p-0.5"
            >
              <span class="text-gray-700">{{ $t('dashboard.team_name') }}</span>
              <span class="text-gray-700">{{ $t('dashboard.team_size') }}</span>
              <span class="text-gray-700">{{
                $t('dashboard.team_cases')
              }}</span>
            </div>

            <!-- Data Rows -->
            <template v-for="team in teams" :key="team.id">
              <div class="col-span-3 grid gap-1 grid-cols-3">
                <div class="flex items-center">
                  <div
                    class="w-2 h-2 rounded-full mr-2"
                    :style="{ backgroundColor: team.color }"
                  ></div>
                  {{ team.name }}
                </div>
                <span>{{ team.users.length }}</span>
                <span>{{ team.assigned_work_types.length }}</span>
              </div>
            </template>
          </div>
        </AccordionItem>
      </Accordion>
    </div>

    <!-- Map and Statistics on the right -->
    <div class="flex flex-col gap-4 p-2">
      <!-- Map Section -->
      <h2 class="font-semibold text-lg mb-3 flex justify-between">
        {{ $t('dashboard.teams_map') }}
        <router-link :to="`/organization/teams`"
          ><span class="text-crisiscleanup-dark-blue text-sm hover:underline">{{
            $t('dashboard.go_to_teams')
          }}</span></router-link
        >
      </h2>
      <div class="relative h-84">
        <SimpleMap
          :map-loading="loadingActionItems"
          data-testid="testSimpleMapContent"
          show-zoom-buttons
          remove-legend
          @on-zoom-in="zoomIn"
          @on-zoom-out="zoomOut"
          @on-zoom-incident-center="goToIncidentCenter"
          @on-zoom-interactive="goToInteractive"
        />
      </div>

      <!-- Statistics Section -->
      <div v-if="dashboardStatistics" class="grid grid-cols-2 gap-2">
        <div class="stats-card">
          <p>{{ $t('dashboard.total_value') }}</p>
          <p>${{ nFormatter(dashboardStatistics.total_commercial_value) }}</p>
        </div>
        <div class="stats-card">
          <p>{{ $t('dashboard.members_served') }}</p>
          <p>{{ dashboardStatistics.members_served }}</p>
        </div>
        <div class="stats-card">
          <p>{{ $t('dashboard.total_cases') }}</p>
          <p>
            <router-link :to="`/incident/${currentIncidentId}/work`"
              >{{ dashboardStatistics.total_cases }}
            </router-link>
          </p>
        </div>
        <div class="stats-card">
          <p>{{ $t('dashboard.active_users_today') }}</p>
          <p class="text-primary-dark cursor-pointer">
            {{ dashboardStatistics.active_users_today }}
          </p>
        </div>
      </div>

      <div class="md:mt-6">
        <h2 class="font-semibold text-lg mb-3 flex justify-between">
          {{ $t('dashboard.completion_rate') }}
        </h2>

        <TeamCompletion :teams="affiliatedTeams" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
