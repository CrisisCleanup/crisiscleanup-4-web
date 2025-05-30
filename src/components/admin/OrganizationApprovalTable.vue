<template>
  <AjaxTable
    :columns="columns"
    :query="query"
    :body-style="{ height: '300px' }"
    :url="url"
    enable-search
    :pagination="{
      pageSize: 100,
    }"
    @change="$emit('change', $event)"
    @row-click="showContacts"
    @data-fetched="handleDataFetched"
  >
    <template #statuses="slotProps">
      <div class="w-full flex items-center">
        <font-awesome-icon
          v-if="slotProps.item.profile_completed"
          :title="$t('adminOrganization.profile_completed')"
          class="mx-1 text-primary-dark"
          size="lg"
          icon="check-circle"
        />
        <badge
          v-if="slotProps.item.is_verified"
          width="18px"
          height="18px"
          class="text-white bg-green-500 mx-1"
          :title="$t('adminOrganization.org_verified')"
          >V</badge
        >
        <badge
          v-if="slotProps.item.is_active"
          width="18px"
          height="18px"
          class="text-white bg-green-500 mx-1"
          :title="$t('adminOrganization.org_active')"
          >A</badge
        >
      </div>
    </template>

    <template #incidents="slotProps">
      <div
        v-if="slotProps.item.incidents && slotProps.item.incidents.length > 0"
        class="w-full flex items-center"
      >
        {{ getIncidentName(slotProps.item.incidents[0]) }}
      </div>
    </template>

    <template #actions="slotProps">
      <div class="flex mr-2 justify-end w-full items-center">
        <ccu-icon
          v-if="slotProps.item.approved_by"
          v-tooltip="{
            content: `
          <div>Approved by: ${slotProps.item.approved_by}</div>
          <div>Approved at: ${moment(slotProps.item.approved_at).format(
            'ddd MMMM Do YYYY',
          )}</div>
        `,
            triggers: ['hover'],
            popperClass: 'interactive-tooltip w-72',
            html: true,
          }"
          type="help"
          size="lg"
        />
        <ccu-icon
          v-if="slotProps.item.rejected_by"
          v-tooltip="{
            content: `
          <div>Rejected by: ${slotProps.item.rejected_by}</div>
          <div>Rejected at: ${moment(slotProps.item.rejected_at).format(
            'ddd MMMM Do YYYY',
          )}</div>
        `,
            triggers: ['hover'],
            popperClass: 'interactive-tooltip w-72',
            html: true,
          }"
          type="help"
          size="lg"
        />
        <base-button
          v-if="!slotProps.item.approved_by && !slotProps.item.rejected_by"
          data-testid="testApproveButton"
          :text="$t('actions.approve')"
          :alt="$t('actions.approve')"
          variant="solid"
          size="small"
          class="mx-1"
          :action="
            () => {
              approveOrganization(slotProps.item.id);
            }
          "
        />
        <base-button
          v-if="!slotProps.item.approved_by && !slotProps.item.rejected_by"
          data-testid="testRejectButton"
          :text="$t('actions.reject')"
          :alt="$t('actions.reject')"
          variant="outline"
          size="small"
          class="mx-1"
          :action="
            () => {
              rejectOrganization(slotProps.item.id);
            }
          "
        />
        <base-button
          data-testid="testNotifyButton"
          :text="$t('actions.notify')"
          :alt="$t('adminDashboard.notify_content')"
          variant="outline"
          size="small"
          class="mx-1"
          :action="
            () => {
              notifyOrganization(slotProps.item.id);
            }
          "
        />
        <base-button
          v-if="
            currentUser &&
            currentUser.isAdmin &&
            (slotProps.item.approved_by || slotProps.item.rejected_by)
          "
          data-testid="testClearApprovalButton"
          :text="$t('actions.undo')"
          :alt="$t('actions.undo')"
          variant="outline"
          size="small"
          class="mx-1"
          :action="
            () => {
              clearApproval(slotProps.item.id);
            }
          "
        />
        <base-link
          v-if="currentUser && currentUser.isAdmin"
          data-testid="testOrganizationLink"
          :href="`/admin/organization/${slotProps.item.id}`"
          text-variant="bodysm"
          class="px-1"
          >{{ $t('actions.edit') }}</base-link
        >
      </div>
    </template>
  </AjaxTable>
</template>

<script lang="ts">
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import moment from 'moment';
import { defineComponent } from 'vue';
import AjaxTable from '@/components/AjaxTable.vue';
import useDialogs from '@/hooks/useDialogs';
import Organization from '@/models/Organization';
import Incident from '@/models/Incident';
import useCurrentUser from '@/hooks/useCurrentUser';
import { useCurrentIncident } from '@/hooks';
import { getErrorMessage } from '@/utils/errors';
import { useToast } from 'vue-toastification';

export default defineComponent({
  name: 'OrganizationApprovalTable',
  components: { AjaxTable },
  props: {
    query: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['reload'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const { currentUser } = useCurrentUser();
    const { currentIncidentId } = useCurrentIncident();
    const { confirm, organizationApproval } = useDialogs();
    const url = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/organizations`;
    const $toasted = useToast();

    async function getOrganizationContacts(organizationId: string) {
      const response = await axios.get(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/ghost_users?organization=${organizationId}`,
      );
      return response.data.results;
    }

    function getIncidentName(id: string) {
      const incident = Incident.find(id);
      return incident && incident.name;
    }

    async function showContacts(organization: Organization) {
      const contacts = await getOrganizationContacts(organization.id);
      const contact = contacts.length > 0 ? contacts[0] : null;
      await confirm({
        title: t('adminOrganization.organization_contact'),
        content: `
          <div>${contact.first_name} ${contact.last_name}</div>
          <div>${contact.title ?? ''}</div>
          <div>${contact.email}</div>
          <div>${contact.mobile}</div>
        `,
      });
    }

    async function approveOrganization(organizationId: string) {
      const result = await organizationApproval({
        title: t('actions.approve_organization'),
        content: t('orgApprovalTable.give_approve_reason'),
      });
      if (result && typeof result !== 'string') {
        await Organization.api().approve(organizationId, result.reason);
        emit('reload');
      }
    }

    async function rejectOrganization(organizationId: string) {
      const result = await organizationApproval({
        title: t('actions.reject_organization'),
        content: t('orgApprovalTable.give_reject_reason'),
      });
      if (result && typeof result !== 'string') {
        await Organization.api().reject(
          organizationId,
          result.reason,
          result.note,
        );
        emit('reload');
      }
    }

    async function clearApproval(organizationId: string) {
      await Organization.api().clearApproval(organizationId);
      emit('reload');
    }

    async function notifyOrganization(organizationId: string) {
      try {
        await Organization.api().notify(
          organizationId,
          currentIncidentId.value,
        );
        $toasted.success(t('adminOrganization.notification_sent'));
      } catch (error) {
        $toasted.error(getErrorMessage(error));
      }
    }

    function handleDataFetched(count: number) {
      emit('onOrganizationApprovalDataFetched', count);
    }

    return {
      currentUser,
      getIncidentName,
      showContacts,
      approveOrganization,
      rejectOrganization,
      clearApproval,
      notifyOrganization,
      moment,
      url,
      handleDataFetched,
      columns: [
        {
          title: t('ID'),
          dataIndex: 'id',
          key: 'id',
          width: 'minmax(75px, 4%)',
        },
        {
          title: t('orgApprovalTable.name'),
          dataIndex: 'name',
          key: 'name',
          width: 'minmax(200px, 12%)',
        },
        {
          title: t('orgApprovalTable.org_statuses'),
          dataIndex: 'statuses',
          key: 'statuses',
          width: 'minmax(75px, 7%)',
        },
        {
          title: t('orgApprovalTable.website'),
          dataIndex: 'url',
          key: 'url',
          class: 'break-all',
          width: 'minmax(125px, 14%)',
        },
        {
          title: t('adminOrganization.admin_notes'),
          dataIndex: 'admin_notes',
          key: 'admin_notes',
          width: 'minmax(200px, 20%)',
        },
        {
          title: t('incidentApprovalTable.incident'),
          dataIndex: 'incidents',
          key: 'incidents',
          width: 'minmax(120px, 15%)',
        },
        {
          title: t('incidentApprovalTable.requested_at'),
          dataIndex: 'created_at',
          key: 'created_at',
          width: 'minmax(120px, 10%)',
          transformer(requested_at: Date) {
            return moment(requested_at).fromNow();
          },
        },
        {
          title: '',
          dataIndex: 'actions',
          key: 'actions',
          width: 'minmax(125px, 18%)',
        },
      ],
    };
  },
});
</script>

<style scoped></style>
