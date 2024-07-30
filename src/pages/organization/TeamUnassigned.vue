<template>
  <div class="bg-white h-full h-84 px-3">
    <div class="flex justify-between">
      <div class="font-semibold flex justify-between items-center h-12">
        {{ $t('~~Unassigned Users') }}
      </div>
    </div>
    <base-text>{{ `${$t('~~Users')} (${allTeamUsers?.length})` }}</base-text>
    <v-popover :auto-hide="false" popover-class="" placement="bottom-start">
      <div
        class="flex items-center bg-white border p-1 px-4 cursor-pointer w-max h-10 mt-3"
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
                data-testid="testFilterEquipmentDiv"
                :class="{
                  'border-l-2 border-l-black':
                    currentFilterSection === 'equipment',
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
            <div class="h-full overflow-auto p-2 w-full">
              <div v-if="currentFilterSection === 'role'">
                {{ $t('usersVue.role') }}
                <div v-for="role in roles" :key="`${role.id}`">
                  <base-checkbox
                    v-model="filters.roles.data[role.id]"
                    :data-testid="`testUserRole${role.id}Checkbox`"
                    class="block my-1 text-sm"
                    @update:model-value="onFilter"
                    >{{ $t(role.name_t) }}
                  </base-checkbox>
                </div>
              </div>
              <div v-if="currentFilterSection === 'equipment'">
                {{ $t('usersVue.equipment') }}
                <base-checkbox
                  v-for="equipment in equipmentList"
                  :key="equipment.id"
                  :model-value="filters.equipment.data.includes(equipment.id)"
                  :data-testid="`testUserEquipment${equipment.id}Checkbox`"
                  class="block my-1 text-sm"
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
        </div>
      </template>
    </v-popover>
    <div v-if="allTeamUsers && allTeamUsers.length > 0" class="mt-2">
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
        :body-style="{ height: '30rem' }"
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
                <ul class="overflow-auto w-56" data-testid="testTeamsEmailsDiv">
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
                </ul>
              </template>
            </v-popover>
          </div>
        </template>
      </Table>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Team from '@/models/Team';
import Avatar from '@/components/Avatar.vue';
import WorksiteStatusDropdown from '@/components/WorksiteStatusDropdown.vue';
import WorkTypeMap from '@/components/WorkTypeMap.vue';
import Table from '@/components/Table.vue';
import useDialogs from '@/hooks/useDialogs';
import type User from '@/models/User';
import AddFromList from '@/pages/lists/AddFromList.vue';
import ListDropdown from '@/pages/lists/ListDropdown.vue';
import BaseText from '@/components/BaseText.vue';
import Equipment from '@/models/Equipment';
import type { Collection } from '@vuex-orm/core';
import UserEquipmentFilter from '@/utils/data_filters/UserEquipmentFilter';
import UserSearchInput from '@/components/UserSearchInput.vue';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import UserRoleFilter from '@/utils/data_filters/UserRoleFilter';
import Role from '@/models/Role';

export default defineComponent({
  name: 'TeamDetail',
  components: {
    BaseCheckbox,
    UserSearchInput,
    BaseText,
    ListDropdown,
    AddFromList,
    Table,
    WorksiteStatusDropdown,
    Avatar,
    WorkTypeMap,
  },
  props: {
    users: {
      type: Array as PropType<User[]>,
      default: () => [],
    },
    teams: {
      type: Array as PropType<Team[]>,
      default: () => [],
    },
  },
  emits: ['reload', 'filterUnassignedUserEquipment'],
  setup(props, ctx) {
    const store = useStore();
    const { t } = useI18n();
    const { selection } = useDialogs();

    const currentFilterSection = ref<'role' | 'equipment'>('equipment');
    const currentFilter = ref({});
    const equipmentList = ref<Collection<Equipment>>([]);

    const filters = reactive({
      equipment: new UserEquipmentFilter('equipment', []),
      roles: new UserRoleFilter('roles', {}),
    });
    const roles = computed(() => {
      return Role.all();
    });

    const allTeamUsers = computed(() => props.users);
    const currentIncidentId = computed(
      () => store.getters['incident/currentIncidentId'],
    );

    const filterCount = computed(() => {
      return Object.values(filters).reduce((total, obj) => {
        return total + obj.getCount();
      }, 0);
    });

    const updateTeam = async (
      id: number | string,
      data: Record<string, any>,
    ) => {
      console.log('updateTeam', id, data);
      await Team.api().patch(`/teams/${id}`, data);
    };

    const getEquipment = async (value: string) => {
      const results = await Equipment.api().get(`/equipment?search=${value}`, {
        dataKey: 'results',
      });
      return (results.entities?.equipment || []) as Collection<Equipment>;
    };

    async function onFilter() {
      currentFilter.value = {};
      for (const filter of Object.values(filters)) {
        currentFilter.value = {
          ...currentFilter.value,
          ...filter.packFunction(),
        };
      }

      const queryParams: Record<string, unknown> = {
        ...currentFilter.value,
      };

      ctx.emit('filterUnassignedUserEquipment', queryParams);
    }

    const moveToDifferentTeam = async (userId) => {
      const _id: number = await selection({
        title: t('teams.move_teams'),
        content: '',
        label: 'name',
        itemKey: 'id',
        options: props.teams,
        placeholder: t('teams.select_target_team'),
      });
      const result = Team.find(_id);
      if (result && result.id) {
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

    onMounted(async () => {
      equipmentList.value = await getEquipment('');
    });

    return {
      allTeamUsers,
      currentIncidentId,
      updateTeam,
      moveToDifferentTeam,
      getEquipment,
      filters,
      currentFilterSection,
      roles,
      onFilter,
      equipmentList,
      filterCount,
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
