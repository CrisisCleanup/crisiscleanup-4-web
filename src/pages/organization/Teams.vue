<template>
  <div class="px-8 py-4">
    <div class="flex justify-between items-center mr-4 mb-6">
      <base-input
        v-model="currentSearch"
        data-testid="testTeamSearch"
        icon="search"
        class="w-84"
        :placeholder="$t('actions.search')"
        @update:model-value="onSearch"
      ></base-input>
    </div>
    <div style="display: grid; grid-template-columns: 0.75fr 2fr" class="h-120">
      <div class="border bg-white">
        <div class="px-2 py-3">
          <div>{{ $t('teams.team_management') }}</div>
          <div class="flex items-center">
            <base-button
              :text="$t('teams.create_new_team')"
              :alt="$t('teams.create_new_team')"
              data-testid="testTeamCreateBtn"
              variant="solid"
              :action="
                () => {
                  creatingTeam = true;
                }
              "
              class="p-1"
            />
            <ListDropdown
              :selected-table-items="selectedTeams"
              :incident="currentIncidentId"
              model-type="organization_organizations_incidents_teams"
              :title="$t('list.team_lists')"
            />
          </div>
        </div>
        <div
          style="
            display: grid;
            grid-template-columns: auto;
            grid-auto-rows: min-content;
          "
          class="overflow-auto h-120"
          data-testid="testTeamsContainerDiv"
        >
          <div
            v-for="team in teams"
            :key="`${team.id}`"
            class="h-full p-4 hover:bg-crisiscleanup-light-grey cursor-pointer"
            :class="
              String(team.id) === String($route.params.team_id)
                ? 'bg-crisiscleanup-light-grey'
                : 'bg-white'
            "
            @click="
              () => {
                $router.push(`/organization/teams/${team.id}`);
              }
            "
          >
            <div class="flex items-center">
              <base-checkbox
                :model-value="selectedTeams.includes(team.id)"
                @update:model-value="toggleTeamSelection(team.id)"
              >
              </base-checkbox>

              <div class="w-full">
                <div class="flex justify-between items-center w-full">
                  <base-text>{{ team.name }}</base-text>
                  <base-text
                    >{{ getAssignedWorkTypes(team)?.length }}
                    {{ $t('teams.cases_assigned') }}
                  </base-text>
                </div>
                <div>
                  {{ getCaseCompletion(team) }}
                  {{ $t('teams.cases_completed') }}
                </div>
                <div
                  v-if="team.users.length > 0"
                  class="mt-2 grid users-avatars-list"
                >
                  <template v-for="user in team.users.map((u) => getUser(u))">
                    <Avatar
                      v-if="user"
                      :key="`${user.id}`"
                      :initials="user.first_name"
                      :url="user.profilePictureUrl"
                      class="mr-2"
                      size="xsmall"
                    />
                  </template>
                </div>
                <div v-else class="py-2">
                  {{ $t('list.no_team_members') }}
                </div>
              </div>
            </div>
          </div>
          <div
            class="h-full p-4 hover:bg-crisiscleanup-light-grey cursor-pointer"
            :class="
              String('unassigned') === String($route.params.team_id)
                ? 'bg-crisiscleanup-light-grey'
                : 'bg-white'
            "
            @click="
              () => {
                $router.push(`/organization/teams/unassigned`);
              }
            "
          >
            <div class="flex items-center">
              <div class="w-full">
                <div class="flex justify-between items-center w-full">
                  <base-text>{{ $t('teams.unassigned_users') }}</base-text>
                </div>
                <div
                  v-if="usersWithoutTeams"
                  class="mt-2 grid users-avatars-list"
                >
                  <template
                    v-for="user in usersWithoutTeams
                      .slice(0, 10)
                      .map((u) => getUser(u.id))"
                  >
                    <Avatar
                      v-if="user"
                      :key="`${user.id}`"
                      :initials="user.first_name"
                      :url="user.profilePictureUrl"
                      class="mr-2"
                      size="xsmall"
                    />
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="h-full">
        <div class="h-full flex flex-col bg-white shadow">
          <router-view
            v-if="teams && teams.length > 0"
            :key="$route.params.team_id"
            :work-types="claimedWorktypes"
            :users="usersWithoutTeams"
            :teams="teams"
            @reload="getData"
            @filter-unassigned-user-equipment="filterUnassignedUserEquipment"
          ></router-view>
        </div>
      </div>
    </div>
    <CreateTeamModal
      v-if="creatingTeam"
      :users="usersWithoutTeams"
      :cases="claimedWorktypes"
      :teams="teams"
      @close="creatingTeam = false"
      @saved="onTeamCreate"
    />
  </div>
</template>

<script lang="ts">
import CreateTeamModal from './CreateTeamModal.vue';
import User from '@/models/User';
import Team from '@/models/Team';
import Worksite from '@/models/Worksite';
import Avatar from '@/components/Avatar.vue';
import { getQueryString } from '@/utils/urls';
import enums from '@/store/modules/enums';
import { useCurrentUser } from '@/hooks';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import ListDropdown from '@/pages/lists/ListDropdown.vue';
import { useToast } from 'vue-toastification';

export default defineComponent({
  name: 'Teams',
  components: { ListDropdown, BaseCheckbox, CreateTeamModal, Avatar },
  setup() {
    const store = useStore();
    const currentSearch = ref('');
    const creatingTeam = ref(false);
    const users = ref<User[]>([]);
    const usersWithoutTeams = ref<User[]>([]);
    const teams = ref<Team[]>([]);
    const selectedTeams = ref([]);
    const $toast = useToast();

    const { currentUser } = useCurrentUser();
    const currentIncidentId = computed(
      () => store.getters['incident/currentIncidentId'] as number,
    );
    const claimedWorktypes = computed(() => {
      const query = Worksite.query().where((worksite: Worksite) => {
        if (
          worksite.work_types &&
          currentIncidentId.value === worksite.incident
        ) {
          const claimed = worksite.work_types.find(
            (workType) =>
              workType.claimed_by === currentUser.value.organization.id,
          );
          return Boolean(claimed);
        }

        return false;
      });
      const worksites = query.get() as Worksite[];
      const workTypes: Record<string, any>[] = [];
      for (const w of worksites) {
        for (const wt of w.work_types) {
          if (wt.claimed_by === currentUser.value.organization.id) {
            const closedStatuses = enums.state.statuses.filter(
              (status) => status.primary_state === 'closed',
            );

            workTypes.push({
              case_number: w.case_number,
              phone1: w.phone1,
              location: w.location,
              name: w.name,
              email: w.email,
              ...wt,
              completed: closedStatuses
                .map((status) => status.status)
                .includes(wt.status),
            });
          }
        }
      }

      return workTypes;
    });

    const getUser = (id: number) => {
      return User.find(id);
    };

    const getTeams = async () => {
      const results = await Team.api().get(
        `/teams?search=${currentSearch.value || ''}&limit=500&incident=${
          currentIncidentId.value
        }`,
        {
          dataKey: 'results',
        },
      );
      teams.value = (results.entities?.teams || []) as Team[];
    };

    const getAssignedWorkTypes = (team: Team) => {
      return claimedWorktypes.value.filter((wt) => {
        return team.assigned_work_types.map((awt) => awt.id).includes(wt.id);
      });
    };

    const getCaseCompletion = (team: Team) => {
      const workTypes = getAssignedWorkTypes(team);
      if (workTypes && workTypes.length > 0) {
        return Number(
          (workTypes.filter((wt) => Boolean(wt.completed)).length /
            workTypes.length) *
            100,
        ).toFixed(0);
      }

      return 0;
    };

    const getClaimedWorksites = async () => {
      const params = {
        incident: currentIncidentId.value,
        work_type__claimed_by: currentUser.value.organization.id,
        limit: 500,
        fields:
          'id,name,address,case_number,work_types,city,state,county,flags,location,incident,postal_code,reported_by,form_data',
      };

      Worksite.api().get(`/worksites?${getQueryString(params)}`, {
        dataKey: 'results',
      });
    };

    const getData = async () => {
      const results = await User.api().get(
        `/users?organization=${currentUser.value.organization.id}&limit=500&fields=id,first_name,last_name,files,email,mobile`,
        {
          dataKey: 'results',
        },
      );
      const usersWithoutTeamsResults = await User.api().get(
        `/users?organization=${currentUser.value.organization.id}&no_team_incident=${currentIncidentId.value}&limit=500&fields=id,first_name,last_name,files,email,mobile`,
        {
          dataKey: 'results',
        },
      );
      users.value = (results.entities?.users || []) as User[];
      usersWithoutTeams.value = (usersWithoutTeamsResults.entities?.users ||
        []) as User[];
      await getTeams();
      await getClaimedWorksites();
    };

    const filterUnassignedUserEquipment = async (data) => {
      const params = {
        organization: currentUser.value.organization.id,
        no_team_incident: currentIncidentId.value,
        limit: 500,
        fields: 'id,first_name,last_name,files,email,mobile',
        ...data,
      };

      const queryString = new URLSearchParams(params).toString();

      const usersWithoutTeamsResults = await User.api().get(
        `/users?${queryString}`,
        {
          dataKey: 'results',
        },
      );
      usersWithoutTeams.value = (usersWithoutTeamsResults.entities?.users ||
        []) as User[];
    };

    const onTeamCreate = () => {
      $toast.success('Successfully Created Team');
      getData();
    };

    const onSearch = async () => {
      await getTeams();
    };

    const toggleTeamSelection = (id: number) => {
      selectedTeams.value = selectedTeams.value.includes(id)
        ? selectedTeams.value.filter((t) => t !== id)
        : [...selectedTeams.value, id];
    };

    watch(currentIncidentId, (newState, oldState) => {
      if (String(newState) !== String(oldState)) {
        getData().then(() => {});
      }
    });

    onMounted(async () => {
      await getData();
    });
    return {
      getTeams,
      getUser,
      getData,
      onSearch,
      getAssignedWorkTypes,
      getCaseCompletion,
      getClaimedWorksites,
      filterUnassignedUserEquipment,
      currentSearch,
      creatingTeam,
      users,
      usersWithoutTeams,
      teams,
      currentUser,
      claimedWorktypes,
      selectedTeams,
      toggleTeamSelection,
      currentIncidentId,
      onTeamCreate,
    };
  },
});
</script>

<style lang="postcss" scoped>
.users-avatars-list {
  grid-template-columns: repeat(auto-fill, 3.5rem);
}
</style>
