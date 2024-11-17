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

    <AjaxTable
      ref="table"
      :columns="columns"
      :url="tableUrl"
      :body-style="{ height: '40rem' }"
      data-testid="testOrganizationsDataTable"
      class="bg-white border"
      :query="{
        search: organizations.search,
        incident: currentIncidentId,
        fields: 'id,name,url,facebook,twitter,type_t',
      }"
    >
      <template #overdue_count="slotProps">
        <base-button
          class="text-primary-dark underline"
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
      <template #type_t="slotProps">
        <base-text>{{ $t(slotProps.item.type_t) }}</base-text>
      </template>
    </AjaxTable>
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
import AjaxTable from '@/components/AjaxTable.vue';

export default defineComponent({
  name: 'OtherOrganizations',
  components: { AjaxTable, Table },
  setup(props) {
    const store = useStore();
    const ccuApi = useApi();
    const { t, locale } = useI18n();
    const tableUrl = '/other_organizations';

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
        title: t('profileOrg.organization_type'),
        dataIndex: 'type_t',
        key: 'type_t',
        sortable: false,
        width: '1fr',
      },
      {
        title: t('otherOrganizations.incidents'),
        dataIndex: 'incident_count',
        key: 'incident_count',
        // sortable: true,
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
        // sortable: true,
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
        // sortable: true,
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
        // sortable: true,
        class: 'justify-center',
        headerClass: 'justify-center',
      },
      {
        title: t('otherOrganizations.last_login'),
        dataIndex: 'last_login',
        key: 'last_login',
        // sortable: true,
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
    });

    const getCreatedAtLteFilter = () => moment().subtract(6, 'd').toISOString();
    function isLandscape() {
      return window.matchMedia(
        'only screen and (max-device-width: 1223px) and (orientation: landscape)',
      ).matches;
    }

    function getHighestRole(roles: number[]) {
      if (roles.length > 0) {
        return organizationRoles.value.find((role) => roles.includes(role.id));
      }

      return {};
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
      getHighestRole,
      tableUrl,
      table,
      open: (location, target) => {
        window.open(location, target);
      },
    };
  },
});
</script>

<style lang="postcss" scoped></style>
