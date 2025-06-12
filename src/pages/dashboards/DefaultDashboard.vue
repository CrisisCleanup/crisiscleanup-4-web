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
import useWorksiteMap from '@/hooks/worksite/useWorksiteMapRefactored';
import { useCurrentIncident } from '@/hooks';
import VolunteerChart from '@/components/dashboard/VolunteerChart.vue';
import SimpleMap from '@/components/SimpleMap.vue';
import DownloadAppBanner from '@/components/dashboard/DownloadAppBanner.vue';
import { useWebSockets } from '@/hooks/useWebSockets';
import type User from '@/models/User';
import { computed, ref } from 'vue';
import useDialogs from '@/hooks/useDialogs';
import UserList from '@/components/user/UserList.vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { DbService, USER_DATABASE } from '@/services/db.service';

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
const { component } = useDialogs();
const { t } = useI18n();

const engagementData = ref([]);
const dashboardStatistics = ref<any>(null);
const online_users_socket = ref<WebSocket | null>(null);
const allOnlineUsers = ref<number[]>([]);
const mobileOnlineUsers = ref<number[]>([]);
const userCache = ref<{ [key: number]: User }>({});

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

const getUsersById = async (ids: number[]) => {
  // Initialize arrays to track missing IDs
  const missingIdsFromCache = ids.filter((id) => !userCache.value[id]);
  const missingIdsFromDb: number[] = [];

  // Try to retrieve missing users from the DbService
  for (const id of missingIdsFromCache) {
    const user = await DbService.getItem(`user_${id}`, USER_DATABASE);
    if (user) {
      userCache.value[id] = user as User;
    } else {
      missingIdsFromDb.push(id);
    }
  }

  // Fetch remaining missing users from the API
  // if (missingIdsFromDb.length > 0) {
  //   const response = await axios.get(
  //     `${import.meta.env.VITE_APP_API_BASE_URL}/users?id__in=${missingIdsFromDb.join(
  //       ',',
  //     )}&limit=1000&fields=id,first_name,last_name,organization,email,mobile`,
  //   );
  //   const userList = response.data.results;
  //   for (const user of userList) {
  //     userCache.value[user.id] = user;
  //     // Store the user in the DbService for future use
  //     await DbService.setItem(`user_${user.id}`, user, USER_DATABASE);
  //   }
  // }

  // Return the users in the order of the original IDs array
  return ids.map((id) => userCache.value[id]);
};

const onlineUsersWithData = computed(() => {
  const result = [];
  for (const id of allOnlineUsers.value) {
    const user = userCache.value[id];
    if (!user) {
      console.info('User not found in store', id, user);
      continue;
    }
    result.push(user);
  }
  console.debug('Found online users', result);
  return result;
});

async function showOnlineUsersList() {
  await component({
    title: t('chat.online_users'),
    component: UserList,
    classes: 'w-full h-108 overflow-auto p-3',
    modalClasses: 'bg-white max-w-3xl shadow',
    props: {
      users: onlineUsersWithData.value,
      mobileOnlineUserIds: mobileOnlineUsers.value,
    },
  });
}

onBeforeMount(() => {
  const { socket: online_users_s } = useWebSockets(
    '/ws/online_chat_users',
    'phone_stats',
    async (data) => {
      const users = Object.keys(data)
        .map((key) => {
          const user = JSON.parse(data[key]);
          return {
            id: user.user_id,
            is_mobile: user.is_mobile,
            last_seen_at: user.last_seen_at,
          };
        })
        .filter(
          (user) => moment().diff(moment(user.last_seen_at), 'minutes') < 5,
        );

      allOnlineUsers.value = users.map((u) => u.id);
      await getUsersById(allOnlineUsers.value);
      mobileOnlineUsers.value = users
        .filter((u) => u.is_mobile)
        .map((u) => u.id);
    },
  );
  online_users_socket.value = online_users_s;
});

onMounted(() => {
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
  <DownloadAppBanner />
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6 p-8">
    <div>
      <h2 class="font-bold text-lg mb-3 flex justify-between">
        {{ $t('dashboard.disaster_map') }}
        <router-link :to="`/incident/${currentIncidentId}/work`"
          ><span class="text-crisiscleanup-dark-blue text-sm hover:underline">{{
            $t('actions.go_to_work_map')
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
      <h2 class="font-bold text-lg mb-3">
        {{ $t('reports.velocity_widget') }}
      </h2>
      <VolunteerChart
        :key="JSON.stringify(engagementData)"
        class="h-84"
        :data="engagementData"
      />
    </div>
  </div>

  <div
    v-if="dashboardStatistics"
    class="grid md:grid-cols-4 grid-cols-3 gap-2 mt-10 p-8"
  >
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
      <p>{{ $t('dashboard.total_claimed_cases') }}</p>
      <p>
        <router-link
          :to="`/incident/${currentIncidentId}/work?work_type__claimed_by=${currentUser.organization.id}`"
          >{{ dashboardStatistics.total_claimed_cases }}
        </router-link>
      </p>
    </div>
    <div class="stats-card">
      <p>{{ $t('dashboard.total_unclaimed_cases') }}</p>
      <p>
        <router-link
          :to="`/incident/${currentIncidentId}/work?work_type__claimed_by__isnull=true`"
          >{{ dashboardStatistics.total_unclaimed_cases }}
        </router-link>
      </p>
    </div>
    <div class="stats-card">
      <p>{{ $t('dashboard.total_closed_cases') }}</p>
      <p>
        <router-link
          :to="`/incident/${currentIncidentId}/work?work_type__status__primary_state=closed`"
          >{{ dashboardStatistics.total_closed_cases }}
        </router-link>
      </p>
    </div>
    <div class="stats-card">
      <p>{{ $t('dashboard.total_open_cases') }}</p>
      <p>
        <router-link
          :to="`/incident/${currentIncidentId}/work?work_type__status__primary_state=open`"
          >{{ dashboardStatistics.total_open_cases }}
        </router-link>
      </p>
    </div>
    <div class="stats-card">
      <p>{{ $t('dashboard.active_users_today') }}</p>
      <p class="text-primary-dark cursor-pointer" @click="showOnlineUsersList">
        {{ dashboardStatistics.active_users_today }}
      </p>
    </div>
  </div>
  <div v-if="inboundWorksiteRequests.length > 0" class="p-8">
    <h2 class="font-bold text-base mt-10">
      {{ $t('dashboard.case_transfer_requests') }}
    </h2>
    <div v-if="inboundWorksiteRequests.length > 0">
      <div>{{ $t('dashboard.inbound_requests') }}</div>
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
          {{ $t('dashboard.requested_by') }}
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
            :alt="$t('actions.approve')"
            >{{ $t('actions.approve') }}
          </base-button>
          <base-button
            variant="outline"
            class="rounded-full"
            :action="() => rejectWorksiteRequest(request.id, fetchAllData)"
            size="small"
            :alt="$t('actions.reject')"
            >{{ $t('actions.reject') }}
          </base-button>
        </div>
      </div>
    </div>

    <!--              <a-->
    <!--                href="#"-->
    <!--                class="text-blue-500 hover:text-blue-700 transition duration-300 ease-in-out text-sm font-bold"-->
    <!--                >{{ $t('actions.view_all_transfer_requests') }}</a-->
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
            $t('dashboard.open_case_count', {
              count: claimedWorksites.length,
            })
          }}
        </div>
        <div class="text-sm opacity-75">
          {{ $t('dashboard.please_close_and_unclaim') }}
        </div>
        <div class="mt-4">
          {{ $t('dashboard.oldest_claimed_cases') }}
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
            {{ $t('dashboard.claimed') }}
            {{ moment(worksite.updated_at).format('M/D/YY') }}
          </div>
          <div class="flex gap-2 justify-end col-span-2">
            <base-button
              variant="primary"
              class="rounded-full"
              :action="() => unclaimAll(worksite)"
              :alt="$t('actions.unclaim_all')"
              size="small"
              >{{ $t('actions.unclaim_all') }}
            </base-button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="invitationRequests.length > 0">
      <div class="text-lg font-semibold">
        {{ $t('dashboard.new_invitation_requests') }}
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
                      $t('dashboard.invitation_request_from_organization', {
                        requester: `${invite.first_name} ${invite.last_name}`,
                        requested_to_organization:
                          invite.requested_to_organization,
                      })
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
                :alt="$t('actions.approve')"
                variant="primary"
                class="rounded-full"
                size="small"
                >{{ $t('actions.approve') }}
              </base-button>
              <base-button
                :action="() => rejectInvitationRequest(invite, fetchAllData)"
                :alt="$t('actions.reject')"
                variant="outline"
                size="small"
                class="rounded-full"
                >{{ $t('actions.reject') }}
              </base-button>
              <base-button
                :action="() => archiveInvitationRequest(invite, fetchAllData)"
                :alt="$t('actions.ignore')"
                variant="outline"
                size="small"
                class="rounded-full"
                >{{ $t('actions.ignore') }}
              </base-button>
            </div>
          </div>
        </div>
        <!--                  <a href="#" class="text-blue-500 hover:underline mt-2">{{-->
        <!--                    $t('actions.view_all_invitations')-->
        <!--                  }}</a>-->
      </div>
    </div>
  </div>
</template>

<style scoped></style>
