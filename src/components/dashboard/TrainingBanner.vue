<template>
  <div
    v-if="!userPreferences.hideTrainingBanner"
    class="flex items-center bg-crisiscleanup-light-smoke relative px-4 pt-2"
  >
    <div class="relative">
      <img src="@/assets/training.png" />
    </div>
    <div class="rounded-lg relative">
      <div class="p-4 ml-5">
        <h2 class="text-2xl font-bold mb-2">
          {{ $t('~~Training Available!') }}
        </h2>
        <p class="mb-4">
          {{
            $t(
              '~~Visit the Training hub to learn how to get the most out of the CC platform. Videos are available to quickly up-skill you and your organization so you can get to helping survivors sooner.',
            )
          }}
        </p>
        <base-button
          variant="solid"
          size="large"
          :action="
            () => {
              $router.push('/training');
            }
          "
        >
          {{ $t('~~Go to Training') }}
        </base-button>
      </div>
    </div>
    <ccu-icon
      data-testid="testModalCancel2Icon"
      :alt="$t('actions.cancel')"
      size="xs"
      type="cancel"
      class="absolute right-5 top-5"
      @click="
        () => {
          closeModal();
        }
      "
    />
  </div>
</template>

<script setup>
import { useCurrentUser } from '@/hooks';
import BaseButton from '@/components/BaseButton.vue';

const { updateCurrentUser, userPreferences } = useCurrentUser();

async function closeModal() {
  await updateCurrentUser({
    preferences: {
      ...userPreferences.value,
      hideTrainingBanner: true,
    },
  });
}
</script>

<style scoped>
button {
  background: transparent;
  border: none;
}
</style>
