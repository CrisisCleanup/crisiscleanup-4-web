<template>
  <div class="p-10">
    <div
      class="sm:w-3/5 border-primary-dark md:h-20 border-2 my-4 flex items-center p-2"
    >
      <span class="text-5xl text-primary-dark mr-4">&#9888;</span>
      <div data-testid="testDoNotSharePublicDiv">
        <base-text variant="h2" :weight="600">
          {{ $t('otherOrganizations.do_not_share_public') }}
        </base-text>
        <base-text>
          {{ $t('otherOrganizations.do_not_abuse_contact_data') }}
        </base-text>
      </div>
    </div>

    <div class="flex">
      <base-input
        v-model="organizations.search"
        data-testid="testOrganizationsSearchTextInput"
        icon="search"
        class="sm:w-84 my-2"
        :placeholder="$t('actions.search')"
        @update:model-value="onSearchInput"
      ></base-input>

      <base-button
        v-if="table"
        :action="table.exportTableCSV"
        type="primary"
        :text="$t('actions.download')"
        :alt="$t('actions.download')"
        class="table-action-button my-2 ml-2 p-2"
        ccu-icon="download"
        icon-size="small"
      />
    </div>

    <Table
      ref="table"
      :columns="columns"
      :data="organizations.data"
      :body-style="{ height: 'calc(100vh - 30rem)' }"
      data-testid="testOrganizationsDataTable"
      enable-pagination
      :pagination="organizations.meta.pagination"
      :loading="loading"
      :sorter="otherOrgSorter"
      class="bg-white border"
      has-row-details
      @change="handleOtherOrgTableChange"
    >
      <template #rowDetails="slotProps">
        <div class="flex p-3" data-testid="testPrimaryContactsDiv">
          <div class="mr-4">
            <base-text variant="h2">
              {{ $t('otherOrganizations.primary_contacts') }}
            </base-text>
            <div
              style="
                display: grid;
                grid-template-columns: max-content max-content max-content;
                grid-column-gap: 10px;
              "
            >
              <template
                v-for="contact in slotProps.item.primary_contacts"
                :key="contact.email"
              >
                <div class="my-1">
                  <strong class="font-bold"
                    >{{ contact.first_name }} {{ contact.last_name }}</strong
                  >
                  <div>{{ contact.title ? contact.title : '' }}</div>
                  <div>{{ contact.email }}</div>
                  <div>{{ contact.mobile }}</div>
                </div>
              </template>
            </div>
          </div>
          <div
            style="
              display: grid;
              grid-template-columns: max-content max-content max-content;
              grid-column-gap: 10px;
            "
          >
            <base-text
              v-if="slotProps.item.incident_primary_contacts.length > 0"
              variant="h2"
            >
              {{ $t('otherOrganizations.incident_primary_contacts') }}
            </base-text>
            <div>
              <template
                v-for="contact in slotProps.item.incident_primary_contacts"
                :key="contact.email"
              >
                <div>
                  <strong class="font-bold"
                    >{{ contact.first_name }} {{ contact.last_name }}</strong
                  >
                  <div>{{ contact.title ? contact.title : '' }}</div>
                  <div>{{ contact.email }}</div>
                  <div>{{ contact.mobile }}</div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>
      <template #url="slotProps">
        <base-button
          class="text-primary-dark underline sm:ml-0 ml-1"
          :icon-classes="$mq === 'sm' ? 'fa-2x' : 'fa-lg'"
          icon="globe"
          :alt="$t('profileOrg.url')"
          :style="slotProps.item.url === '' ? 'opacity: .5' : ''"
          :action="
            () => {
              if (slotProps.item.url != '') {
                open(slotProps.item.url, `_blank`);
              }
            }
          "
        />
        <a
          v-if="$mq === 'sm'"
          class="text-primary-dark underline ml-2"
          :href="slotProps.item.url"
          >{{ slotProps.item.url }}</a
        >
      </template>
      <template #facebook="slotProps">
        <img
          src="@/assets/facebook.svg"
          class="sm:ml-1 sm:w-16 w-12"
          :style="slotProps.item.facebook === '' ? 'opacity: .5' : ''"
          :alt="$t('profileOrg.facebook')"
          @click="
            () => {
              if (slotProps.item.facebook != '')
                open(slotProps.item.facebook, `_blank`);
            }
          "
        />
        <a
          v-if="$mq === 'sm'"
          class="text-primary-dark underline ml-1"
          :href="slotProps.item.facebook"
          >{{ slotProps.item.facebook }}</a
        >
      </template>
      <template #twitter="slotProps">
        <img
          src="@/assets/twitter.svg"
          class="sm:w-6 w-10 sm:ml-0 ml-1"
          :style="slotProps.item.twitter === '' ? 'opacity: .5' : ''"
          :alt="$t('profileOrg.twitter')"
          @click="
            () => {
              if (slotProps.item.twitter != '')
                open(slotProps.item.twitter, `_blank`);
            }
          "
        />
        <a
          v-if="$mq === 'sm'"
          class="text-primary-dark underline ml-2"
          :href="slotProps.item.twitter"
          >{{ slotProps.item.twitter }}</a
        >
      </template>
      <template #approved_roles="slotProps">
        <v-popover popper-class="w-80">
          <base-text
            class="details-name"
            variant="body"
            data-testid="testApprovedRolesContent"
          >
            <span :class="`tooltip-target cursor-pointer text-primary-dark`">
              {{ $t(getHighestRole(slotProps.item.approved_roles).name_t) }}
            </span>
          </base-text>
          <template #popper>
            <div class="bg-black p-2">
              <div class="bg-white rounded p-1">
                <div class="text-base">
                  {{
                    $t(
                      getHighestRole(slotProps.item.approved_roles)
                        .data_access_t,
                    )
                  }}
                </div>
                <div class="text-xs mb-2">
                  {{
                    $t(
                      getHighestRole(slotProps.item.approved_roles)
                        .description_t,
                    )
                  }}
                </div>
                <div class="text-xs">
                  {{
                    $t(
                      getHighestRole(slotProps.item.approved_roles)
                        .limitations_t,
                    )
                  }}
                </div>
              </div>
            </div>
          </template>
        </v-popover>
      </template>
      <template #overdue_count="slotProps">
        <base-button
          class="text-primary-dark underline"
          data-testid="testOverdueCountButton"
          :alt="slotProps.item.overdue_count || 0"
          :action="
            () => {
              $router.push(
                `/incident/${currentIncidentId}/work?showTable=true&work_type__claimed_by=${
                  slotProps.item.id
                }&work_type__status__in=${getOpenStatuses()}&created_at__lte=${getCreatedAtLteFilter()}`,
              );
            }
          "
        >
          {{ slotProps.item.overdue_count || 0 }}
        </base-button>
      </template>
    </Table>
  </div>
</template>

<script lang="ts">
import { throttle } from 'lodash';
import moment from 'moment';
import enums from '../store/modules/enums';
import Table from '@/components/Table.vue';
import type {
  TableSorterObject,
  TableChangeEmitItem,
} from '@/components/Table.vue';
import { getQueryString } from '@/utils/urls';
import { cachedGet } from '@/utils/promise';
import type Role from '@/models/Role';
import { useApi } from '@/hooks/useApi';
import type Organization from '@/models/Organization';
import { useCurrentIncident, useCurrentUser } from '@/hooks';

export default defineComponent({
  name: 'OtherOrganizations',
  components: { Table },
  setup(props) {
    const store = useStore();
    const ccuApi = useApi();
    const { t, locale } = useI18n();

    const loading = ref(false);
    const table = ref(null);
    const organizations = reactive({
      data: [] as Organization[],
      meta: {
        pagination: {
          pageSize: 50,
          page: 1,
          current: 1,
        },
      },
      search: '',
      visible: true,
    });
    const otherOrgSorter = ref<TableSorterObject<Organization>>({});
    const organizationRoles = ref<Role[]>([]);

    const { currentIncidentId } = useCurrentIncident();

    const { currentUser } = useCurrentUser();
    const columns = computed(() => [
      {
        title: t('otherOrganizations.name'),
        dataIndex: 'name',
        key: 'name',
        sortable: true,
        width: isLandscape() ? '2fr' : '350px',
      },
      {
        // TODO: change title to show url within the $t()
        title: t('Links'),
        dataIndex: 'url',
        key: 'url',
        width: '30px',
      },
      {
        // TODO: change title to show url within the $t()
        title: '',
        dataIndex: 'facebook',
        key: 'facebook',
        width: '50px',
      },
      {
        // TODO: change title to show url within the $t()
        title: '',
        dataIndex: 'twitter',
        key: 'twitter',
        width: '50px',
      },
      {
        title: t('otherOrganizations.access_level'),
        dataIndex: 'approved_roles',
        key: 'approved_roles',
        sortable: true,
        width: '150px',
      },
      {
        title: t('otherOrganizations.incidents'),
        dataIndex: 'incident_count',
        key: 'incident_count',
        sortable: true,
        transformer(item: number) {
          return item || 0;
        },
        class: 'justify-center',
        headerClass: 'justify-center',
      },
      {
        title: t('otherOrganizations.cases_reported'),
        dataIndex: 'reported_count',
        key: 'reported_count',
        sortable: true,
        transformer(item: number) {
          return item || 0;
        },
        class: 'justify-center',
        headerClass: 'justify-center',
      },
      {
        title: t('otherOrganizations.cases_claimed'),
        dataIndex: 'claimed_count',
        key: 'claimed_count',
        sortable: true,
        transformer(item: number) {
          return item || 0;
        },
        class: 'justify-center',
        headerClass: 'justify-center',
      },
      {
        title: t('otherOrganizations.cases_closed'),
        dataIndex: 'closed_count',
        key: 'closed_count',
        sortable: true,
        transformer(item: number) {
          return item || 0;
        },
        class: 'justify-center',
        headerClass: 'justify-center',
      },
      {
        title: t('otherOrganizations.cases_overdue'),
        dataIndex: 'overdue_count',
        key: 'overdue_count',
        sortable: true,
        class: 'justify-center',
        headerClass: 'justify-center',
      },
      {
        title: t('otherOrganizations.last_login'),
        dataIndex: 'last_login',
        key: 'last_login',
        sortable: true,
        class: 'justify-center',
        headerClass: 'justify-center',
        width: '150px',
        transformer(item: Date) {
          return moment(item).fromNow();
        },
      },
    ]);

    onMounted(async () => {
      const organizationRolesResponse = await cachedGet(
        `${import.meta.env.VITE_APP_API_BASE_URL}/organization_roles`,
        {},
        `organizations_roles:${locale.value}`,
      );
      organizationRoles.value = organizationRolesResponse.data.results;

      await getOrganizations(organizations.meta);
    });

    const getCreatedAtLteFilter = () => moment().subtract(6, 'd').toISOString();
    function isLandscape() {
      return window.matchMedia(
        'only screen and (max-device-width: 1223px) and (orientation: landscape)',
      ).matches;
    }

    function otherOrgSorterFunc<T extends Organization>(a: T, b: T) {
      if (otherOrgSorter.value.key) {
        const { key, direction } = otherOrgSorter.value;
        if (direction === 'asc') {
          return a[key] > b[key] ? 1 : -1;
        }

        return a[key] < b[key] ? 1 : -1;
      }

      return a.name > b.name ? 1 : -1; // default sort by name
    }

    async function handleOtherOrgTableChange({
      sorter,
      pagination,
    }: TableChangeEmitItem<Organization>) {
      otherOrgSorter.value = { ...sorter };
      const sortedOrgs = (organizations.data as Organization[]).sort(
        otherOrgSorterFunc,
      );
      organizations.data = sortedOrgs;
      // only refetch organizations if page changes
      if (
        organizations.meta.pagination.current !== pagination.current ||
        organizations.meta.pagination.pageSize !== pagination.pageSize
      ) {
        organizations.meta.pagination = {
          ...organizations.meta.pagination,
          ...pagination,
        };
        await getOrganizations(organizations.meta);
      }
    }

    async function getOrganizations(data: Record<string, any> = {}) {
      loading.value = true;
      const pagination = data.pagination || organizations.meta.pagination;
      const params: Record<string, unknown> = {
        offset: pagination.pageSize * (pagination.page - 1),
        limit: pagination.pageSize,
      };
      if (organizations.search) {
        params.search = organizations.search;
      }

      const queryString = getQueryString(params);
      organizations.data = [];
    }

    function getOpenStatuses() {
      enums.state.statuses.filter((status) => status.primary_state === 'open');
      const openStatuses = enums.state.statuses.filter(
        (status) => status.primary_state === 'open',
      );
      return openStatuses.map((status) => status.status).join(',');
    }

    function getHighestRole(roles: number[]) {
      if (roles.length > 0) {
        return organizationRoles.value.find((role) => roles.includes(role.id));
      }

      return {};
    }

    function onSearchInput() {
      throttle(getOrganizations, 1000)();
    }

    return {
      loading,
      organizations,
      columns,
      organizationRoles,
      currentIncidentId,
      currentUser,
      otherOrgSorter,
      throttle,
      getCreatedAtLteFilter,
      isLandscape,
      getOrganizations,
      getOpenStatuses,
      getHighestRole,
      onSearchInput,
      handleOtherOrgTableChange,
      table,
      open: (location, target) => {
        window.open(location, target);
      },
    };
  },
});
</script>

<style lang="postcss" scoped></style>
