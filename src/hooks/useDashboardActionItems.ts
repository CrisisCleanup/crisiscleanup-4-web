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

  const fetchAllData = async () => {
    loading.value = true;

    const preferences = user.preferences || {};
    const archivedWorksiteRequests =
      preferences.archived_worksite_requests || [];
    const archivedInvitationRequests =
      preferences.archived_invitation_requests || [];

    try {
      const [
        allClaimedWorksitesData,
        invitationRequestsData,
        transferRequestsData,
        worksiteRequestsData,
      ] = await Promise.all([
        getClaimedWorksites(currentIncidentId, organizationId),
        getInvitationRequests(),
        getUserTransferRequests(),
        getWorksiteRequests(currentIncidentId),
      ]);
      invitationRequests.value = invitationRequestsData.filter(
        (request) => !archivedInvitationRequests.includes(request.id),
      );
      transferRequests.value = transferRequestsData;
      worksiteRequests.value = worksiteRequestsData.filter(
        (request) =>
          !archivedWorksiteRequests.includes(request.id) &&
          request.requested_by_org.id !== organizationId,
      );
      allClaimedWorksites.value = allClaimedWorksitesData;
    } catch (error) {
      console.error('Error fetching action items:', error);
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchAllData);

  const actionItems = computed(() => {
    // Combine all items with transformation logic as shown earlier
    const items = [
      ...invitationRequests.value.map((request) => ({
        id: request.id,
        description: i18n.global.t(`~~Join request to {organization}`, {
          organization: request.requested_to_organization,
        }),
        title: i18n.global.t('~~{requester} requested_access', {
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
        title: i18n.global.t('~~{requester} Requested Case {case_number}', {
          requester: request.requested_by_org.name,
          case_number: request.case_number,
        }),
        description: i18n.global.t('~~Status: {status}', {
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
    fetchAllData,
  };
}
