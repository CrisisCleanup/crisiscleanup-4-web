<template>
  <div
    class="max-w-sm mx-auto bg-white flex flex-col items-center space-y-4 border rounded-md"
  >
    <div class="flex flex-col items-center p-3">
      <img
        class="h-32 w-32 rounded-full my-5"
        :src="user.profilePictureUrl"
        alt="profileUser.profile_picture"
      />
      <h1 class="text-lg font-semibold">{{ user.full_name }}</h1>
      <p class="text-gray-500">{{ user.highestRole.name_t }}</p>
    </div>
    <div class="space-y-1 text-crisiscleanup-grey-900">
      <div class="flex items-center space-x-1">
        <font-awesome-icon icon="phone" class="text-gray-500" />
        <span>{{ user.mobile }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <font-awesome-icon icon="envelope" class="text-gray-500" />
        <span>{{ user.email }}</span>
      </div>
    </div>
    <a
      href="/profile"
      class="text-blue-500 hover:text-blue-700 transition duration-300 ease-in-out text-lg"
      >{{ $t('actions.view_profile') }}</a
    >
    <div class="border-t py-4 w-full bg-crisiscleanup-light-smoke text-center">
      <p class="">
        <span class="font-bold">{{ $t('profileUser.your_organization') }}</span>
        {{ user.organization.name }}
      </p>
      <p class="">
        <span class="font-bold">{{ $t('profileUser.languages') }}</span>
        {{ user.languageNames }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type User from '@/models/User';

const props = defineProps<{
  user: User;
}>();
</script>

<style scoped>
/* Scoped styles if needed */
</style>
