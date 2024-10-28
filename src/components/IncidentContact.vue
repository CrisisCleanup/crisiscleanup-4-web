<template>
  <div class="grid--survivors" data-testid="testSurvivorContactDiv">
    <base-text font="display" variant="h1">
      {{ $t('homeVue.survivors_call') }}
    </base-text>
    <base-text font="display" variant="h2" class="help-contact">
      <div
        v-if="
          incidentsWithActiveHotline && incidentsWithActiveHotline.length > 0
        "
        class="w-full"
      >
        <div
          v-for="incident in incidentsWithActiveHotline"
          :key="incident.id"
          data-testid="testIncidentPhoneDiv"
          class="ml-2"
        >
          <PhoneNumberDisplay
            v-for="hotlineNumber in formatIncidentPhoneNumbers(incident)"
            :key="hotlineNumber"
            :phone-number="hotlineNumber"
          />
        </div>
      </div>
      <div v-else-if="isLoading">
        <spinner data-testid="testSpinnerLoadingIcon" />
      </div>
      <div v-else data-testid="testNoPhoneDiv">
        {{ $t('homeVue.phone_or_website') }}
      </div>
    </base-text>
  </div>
</template>

<script lang="ts" setup>
import { useActiveHotlines } from '@/hooks/useActiveHotlines';
import { formatIncidentPhoneNumbers, getIncidentPhoneNumbers } from '@/filters';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay.vue';

const { isLoading, incidentsWithActiveHotline } = useActiveHotlines();
</script>

<style lang="postcss" scoped>
.grid--survivors {
  @apply bg-crisiscleanup-yellow-700 my-4 text-center p-4;
  /*min-width: 205px;*/

  p {
    letter-spacing: 0.35px;

    &:first-child {
      font-weight: 700;
      @apply text-2xl;
    }

    &:last-child {
      font-weight: 600;
    }
  }

  a {
    @apply underline;
  }
}

@media only screen and (max-width: 768px) {
}
</style>
