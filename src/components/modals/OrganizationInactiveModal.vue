<template>
  <modal
    :title="$t('orgInactive.title')"
    data-testid="testVerificationTitleModal"
    modal-classes="max-w-lg h-auto verification-modal"
    :closeable="true"
    @close="$emit('userLoggedOut')"
  >
    <div class="overflow-auto">
      <div class="px-3">
        <div v-html="$t(`orgInactive.sorry_not_active_contact_helpdesk`)"></div>
      </div>
    </div>
    <template #footer>
      <div class="flex items-center justify-center py-2 border-t">
        <base-button
          data-testid="testVerificationLogoutButton"
          :text="$t('actions.logout')"
          :alt="$t('actions.logout')"
          variant="solid"
          class="px-6 p-3 logout-button"
          :action="logout"
        >
          {{ $t('actions.logout') }}
        </base-button>
      </div>
    </template>
  </modal>
</template>

<script lang="ts">
export default defineComponent({
  name: 'OrganizationInactiveModal',
  emits: ['userLoggedOut'],
  setup(props, { emit }) {
    function logout() {
      emit('userLoggedOut');
    }

    return {
      logout,
    };
  },
});
</script>

<style>
.verification-modal a {
  @apply text-primary-dark underline;
}
@media only screen and (max-width: 1223px) and (orientation: landscape) {
  .logout-button {
    @apply w-full m-2;
  }
}
</style>
