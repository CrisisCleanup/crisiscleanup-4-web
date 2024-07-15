<template>
  <div class="text-justify flex flex-col p-3 justify-center">
    <div class="my-3" data-testid="testInviteTeammatesInstructionsDiv">
      {{ $t('inviteTeammates.invite_teammates_instructions') }}
    </div>
    <base-radio
      class="m-1 mb-3"
      data-testid="testCurrentLocationSharedRadio"
      label="Member"
      :name="
        $t('inviteTeammates.member_of_organization', {
          organizationName: currentUser?.organization?.name || '',
        })
      "
      :model-value="memberOfMyOrg"
      @update:model-value="memberOfMyOrg = $event"
    />
    <base-radio
      class="m-1 mb-3"
      :name="
        $t('inviteTeammates.not_member_of_organization', {
          organizationName: currentUser?.organization?.name || '',
        })
      "
      label="Not Member"
      data-testid="testCurrentLocationPrivateRadio"
      :model-value="memberOfMyOrg"
      @update:model-value="memberOfMyOrg = $event"
    />
    <div class="mb-1">
      <tag-input
        v-model="emails"
        v-model:tags="usersToInvite"
        data-testid="testUserEmailsToInviteTextInput"
        :placeholder="$t('usersVue.emails')"
        :validation="validation"
        :add-on-key="[13, 32, ',']"
        :separators="[';', ',', ', ']"
        @tags-changed="
          (newTags: any) =>
            $emit('tagsChanged', {
              tags: newTags,
              emails,
            })
        "
      />
    </div>
    <div
      v-if="
        isAdmin ||
        (currentOrganization && currentOrganization.affiliates.length > 1) ||
        memberOfMyOrg === 'Not Member'
      "
    >
      <OrganizationSearchInput
        class="w-108"
        data-testid="testOrganizationSearchTextInput"
        :is-admin="isAdmin"
        @selected-organization="
          (organization) => {
            selectedOrganization = organization.id;
            $emit('selected-organization', organization.id);
          }
        "
      />
      <base-checkbox
        v-if="memberOfMyOrg === 'Not Member'"
        class="m-1 mt-3"
        data-testid="testOrganizationDoesNotExistCheckbox"
        label="Organization is not listed"
        :model-value="organizationDoesNotExist"
        @update:model-value="
          (value) => {
            organizationDoesNotExist = value;
            $emit('onSetOrganizationDoesNotExist', value);
          }
        "
      >
        {{ $t('inviteTeammates.org_not_listed') }}
      </base-checkbox>
    </div>
  </div>
</template>
<script setup lang="ts">
import useCurrentUser from '@/hooks/useCurrentUser';
import { ref } from 'vue';
import Organization from '@/models/Organization';
import type { TagInputData } from '@sipec/vue3-tags-input';
import OrganizationSearchInput from '@/components/OrganizationSearchInput.vue';

defineProps({
  isAdmin: Boolean,
});

const { currentUser } = useCurrentUser();
const currentOrganization = computed(() =>
  Organization.find(currentUser?.value?.organization?.id),
);
const emails = ref('');
const memberOfMyOrg = ref('Member');
const organizationDoesNotExist = ref(false);
const usersToInvite = ref<TagInputData[]>([]);
const validation = [
  {
    classes: 'email',
    rule: /[\w!#$%&*+./=?^`{|}~’-]+@[\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*/,
    disableAdd: true,
  },
];
const selectedOrganization = ref(null);
</script>
