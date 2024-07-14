<template>
  <div>
    <base-button
      :text="$t('usersVue.invite_new_user')"
      :alt="$t('usersVue.invite_new_user')"
      data-testid="testInviteNewUserButton"
      variant="solid"
      size="medium"
      :action="
        () => {
          showInviteModal = true;
        }
      "
    />
    <modal
      v-if="showInviteModal"
      data-testid="testInviteUserModal"
      modal-classes="bg-white max-w-2xl shadow"
      modal-body-classes="h-120 overflow-auto"
      :title="$t('usersVue.invite_user')"
      closeable
      @close="
        () => {
          emails = '';
          organizationDoesNotExist = false;
          selectedOrganization = null;
          showInviteModal = false;
          usersToInvite = [];
        }
      "
    >
      <Invite
        :is-admin="isAdmin"
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
      <template #footer>
        <div class="p-3 flex justify-end">
          <base-button
            :text="$t('actions.cancel')"
            :alt="$t('actions.cancel')"
            data-testid="testCancelButton"
            class="ml-2 p-3 px-6 mr-1 text-xs border border-black"
            :action="
              () => {
                showInviteModal = false;
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
    </modal>
  </div>
</template>
<script lang="ts">
import { computed, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useI18n } from 'vue-i18n';
import type { TagInputData } from '@sipec/vue3-tags-input';
import Organization from '../../models/Organization';
import OrganizationSearchInput from '../OrganizationSearchInput.vue';
import { getErrorMessage } from '../../utils/errors';
import useCurrentUser from '../../hooks/useCurrentUser';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import Invite from '@/components/Invite.vue';
import useInviteUsers from '@/hooks/useInviteUsers';

export default defineComponent({
  name: 'InviteUsers',
  components: { Invite, BaseCheckbox, OrganizationSearchInput },
  props: {
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const $toasted = useToast();
    const { t } = useI18n();

    const validation = [
      {
        classes: 'email',
        rule: /[\w!#$%&*+./=?^`{|}~’-]+@[\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*/,
        disableAdd: true,
      },
    ];
    const emails = ref('');
    const usersToInvite = ref<TagInputData[]>([]);
    const showInviteModal = ref(false);
    const selectedOrganization = ref(null);
    const organizationResults = ref<Organization[]>([]);
    const { currentUser } = useCurrentUser();
    const memberOfMyOrg = ref('Member');
    const organizationDoesNotExist = ref(false);
    const currentOrganization = computed(() =>
      Organization.find(currentUser?.value?.organization?.id),
    );
    const { inviteUsers } = useInviteUsers();

    async function onOrganizationSearch(value: string) {
      const results = await Organization.api().get(
        `/organizations?search=${value}&limit=10&fields=id,name&is_active=true`,
        {
          dataKey: 'results',
        },
      );
      organizationResults.value = (results.entities?.organizations ||
        []) as Organization[];
    }

    const sendInvitations = async () => {
      return inviteUsers({
        usersToInvite: usersToInvite.value,
        emails: emails.value,
        selectedOrganization: selectedOrganization.value,
        organizationDoesNotExist: organizationDoesNotExist.value,
        onSuccess: () => {
          $toasted.success(t('inviteTeammates.invites_sent_success'));
          showInviteModal.value = false;
          usersToInvite.value = [];
        },
        onError: (error: unknown) => {
          $toasted.error(getErrorMessage(error));
        },
      });
    };

    return {
      validation,
      emails,
      showInviteModal,
      currentUser,
      currentOrganization,
      onOrganizationSearch,
      selectedOrganization,
      organizationResults,
      sendInvitations,
      usersToInvite,
      memberOfMyOrg,
      organizationDoesNotExist,
    };
  },
});
</script>

<style>
.vue-tags-input {
  @apply h-auto w-full mb-2;
}
.vue-tags-input .ti-input {
  @apply h-auto;
}
</style>
