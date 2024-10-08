<template>
  <div class="bg-white h-full h-84">
    <div class="flex justify-between">
      <div class="font-semibold flex justify-between items-center h-12 px-3">
        {{ team.name }}
      </div>
      <div class="flex flex-wrap items-center justify-end">
        <ccu-icon
          :alt="$t('actions.jump_to_case')"
          data-testid="testJumpToCaseIcon"
          size="small"
          class="p-2"
          type="go-case"
          @click="showAllOnMap()"
        />
        <ccu-icon
          :alt="$t('actions.delete')"
          data-testid="testDeleteTeamIcon"
          type="trash"
          class="p-2"
          size="small"
          @click="
            () => {
              deleteCurrentTeam();
            }
          "
        />
        <img
          :alt="$t('actions.rename_team')"
          data-testid="testRenameTeamIcon"
          src="@/assets/icons/edit.svg"
          class="cursor-pointer p-2"
          @click="showRenameModal = true"
        />
      </div>
    </div>
    <tabs
      v-if="team && allTeamUsers && assignedWorksites"
      ref="tabs"
      class="w-full"
    >
      <tab :name="`${$t('teams.manage_users')} (${allTeamUsers?.length})`">
        <div class="flex items-center justify-between p-2">
          <base-button
            class="my-1 text-primary-dark"
            data-testid="testAddMembersButton"
            type="link"
            :text="$t('teams.add_members')"
            :alt="$t('teams.add_members')"
            :action="
              () => {
                showAddMembersModal = true;
              }
            "
          />
          <div>
            <base-button
              variant="outline"
              data-testid="testRemoveFromTeamButton"
              class="px-2 py-1"
              :text="$t('teams.remove_from_team')"
              :alt="$t('teams.remove_from_team')"
              :disabled="selectedUsers?.length === 0"
              :action="
                () => {
                  removeFromTeam([...selectedUsers]);
                  selectedUsers = [];
                }
              "
            ></base-button>
          </div>
        </div>
        <div v-if="allTeamUsers" class="mt-2">
          <Table
            :columns="[
              {
                title: '',
                dataIndex: 'name',
                key: 'name',
                width: '25%',
              },
              {
                title: $t(''),
                dataIndex: 'email',
                key: 'email',
                width: '32%',
              },
              {
                title: $t(''),
                dataIndex: 'phone1',
                key: 'phone1',
                width: '30%',
              },
              {
                title: $t(''),
                dataIndex: 'actions',
                key: 'actions',
                width: '10%',
              },
            ]"
            :data="allTeamUsers"
            data-testid="testAllTeamUsersTable"
            enable-selection
            :body-style="{ height: '300px' }"
            @selection-changed="
              (selectedItems) => {
                selectedUsers = Array.from(selectedItems);
              }
            "
          >
            <template #name="slotProps">
              <div class="flex items-center">
                <Avatar
                  :initials="slotProps.item.first_name"
                  :url="slotProps.item.profilePictureUrl"
                  :data-testid="`testFirstName${slotProps.item.id}Div`"
                  classes="mb-1"
                  size="xsmall"
                />
                <span class="ml-2">{{ slotProps.item.full_name }}</span>
              </div>
            </template>
            <template #email="slotProps">
              <span>
                <font-awesome-icon
                  icon="envelope"
                  :alt="$t('actions.email')"
                  :data-testid="`testEnvelope${slotProps.item.id}Icon`"
                />
                {{ slotProps.item.email }}
              </span>
            </template>
            <template #phone1="slotProps">
              <span>
                <font-awesome-icon
                  icon="phone"
                  :alt="$t('actions.call')"
                  :data-testid="`testPhone${slotProps.item.id}Icon`"
                />
                {{ slotProps.item.mobile }}
              </span>
            </template>
            <template #actions="slotProps">
              <div style="margin-top: 2px" class="flex justify-end p-1">
                <v-popover
                  placement="bottom-end"
                  :triggers="['click']"
                  popper-class="user-details-team-popover"
                >
                  <ccu-icon
                    :alt="$t('teams.settings')"
                    data-testid="testTeamsSettingsIcon"
                    size="medium"
                    type="settings"
                  />
                  <template #popper>
                    <ul
                      class="overflow-auto w-56"
                      data-testid="testTeamsEmailsDiv"
                    >
                      <li
                        class="p-2 cursor-pointer hover:bg-crisiscleanup-light-grey"
                        data-testid="testSendUserEmailLink"
                      >
                        <font-awesome-icon
                          icon="envelope"
                          :alt="$t('actions.email')"
                          class="mr-1"
                        >
                        </font-awesome-icon>
                        <a :href="`mailto:${slotProps.item.email}`">{{
                          $t('teams.send_email')
                        }}</a>
                      </li>
                      <li
                        class="p-2 cursor-pointer hover:bg-crisiscleanup-light-grey"
                        data-testid="testEditUserProfileLink"
                      >
                        <font-awesome-icon
                          icon="user"
                          :alt="$t('nav.profile')"
                          class="mr-1"
                        >
                        </font-awesome-icon>
                        <a :href="`/organization/users/${slotProps.item.id}`">
                          {{ $t('teams.view_full_profile') }}
                        </a>
                      </li>
                      <li
                        class="p-2 cursor-pointer hover:bg-crisiscleanup-light-grey"
                        data-testid="testMoveToAnotherTeamLink"
                        @click="
                          () => {
                            moveToDifferentTeam(slotProps.item.id);
                          }
                        "
                      >
                        <font-awesome-icon
                          icon="pen"
                          :alt="$t('actions.edit')"
                          class="mr-1"
                        >
                        </font-awesome-icon>
                        {{ $t('teams.move_to_another_team') }}
                      </li>
                      <li
                        class="p-2 cursor-pointer hover:bg-crisiscleanup-light-grey"
                        data-testid="testRemoveFromTeamLink"
                        @click="
                          () => {
                            removeFromTeam([slotProps.item.id]);
                          }
                        "
                      >
                        <font-awesome-icon
                          icon="trash"
                          :alt="$t('actions.delete')"
                          class="mr-1"
                        >
                        </font-awesome-icon>
                        {{ $t('teams.remove_from_team') }}
                      </li>
                    </ul>
                  </template>
                </v-popover>
              </div>
            </template>
          </Table>
        </div>
      </tab>
      <tab :name="`${$t('teams.manage_cases')} (${assignedWorksites?.length})`">
        <div class="flex items-center justify-between p-2">
          <base-button
            class="my-1 text-primary-dark"
            data-testid="testAssignedClaimedCasesPlusButton"
            type="link"
            :text="$t('teams.assigned_claimed_cases_plus')"
            :alt="$t('teams.assigned_claimed_cases_plus')"
            :action="
              () => {
                showAddCasesModal = true;
              }
            "
          />
          <base-button
            variant="outline"
            data-testid="testRemoveFromTeam2Button"
            class="px-2 py-1"
            :text="$t('teams.remove_from_team')"
            :alt="$t('teams.remove_from_team')"
            :disabled="selectedWorksites?.length === 0"
            :action="
              () => {
                Promise.all(
                  selectedWorksites.map((id) => removeWorksiteFromTeam(id)),
                );
              }
            "
          ></base-button>
        </div>
        <div class="flex" style="min-width: 80px">
          <ccu-icon
            :alt="$t('casesVue.map_view')"
            data-testid="testMapViewIcon"
            size="medium"
            class="mr-4 cursor-pointer"
            :class="showingWorksiteMap ? 'filter-yellow' : 'filter-gray'"
            type="map"
            @click="toggleView('showingWorksiteMap')"
          />
          <ccu-icon
            :alt="$t('casesVue.table_view')"
            data-testid="testTableViewIcon"
            size="medium"
            class="mr-4 cursor-pointer"
            :class="showingWorksiteTable ? 'filter-yellow' : 'filter-gray'"
            type="table"
            @click="toggleView('showingWorksiteTable')"
          />
        </div>
        <div class="mt-2">
          <Table
            v-if="showingWorksiteTable"
            data-testid="testWorksiteTable"
            :columns="[
              {
                title: '',
                dataIndex: 'case_number',
                key: 'case_number',
                width: '7%',
              },
              {
                title: $t(''),
                dataIndex: 'work_types',
                key: 'work_types',
                width: '20%',
              },
              {
                title: $t(''),
                dataIndex: 'name',
                key: 'name',
                width: '15%',
              },
              {
                title: $t(''),
                dataIndex: 'full_address',
                key: 'full_address',
                width: '30%',
              },
              {
                title: $t(''),
                dataIndex: 'phone1',
                key: 'phone1',
                width: '15%',
              },
              {
                title: $t(''),
                dataIndex: 'actions',
                key: 'actions',
                width: '10%',
              },
            ]"
            :body-style="{ height: '300px' }"
            :data="assignedWorksites"
            enable-selection
            @selection-changed="
              (selectedItems) => {
                selectedWorksites = Array.from(selectedItems);
              }
            "
          >
            <template #case_number="slotProps">
              <div class="flex items-center">
                <span class="ml-2">{{ slotProps.item.case_number }}</span>
              </div>
            </template>
            <template #work_types="slotProps">
              <div class="flex flex-wrap w-full">
                <div
                  v-for="work_type in slotProps.item.work_types"
                  :key="`${work_type.id}`"
                  :data-testid="`testWorksiteDetails${work_type.id}Div`"
                  class="mx-1"
                >
                  <WorksiteStatusDropdown
                    class="block"
                    :data-testid="`testWorkTypeStatus${work_type.id}Select`"
                    :current-work-type="work_type"
                    use-icon
                    hide-name
                    @input="
                      (value) => {
                        statusValueChange(value, work_type, slotProps.item.id);
                      }
                    "
                  />
                </div>
              </div>
            </template>
            <template #actions="slotProps">
              <div class="flex items-start">
                <ccu-icon
                  :alt="$t('actions.jump_to_case')"
                  :data-testid="`testJumpToCase${slotProps.item.id}Icon`"
                  size="small"
                  class="p-1 py-2"
                  type="go-case"
                  @click="showOnMap(slotProps.item)"
                />
              </div>
              <div style="margin-top: 2px" class="flex justify-end">
                <v-popover
                  placement="bottom-end"
                  :triggers="['click']"
                  class-name="team-detail-case"
                >
                  <ccu-icon
                    :alt="$t('teams.settings')"
                    data-testid="testTeamsSettings2Icon"
                    size="medium"
                    type="settings"
                  />
                  <template #popper>
                    <ul class="overflow-auto w-40">
                      <li
                        class="py-2 cursor-pointer hover:bg-crisiscleanup-light-grey"
                        data-testid="testRemoveFromTeam3Button"
                        @click="
                          () => {
                            removeWorksiteFromTeam(slotProps.item.id);
                          }
                        "
                      >
                        {{ $t('teams.remove_from_team') }}
                      </li>
                    </ul>
                  </template>
                </v-popover>
              </div>
            </template>
          </Table>
          <WorkTypeMap
            v-if="showingWorksiteMap"
            data-testid="testMapView2Content"
            class="w-full h-96"
            :work-types="mapAssignedWorkTypes"
            :polygon="caseArea"
          ></WorkTypeMap>
        </div>
      </tab>
      <tab :name="$t('teams.notes')">
        <base-input
          :value="team?.notes"
          data-testid="testTeamsNotesTextInput"
          text-area
          :rows="4"
          :placeholder="$t('teams.notes')"
          @update:model-value="updateNotes"
          @blur="updateCurrentTeam"
        />
      </tab>
    </tabs>

    <modal
      v-if="showAddMembersModal"
      data-testid="testMembersModal"
      :title="$t('teams.add_members')"
      closeable
      modal-classes="max-w-xl"
      @close="showAddMembersModal = false"
    >
      <div class="px-5 py-2">
        <div class="py-2">
          {{ $t('teams.choose_members') }}
        </div>
        <div class="flex items-center justify-between mb-6">
          <base-input
            v-model="currentUserSearch"
            data-testid="testChooseMembersSearch"
            icon="search"
            class="w-64"
            :placeholder="$t('actions.search')"
            @update:model-value="onUserSearch"
          ></base-input>

          <AddFromList
            model-type="user_users"
            :title="$t('list.add_from_users')"
            :incident="currentIncidentId"
            @add-from-list="addUsersFromList"
          />
        </div>

        <div class="h-64 overflow-auto">
          <div
            v-for="user in userResults.filter(
              (user) => !team.users.includes(user.id),
            )"
            :key="`${user.id}`"
            :data-testid="`testUserResults${user.id}Div`"
            class="border-t pt-2"
          >
            <base-checkbox
              :model-value="usersToAdd.includes(user.id)"
              :data-testid="`testSelectUser${user.id}Checkbox`"
              @update:model-value="
                (value) => {
                  if (value) {
                    usersToAdd.push(user.id);
                  } else {
                    usersToAdd = usersToAdd.filter((id) => id !== user.id);
                  }
                }
              "
            >
              <div class="flex">
                <Avatar
                  :initials="user.first_name"
                  :url="user.profilePictureUrl"
                  class="mr-2 mb-4"
                  size="xsmall"
                />
                {{ user.full_name }}
              </div>
            </base-checkbox>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="p-3 flex items-center justify-center">
          <base-button
            :action="
              () => {
                showAddMembersModal = false;
              }
            "
            :text="$t('actions.cancel')"
            :alt="$t('actions.cancel')"
            data-testid="testCancelButton"
            variant="outline"
            class="ml-2 p-3 px-6 text-xs"
          />
          <base-button
            variant="solid"
            data-testid="testAddButton"
            :action="addUsers"
            :text="$t('actions.add')"
            :alt="$t('actions.add')"
            class="ml-2 p-3 px-6 text-xs"
          />
        </div>
      </template>
    </modal>
    <modal
      v-if="showAddCasesModal"
      data-testid="testAddCasesModal"
      :title="$t('teams.assign_cases')"
      closeable
      modal-classes="max-w-4xl"
      @close="showAddCasesModal = false"
    >
      <div class="flex">
        <div class="w-1/3">
          <WorkTypeMap
            class="w-full h-96"
            data-testid="testWorkTypeMapDiv"
            :work-types="mapWorkTypes"
          ></WorkTypeMap>
        </div>
        <div class="w-2/3 px-5 py-2 flex flex-col gap-2">
          <div class="py-2">
            {{ $t('teams.choose_cases') }}
          </div>
          <base-input
            v-model="currentCaseSearch"
            data-testid="testCaseSearch"
            icon="search"
            class="w-64"
            :placeholder="$t('actions.search')"
            @input="getClaimedWorksites"
          ></base-input>
          <div class="h-64 overflow-auto">
            <div
              v-for="worksite in assignableWorksites"
              :key="`${worksite.id}`"
              :data-testid="`testAssignableWorksiteDetail${worksite.id}Div`"
              class="border-t last:border-b py-3 px-3 bg-white"
              style="
                display: grid;
                grid-template-columns: 25px max-content 1fr 1fr 1fr;
                grid-gap: 10px;
              "
            >
              <base-checkbox
                :data-testid="`testAssignableWorksite${worksite.id}Checkbox`"
                @update:model-value="
                  (value) => {
                    const ids = worksite.work_types
                      .filter(
                        (type) =>
                          type.claimed_by === currentUser.organization.id,
                      )
                      .map((wt) => wt.id);
                    if (value) {
                      casesToAdd.push(...ids);
                    } else {
                      casesToAdd = casesToAdd.filter((id) => !ids.includes(id));
                    }
                  }
                "
              />
              <span>{{ worksite.case_number }}</span>
              <div class="flex flex-wrap w-full">
                <div
                  v-for="work_type in worksite.work_types"
                  :key="`${work_type.id}`"
                  :data-testid="`testWorkTypeList${work_type.id}Div`"
                  class="mx-1"
                >
                  <WorksiteStatusDropdown
                    class="block"
                    :data-testid="`testWorkTypeDropdown${work_type.id}Select`"
                    :current-work-type="work_type"
                    use-icon
                    hide-name
                    @input="
                      (value) => {
                        statusValueChange(value, work_type, worksite.id);
                      }
                    "
                  />
                </div>
              </div>
              <span>{{ worksite.name }}</span>
              <span>{{ worksite.full_address }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="p-3 flex items-center justify-center">
          <base-button
            :action="
              () => {
                showAddCasesModal = false;
                currentCaseSearch = null;
                getClaimedWorksites();
              }
            "
            :text="$t('actions.cancel')"
            :alt="$t('actions.cancel')"
            data-testid="testCancel2Button"
            variant="outline"
            class="ml-2 p-3 px-6 text-xs"
          />
          <base-button
            variant="solid"
            data-testid="testAddCases2Button"
            :action="addCases"
            :text="$t('actions.add')"
            :alt="$t('actions.add')"
            class="ml-2 p-3 px-6 text-xs"
          />
        </div>
      </template>
    </modal>
    <modal
      v-if="showRenameModal"
      data-testid="testRenameTeam2Modal"
      closeable
      :title="$t('actions.rename_team')"
      modal-classes="max-w-xl"
      @close="renameTeam"
    >
      <base-input
        v-model="team.name"
        data-testid="testTeamsNameTextInput"
        :placeholder="$t('teams.name')"
        class="w-64 m-6"
      />
    </modal>
  </div>
</template>

<script lang="ts">
import * as L from 'leaflet';
import axios, { AxiosError } from 'axios';
import { useToast } from 'vue-toastification';
import type { PropType } from 'vue';
import { getErrorMessage } from '@/utils/errors';
import Team from '@/models/Team';
import Worksite from '@/models/Worksite';
import Avatar from '@/components/Avatar.vue';
import WorksiteStatusDropdown from '@/components/WorksiteStatusDropdown.vue';
import WorkTypeMap from '@/components/WorkTypeMap.vue';
import { getQueryString } from '@/utils/urls';
import Table from '@/components/Table.vue';
import useDialogs from '@/hooks/useDialogs';
import User from '@/models/User';
import { useCurrentUser } from '@/hooks';
import AddFromList from '@/pages/lists/AddFromList.vue';
import ListDropdown from '@/pages/lists/ListDropdown.vue';

export default defineComponent({
  name: 'TeamDetail',
  components: {
    ListDropdown,
    AddFromList,
    Table,
    WorksiteStatusDropdown,
    Avatar,
    WorkTypeMap,
  },
  props: {
    workTypes: {
      type: Array as PropType<Record<string, any>[]>,
      default: () => [],
    },
    users: {
      type: Array as PropType<User[]>,
      default: () => [],
    },
    teams: {
      type: Array as PropType<Team[]>,
      default: () => [],
    },
  },
  emits: ['reload'],
  setup(props, ctx) {
    const $toasted = useToast();
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n();
    const { component: dialogComponent, selection, confirm } = useDialogs();
    const $http = axios;
    const { currentUser } = useCurrentUser();
    const userResults = ref<User[]>([]);
    const caseResults = ref<Record<string, any>[]>([]);
    const usersToAdd = ref([]);
    const casesToAdd = ref([]);
    const worksites = ref<Worksite[]>([]);
    const selectedUsers = ref([]);
    const selectedWorksites = ref([]);
    const showAddMembersModal = ref(false);
    const showAddCasesModal = ref(false);
    const showRenameModal = ref(false);
    const showingWorksiteTable = ref(true);
    const showingWorksiteMap = ref(false);
    const caseArea = ref<L.GeoJSON | null>(null);
    const currentUserSearch = ref('');
    const currentCaseSearch = ref('');

    const team = computed(() => {
      return Team.find(route.params.team_id) as Team;
    });
    const assignableWorksites = computed(() =>
      worksites.value.filter(
        (w) => !assignedWorksites.value.map((ws) => ws.id).includes(w.id),
      ),
    );
    const mapWorkTypes = computed(() =>
      assignableWorksites.value.map((worksite) => {
        const workType = Worksite.getWorkType(
          worksite.work_types,
          null,
          currentUser.value.organization,
        );
        return { ...workType, location: worksite.location };
      }),
    );
    const assignedWorksites = computed(() =>
      Worksite.query()
        .where((worksite: Worksite) => {
          return props.workTypes
            .filter((wt) => {
              return team.value?.assigned_work_types
                .map((awt) => awt.id)
                .includes(wt.id);
            })
            .map((awt) => awt.case_number)
            .includes(worksite.case_number);
        })
        .get(),
    );
    const mapAssignedWorkTypes = computed(() =>
      assignedWorksites.value.map((worksite) => {
        const workType = Worksite.getWorkType(
          worksite.work_types,
          null,
          currentUser.value?.organization,
        );
        return { ...workType, location: worksite.location };
      }),
    );
    const getUser = (id) => {
      return User.find(id);
    };

    const allTeamUsers = computed(
      () => team.value && team.value.users.map((u) => getUser(u)),
    );
    const currentIncidentId = computed(
      () => store.getters['incident/currentIncidentId'],
    );

    const getClaimedWorksites = async () => {
      const params: Record<string, unknown> = {
        incident: currentIncidentId.value,
        work_type__claimed_by: currentUser.value?.organization.id,
        fields:
          'id,name,address,case_number,work_types,city,state,county,flags,location,incident,postal_code,reported_by,form_data',
      };

      if (currentCaseSearch.value) {
        params.search = currentCaseSearch.value;
      }

      const results = await Worksite.api().get(
        `/worksites?${getQueryString(params)}`,
        {
          dataKey: 'results',
        },
      );
      worksites.value = (results.entities?.worksites || []) as Worksite[];
    };

    const renameTeam = async () => {
      await Team.update({
        where: team.value?.id,
        data: {
          name: team.value?.name,
        },
      });
      await updateCurrentTeam();
      showRenameModal.value = false;
    };

    const onUserSearch = () => {
      userResults.value = props.users.filter((user) => {
        return (
          user.full_name
            .toLowerCase()
            .includes(currentUserSearch.value.toLowerCase()) ||
          user.email
            .toLowerCase()
            .includes(currentUserSearch.value.toLowerCase())
        );
      });
    };

    const onCaseSearch = () => {
      caseResults.value = props.workTypes.filter((c) => {
        return (
          c.case_number
            .toLowerCase()
            .includes(currentCaseSearch.value.toLowerCase()) ||
          c.work_type
            .toLowerCase()
            .includes(currentCaseSearch.value.toLowerCase())
        );
      });
    };

    const addUsers = async () => {
      try {
        await Team.update({
          where: team.value?.id,
          data: {
            users: [
              ...new Set([...(team.value?.users || []), ...usersToAdd.value]),
            ],
          },
        });
        await updateCurrentTeam();
        usersToAdd.value = [];
        showAddMembersModal.value = false;
        ctx.emit('reload');
        $toasted.success('Successfully Added User');
      } catch (error) {
        $toasted.error(error);
      }
    };

    const updateNotes = (value: string) => {
      Team.update({
        where: team.value?.id,
        data: {
          notes: value,
        },
      });
    };

    const updateCurrentTeam = async () => {
      const result = await Team.api().patch(
        `/teams/${team.value?.id}`,
        team.value?.$toJson(),
      );
      return $toasted.success(t('teams.team_updated'));
    };

    const updateTeam = async (
      id: number | string,
      data: Record<string, any>,
    ) => {
      console.log('updateTeam', id, data);
      await Team.api().patch(`/teams/${id}`, data);
    };

    const getWorksite = async (id: number) => {
      const {
        response: { data },
      } = await Worksite.api().get(`/worksites/${id}`);
      return data;
    };

    const addUsersFromList = async (userIds) => {
      usersToAdd.value = [...new Set([...usersToAdd.value, ...userIds])];
      await addUsers();
    };

    const addCases = async () => {
      if (casesToAdd.value?.length) {
        await Promise.all(
          casesToAdd.value.map((c) =>
            $http.post(
              `${
                import.meta.env.VITE_APP_API_BASE_URL
              }/worksite_work_types_teams`,
              {
                team: team.value?.id,
                worksite_work_type: c,
              },
            ),
          ),
        );
      }

      casesToAdd.value = [];
      showAddCasesModal.value = false;
      currentCaseSearch.value = '';
      await getClaimedWorksites();
      ctx.emit('reload');
    };

    const removeFromTeam = async (userIds: number[]) => {
      const newUsers = team.value?.users.filter((id) => !userIds.includes(id));
      try {
        await Team.update({
          where: team.value?.id,
          data: {
            users: newUsers,
          },
        });
        $toasted.success('Removed User From Team');
        await updateCurrentTeam();
        ctx.emit('reload');
      } catch (error) {
        $toasted.error(error);
      }
    };

    const removeWorksiteFromTeam = async (worksiteId: number) => {
      const worksite = await getWorksite(worksiteId);

      const ids = new Set(
        worksite.work_types
          .filter((t) => t.claimed_by === currentUser.value?.organization.id)
          .map((wt) => wt.id),
      );

      const workTypesToDelete = (team.value?.assigned_work_types || []).filter(
        (awt) => ids.has(awt.id),
      );
      await Promise.all(
        workTypesToDelete.map((wt) => {
          return $http.delete(
            `${
              import.meta.env.VITE_APP_API_BASE_URL
            }/worksite_work_types_teams/${wt.id}`,
            {
              data: { team: team.value?.id },
            },
          );
        }),
      );
      ctx.emit('reload');
    };

    const toggleView = (
      view: 'showingWorksiteTable' | 'showingWorksiteMap',
    ) => {
      showingWorksiteTable.value = view === 'showingWorksiteTable';
      showingWorksiteMap.value = view === 'showingWorksiteMap';
    };

    const moveToDifferentTeam = async (userId) => {
      const _id: number = await selection({
        title: t('teams.move_teams'),
        content: '',
        label: 'name',
        itemKey: 'id',
        options: props.teams.filter((t) => t.id !== team.value?.id),
        placeholder: t('teams.select_target_team'),
      });
      const result = Team.find(_id);
      if (result && result.id) {
        await removeFromTeam([userId]);
        await Team.update({
          where: result.id,
          data: {
            users: [...(result.users || []), userId],
          },
        });
        const t = Team.find(result.id);
        if (t) {
          await updateTeam(t.id, t.$toJson());
        }

        ctx.emit('reload');
      }
    };

    const deleteCurrentTeam = async () => {
      const result = await confirm({
        title: t('teams.delete_team'),
        content: t('teams.delete_team_confirm'),
        actions: {
          no: {
            text: t('actions.cancel'),
            type: 'outline',
            buttonClass: 'border border-black',
          },
          yes: {
            text: t('teams.yes'),
            type: 'solid',
          },
        },
      });
      if (result === 'no' || result === 'cancel') {
        return;
      }

      try {
        await Team.api().delete(`/teams/${team.value?.id}`, {
          delete: team.value?.id,
        });
        $toasted.success('Successfully Deleted Team');
        ctx.emit('reload');
        await router.push('/organization/teams');
      } catch (error) {
        $toasted.error(error);
      }
    };

    const showOnMap = async (worksite: Worksite) => {
      const workType = Worksite.getWorkType(
        worksite.work_types,
        null,
        currentUser.value?.organization,
      );
      await dialogComponent({
        title: t('teams.view_case'),
        component: 'WorkTypeMap',
        classes: 'w-full h-96',
        props: {
          workTypes: [{ ...workType, location: worksite.location }],
        },
      });
    };

    const statusValueChange = async (
      value: string,
      workType: Record<string, any>,
      worksiteId: number,
    ) => {
      try {
        await Worksite.api().updateWorkTypeStatus(workType.id, value);
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      } finally {
        await Worksite.api().fetch(worksiteId);
      }
    };

    const showAllOnMap = async () => {
      await dialogComponent({
        title: t('teams.view_all_cases'),
        component: 'WorkTypeMap',
        classes: 'w-full h-96',
        props: {
          workTypes: assignedWorksites.value.map((worksite) => {
            const workType = Worksite.getWorkType(
              worksite.work_types,
              null,
              currentUser.value?.organization,
            );
            return { ...workType, location: worksite.location };
          }),
        },
      });
    };

    watch(showAddMembersModal, () => {
      onUserSearch();
    });
    watch(showAddCasesModal, () => {
      onCaseSearch();
    });

    onMounted(async () => {
      await Team.api().get(`/teams/${route.params.team_id}`);
      const feature = await Team.api().getCasesArea(
        route.params.team_id,
        currentIncidentId.value,
      );
      const geojsonFeature = {
        type: 'Feature',
        properties: {},
        geometry: feature.response.data,
      };
      caseArea.value = L.geoJSON(geojsonFeature, {
        weight: '1',
      });
      await getClaimedWorksites();
    });

    return {
      Promise,
      currentUser,
      userResults,
      caseResults,
      usersToAdd,
      casesToAdd,
      worksites,
      selectedUsers,
      selectedWorksites,
      showAddMembersModal,
      showAddCasesModal,
      showRenameModal,
      showingWorksiteTable,
      showingWorksiteMap,
      caseArea,
      currentUserSearch,
      currentCaseSearch,
      team,
      assignableWorksites,
      mapWorkTypes,
      assignedWorksites,
      mapAssignedWorkTypes,
      allTeamUsers,
      currentIncidentId,
      renameTeam,
      getClaimedWorksites,
      onUserSearch,
      onCaseSearch,
      addUsers,
      updateNotes,
      updateCurrentTeam,
      updateTeam,
      getWorksite,
      addCases,
      removeFromTeam,
      removeWorksiteFromTeam,
      toggleView,
      moveToDifferentTeam,
      deleteCurrentTeam,
      showOnMap,
      statusValueChange,
      showAllOnMap,
      addUsersFromList,
    };
  },
});
</script>

<style lang="postcss" scoped>
.team-detail-user-bp__btn--active {
  background: #fff;
}

.team-detail-user-bp__btn {
  @apply border-0;
}

.team-detail-case-bp__btn--active {
  background: #fff;
}

.team-detail-case-bp__btn {
  @apply border-0;
}
</style>
