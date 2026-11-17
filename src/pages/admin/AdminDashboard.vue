<template>
  <div class="flex flex-col">
    <div class="flex flex-wrap items-center gap-3 m-4 mb-0">
      <base-input
        :model-value="globalSearch"
        data-testid="testGlobalSearch"
        icon="search"
        class="w-full md:flex-1 md:min-w-[18rem]"
        width="400"
        :placeholder="$t('actions.search_everywhere')"
        @update:model-value="
          (value) => {
            globalSearch = value;
            debounce(reloadDashBoard, 1000)();
          }
        "
      ></base-input>
      <div class="flex flex-wrap gap-2 items-center">
        <InviteUsers is-admin />
        <base-button
          data-testid="testExportButton"
          size="medium"
          variant="solid"
          :text="$t('adminDashboard.edit_current_incident')"
          :alt="$t('adminDashboard.edit_current_incident')"
          :action="
            () => $router.push(`/admin/incident_wizard/${currentIncidentId}`)
          "
        />
        <v-popover placement="bottom-end">
          <base-button
            size="medium"
            variant="outline"
            suffix-icon="caret-down"
            :text="$t('~~More actions')"
            :alt="$t('~~More actions')"
          />
          <template #popper>
            <div class="flex flex-col p-2 gap-1 min-w-[12rem]">
              <base-button
                v-for="item of moreActions"
                :key="item.text"
                variant="bare"
                class="hover:bg-primary-light px-4 py-2 text-left"
                :text="item.text"
                :alt="item.text"
                :data-testid="item.testId"
                :action="item.action"
              />
            </div>
          </template>
        </v-popover>
      </div>
    </div>
    <MergeOrganizations ref="mergeOrganizationsRef" is-admin hide-trigger />
    <FileUpload ref="fileUploadRef" hide-trigger />
    <DatabaseAccess ref="databaseAccessRef" hide-trigger />
    <div class="flex" data-testid="testPendingOrganizationsDiv">
      <div class="admin-card m-4 shadow bg-white w-full">
        <AdminSectionHeader
          v-model:visible="organizationApprovalVisible"
          :title="$t('adminDashboard.pending_organizations')"
        >
          <template #actions>
            <SegmentedTabs
              :model-value="organizationApprovalView"
              :options="approvalTabOptions('PendingOrganizations')"
              @update:model-value="setApprovalView"
            />
            <base-button
              icon="sync"
              :action="setOrganizationApprovalQuery"
              :alt="$t('adminDashboard.refresh_pending_organizations')"
              data-testid="testRefreshPendingOrganizationsButton"
            />
          </template>
        </AdminSectionHeader>
        <div v-show="organizationApprovalVisible" class="p-4">
          <OrganizationApprovalTable
            :query="organizationApprovalQuery"
            @reload="setOrganizationApprovalQuery"
            @on-organization-approval-data-fetched="
              handleOrganizationApprovalDataFetched
            "
          ></OrganizationApprovalTable>
        </div>
      </div>
    </div>
    <div class="flex" data-testid="testRedeployRequestsDiv">
      <div class="admin-card m-4 shadow bg-white w-full">
        <AdminSectionHeader
          v-model:visible="redeployVisible"
          :title="$t('adminDashboard.redeploy_requests')"
        >
          <template #actions>
            <SegmentedTabs
              :model-value="redeployView"
              :options="approvalTabOptions('RedeployRequests')"
              @update:model-value="setRedeployViewView"
            />
            <base-button
              icon="sync"
              :action="setIncidentApprovalQuery"
              :alt="$t('adminDashboard.refresh_incident_redeploy_requests')"
              data-testid="testRefreshRedeployRequestsButton"
            />
          </template>
        </AdminSectionHeader>
        <div v-show="redeployVisible" class="p-4">
          <IncidentApprovalTable
            :query="incidentApprovalQuery"
            @reload="setIncidentApprovalQuery"
            @on-incident-approval-data-fetched="
              handleIncidentApprovalDataFetched
            "
          ></IncidentApprovalTable>
        </div>
      </div>
    </div>
    <div class="flex" data-testid="testWorksiteImportDiv">
      <WorksiteImport
        class="admin-card m-4 shadow bg-white w-full"
      ></WorksiteImport>
    </div>
    <div class="flex" data-testid="testOrganizationsDiv">
      <div class="admin-card m-4 shadow bg-white w-full">
        <AdminSectionHeader
          v-model:visible="organizations.visible"
          data-testid="testOrganizationsSearch"
          :title="$t('adminDashboard.organizations')"
          :search="organizations.search"
          @update:search="
            (value) => {
              organizations.search = value;
              debounce(getOrganizations, 1000)();
            }
          "
        />
        <div v-if="organizations.visible" class="p-4">
          <OrganizationsTable
            :organizations="organizations.data"
            :meta="organizations.meta"
            @change="getOrganizations"
            @reload="getOrganizations"
          ></OrganizationsTable>
        </div>
      </div>
    </div>
    <div class="flex" data-testid="testUsersDiv">
      <div class="admin-card m-4 shadow bg-white w-full">
        <AdminSectionHeader
          v-model:visible="users.visible"
          :title="$t('adminDashboard.users')"
          :search="users.search"
          @update:search="
            (value) => {
              users.search = value;
              debounce(getUsers, 1000)();
            }
          "
        />
        <div v-if="users.visible" class="p-4">
          <UsersTable
            :users="users.data"
            :meta="users.meta"
            @change="getUsers"
            @reload="getUsers"
          ></UsersTable>
        </div>
      </div>
    </div>
    <div class="flex" data-testid="testGhostUsersDiv">
      <div class="admin-card m-4 shadow bg-white w-full">
        <AdminSectionHeader
          v-model:visible="ghostUsers.visible"
          :title="$t('adminDashboard.ghost_users')"
          :search="ghostUsers.search"
          @update:search="
            (value) => {
              ghostUsers.search = value;
              debounce(getGhostUsers, 1000)();
            }
          "
        />
        <div v-if="ghostUsers.visible" class="p-4">
          <GhostUsersTable
            :users="ghostUsers.data"
            :meta="ghostUsers.meta"
            @change="getGhostUsers"
            @reload="getGhostUsers"
          ></GhostUsersTable>
        </div>
      </div>
    </div>
    <div class="flex" data-testid="testInvitationRequestsDiv">
      <div class="admin-card m-4 shadow bg-white w-full">
        <AdminSectionHeader
          v-model:visible="invitationRequests.visible"
          :title="$t('adminDashboard.invitation_requests')"
          :search="invitationRequests.search"
          @update:search="
            (value) => {
              invitationRequests.search = value;
              debounce(getInvitationRequests, 1000)();
            }
          "
        />
        <div v-if="invitationRequests.visible" class="p-4">
          <InvitationRequestTable
            :requests="invitationRequests.data"
            :meta="invitationRequests.meta"
            @change="getInvitationRequests"
            @reload="getInvitationRequests"
          ></InvitationRequestTable>
        </div>
      </div>
    </div>
    <div class="flex" data-testid="testInvitationsDiv">
      <div class="admin-card m-4 shadow bg-white w-full">
        <AdminSectionHeader
          v-model:visible="invitations.visible"
          :title="$t('adminDashboard.invitations')"
          :search="invitations.search"
          @update:search="
            (value) => {
              invitations.search = value;
              debounce(getInvitations, 1000)();
            }
          "
        />
        <div v-if="invitations.visible" class="p-4">
          <InvitationTable
            :invitations="invitations.data"
            :meta="invitations.meta"
            @change="getInvitations"
            @reload="getInvitations"
          ></InvitationTable>
        </div>
      </div>
    </div>
    <div class="flex" data-testid="testMessagesDiv">
      <div class="admin-card m-4 shadow bg-white w-full">
        <AdminSectionHeader
          v-model:visible="messages.visible"
          :title="$t('adminDashboard.messages')"
          :search="messages.search"
          @update:search="(value) => (messages.search = value)"
        />
        <div v-if="messages.visible" class="p-4">
          <MessagesTable :search="messages.search" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useStore } from 'vuex';
import { debounce } from 'lodash-es';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import IncidentApprovalTable from '../../components/admin/IncidentApprovalTable.vue';
import OrganizationApprovalTable from '../../components/admin/OrganizationApprovalTable.vue';
import InviteUsers from '@/components/modals/InviteUsers.vue';
import { getQueryString } from '../../utils/urls';
import { getErrorMessage } from '../../utils/errors';
import AdminSectionHeader from '../../components/admin/AdminSectionHeader.vue';
import SegmentedTabs from '../../components/admin/SegmentedTabs.vue';
import WorksiteImport from '../../components/admin/WorksiteImport.vue';
import FileUpload from '../../components/FileUpload.vue';
import OrganizationsTable from '../../components/admin/OrganizationsTable.vue';
import UsersTable from '../../components/admin/UsersTable.vue';
import GhostUsersTable from '../../components/admin/GhostUsersTable.vue';
import MergeOrganizations from '../../components/admin/MergeOrganizations.vue';
import DatabaseAccess from '../../components/admin/DatabaseAccess.vue';
import InvitationTable from '../../components/admin/InvitationTable.vue';
import InvitationRequestTable from '../../components/admin/InvitationRequestTable.vue';
import User from '../../models/User';
import useAcl from '../../hooks/useAcl';
import useDialogs from '../../hooks/useDialogs';
import ArcGisUploader from '@/components/admin/ArcGisUploader.vue';
import MessagesTable from '@/components/admin/MessagesTable.vue';
import BaseInput from '@/components/BaseInput.vue';

export default defineComponent({
  name: 'AdminDashboard',
  components: {
    BaseInput,
    AdminSectionHeader,
    SegmentedTabs,
    MessagesTable,
    DatabaseAccess,
    MergeOrganizations,
    InvitationTable,
    InvitationRequestTable,
    GhostUsersTable,
    UsersTable,
    OrganizationsTable,
    FileUpload,
    WorksiteImport,
    IncidentApprovalTable,
    OrganizationApprovalTable,
    InviteUsers,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const store = useStore();
    const $toasted = useToast();
    const { $can } = useAcl();
    const { component } = useDialogs();

    const mergeOrganizationsRef = ref<{ open: () => void }>();
    const fileUploadRef = ref<{ open: () => void }>();
    const databaseAccessRef = ref<{ open: () => void }>();
    const router = useRouter();

    const moreActions = computed(() => [
      {
        text: t('mergeOrganizations.merge_organizations'),
        testId: 'testMergeOrganizationsButton',
        action: () => mergeOrganizationsRef.value?.open(),
      },
      {
        text: t('fileUpload.file_uploader'),
        action: () => fileUploadRef.value?.open(),
      },
      {
        text: t('databaseAccess.database_access'),
        action: () => databaseAccessRef.value?.open(),
      },
      {
        text: t('adminDashboard.arcgis_upload'),
        testId: 'testArcgisUploadButton',
        action: showArcGisUploader,
      },
      {
        text: t('adminDashboard.show_god_mode'),
        action: () => router.push('/admin/god_mode'),
      },
      {
        text: t('adminDashboard.save_bulk_sms'),
        action: () => router.push('/admin/send_bulk_sms'),
      },
      {
        text: t('adminDashboard.send_bulk_email'),
        action: () => router.push('/admin/send_bulk_email'),
      },
      {
        text: t('adminDashboard.magazine'),
        action: () => router.push('/admin/magazine'),
      },
    ]);

    function approvalTabOptions(prefix: string) {
      return [
        ['default', 'action_required', 'ActionRequired'],
        ['approved', 'recently_approved', 'RecentlyApproved'],
        ['rejected', 'recently_rejected', 'RecentlyRejected'],
      ].map(([value, key, testKey]) => ({
        value,
        label: t(`adminDashboard.${key}`),
        testId: `test${prefix}${testKey}Button`,
      }));
    }

    const organizationApprovalVisible = ref(true);
    const redeployVisible = ref(true);
    const organizationApprovalCount = ref(0);
    const incidentApprovalCount = ref(0);
    const usersToInvite = ref('');
    const globalSearch = ref('');
    const organizations = ref({
      data: [],
      meta: {
        pagination: {
          pageSize: 20,
          page: 1,
          current: 1,
        },
      },
      search: '',
      visible: true,
    });
    const users = ref({
      data: [],
      meta: {
        pagination: {
          pageSize: 20,
          page: 1,
          current: 1,
        },
      },
      search: '',
      visible: true,
    });
    const ghostUsers = ref({
      data: [],
      meta: {
        pagination: {
          pageSize: 20,
          page: 1,
          current: 1,
        },
      },
      search: '',
      visible: true,
    });
    const invitationRequests = ref({
      data: [],
      meta: {
        pagination: {
          pageSize: 20,
          page: 1,
          current: 1,
        },
      },
      search: '',
      visible: true,
    });
    const invitations = ref({
      data: [],
      meta: {
        pagination: {
          pageSize: 20,
          page: 1,
          current: 1,
        },
      },
      search: '',
      visible: true,
    });
    const messages = ref({
      search: '',
      visible: true,
    });
    const organizationApprovalQuery = ref({
      approved_by__isnull: true,
      rejected_by__isnull: true,
      sort: '-created_at',
    });
    const organizationApprovalView = ref('default');
    const redeployView = ref('default');
    const incidentApprovalQuery = ref({
      approved_by__isnull: true,
      rejected_by__isnull: true,
      organization__is_verified: true,
      sort: '-updated_at',
    });
    const loading = ref(false);
    const defaultPagination = ref({
      pageSize: 20,
      page: 1,
      current: 1,
    });

    const currentIncidentId = computed(
      () => store.getters['incident/currentIncidentId'],
    );
    const statuses = computed(() => store.getters['enums/statuses']);

    async function setApprovalView(view) {
      organizationApprovalView.value = view;
      setOrganizationApprovalQuery();
    }

    async function setRedeployViewView(view) {
      redeployView.value = view;
      setIncidentApprovalQuery();
    }

    async function getOrganizations(data = {}) {
      const pagination = data.pagination || organizations.value.meta.pagination;
      const parameters = {
        offset: pagination.pageSize * (pagination.page - 1),
        limit: pagination.pageSize,
        sort: '-updated_at',
      };
      if (organizations.value.search || globalSearch.value) {
        parameters.search = globalSearch.value || organizations.value.search;
      }

      const queryString = getQueryString(parameters);

      const response = await axios.get(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/admins/organizations?${queryString}`,
      );
      organizations.value.data = response.data.results;
      const newPagination = {
        ...pagination,
        total: response.data.count,
      };
      organizations.value.meta = {
        pagination: newPagination,
      };
    }

    async function getUsers(data = {}) {
      const pagination = data.pagination || users.value.meta.pagination;
      const parameters = {
        offset: pagination.pageSize * (pagination.page - 1),
        limit: pagination.pageSize,
        sort: '-updated_at',
      };
      if (users.value.search || globalSearch.value) {
        parameters.search = globalSearch.value || users.value.search;
      }

      const queryString = getQueryString(parameters);

      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/users?${queryString}`,
      );
      users.value.data = response.data.results;
      const newPagination = {
        ...pagination,
        total: response.data.count,
      };
      users.value.meta = {
        pagination: newPagination,
      };
    }

    async function getGhostUsers(data = {}) {
      const pagination = data.pagination || ghostUsers.value.meta.pagination;
      const parameters = {
        offset: pagination.pageSize * (pagination.page - 1),
        limit: pagination.pageSize,
        sort: '-updated_at',
      };
      if (ghostUsers.value.search || globalSearch.value) {
        parameters.search = globalSearch.value || ghostUsers.value.search;
      }

      const queryString = getQueryString(parameters);

      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/ghost_users?${queryString}`,
      );
      ghostUsers.value.data = response.data.results;
      const newPagination = {
        ...pagination,
        total: response.data.count,
      };
      ghostUsers.value.meta = {
        pagination: newPagination,
      };
    }

    async function getInvitationRequests(data = {}) {
      const pagination =
        data.pagination || invitationRequests.value.meta.pagination;
      const parameters = {
        offset: pagination.pageSize * (pagination.page - 1),
        limit: pagination.pageSize,
        approved_by__isnull: true,
        rejected_by__isnull: true,
        sort: '-requested_at',
      };
      if (invitationRequests.value.search || globalSearch.value) {
        parameters.search =
          globalSearch.value || invitationRequests.value.search;
      }

      const queryString = getQueryString(parameters);

      const response = await axios.get(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/admins/invitation_requests?${queryString}`,
      );
      invitationRequests.value.data = response.data.results;
      const newPagination = {
        ...pagination,
        total: response.data.count,
      };
      invitationRequests.value.meta = {
        pagination: newPagination,
      };
    }

    async function getInvitations(data = {}) {
      const pagination = data.pagination || invitations.value.meta.pagination;
      const parameters = {
        offset: pagination.pageSize * (pagination.page - 1),
        limit: pagination.pageSize,
        activated: false,
        sort: '-created_at',
      };
      if (invitations.value.search || globalSearch.value) {
        parameters.search = globalSearch.value || invitations.value.search;
      }

      const queryString = getQueryString(parameters);

      const response = await axios.get(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/admins/invitations?${queryString}`,
      );
      invitations.value.data = response.data.results;
      const newPagination = {
        ...pagination,
        total: response.data.count,
      };
      invitations.value.meta = {
        pagination: newPagination,
      };
    }

    function setIncidentApprovalQuery() {
      if ($can('move_orgs')) {
        const parametersDict = {
          default: {
            approved_by__isnull: true,
            rejected_by__isnull: true,
            organization__is_verified: true,
            sort: '-updated_at',
          },
          approved: {
            approved_by__isnull: false,
            sort: '-approved_at',
            limit: 50,
          },
          rejected: {
            rejected_by__isnull: false,
            sort: '-rejected_at',
            limit: 50,
          },
        };

        const parameters = {
          ...parametersDict[redeployView.value],
        };
        incidentApprovalQuery.value = { ...parameters };
      }
    }

    function setOrganizationApprovalQuery() {
      if ($can('approve_orgs_full')) {
        const parametersDict = {
          default: {
            approved_by__isnull: true,
            rejected_by__isnull: true,
            sort: '-created_at',
          },
          approved: {
            approved_by__isnull: false,
            sort: '-approved_at',
          },
          rejected: {
            rejected_by__isnull: false,
            sort: '-rejected_at',
          },
        };

        const parameters = {
          ...parametersDict[organizationApprovalView.value],
          fields:
            'id,name,url,admin_notes,profile_completed,is_verified,is_active,incidents,created_at,approved_by,approved_at,rejected_by,rejected_at',
        };
        if (globalSearch.value) {
          parameters.search = globalSearch.value;
        }
        organizationApprovalQuery.value = { ...parameters };
      }
    }

    async function inviteUsers() {
      try {
        const emails = usersToInvite.value.split(',');
        await Promise.all(emails.map((email) => User.api().inviteUser(email)));
        await $toasted.success(t('inviteTeammates.invites_sent_success'));
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      }
    }

    async function reloadDashBoard() {
      await Promise.all([
        setOrganizationApprovalQuery(),
        setIncidentApprovalQuery(),
        getOrganizations({ pagination: defaultPagination.value }),
        getUsers({ pagination: defaultPagination.value }),
        getGhostUsers({ pagination: defaultPagination.value }),
        getInvitationRequests({ pagination: defaultPagination.value }),
        getInvitations({ pagination: defaultPagination.value }),
      ]);
    }

    async function showArcGisUploader() {
      await component({
        title: t('adminDashboard.arcgis_upload'),
        component: ArcGisUploader,
        classes: 'w-full h-56 p-3',
      });
    }

    function handleOrganizationApprovalDataFetched(count: number) {
      if (organizationApprovalView.value === 'default') {
        organizationApprovalCount.value = count;
      }
    }

    function handleIncidentApprovalDataFetched(count: number) {
      if (redeployView.value === 'default') {
        incidentApprovalCount.value = count;
      }
    }

    const totalCount = computed(() => {
      return (
        (organizationApprovalCount.value || 0) +
        (incidentApprovalCount.value || 0)
      );
    });

    watch(totalCount, () => {
      emit('onTotalDashboardCountFetched', totalCount.value);
    });

    onMounted(async () => {
      loading.value = true;
      await reloadDashBoard();
      loading.value = false;
    });

    return {
      organizationApprovalVisible,
      redeployVisible,
      mergeOrganizationsRef,
      fileUploadRef,
      databaseAccessRef,
      moreActions,
      approvalTabOptions,
      getOrganizations,
      getUsers,
      getGhostUsers,
      getInvitationRequests,
      setIncidentApprovalQuery,
      incidentApprovalQuery,
      inviteUsers,
      reloadDashBoard,
      showArcGisUploader,
      getInvitations,
      handleOrganizationApprovalDataFetched,
      handleIncidentApprovalDataFetched,
      usersToInvite,
      globalSearch,
      organizations,
      users,
      ghostUsers,
      invitationRequests,
      invitations,
      organizationApprovalQuery,
      setOrganizationApprovalQuery,
      messages,
      loading,
      defaultPagination,
      currentIncidentId,
      statuses,
      debounce,
      organizationApprovalView,
      redeployView,
      setApprovalView,
      setRedeployViewView,
      organizationApprovalCount,
      incidentApprovalCount,
    };
  },
});
</script>

<style scoped>
/* The card already supplies the shadow and rounding; a table inside it
   would otherwise draw a second, overlapping one. */
.admin-card :deep(.ccu-table-card) {
  box-shadow: none;
  border-radius: 0;
}
</style>
