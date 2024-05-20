<script setup lang="ts">
import { getColorForStatus, getWorkTypeImage, momentFromNow } from '@/filters';
import {
  acceptInvitationRequest,
  acceptWorksiteRequest,
  archiveInvitationRequest,
  getDashboardStatistics,
  getEngagementData,
  getWorksites,
  rejectInvitationRequest,
  rejectWorksiteRequest,
} from '@/utils/dashboard';
import { nFormatter } from '@/utils/helpers';
import moment from 'moment/moment';
import WorksiteStatusDropdown from '@/components/WorksiteStatusDropdown.vue';
import Worksite from '@/models/Worksite';
import { getErrorMessage } from '@/utils/errors';
import useCurrentUser from '@/hooks/useCurrentUser';
import { useToast } from 'vue-toastification';
import useWorksiteMap from '@/hooks/worksite/useWorksiteMap';
import { useCurrentIncident } from '@/hooks';
import VolunteerChart from '@/components/dashboard/VolunteerChart.vue';
import SimpleMap from '@/components/SimpleMap.vue';

const props = defineProps({
  loadingActionItems: Boolean,
  claimedWorksites: Array,
  invitationRequests: Array,
  transferRequests: Array,
  worksiteRequests: Array,
  allDataLoaded: Boolean,
  fetchAllData: Function,
});
let mapUtils;
const { currentUser } = useCurrentUser();
const { currentIncidentId, currentIncident } = useCurrentIncident();

const $toasted = useToast();

const engagementData = ref([]);
const dashboardStatistics = ref<any>(null);

const inboundWorksiteRequests = computed(() => {
  const preferences = currentUser.value?.preferences || {};
  const archivedRequests = preferences.archived_worksite_requests || [];
  return props.worksiteRequests.filter(
    (request) =>
      Number(request.requested_to_org.id) ===
        Number(currentUser.value.organization.id) &&
      !archivedRequests.includes(request.id) &&
      !request.has_response,
  );
});

async function statusValueChange(value, workType, worksiteId) {
  try {
    await Worksite.api().updateWorkTypeStatus(workType.id, value);
  } catch (error) {
    await $toasted.error(getErrorMessage(error));
  } finally {
    await props.fetchAllData();
  }
}

async function unclaimAll(worksite: Worksite) {
  try {
    Worksite.api().unclaimWorksite(worksite.id, []);
  } catch (error) {
    await $toasted.error(getErrorMessage(error));
  } finally {
    await Worksite.api().fetch(worksite.id);
    await props.fetchAllData();
  }
}

onMounted((loaded) => {
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
            5,
          );
        } else {
          map.setView([35.746_512_259_918_5, -96.411_509_631_256_56], 5);
        }
      },
    );
  });

  Promise.all([
    getEngagementData({
      start_date: moment().add(-60, 'days'),
      end_date: moment(),
      incident: currentIncidentId.value,
    }).then(({ data }) => {
      engagementData.value = data;
    }),
    getDashboardStatistics({ incidentId: currentIncidentId.value })
      .then((data) => {
        dashboardStatistics.value = data;
      })
      .catch((error) => {
        console.error('Error fetching dashboard statistics:', error);
      }),
  ]).catch((error) => {
    console.error('Error fetching data:', error);
  });
});
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6 p-8">
    <div>
      <h2 class="font-bold text-lg mb-3 flex justify-between">
        {{ $t('~~Disaster Map') }}
        <router-link :to="`/incident/${currentIncidentId}/work`"
          ><span class="text-crisiscleanup-dark-blue text-sm hover:underline">{{
            $t('~~Go to Work Map →')
          }}</span></router-link
        >
      </h2>
      <div class="h-84 bg-gray-200 relative">
        <SimpleMap
          :map-loading="loadingActionItems"
          data-testid="testSimpleMapContent"
        />
      </div>
    </div>
    <div>
      <h2 class="font-bold text-lg mb-3">Volunteer Engagement</h2>
      <VolunteerChart
        :key="JSON.stringify(engagementData)"
        class="h-84"
        :data="engagementData"
      />
    </div>
  </div>
  <div
    v-if="dashboardStatistics"
    class="grid md:grid-cols-6 grid-cols-3 gap-2 mt-10 p-8"
  >
    <div class="stats-card">
      <p>{{ $t('~~Total Value') }}</p>
      <p>${{ nFormatter(dashboardStatistics.total_commercial_value) }}</p>
    </div>
    <div class="stats-card">
      <p>{{ $t('~~Members Served') }}</p>
      <p>{{ dashboardStatistics.members_served }}</p>
    </div>
    <div class="stats-card">
      <p>{{ $t('~~Total Claimed Cases') }}</p>
      <p>{{ dashboardStatistics.total_claimed_cases }}</p>
    </div>
    <div class="stats-card">
      <p>{{ $t('~~Total Closed Cases') }}</p>
      <p>{{ dashboardStatistics.total_closed_cases }}</p>
    </div>
    <div class="stats-card">
      <p>{{ $t('~~Total Open Cases') }}</p>
      <p>{{ dashboardStatistics.total_open_cases }}</p>
    </div>
    <div class="stats-card">
      <p>{{ $t('~~Active Users Today') }}</p>
      <p>{{ dashboardStatistics.active_users_today }}</p>
    </div>
  </div>
  <div v-if="inboundWorksiteRequests.length > 0" class="p-8">
    <h2 class="font-bold text-base mt-10">
      {{ $t('~~Case Transfer Requests') }}
    </h2>
    <div v-if="inboundWorksiteRequests.length > 0">
      <div>{{ $t('~~Inbound Requests') }}</div>
      <div
        v-for="request in inboundWorksiteRequests"
        :key="request.id"
        class="grid grid-cols-3 items-center justify-start bg-crisiscleanup-light-smoke p-1 m-1"
      >
        <div class="flex items-center justify-start gap-3">
          {{ request.case_number }}
          <div
            class="flex p-1 items-center justify-center rounded-lg"
            :style="{
              backgroundColor: `${getColorForStatus(
                request.worksite_work_type.status,
                Boolean(request.worksite_work_type.claimed_by),
              )}3D`,
            }"
          >
            <div
              class="case-svg-container"
              v-html="getWorkTypeImage(request.worksite_work_type)"
            ></div>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          {{ $t('~~Requested By') }}
          <span class="text-crisiscleanup-dark-blue">{{
            request.requested_by_org.name
          }}</span>
        </div>
        <div class="flex gap-2 justify-end">
          <base-button
            variant="primary"
            class="rounded-full"
            :action="() => acceptWorksiteRequest(request.id, fetchAllData)"
            size="small"
            >{{ $t('~~Approve') }}
          </base-button>
          <base-button
            variant="outline"
            class="rounded-full"
            :action="() => rejectWorksiteRequest(request.id, fetchAllData)"
            size="small"
            >{{ $t('~~Reject') }}
          </base-button>
        </div>
      </div>
    </div>

    <!--              <a-->
    <!--                href="#"-->
    <!--                class="text-blue-500 hover:text-blue-700 transition duration-300 ease-in-out text-sm font-bold"-->
    <!--                >{{ $t('~~View all transfer requests →') }}</a-->
    <!--              >-->
  </div>
  <div
    v-if="claimedWorksites.length > 0 || invitationRequests.length > 0"
    class="grid md:grid-cols-2 gap-8 mt-5 p-8"
  >
    <div v-if="claimedWorksites.length > 0">
      <div>
        <div class="text-lg font-semibold">
          {{
            $t('~~{count} Open Cases', {
              count: claimedWorksites.length,
            })
          }}
        </div>
        <div class="text-sm opacity-75">
          {{ $t('~~Please unclaim old cases and close finished cases') }}
        </div>
        <div class="mt-4">
          {{ $t('~~Oldest Claimed Cases') }}
        </div>
        <div
          v-for="worksite in claimedWorksites"
          :key="worksite.id"
          class="grid grid-cols-12 items-center justify-start bg-crisiscleanup-light-smoke p-1 m-1"
        >
          <div class="flex items-center justify-start gap-1 col-span-6">
            <span class="font-semibold mr-1">{{ worksite.case_number }}</span>
            <div
              v-for="workType in worksite.work_types"
              :key="workType.id"
              class="flex items-center justify-center rounded-lg"
            >
              <WorksiteStatusDropdown
                class="block"
                :current-work-type="workType"
                use-icon
                hide-name
                size="sm"
                @input="
                  (value) => {
                    statusValueChange(value, workType, worksite.id);
                  }
                "
              />
            </div>
          </div>
          <div class="text-xs text-gray-500 col-span-4 justify-self-center">
            {{ $t('~~Claimed') }}
            {{ moment(worksite.updated_at).format('M/D/YY') }}
          </div>
          <div class="flex gap-2 justify-end col-span-2">
            <base-button
              variant="primary"
              class="rounded-full"
              :action="() => unclaimAll(worksite)"
              size="small"
              >{{ $t('~~Unclaim All') }}
            </base-button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="invitationRequests.length > 0">
      <div class="text-lg font-semibold">
        {{ $t('~~New Invitation Requests') }}
      </div>
      <div class="container mx-auto py-6 bg-white">
        <div class="space-y-4">
          <div
            v-for="invite in invitationRequests"
            :key="invite.id"
            class="border rounded-lg"
          >
            <div class="p-8">
              <div class="flex justify-between items-center mb-4">
                <div>
                  <div class="text-lg font-medium">
                    {{
                      $t(
                        '{requester} ask to join {requested_to_organization}',
                        {
                          requester: `${invite.first_name} ${invite.last_name}`,
                          requested_to_organization:
                            invite.requested_to_organization,
                        },
                      )
                    }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ momentFromNow(invite.requested_at) }}
                  </div>
                </div>
              </div>
              <div class="flex items-center">
                <div class="flex-1 flex flex-col">
                  <a class="text-sm" :href="`tel:${invite.mobile}`">
                    <i class="fas fa-phone-alt mr-2"></i>{{ invite.mobile }}
                  </a>
                  <a class="text-sm" :href="`mailto:${invite.email}`">
                    <i class="fas fa-envelope mr-2"></i>{{ invite.email }}
                  </a>
                </div>
              </div>
            </div>
            <div class="flex border-t p-2 justify-end gap-2">
              <base-button
                :action="() => acceptInvitationRequest(invite, fetchAllData)"
                variant="primary"
                class="rounded-full"
                size="small"
                >{{ $t('~~Approve') }}
              </base-button>
              <base-button
                :action="() => rejectInvitationRequest(invite, fetchAllData)"
                variant="outline"
                size="small"
                class="rounded-full"
                >{{ $t('~~Reject') }}
              </base-button>
              <base-button
                :action="() => archiveInvitationRequest(invite, fetchAllData)"
                variant="outline"
                size="small"
                class="rounded-full"
                >{{ $t('~~Ignore') }}
              </base-button>
            </div>
          </div>
        </div>
        <!--                  <a href="#" class="text-blue-500 hover:underline mt-2">{{-->
        <!--                    $t('~~View All Invitations →')-->
        <!--                  }}</a>-->
      </div>
    </div>
  </div>
</template>

<style scoped></style>
