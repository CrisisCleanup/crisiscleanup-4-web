<script setup lang="ts">
import UserDetailsTooltip from '@/components/user/DetailsTooltip.vue';
import Avatar from '@/components/Avatar.vue';
import { getUserAvatarLink } from '@/utils/urls';
import { defineProps } from 'vue';
import type User from '@/models/User';

defineProps({
  users: {
    type: Array<User>,
  },
  mobileOnlineUserIds: {
    type: Array<number>,
  },
});
</script>

<template>
  <div>
    <div
      v-for="user in users"
      :key="user.id"
      class="flex items-center space-x-2 w-full"
    >
      <Avatar
        v-if="user"
        :initials="user.first_name"
        :url="
          user.profilePictureUrl
            ? user.profilePictureUrl
            : getUserAvatarLink(user.first_name)
        "
        data-testid="testAvatarIcon"
        :custom-size="{ width: '40px', height: '40px' }"
        inner-classes="shadow"
      />
      <UserDetailsTooltip :user="user.id" />
      <div v-if="mobileOnlineUserIds && mobileOnlineUserIds.includes(user.id)">
        <font-awesome-icon
          icon="mobile-screen"
          class="text-green-700"
          :title="$t('chat.using_mobile_app')"
          :alt="$t('chat.using_mobile_app')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
