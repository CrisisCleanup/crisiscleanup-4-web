<template>
  <div
    v-if="user"
    class="max-w-sm mx-auto bg-white flex flex-col items-center border rounded-md"
  >
    <div class="flex flex-col items-center p-3">
      <img
        class="h-32 w-32 rounded-full my-5"
        :src="user.profilePictureUrl"
        alt="profileUser.profile_picture"
      />
      <h1 class="text-lg font-semibold">{{ user.full_name }}</h1>
      <div class="text-gray-500 text-center">
        <div v-for="role in user.allRoles" :key="role.id">
          {{ $t(role.name_t) }}
        </div>
      </div>
    </div>
    <div v-for="l in user.languages" :key="`l_${l}`" class="flex gap-2">
      <LanguageTag class="tag-item mx-0.5" :language-id="l.id" />
    </div>
    <div class="space-y-1 text-crisiscleanup-grey-900 mt-4">
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
      class="text-primary-dark hover:text-primary-light transition duration-300 ease-in-out text-lg mb-2 text-base"
      >{{ $t('actions.view_profile') }}</a
    >
    <div class="border-t py-4 w-full bg-crisiscleanup-light-smoke text-center">
      <div class="w-full flex items-center justify-center mb-2">
        <img
          :src="organization.logo_url"
          :alt="organization.name"
          class="w-10"
        />
      </div>
      <router-link
        to="/organization/profile"
        class="text-primary-dark hover:text-primary-light text-base"
      >
        <p class="mx-2">
          {{ organization.name }}
        </p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type User from '@/models/User';
import LanguageTag from '@/components/tags/LanguageTag.vue';
import Organization from '@/models/Organization';

const props = defineProps<{
  user: User;
}>();

const organization = computed(() => {
  return Organization.find(props.user.organization.id);
});
</script>

<style scoped>
/* Scoped styles if needed */
</style>
