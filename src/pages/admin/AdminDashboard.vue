<template>
  <div class="flex flex-col">
    <div class="flex flex-col items-center justify-between">
      <base-input
        :model-value="globalSearch"
        data-testid="testGlobalSearch"
        icon="search"
        class="w-full"
        :placeholder="$t('actions.search_everywhere')"
        @update:model-value="
          (value) => {
            globalSearch = value;
            debounce(reloadDashBoard, 1000)();
          }
        "
      ></base-input>
      <div class="flex gap-2 flex-wrap mt-4 items-center mr-4">
        <InviteUsers class="" is-admin />
        <MergeOrganizations is-admin />
        <FileUpload class="" />
        <DatabaseAccess class="" />
        <base-button
          :text="$t('adminDashboard.arcgis_upload')"
          :alt="$t('adminDashboard.arcgis_upload')"
          data-testid="testArcgisUploadButton"
          variant="solid"
          size="medium"
          :action="showArcGisUploader"
        />
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
        <base-button
          size="medium"
          variant="solid"
          :text="$t('adminDashboard.show_god_mode')"
          :alt="$t('adminDashboard.show_god_mode')"
          :action="() => $router.push('/admin/god_mode')"
        />

        <base-button
          size="medium"
          variant="solid"
          :text="$t('adminDashboard.save_bulk_sms')"
          :alt="$t('adminDashboard.save_bulk_sms')"
          :action="() => $router.push('/admin/send_bulk_sms')"
        />
        <base-button
          size="medium"
          variant="solid"
          :text="$t('adminDashboard.send_bulk_email')"
          :alt="$t('adminDashboard.send_bulk_email')"
          :action="() => $router.push('/admin/send_bulk_email')"
        />
        <base-button
          size="medium"
          variant="solid"
          :text="$t('adminDashboard.magazine')"
          :alt="$t('adminDashboard.magazine')"
          :action="() => $router.push('/admin/magazine')"
        />
      </div>
    </div>
    <div class="flex" data-testid="testPendingOrganizationsDiv">
      <div class="m-4 pt-2 shadow bg-white w-full">
        <div class="py-4 px-4 flex items-center justify-between border-b">
          <div class="text-gray-500">
            {{ $t('adminDashboard.pending_organizations') }}
          </div>
          <base-button
            icon="sync"
            :action="setOrganizationApprovalQuery"
            :alt="$t('adminDashboard.refresh_pending_organizations')"
            data-testid="testRefreshPendingOrganizationsButton"
          />
        </div>
        <div
          class="py-4 px-4 border-b grid md:grid-cols-3 grid-cols-1 items-center"
        >
          <base-button
            class="mr-2 md:border-r pr-2"
            data-testid="testPendingOrganizationsActionRequiredButton"
            size="medium"
            :text="$t('adminDashboard.action_required')"
            :alt="$t('adminDashboard.action_required')"
            :class="[
              organizationApprovalView === 'default' ? 'text-primary-dark' : '',
            ]"
            variant="text"
            :action="() => setApprovalView('default')"
          />

          <base-button
            class="mr-2 md:border-r pr-2"
            data-testid="testPendingOrganizationsRecentlyApprovedButton"
            size="medium"
            :text="$t('adminDashboard.recently_approved')"
            :alt="$t('adminDashboard.recently_approved')"
            :class="[
              organizationApprovalView === 'approved'
                ? 'text-primary-dark'
                : '',
            ]"
            variant="text"
            :action="() => setApprovalView('approved')"
          />

          <base-button
            class="mr-2"
            data-testid="testPendingOrganizationsRecentlyRejectedButton"
            size="medium"
            :text="$t('adminDashboard.recently_rejected')"
            :alt="$t('adminDashboard.recently_rejected')"
            :class="[
              organizationApprovalView === 'rejected'
                ? 'text-primary-dark'
                : '',
            ]"
            variant="text"
            :action="() => setApprovalView('rejected')"
          />
        </div>

        <div class="p-4">
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
      <div class="m-4 pt-2 shadow bg-white w-full">
        <div class="py-4 px-4 flex items-center justify-between border-b">
          <div class="text-gray-500">
            {{ $t('adminDashboard.redeploy_requests') }}
          </div>
          <base-button
            icon="sync"
            data-testid="testRefreshRedeployRequestsButton"
            :action="setIncidentApprovalQuery"
            :alt="$t('adminDashboard.refresh_incident_redeploy_requests')"
          />
        </div>
        <div
          class="py-4 px-4 border-b grid md:grid-cols-3 grid-cols-1 items-center"
        >
          <base-button
            class="mr-2 md:border-r pr-2"
            data-testid="testRedeployRequestsActionRequiredButton"
            size="medium"
            :text="$t('adminDashboard.action_required')"
            :alt="$t('adminDashboard.action_required')"
            :class="[redeployView === 'default' ? 'text-primary-dark' : '']"
            variant="text"
            :action="() => setRedeployViewView('default')"
          />

          <base-button
            class="mr-2 md:border-r pr-2"
            data-testid="testRedeployRequestsRecentlyApprovedButton"
            size="medium"
            :text="$t('adminDashboard.recently_approved')"
            :alt="$t('adminDashboard.recently_approved')"
            :class="[redeployView === 'approved' ? 'text-primary-dark' : '']"
            variant="text"
            :action="() => setRedeployViewView('approved')"
          />

          <base-button
            class="mr-2"
            data-testid="testRedeployRequestsRecentlyRejectedButton"
            size="medium"
            :text="$t('adminDashboard.recently_rejected')"
            :alt="$t('adminDashboard.recently_rejected')"
            :class="[redeployView === 'rejected' ? 'text-primary-dark' : '']"
            variant="text"
            :action="() => setRedeployViewView('rejected')"
          />
        </div>
        <div class="p-4">
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
      <WorksiteImport class="m-4 pt-2 shadow bg-white w-full"></WorksiteImport>
    </div>
    <div class="flex" data-testid="testOrganizationsDiv">
      <div class="m-4 pt-2 shadow bg-white w-full">
        <div class="py-4 px-2 border-b flex items-center">
          <span class="flex items-center">
            <base-button
              class="text-4xl mx-3"
              :alt="$t('adminDashboard.organizations')"
              :action="
                () => {
                  organizations.visible = !organizations.visible;
                }
              "
              >-</base-button
            >
            {{ $t('adminDashboard.organizations') }}
          </span>
          <base-input
            :model-value="organizations.search"
            data-testid="testOrganizationsSearch"
            icon="search"
            class="w-48 md:w-72 mx-4"
            :placeholder="$t('actions.search')"
            @update:model-value="
              (value) => {
                organizations.search = value;
                debounce(getOrganizations, 1000)();
              }
            "
          ></base-input>
        </div>
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
      <div class="m-4 pt-2 shadow bg-white w-full">
        <div class="py-4 px-2 border-b flex items-center">
          <span class="flex items-center">
            <base-button
              class="text-4xl mx-3"
              data-testid="testUsersSearch"
              :alt="$t('adminDashboard.users')"
              :action="
                () => {
                  users.visible = !users.visible;
                }
              "
              >-</base-button
            >
            {{ $t('adminDashboard.users') }}
          </span>
          <base-input
            :model-value="users.search"
            icon="search"
            class="w-48 md:w-72 mx-4"
            :placeholder="$t('actions.search')"
            @update:model-value="
              (value) => {
                users.search = value;
                debounce(getUsers, 1000)();
              }
            "
          ></base-input>
        </div>
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
      <div class="m-4 pt-2 shadow bg-white w-full">
        <div class="py-4 px-2 border-b flex items-center">
          <span class="flex items-center">
            <base-button
              class="text-4xl mx-3"
              data-testid="testGhostUsersSearch"
              :alt="$t('adminDashboard.ghost_users')"
              :action="
                () => {
                  ghostUsers.visible = !ghostUsers.visible;
                }
              "
              >-</base-button
            >
            {{ $t('adminDashboard.ghost_users') }}
          </span>
          <base-input
            :model-value="ghostUsers.search"
            icon="search"
            class="w-48 md:w-72 mx-4"
            :placeholder="$t('actions.search')"
            @update:model-value="
              (value) => {
                ghostUsers.search = value;
                debounce(getGhostUsers, 1000)();
              }
            "
          ></base-input>
        </div>
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
      <div class="m-4 pt-2 shadow bg-white w-full">
        <div class="py-4 px-2 border-b flex items-center">
          <span class="flex items-center">
            <base-button
              class="text-4xl mx-3"
              data-testid="testInvitationRequestsSearch"
              :alt="$t('adminDashboard.invitation_requests')"
              :action="
                () => {
                  invitationRequests.visible = !invitationRequests.visible;
                }
              "
              >-</base-button
            >
            {{ $t('adminDashboard.invitation_requests') }}
          </span>
          <base-input
            :model-value="invitationRequests.search"
            icon="search"
            class="w-48 md:w-72 mx-4"
            :placeholder="$t('actions.search')"
            @update:model-value="
              (value) => {
                invitationRequests.search = value;
                debounce(getInvitationRequests, 1000)();
              }
            "
          ></base-input>
        </div>
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
      <div class="m-4 pt-2 shadow bg-white w-full">
        <div class="py-4 px-2 border-b flex items-center">
          <span class="flex items-center">
            <base-button
              class="text-4xl mx-3"
              data-testid="testInvitationsSearch"
              :alt="$t('adminDashboard.invitations')"
              :action="
                () => {
                  invitations.visible = !invitations.visible;
                }
              "
              >-</base-button
            >
            {{ $t('adminDashboard.invitations') }}
          </span>
          <base-input
            :model-value="invitations.search"
            icon="search"
            class="w-48 md:w-72 mx-4"
            :placeholder="$t('actions.search')"
            @update:model-value="
              (value) => {
                invitations.search = value;
                debounce(getInvitations, 1000)();
              }
            "
          ></base-input>
        </div>
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
      <div class="m-4 pt-2 shadow bg-white w-full">
        <div class="py-4 px-2 border-b flex items-center">
          <span class="flex items-center">
            <base-button
              class="text-4xl mx-3"
              data-testid="testInvitationsSearch"
              :alt="$t('adminDashboard.messages')"
              :action="
                () => {
                  messages.visible = !messages.visible;
                }
              "
              >-</base-button
            >
            {{ $t('adminDashboard.messages') }}
          </span>
          <base-input
            v-model="messages.search"
            icon="search"
            class="w-48 md:w-72 mx-4"
            :placeholder="$t('adminDashboard.search_message')"
          ></base-input>
        </div>
        <div v-if="messages.visible" class="p-4">
          <MessagesTable :search="messages.search" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useStore } from 'vuex';
import { debounce } from 'lodash';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import IncidentApprovalTable from '../../components/admin/IncidentApprovalTable.vue';
import OrganizationApprovalTable from '../../components/admin/OrganizationApprovalTable.vue';
import InviteUsers from '@/components/modals/InviteUsers.vue';
import { getQueryString } from '../../utils/urls';
import { getErrorMessage } from '../../utils/errors';
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

<style scoped></style>
