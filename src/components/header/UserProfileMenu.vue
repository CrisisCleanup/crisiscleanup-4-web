<template>
  <div
    class="profile-menu flex items-center header-item overflow-hidden h-full"
    :class="invert && '--invert'"
  >
    <v-popover
      popper-class="menu-popover"
      placement="bottom-end"
      data-testid="auth.userprofile"
    >
      <div class="profile-menu__body flex cursor-pointer items-center">
        <Avatar
          :initials="currentUser ? currentUser.first_name : undefined"
          :url="currentUser && currentUser.profilePictureUrl"
          :alt="currentUser && currentUser.full_name"
          data-testid="testAvatarIcon"
          class="p-1"
          size="small"
        />
        <base-text variant="h3" class="p-3" regular :class="[...styles.title]">
          <span
            class="font-h3 text-h3 font-normal subpixel-antialiased"
            data-testid="testCurrentUserFullNameContent"
            :class="styles.title"
            >{{ currentUser && currentUser.full_name }}
            <font-awesome-icon
              class="cursor-pointer"
              icon="caret-down"
              :alt="$t('nav.show_options')"
            />
          </span>
        </base-text>
      </div>
      <template #popper="{ hide: hidePopover }">
        <div class="flex flex-col">
          <base-button
            data-testid="testUserprofileProfileLink"
            class="text-base p-2 hover:bg-crisiscleanup-light-grey cursor-pointer"
            :text="$t('nav.profile')"
            :alt="$t('nav.profile')"
            :action="
              () => {
                $router.push(`/profile`);
                hidePopover();
              }
            "
          />
          <base-button
            data-testid="testUserprofileDownloadsLink"
            class="text-base p-2 hover:bg-crisiscleanup-light-grey cursor-pointer"
            :text="$t('nav.downloads')"
            :alt="$t('nav.downloads')"
            :action="
              () => {
                $router.push(`/downloads`);
                hidePopover();
              }
            "
          />
          <base-button
            data-testid="testUserprofilelistsLink"
            class="text-base p-2 hover:bg-crisiscleanup-light-grey cursor-pointer"
            :text="$t('list.lists')"
            :alt="$t('list.lists')"
            :action="
              () => {
                $router.push(`/lists`);
                hidePopover();
              }
            "
          />
          <base-button
            data-testid="testUserprofileLogoutLink"
            class="text-base p-2 hover:bg-crisiscleanup-light-grey cursor-pointer"
            :text="$t('actions.logout')"
            :alt="$t('actions.logout')"
            :action="
              () => {
                $emit('auth:logout');
                hidePopover();
              }
            "
          />
        </div>
      </template>
    </v-popover>
  </div>
</template>
<script lang="ts">
import { computed } from 'vue';
import Avatar from '../Avatar.vue';
import User from '@/models/User';
import { useCurrentUser } from '@/hooks';

export default defineComponent({
  name: 'UserProfileMenu',
  components: { Avatar },
  props: {
    invert: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { currentUser } = useCurrentUser();

    const styles = computed(() => ({
      title:
        props.invert === true
          ? ['text-white']
          : ['text-crisiscleanup-dark-300'],
    }));

    return {
      styles,
      currentUser,
    };
  },
});
</script>

<style scoped lang="postcss"></style>

<style>
.menu-popover {
  @apply bg-white w-48;
}
</style>
