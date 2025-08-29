<template>
  <div
    class="flex items-center justify-center md:mb-0 mb-10"
    data-testid="testDashboarddiv"
  >
    <div
      v-if="loadingActionItems && !allDataLoaded"
      class="h-screen flex items-center justify-center"
    >
      <spinner size="lg" />
    </div>
    <div v-else class="flex flex-col" data-testid="testMainContent">
      <header
        class="bg-white border p-6 items-center gap-3 flex justify-between"
        data-testid="testHeader"
      >
        <div class="flex items-center gap-2" data-testid="testHeaderLeft">
          <ccu-icon
            :type="`${kebabCase($route.path.split('/').pop())}-dashboard`"
            class="text-crisiscleanup-dashboard-blue"
            size="xl"
            data-testid="testDashboardIcon"
          />
          <h1 class="text-2xl" data-testid="testDashboardTitle">
            {{ $t(String($route.name)) }}
          </h1>
          <base-button
            :action="goToDashboardSelector"
            :alt="$t('actions.switch')"
            variant="text-dark"
            data-testid="testSwitchButton"
          >
            {{ $t('actions.switch') }}
          </base-button>
        </div>
        <div class="flex items-center" data-testid="testHeaderRight">
          <RedeployRequest data-testid="testRedeployRequest" />
          <base-button
            :text="
              $t('dashboard.upload_volunteer_photos_button') ||
              'Upload Volunteer Photos'
            "
            :alt="
              $t('dashboard.upload_volunteer_photos_button') ||
              'Upload Volunteer Photos'
            "
            data-testid="testUploadVolunteerPhotosButton"
            variant="solid"
            class="mx-1"
            size="medium"
            :action="
              () => {
                showUploadPhotosModal = true;
              }
            "
          >
            <font-awesome-icon icon="camera" class="mr-1" />
            {{
              $t('dashboard.upload_volunteer_photos_button') ||
              'Upload Volunteer Photos'
            }}
          </base-button>
          <base-button
            :text="$t('usersVue.invite_new_user')"
            :alt="$t('usersVue.invite_new_user')"
            data-testid="testInviteNewUserButton"
            variant="solid"
            class="mx-1"
            size="medium"
            :action="
              () => {
                showInviteSection = true;
              }
            "
          />
          <spinner v-show="loadingActionItems && allDataLoaded" size="lg" />
        </div>
      </header>

      <main
        class="flex-grow overflow-y-auto overflow-x-hidden bg-gray-100 border-l border-r"
        data-testid="testMain"
      >
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 h-full"
          data-testid="testGrid"
        >
          <section
            class="bg-white p-5 border-r h-full"
            data-testid="testLeftSection"
          >
            <UserProfileCard
              class="mb-5"
              :user="currentUser"
              data-testid="testUserProfileCard"
            />
            <h2
              class="font-bold text-lg mb-3"
              data-testid="testActionItemsTitle"
            >
              Action Items
            </h2>
            <div
              v-for="item in actionItems"
              :key="item.id"
              class="mb-2 flex flex-col gap-1"
              data-testid="testActionItem"
            >
              <p
                class="text-crisiscleanup-dark-blue font-semibold text-sm"
                data-testid="testActionItemTitle"
              >
                {{ item.title }}
              </p>
              <p
                class="text-xs text-gray-500"
                data-testid="testActionItemTimestamp"
              >
                {{ momentFromNow(item.timestamp) }}
              </p>
              <div
                class="actions flex items-center justify-start gap-1"
                data-testid="testActionItemActions"
              >
                <base-button
                  v-for="action in item.actions"
                  :key="action.title"
                  :variant="action.variant"
                  size="small"
                  class="rounded-full"
                  :action="() => performAction(action.action)"
                  data-testid="testActionButton"
                >
                  {{ action.title }}
                </base-button>
              </div>
            </div>
          </section>

          <section
            class="col-span-3 bg-white md:col-span-1 lg:col-span-3"
            data-testid="testRightSection"
          >
            <template v-if="showInviteSection">
              <Invite
                :is-admin="false"
                @tags-changed="
                  usersToInvite = $event.tags;
                  emails = $event.emails;
                "
                @selected-organization="selectedOrganization = $event"
                @on-set-organization-does-not-exist="
                  (value) => {
                    organizationDoesNotExist = value;
                  }
                "
              />
              <div class="p-3 flex justify-end">
                <base-button
                  :text="$t('actions.cancel')"
                  :alt="$t('actions.cancel')"
                  data-testid="testCancelButton"
                  class="ml-2 p-3 px-6 mr-1 text-xs border border-black"
                  :action="
                    () => {
                      showInviteSection = false;
                    }
                  "
                />
                <base-button
                  variant="solid"
                  data-testid="testSubmitInvitesButton"
                  :action="() => sendInvitations()"
                  :text="$t('actions.submit_invites')"
                  :alt="$t('actions.submit_invites')"
                  class="ml-2 p-3 px-6 text-xs"
                />
              </div>
            </template>
            <router-view
              v-if="allDataLoaded"
              :current-incident-id="currentIncidentId"
              :loading-action-items="loadingActionItems"
              :claimed-worksites="claimedWorksites"
              :invitation-requests="invitationRequests"
              :transfer-requests="transferRequests"
              :worksite-requests="worksiteRequests"
              :all-data-loaded="allDataLoaded"
              :fetch-all-data="fetchAllData"
            />
          </section>
        </div>
      </main>

      <DashboardFooter class="flex-shrink" data-testid="testDashboardFooter" />
    </div>

    <teleport to="body">
      <div
        v-if="showUploadPhotosModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click.self="showUploadPhotosModal = false"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        >
          <UploadVolunteerPhotosModal
            :organization-id="currentUser?.organization?.id"
            :incidents="availableIncidents"
            :current-incident-id="currentIncidentId"
            @close="showUploadPhotosModal = false"
            @uploaded="onPhotosUploaded"
          />
        </div>
      </div>
    </teleport>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import UserProfileCard from '@/components/UserProfileCard.vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import BaseButton from '@/components/BaseButton.vue';
import { momentFromNow } from '@/filters';
import { useCurrentIncident } from '@/hooks';
import { useDashboardActionItems } from '@/hooks/useDashboardActionItems';
import { useToast } from 'vue-toastification';
import useNavigation from '@/hooks/useNavigation';
import _, { kebabCase } from 'lodash';
import DashboardFooter from '@/components/dashboard/DashboardFooter.vue';
import InviteUsers from '@/components/modals/InviteUsers.vue';
import RedeployRequest from '@/components/modals/RedeployRequest.vue';
import Invite from '@/components/Invite.vue';
import { getErrorMessage } from '@/utils/errors';
import type { TagInputData } from '@sipec/vue3-tags-input';
import useInviteUsers from '@/hooks/useInviteUsers';
import UploadVolunteerPhotosModal from '@/components/dashboard/UploadVolunteerPhotosModal.vue';
import Incident from '@/models/Incident';

const { currentUser, userPreferences, updateCurrentUser } = useCurrentUser();
const { currentIncidentId } = useCurrentIncident();
const router = useRouter();
const $toasted = useToast();
const { t } = useI18n();

const emails = ref('');
const usersToInvite = ref<TagInputData[]>([]);
const selectedOrganization = ref(null);
const organizationDoesNotExist = ref(false);
const { inviteUsers } = useInviteUsers();
const showInviteSection = ref(false);
const showUploadPhotosModal = ref(false);
const availableIncidents = ref<Incident[]>([]);

const performAction = async (action) => {
  await action();
  await fetchAllData();
};

const {
  actionItems,
  claimedWorksites,
  invitationRequests,
  transferRequests,
  worksiteRequests,
  loadingActionItems,
  fetchAllData,
} = useDashboardActionItems(
  currentIncidentId.value,
  currentUser.value?.organization.id,
  currentUser.value,
);

const allDataLoaded = ref(false);

const goToDashboardSelector = async () => {
  const newPreferences = {
    ...userPreferences.value,
  };
  delete newPreferences.dashboard;
  await updateCurrentUser({
    preferences: newPreferences,
  });
  await router.push(`/dashboard`);
};

const sendInvitations = async () => {
  return inviteUsers({
    usersToInvite: usersToInvite.value,
    emails: emails.value,
    selectedOrganization: selectedOrganization.value,
    organizationDoesNotExist: organizationDoesNotExist.value,
    onSuccess: () => {
      $toasted.success(t('inviteTeammates.invites_sent_success'));
      showInviteSection.value = false;
      usersToInvite.value = [];
    },
    onError: (error: unknown) => {
      $toasted.error(getErrorMessage(error));
    },
  });
};

const onPhotosUploaded = () => {
  // Optionally refresh data or show additional success messaging
  $toasted.success(
    t('dashboard.photos_upload_complete') || 'Photos uploaded successfully!',
  );
};

const fetchIncidents = async () => {
  try {
    const incidents = Incident.query().get();
    availableIncidents.value = incidents;
  } catch (error) {
    console.error('Error fetching incidents:', error);
  }
};

onMounted(() => {
  fetchIncidents();
  watch(
    loadingActionItems,
    (newVal) => {
      if (!newVal) {
        allDataLoaded.value = true;
      }
    },
    { immediate: true },
  );

  if (!loadingActionItems) {
    allDataLoaded.value = true;
  }
});
</script>

<style>
.stats-card {
  @apply border flex-1 p-4 shadow rounded-md h-28;
}

.stats-card p {
  @apply text-start;
}

.stats-card p > a {
  @apply text-primary-dark;
}

.stats-card p:first-child {
  @apply text-sm font-light;
}

.stats-card p:last-child {
  @apply text-3xl font-light mt-2;
}

.case-svg-container svg {
  width: 20px;
  height: 20px;
}

header {
  @apply z-toolbar;
  position: sticky;
  top: 0;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
/* Add any custom styles or override Tailwind styles if needed */
</style>
