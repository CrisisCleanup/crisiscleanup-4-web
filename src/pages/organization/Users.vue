<template>
  <!-- The filter panel and the user table are the same on a phone and on a
     desktop. Only the container around them is different. -->
  <component :is="DefineFilterPanel">
    <div
      class="flex items-center bg-crisiscleanup-light-grey w-full flex-wrap"
      :class="isMobile ? 'p-2 px-3' : 'p-1 px-2'"
      data-testid="testUserFiltersDiv"
    >
      {{ $t('usersVue.filters') }}
      <template v-for="(filter, key) in filters">
        <template
          v-for="(label, identifier) in filter.labels"
          :key="key + identifier"
        >
          <tag
            closeable
            class="m-1"
            @closed="
              () => {
                filter.removeField(identifier);
                onFilter();
              }
            "
          >
            {{ label }}
          </tag>
        </template>
      </template>
    </div>
    <div class="flex h-64">
      <div class="w-40 border-r">
        <div
          class="p-3 px-4 cursor-pointer"
          data-testid="testFilterRoleDiv"
          :class="{
            'border-l-2 border-l-black': currentFilterSection === 'role',
          }"
          @click="currentFilterSection = 'role'"
        >
          {{ $t('usersVue.role') }}
          <span
            v-if="filters.roles.count > 0"
            class="rounded-full px-1 bg-black text-white text-xs"
            >{{ filters.roles.count }}</span
          >
        </div>
        <div
          class="p-3 px-4 cursor-pointer"
          data-testid="testFilterInvitedByDiv"
          :class="{
            'border-l-2 border-l-black': currentFilterSection === 'invited_by',
          }"
          @click="currentFilterSection = 'invited_by'"
        >
          {{ $t('usersVue.invited_by') }}
          <span
            v-if="filters.invitedBy.count > 0"
            class="rounded-full px-1 bg-black text-white text-xs"
            >{{ filters.invitedBy.count }}</span
          >
        </div>
        <div
          class="p-3 px-4 cursor-pointer"
          data-testid="testFilterTeamDiv"
          :class="{
            'border-l-2 border-l-black': currentFilterSection === 'team',
          }"
          @click="currentFilterSection = 'team'"
        >
          {{ $t('usersVue.team') }}
          <span
            v-if="filters.team.count > 0"
            class="rounded-full px-1 bg-black text-white text-xs"
            >{{ filters.team.count }}</span
          >
        </div>
        <div
          class="p-3 px-4 cursor-pointer"
          data-testid="testFilterTeamDiv"
          :class="{
            'border-l-2 border-l-black': currentFilterSection === 'equipment',
          }"
          @click="currentFilterSection = 'equipment'"
        >
          {{ $t('usersVue.equipment') }}
          <span
            v-if="filters.equipment.count > 0"
            class="rounded-full px-1 bg-black text-white text-xs"
            >{{ filters.equipment.count }}</span
          >
        </div>
      </div>
      <div class="h-full overflow-auto p-2" :class="{ 'w-full': !isMobile }">
        <div v-if="currentFilterSection === 'role'">
          {{ $t('usersVue.role') }}
          <div v-for="role in roles" :key="`${role.id}`">
            <base-checkbox
              v-model="filters.roles.data[role.id]"
              :data-testid="`testUserRole${role.id}Checkbox`"
              class="block my-1"
              @update:model-value="onFilter"
              >{{ $t(role.name_t) }}
            </base-checkbox>
          </div>
        </div>
        <div v-if="currentFilterSection === 'invited_by'">
          {{ $t('usersVue.invited_by') }}
          <UserSearchInput
            :placeholder="$t('usersVue.search_users')"
            data-testid="testUserInvitedBySearch"
            class="my-1"
            @selected-user="onSelectedUser"
          />

          <div
            v-for="user in filters.invitedBy.data"
            :key="`${user.id}`"
            :data-testid="`testUserInvitedByResults${user.id}Div`"
          >
            {{ user.full_name }}
          </div>
        </div>
        <div v-if="currentFilterSection === 'team'">
          {{ $t('usersVue.team') }}
          <div v-for="team in teams" :key="`${team.id}`">
            <base-checkbox
              v-model="filters.team.data[team.id]"
              :data-testid="`testUserTeam${team.id}Checkbox`"
              class="block my-1"
              @update:model-value="onFilter"
              >{{ team.name }}
            </base-checkbox>
          </div>
          <base-checkbox
            v-model="filters.team.data[`no_team:${currentIncidentId}`]"
            :data-testid="`testNoUserTeamCheckbox`"
            class="block my-1"
            @update:model-value="onFilter"
            >{{ $t('usersVue.no_team') }}
          </base-checkbox>
        </div>
        <div v-if="currentFilterSection === 'equipment'">
          {{ $t('usersVue.equipment') }}
          <base-checkbox
            v-for="equipment in equipmentList"
            :key="equipment.id"
            :model-value="filters.equipment.data.includes(equipment.id)"
            :data-testid="`testUserEquipment${equipment.id}Checkbox`"
            class="block my-1 text-xs"
            @update:model-value="
              (value) => {
                if (value) {
                  filters.equipment.data = [
                    ...filters.equipment.data,
                    equipment.id,
                  ];
                } else {
                  filters.equipment.data = filters.equipment.data.filter(
                    (id) => id !== equipment.id,
                  );
                }
                onFilter();
              }
            "
            >{{ equipment.name }}</base-checkbox
          >
        </div>
      </div>
    </div>
  </component>
  <component :is="DefineUsersTable">
    <Table
      class="border flex-grow"
      :class="isMobile ? 'text-xs' : 'text-sm'"
      data-testid="testUserTable"
      :data="users"
      :columns="columns"
      :loading="usersLoading"
      hide-header
      :enable-selection="!isMobile"
      :body-style="isMobile ? {} : { height: '70vh' }"
      @selection-changed="
        (selectedItems) => {
          selectedUsers = Array.from(selectedItems);
        }
      "
      @row-click="openUser"
    >
      <template #data="slotProps">
        <div class="p-2 flex items-center">
          <img
            class="rounded-full mr-2 user-image"
            data-testid="testUserProfilePictureIcon"
            :src="slotProps.item.profilePictureUrl"
            :alt="$t('usersVue.profile_picture')"
          />
          <div>
            {{ slotProps.item.full_name }}
            <div class="text-crisiscleanup-grey-700">
              {{
                slotProps.item.currentRole &&
                $t(slotProps.item.currentRole.name_t)
              }}
            </div>
          </div>
        </div>
      </template>
      <template #actions="slotProps">
        <div
          class="flex items-center w-full"
          :class="{ 'justify-end': !isMobile }"
          data-testid="testUserEmailDiv"
        >
          <a
            :href="`mailto:${slotProps.item.email}`"
            :class="{ link: isMobile }"
          >
            <ccu-icon
              :linked="isMobile"
              :alt="$t('actions.chat')"
              data-testid="testUserChatIcon"
              type="chat"
              class="mx-1"
              size="large"
            />
          </a>
          <a :href="`tel:${slotProps.item.mobile}`" :class="{ link: isMobile }">
            <ccu-icon
              :linked="isMobile"
              :alt="$t('actions.call')"
              data-testid="testUserCallIcon"
              type="call"
              class="mx-1"
              size="small"
            />
          </a>
        </div>
      </template>
    </Table>
  </component>

  <div v-if="isMobile" class="p-3 grid grid-cols-1 gap-2">
    <InviteUsers />
    <base-input
      v-model="currentSearch"
      data-testid="testUserSearch"
      icon="search"
      class="w-full"
      :placeholder="$t('actions.search')"
      @update:model-value="onSearch"
    ></base-input>
    <div
      class="flex items-center bg-white border p-1 px-4 cursor-pointer h-10"
      @click="showUserFilterModal = true"
    >
      <div class="flex justify-between items-center w-full">
        {{ $t('usersVue.filters') }}
        <span
          v-if="filterCount > 0"
          class="rounded-full px-1 bg-black text-white text-xs text-center"
        >
          {{ filterCount }}
        </span>
      </div>
    </div>
    <modal
      v-if="showUserFilterModal"
      closeable
      :title="$t('usersVue.filters')"
      @close="showUserFilterModal = false"
    >
      <component :is="FilterPanel" />
    </modal>
    <component :is="UsersTable" />
    <UserEditModal
      v-if="selectedUser"
      data-testid="testUserEditModal"
      :user="selectedUser"
      @close="selectedUser = null"
      @save="saveUser"
    />
  </div>
  <div v-else class="flex h-full p-8 m-auto">
    <div class="w-full flex flex-col">
      <div class="flex items-center justify-between w-full">
        <div class="flex py-2">
          <div class="mr-4">
            <base-input
              v-model="currentSearch"
              data-testid="testUserSearch"
              icon="search"
              class="w-84"
              :placeholder="$t('actions.search')"
              @update:model-value="onSearch"
            ></base-input>
          </div>
          <v-popover
            :auto-hide="false"
            popover-class=""
            placement="bottom-start"
          >
            <div
              class="flex items-center bg-white border p-1 px-4 cursor-pointer sm:mr-64 h-10"
              @click="() => {}"
            >
              <div>
                {{ $t('usersVue.filters') }}
                <span
                  v-if="filterCount > 0"
                  class="rounded-full px-1 bg-black text-white text-xs"
                >
                  {{ filterCount }}
                </span>
              </div>
              <font-awesome-icon
                icon="sort"
                class="ml-20"
                :alt="$t('actions.sort')"
              />
            </div>
            <template #popper>
              <div class="bg-white shadow w-108 z-toolbar">
                <component :is="FilterPanel" />
              </div>
            </template>
          </v-popover>
        </div>

        <div class="flex items-center text-sm gap-2">
          <ListDropdown
            :selected-table-items="selectedUsers"
            model-type="user_users"
            :title="$t('list.user_lists')"
          />
          <base-button
            :text="$t('actions.download_csv')"
            :alt="$t('actions.download_csv')"
            data-testid="testDownloadOrgUsersCSVButton"
            variant="solid"
            size="medium"
            :action="downloadCSV"
          />
          <InviteUsers />
        </div>
      </div>
      <div class="user-grid">
        <div class="sm:w-96 w-full flex flex-col h-full">
          <component :is="UsersTable" />
        </div>
        <div class="flex-grow">
          <div class="h-full flex flex-col bg-white shadow">
            <router-view></router-view>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapKeys, startCase, throttle } from 'lodash-es';
import { useViewport } from '@/hooks/useViewport';
import { useToast } from 'vue-toastification';
import InviteUsers from '@/components/modals/InviteUsers.vue';
import User from '@/models/User';
import Role from '@/models/Role';
import Equipment from '@/models/Equipment';
import Table from '@/components/Table.vue';
import { getQueryString } from '@/utils/urls';
import UserSearchInput from '@/components/UserSearchInput.vue';
import UserRoleFilter from '@/utils/data_filters/UserRoleFilter';
import UserInvitedByFilter from '@/utils/data_filters/UserInvitedByFilter';
import UserEquipmentFilter from '@/utils/data_filters/UserEquipmentFilter';
import Modal from '@/components/Modal.vue';
import UserEditModal from '@/pages/organization/UserEditModal.vue';
import { getErrorMessage } from '@/utils/errors';
import { useCurrentIncident, useCurrentUser } from '@/hooks';
import { unparse } from 'papaparse';
import moment from '@/utils/dates';
import AjaxTable from '@/components/AjaxTable.vue';
import ListDropdown from '@/pages/lists/ListDropdown.vue';
import { downloadCSVFile } from '@/utils/downloads';
import UserTeamFilter from '@/utils/data_filters/UserTeamFilter';
import Team from '@/models/Team';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import type { Collection } from '@vuex-orm/core';

export default defineComponent({
  name: 'Users',
  components: {
    BaseCheckbox,
    ListDropdown,
    AjaxTable,
    UserEditModal,
    Modal,
    InviteUsers,
    Table,
    UserSearchInput,
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const { isMobile } = useViewport();
    const [DefineFilterPanel, FilterPanel] = createReusableTemplate();
    const [DefineUsersTable, UsersTable] = createReusableTemplate();
    const { t } = useI18n();
    const $toasted = useToast();
    const { currentIncidentId, currentIncident, isCurrentIncidentLoading } =
      useCurrentIncident();

    const currentFilterSection = ref<
      'role' | 'invited_by' | 'team' | 'equipment'
    >('role');
    const currentSearch = ref();
    const currentFilter = ref({});
    const filters = reactive({
      roles: new UserRoleFilter('roles', {}),
      invitedBy: new UserInvitedByFilter('invitedBy', new Set([])),
      team: new UserTeamFilter('team', {}),
      equipment: new UserEquipmentFilter('equipment', []),
    });
    const usersLoading = ref(false);
    const users = ref<unknown[]>([]);
    const selectedUsers = ref<number[]>([]);
    const teams = ref<Team[]>([]);
    const equipmentList = ref<Equipment[]>([]);
    const columns = ref([
      {
        title: '',
        dataIndex: 'data',
        key: 'data',
        width: '2fr',
      },
      {
        title: '',
        dataIndex: 'actions',
        key: 'actions',
        width: '1fr',
      },
    ]);

    const getEquipmentList = async () => {
      const results = await Equipment.api().get(`/equipment`, {
        dataKey: 'results',
      });
      return (results.entities?.equipment || []) as Collection<Equipment>;
    };

    const roles = computed(() => {
      return Role.all();
    });
    const getTeams = async () => {
      const results = await Team.api().get(
        `/teams?incident=${currentIncidentId.value}`,
        {
          dataKey: 'results',
        },
      );
      teams.value = (results.entities?.teams || []) as Team[];
    };

    const { currentUser } = useCurrentUser();
    const filterCount = computed(() => {
      return Object.values(filters).reduce((total, obj) => {
        return total + obj.getCount();
      }, 0);
    });
    const showUserFilterModal = ref(false);
    const selectedUser = ref<User | null>(null);

    onMounted(async () => {
      const results = await User.api().get(
        `/users?organization=${currentUser.value?.organization.id}&limit=10000`,
        { dataKey: 'results' },
      );
      users.value = results.entities?.users || [];

      await getTeams();
      equipmentList.value = await getEquipmentList();
    });

    const onSearch = throttle(async function (search) {
      const queryParams = {
        search,
        organization: currentUser.value?.organization.id,
      };
      usersLoading.value = true;
      const results = await User.api().get(
        `/users?${getQueryString(queryParams)}`,
        { dataKey: 'results' },
      );
      users.value = results.entities?.users || [];
      usersLoading.value = false;
    }, 300);

    // A phone edits the user in a modal. A desktop shows the user next to the
    // table, on a child route.
    function openUser(user: User) {
      if (isMobile.value) {
        selectedUser.value = user;
      } else {
        router.push(`/organization/users/${user.id}`);
      }
    }

    function onSelectedUser(user: User) {
      filters.invitedBy.data = new Set(filters.invitedBy.data.add(user));
      onFilter();
    }

    async function onFilter() {
      currentFilter.value = {};
      for (const filter of Object.values(filters)) {
        currentFilter.value = {
          ...currentFilter.value,
          ...filter.packFunction(),
        };
      }

      const queryParams: Record<string, unknown> = {
        organization: currentUser.value?.organization.id,
        ...currentFilter.value,
      };

      if (currentSearch.value) {
        queryParams.search = currentSearch.value;
      }

      usersLoading.value = true;
      const results = await User.api().get(
        `/users?${getQueryString(queryParams)}`,
        { dataKey: 'results' },
      );
      users.value = results.entities?.users || [];
      usersLoading.value = false;
    }

    async function saveUser() {
      try {
        if (!isDefined(selectedUser)) {
          $toasted.error(t('profileUser.save_user_fail'));
          return;
        }

        await User.api().patch(`/users/${selectedUser.value.id}`, {
          ...selectedUser.value.$toJson(),
        });
        await $toasted.success(t('profileUser.save_user_success'));
        selectedUser.value = null;
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      }
    }

    /**
     * Headers:
     *  First Name
     *  Last Name
     *  Phone Number
     *  Email
     *  Invited By (User first, last name)
     *  Sign in Count
     *  Last Logged In (at the time zone of the current incident)
     */
    async function downloadCSV() {
      const orgUsers = users.value as User[];
      const usersToDownload: Record<string, any>[] = [];
      const referringUsersIds: number[] = orgUsers
        .map((u) => u.referring_user)
        .filter(Boolean);
      await User.fetchOrFindId(referringUsersIds);
      console.info(
        'CurrentIncident timezone',
        currentIncidentId.value,
        isCurrentIncidentLoading.value,
        currentIncident.timezone,
      );
      for (const u of orgUsers) {
        console.log('Transforming user', u.id);
        const referringUser = User.find(u.referring_user);
        const userInfo = {
          firstName: u.first_name,
          lastName: u.last_name,
          phoneNumber: u.mobile,
          email: u.email,
          invitedBy: referringUser?.full_name,
          signInCount: u.sign_in_count ?? 0,
          lastLoggedIn: moment(u.current_sign_in_at).isValid()
            ? moment(u.current_sign_in_at)
                .tz(currentIncident.timezone)
                .format('MMMM Do YYYY, h:mm:ss a')
            : undefined,
        };
        // convert keys to 'Start Case' for csv headers
        const transformedUser = mapKeys(userInfo, (v, k) => startCase(k));
        usersToDownload.push(transformedUser);
      }
      console.info('Users', usersToDownload);
      const csvContent = unparse(usersToDownload);
      downloadCSVFile(csvContent, 'orgUsers.csv');
    }

    return {
      currentFilterSection,
      currentSearch,
      currentFilter,
      currentIncidentId,
      filters,
      usersLoading,
      users,
      columns,
      roles,
      currentUser,
      filterCount,
      onFilter,
      onSearch,
      onSelectedUser,
      openUser,
      isMobile,
      DefineFilterPanel,
      FilterPanel,
      DefineUsersTable,
      UsersTable,
      showUserFilterModal,
      selectedUser,
      saveUser,
      selectedUsers,
      downloadCSV,
      teams,
      equipmentList,
    };
  },
});
</script>

<style lang="postcss" scoped>
.user-image {
  width: 50px;
  height: 50px;
}
</style>

<style>
.vue-tags-input .ti-tag {
  @apply relative bg-crisiscleanup-grey-100 text-black;
}

.user-grid {
  @apply flex-grow;
  display: grid;
  grid-template-columns: auto 5fr;
}
</style>
