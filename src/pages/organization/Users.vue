<template>
  <template v-if="mq.mdMinus">
    <div class="p-3 grid grid-cols-1 gap-2">
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
        <div
          class="flex items-center bg-crisiscleanup-light-grey p-1 px-2 w-full flex-wrap"
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
                'border-l-2 border-l-black':
                  currentFilterSection === 'invited_by',
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
          </div>
          <div class="w-64 p-2">
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
          </div>
        </div>
      </modal>
      <Table
        class="border text-xs flex-grow"
        data-testid="testUserTable"
        :data="users"
        :columns="columns"
        :loading="usersLoading"
        hide-header
        @row-click="
          (user) => {
            selectedUser = user;
          }
        "
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
            class="flex items-center md:justify-end w-full"
            data-testid="testUserEmailDiv"
          >
            <a :href="`mailto:${slotProps.item.email}`" class="link">
              <ccu-icon
                linked
                :alt="$t('actions.chat')"
                data-testid="testUserChatIcon"
                type="chat"
                class="mx-1"
                size="large"
              />
            </a>
            <a :href="`tel:${slotProps.item.mobile}`" class="link">
              <ccu-icon
                linked
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
      <UserEditModal
        v-if="selectedUser"
        data-testid="testUserEditModal"
        :user="selectedUser"
        @close="selectedUser = null"
        @save="saveUser"
      />
    </div>
  </template>
  <template v-else>
    <div class="flex h-full p-8 m-auto">
      <div class="w-full flex flex-col">
        <div class="flex items-center justify-between w-full">
          <div class="flex py-2">
            <base-input
              v-model="currentSearch"
              data-testid="testUserSearch"
              icon="search"
              class="w-84 mr-4"
              :placeholder="$t('actions.search')"
              @update:model-value="onSearch"
            ></base-input>
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
                <div class="bg-white shadow w-108" style="z-index: 1001">
                  <div
                    class="flex items-center bg-crisiscleanup-light-grey p-1 px-2 w-full flex-wrap"
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
                          'border-l-2 border-l-black':
                            currentFilterSection === 'role',
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
                          'border-l-2 border-l-black':
                            currentFilterSection === 'invited_by',
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
                    </div>
                    <div class="w-64 p-2">
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
                    </div>
                  </div>
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
            <InviteUsers />
          </div>
        </div>
        <div class="user-grid">
          <div class="sm:w-96 w-full flex flex-col h-full">
            <Table
              class="border text-xs flex-grow"
              data-testid="testUserTable"
              :data="users"
              :columns="columns"
              :loading="usersLoading"
              hide-header
              enable-selection
              :body-style="{ height: '70vh' }"
              @selection-changed="
                (selectedItems) => {
                  selectedUsers = Array.from(selectedItems);
                }
              "
              @row-click="
                (user) => {
                  $router.push(`/organization/users/${user.id}`);
                }
              "
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
                  class="flex items-center justify-end w-full"
                  data-testid="testUserEmailDiv"
                >
                  <a :href="`mailto:${slotProps.item.email}`">
                    <ccu-icon
                      :alt="$t('actions.chat')"
                      data-testid="testUserChatIcon"
                      type="chat"
                      class="mx-1"
                      size="large"
                    />
                  </a>
                  <a :href="`tel:${slotProps.item.mobile}`">
                    <ccu-icon
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
</template>

<script lang="ts">
import { throttle } from 'lodash';
import { useMq } from 'vue3-mq';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import InviteUsers from '@/components/modals/InviteUsers.vue';
import User from '@/models/User';
import Role from '@/models/Role';
import Table from '@/components/Table.vue';
import { getQueryString } from '@/utils/urls';
import UserSearchInput from '@/components/UserSearchInput.vue';
import UserRoleFilter from '@/utils/data_filters/UserRoleFilter';
import UserInvitedByFilter from '@/utils/data_filters/UserInvitedByFilter';
import Modal from '@/components/Modal.vue';
import UserEditModal from '@/pages/organization/UserEditModal.vue';
import { getErrorMessage } from '@/utils/errors';
import { useCurrentUser } from '@/hooks';
import AjaxTable from '@/components/AjaxTable.vue';
import ListDropdown from '@/pages/lists/ListDropdown.vue';

export default defineComponent({
  name: 'Users',
  components: {
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
    const mq = useMq();
    const { t } = useI18n();
    const $toasted = useToast();

    const currentFilterSection = ref('role');
    const currentSearch = ref();
    const currentFilter = ref({});
    const filters = reactive({
      roles: new UserRoleFilter('roles', {}),
      invitedBy: new UserInvitedByFilter('invitedBy', new Set([])),
    });
    const usersLoading = ref(false);
    const users = ref<unknown[]>([]);
    const selectedUsers = ref<number[]>([]);
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

    const roles = computed(() => {
      return Role.all();
    });
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
        `/users?organization=${currentUser.value?.organization.id}`,
        { dataKey: 'results' },
      );
      users.value = results.entities?.users || [];
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

    return {
      currentFilterSection,
      currentSearch,
      currentFilter,
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
      mq,
      showUserFilterModal,
      selectedUser,
      saveUser,
      selectedUsers,
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
