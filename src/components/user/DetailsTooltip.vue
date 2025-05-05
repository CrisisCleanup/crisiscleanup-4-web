<template>
  <v-popover
    :popper-class="['popover', dark && 'dark']"
    trigger="click"
    popover-inner-class="popover-inner max-w-sm"
  >
    <base-text :style="[nameStyle]" class="details-name" variant="body">
      <span
        v-if="userItem"
        data-testid="testUserFullNameContent"
        :class="`${nameClass} tooltip-target cursor-pointer hover:text-primary-dark`"
        >{{ `${userItem.first_name} ${userItem.last_name}` }}</span
      >
      <slot
    /></base-text>
    <template #popper>
      <div class="flex">
        <div v-if="userItem" class="flex items-center justify-center">
          <Avatar
            :initials="userItem.first_name"
            :url="
              userItem.profilePictureUrl
                ? userItem.profilePictureUrl
                : getUserAvatarLink(userItem.first_name)
            "
            :custom-size="{ width: '40px', height: '40px' }"
            inner-classes="shadow"
          />
        </div>
        <div class="tooltip-content p-2">
          <div v-if="userItem" class="text-base">
            {{ `${userItem.first_name} ${userItem.last_name}` }}
          </div>
          <div
            v-if="userItem"
            class="text-xs"
            data-testid="testUserOrganizationDiv"
          >
            {{ userItem.organization.name }}
          </div>
          <div v-if="userItem" class="mt-2" data-testid="testUserEmailDiv">
            <font-awesome-icon icon="envelope" :alt="$t('actions.email')" />
            <a :href="`mailto:${userItem.email}`" class="ml-1">{{
              userItem.email
            }}</a>
          </div>
          <div
            v-if="userItem && userItem.mobile"
            data-testid="testUserMobileDiv"
          >
            <font-awesome-icon icon="phone" :alt="$t('actions.call')" />
            <a :href="`tel:${userItem.mobile}`" class="ml-1">{{
              userItem.mobile
            }}</a>
          </div>
        </div>
      </div>
    </template>
  </v-popover>
</template>

<script lang="ts">
import { computed, onMounted, ref } from 'vue';
import User from '../../models/User';
import { DbService, USER_DATABASE } from '@/services/db.service';
import { getUserAvatarLink } from '../../utils/urls';
import Avatar from '@/components/Avatar.vue';

export default defineComponent({
  name: 'UserDetailsTooltip',
  components: { Avatar },
  props: {
    user: {
      type: Number,
    },
    nameClass: {
      type: String,
      default: 'text-yellow-600',
    },
    nameStyle: {
      type: String,
      default: '',
    },
    dark: {
      type: Boolean,
      default: true,
    },
    userObject: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const userFromCache = ref(null);

    const asyncUser = ref(null);
    const userItem = computed(() => {
      return props.userObject || userFromCache.value || User.find(props.user);
    });
    onMounted(async () => {
      const user = props.userObject || User.find(props.user);

      if (!user) {
        userFromCache.value = await DbService.getItem(
          `user_${props.user}`,
          USER_DATABASE,
        );
      }

      if (!user && !userFromCache.value) {
        User.api()
          .get(`/users/${props.user}`, {})
          .then((response) => {
            DbService.setItem(
              `user_${props.user}`,
              User.find(props.user)?.$toJson(),
              USER_DATABASE,
            );
          });
      }
    });
    return {
      asyncUser,
      userItem,
      getUserAvatarLink,
      Avatar,
    };
  },
});
</script>

<style></style>
