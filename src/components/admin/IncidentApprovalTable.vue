<template>
  <AjaxTable
    :columns="columns"
    :query="query"
    :body-style="{ height: '300px' }"
    :url="url"
    @change="$emit('change', $event)"
    @row-click="showContacts"
    @data-fetched="handleDataFetched"
  >
    <template #created_at="slotProps">
      <div :title="slotProps.item.created_at">
        {{ momentFromNow(slotProps.item.created_at) }}
      </div>
    </template>
    <template #organization_statuses="slotProps">
      <div class="w-full flex items-center">
        <font-awesome-icon
          v-if="slotProps.item.organization_profile_completed"
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
        <badge
          v-if="slotProps.item.is_auto_request"
          width="18px"
          height="18px"
          class="text-white bg-blue-500 mx-1"
          :title="$t('adminOrganization.auto_request_new_case')"
          >A</badge
        >
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
          v-if="
            slotProps.item.is_verified &&
            !slotProps.item.approved_by &&
            !slotProps.item.rejected_by
          "
          data-testid="testApproveButton"
          :text="$t('actions.approve')"
          :alt="$t('actions.approve')"
          variant="solid"
          size="small"
          class="mx-2"
          :action="
            () => {
              approveRequest(slotProps.item.id);
            }
          "
        />
        <base-button
          v-if="
            slotProps.item.is_verified &&
            !slotProps.item.approved_by &&
            !slotProps.item.rejected_by
          "
          data-testid="testRejectButton"
          :text="$t('actions.reject')"
          :alt="$t('actions.reject')"
          variant="outline"
          size="small"
          class="mx-2"
          :action="
            () => {
              rejectRequest(slotProps.item.id);
            }
          "
        />
        <base-button
          v-if="
            slotProps.item.is_verified &&
            (slotProps.item.approved_by || slotProps.item.rejected_by)
          "
          data-testid="testClearApprovalButton"
          :text="$t('actions.undo')"
          :alt="$t('actions.undo')"
          variant="outline"
          size="small"
          class="mx-2"
          :action="
            () => {
              clearApproval(slotProps.item.id);
            }
          "
        />
        <base-link
          :href="`/admin/organization/${slotProps.item.organization}`"
          data-testid="testEditOrganizationLink"
          text-variant="bodysm"
        >
          {{ $t('actions.edit_organization') }}
        </base-link>
      </div>
    </template>
  </AjaxTable>
</template>

<script lang="ts">
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import moment from 'moment';
import Table from '../Table.vue';
import useDialogs from '../../hooks/useDialogs';
import { momentFromNow } from '../../filters';
import type { IncidentRequest } from '@/models/types';
import AjaxTable from '@/components/AjaxTable.vue';

export default defineComponent({
  name: 'IncidentApprovalTable',
  components: { AjaxTable, Table },
  props: {
    query: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['reload'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const { confirm } = useDialogs();
    const url = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/incident_requests`;

    async function showContacts(request: IncidentRequest) {
      const contact = request.requested_by_contact;
      await confirm({
        title: t('incidentApprovalTable.requester'),
        content: `
          <div>${contact.first_name} ${contact.last_name}</div>
          <div>${contact.email}</div>
          <div>${contact.mobile}</div>
          </p>
        `,
      });
    }

    async function approveRequest(requestId: string) {
      await axios.post(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/incident_requests/${requestId}/respond`,
        {
          action: 'approve',
        },
      );
      emit('reload');
    }

    async function rejectRequest(requestId: string) {
      await axios.post(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/incident_requests/${requestId}/respond`,
        {
          action: 'reject',
        },
      );
      emit('reload');
    }

    async function clearApproval(requestId: string) {
      await axios.post(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/incident_requests/${requestId}/clear_approval`,
      );
      emit('reload');
    }

    function handleDataFetched(count: number) {
      emit('onIncidentApprovalDataFetched', count);
    }

    return {
      showContacts,
      approveRequest,
      rejectRequest,
      clearApproval,
      momentFromNow,
      handleDataFetched,
      moment,
      url,
      columns: [
        {
          title: t('incidentApprovalTable.organization_name'),
          dataIndex: 'organization_name',
          key: 'organization_name',
          width: '1fr',
        },
        {
          title: t('orgApprovalTable.org_statuses'),
          dataIndex: 'organization_statuses',
          key: 'organization_statuses',
          width: '1fr',
        },
        {
          title: t('incidentApprovalTable.incident'),
          dataIndex: 'incident_name',
          key: 'incident_name',
          width: '1fr',
        },
        {
          title: t('incidentApprovalTable.requested_at'),
          dataIndex: 'created_at',
          key: 'created_at',
          width: '1fr',
        },
        {
          title: '',
          dataIndex: 'actions',
          key: 'actions',
          width: '2fr',
        },
      ],
    };
  },
});
</script>

<style scoped></style>
