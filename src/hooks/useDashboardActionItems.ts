import { computed, onMounted, ref } from 'vue';
import {
  getClaimedWorksites,
  getInvitationRequests,
  getUserTransferRequests,
  getWorksiteRequests,
} from '@/utils/dashboard';
import WorksiteRequest from '@/models/WorksiteRequest';
import InvitationRequest from '@/models/InvitationRequest';
import { i18n } from '@/modules/i18n';
import axios from 'axios';
import Organization from '@/models/Organization';
import useDialogs from '@/hooks/useDialogs';
import User from '@/models/User';

async function approveTransferRequest(requestId: number, reason = '') {
  await axios.post(
    `${
      import.meta.env.VITE_APP_API_BASE_URL
    }/transfer_requests/${requestId}/respond`,
    {
      action: 'approve',
      accepted_rejected_reason: reason || 'Approved via dashboard action items',
    },
  );
}

async function rejectTransferRequest(requestId: number, reason = '') {
  await axios.post(
    `${
      import.meta.env.VITE_APP_API_BASE_URL
    }/transfer_requests/${requestId}/respond`,
    {
      action: 'reject',
      accepted_rejected_reason: reason || 'Rejected via dashboard action items',
    },
  );
}

export function useDashboardActionItems(
  currentIncidentId,
  organizationId,
  user,
) {
  const invitationRequests = ref([]);
  const transferRequests = ref([]);
  const worksiteRequests = ref([]);
  const allClaimedWorksites = ref([]);
  const loading = ref(false);
  const loadingWorksites = ref(false);
  const loadingInvitations = ref(false);
  const loadingTransfers = ref(false);
  const loadingRequests = ref(false);

  const { prompt } = useDialogs();

  const claimedWorksites = computed(() => {
    const result = allClaimedWorksites.value.filter((worksite) => {
      if (worksite.work_types && currentIncidentId === worksite.incident) {
        const claimed = worksite.work_types.find((workType) => {
          return (
            workType.claimed_by === organizationId &&
            workType.status.includes('open')
          );
        });
        return Boolean(claimed);
      }
      return false;
    });
    return result
      .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at))
      .slice(0, 5);
  });

  const fetchWorksites = async () => {
    loadingWorksites.value = true;
    try {
      const data = await getClaimedWorksites(currentIncidentId, organizationId);
      allClaimedWorksites.value = data;
    } catch (error) {
      console.error('Error fetching worksites:', error);
    } finally {
      loadingWorksites.value = false;
    }
  };

  const fetchInvitations = async () => {
    loadingInvitations.value = true;
    const preferences = user.preferences || {};
    const archivedInvitationRequests =
      preferences.archived_invitation_requests || [];

    try {
      const data = await getInvitationRequests();
      invitationRequests.value = data.filter(
        (request) => !archivedInvitationRequests.includes(request.id),
      );
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      loadingInvitations.value = false;
    }
  };

  const fetchTransfers = async () => {
    loadingTransfers.value = true;
    try {
      const data = await getUserTransferRequests();
      transferRequests.value = data;
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      loadingTransfers.value = false;
    }
  };

  const fetchWorksiteRequests = async () => {
    loadingRequests.value = true;
    const preferences = user.preferences || {};
    const archivedWorksiteRequests =
      preferences.archived_worksite_requests || [];

    try {
      const data = await getWorksiteRequests();
      worksiteRequests.value = data.filter(
        (request) =>
          !archivedWorksiteRequests.includes(request.id) &&
          request.requested_by_org.id !== organizationId,
      );
    } catch (error) {
      console.error('Error fetching worksite requests:', error);
    } finally {
      loadingRequests.value = false;
    }
  };

  const fetchAllData = () => {
    fetchWorksites();
    fetchInvitations();
    fetchTransfers();
    fetchWorksiteRequests();
  };

  onMounted(fetchAllData);

  const actionItems = computed(() => {
    // Combine all items with transformation logic as shown earlier
    const items = [
      ...invitationRequests.value.map((request) => ({
        id: request.id,
        description: i18n.global.t(`dashboard.request_to_join_org`, {
          organization: request.requested_to_organization,
        }),
        title: i18n.global.t('dashboard.user_requested_access', {
          requester: `${request.first_name} ${request.last_name}`,
        }),
        type: 'InvitationRequest',
        timestamp: request.requested_at,
        actions: [
          {
            title: i18n.global.t('actions.accept'),
            variant: 'solid',
            action: () =>
              InvitationRequest.api().acceptInvitationRequest(request),
          },
          {
            title: i18n.global.t('actions.reject'),
            variant: 'outline',
            action: () =>
              InvitationRequest.api().rejectInvitationRequest(request),
          },
          {
            title: i18n.global.t('actions.ignore'),
            variant: 'outline',
            action: () =>
              InvitationRequest.api().archiveInvitationRequest(request),
          },
        ],
      })),
      ...worksiteRequests.value.map((request) => ({
        id: request.id,
        title: i18n.global.t('dashboard.user_requested_case', {
          requester: request.requested_by_org.name,
          case_number: request.case_number,
          work_type: i18n.global.t(
            `workType.${request.worksite_work_type.work_type}`,
          ),
        }),
        description: i18n.global.t('dashboard.request_status', {
          status: request.status,
        }),
        type: 'WorksiteRequest',
        timestamp: request.created_at,
        actions: [
          {
            title: i18n.global.t('actions.accept'),
            variant: 'solid',
            action: () => WorksiteRequest.api().acceptRequest(request.id),
          },
          {
            title: i18n.global.t('actions.reject'),
            variant: 'outline',
            action: () => WorksiteRequest.api().rejectRequest(request.id),
          },
          {
            title: i18n.global.t('actions.ignore'),
            variant: 'outline',
            action: () =>
              WorksiteRequest.api().archiveWorksiteRequest(request.id),
          },
        ],
      })),
      ...transferRequests.value.map((request) => ({
        title: i18n.global.t('dashboard.user_requested_transfer', {
          requester: User.find(request.user)?.full_name,
        }),
        description: i18n.global.t(
          '{requester} would like to transfer to your organization',
          {
            requester: User.find(request.user)?.name,
          },
        ),
        type: 'WorksiteRequest',
        timestamp: request.created_at,
        actions: [
          {
            title: i18n.global.t('actions.accept'),
            variant: 'solid',
            action: async () => {
              const result = await prompt({
                title: i18n.global.t('userTransfer.approve_user_transfer'),
                content: i18n.global.t(
                  'userTransfer.please_give_approval_reason',
                ),
              });
              if (result) {
                await approveTransferRequest(request.id, result);
              }
            },
          },
          {
            title: i18n.global.t('actions.reject'),
            variant: 'outline',
            action: async () => {
              const result = await prompt({
                title: i18n.global.t('userTransfer.reject_user_transfer'),
                content: i18n.global.t(
                  'userTransfer.please_give_reject_reason',
                ),
              });
              if (result) {
                await rejectTransferRequest(request.id, result);
              }
            },
          },
          // {
          //   title: i18n.global.t('actions.ignore'),
          //   variant: 'outline',
          //   action: () =>
          //     WorksiteRequest.api().archiveWorksiteRequest(request.id),
          // },
        ],
      })),
    ];

    return items
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  });

  return {
    actionItems,
    claimedWorksites,
    invitationRequests,
    transferRequests,
    worksiteRequests,
    loadingActionItems: loading,
    loadingWorksites,
    loadingInvitations,
    loadingTransfers,
    loadingRequests,
    fetchAllData,
    fetchWorksites,
    fetchInvitations,
    fetchTransfers,
    fetchWorksiteRequests,
  };
}
