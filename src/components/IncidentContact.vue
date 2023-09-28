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
          {{ incident.short_name }}:
          {{ getIncidentPhoneNumbers(incident) }}
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
import { getIncidentPhoneNumbers, isValidActiveHotline } from '@/filters';
import type Incident from '@/models/Incident';
import type { CCUApiListResponse } from '@/models/types';

const ccuApi = useApi();
// TODO: Convert this logic into hook (useActiveHotlines)
const fieldsToFetch = [
  'id',
  'name',
  'short_name',
  'active_phone_number',
  'start_at',
];
const { isLoading, data } = ccuApi<CCUApiListResponse<Incident>>(
  '/incidents?fields=id,name,short_name,active_phone_number&limit=200&sort=-start_at',
  {
    method: 'GET',
    params: {
      fields: fieldsToFetch.join(','),
      limit: 200,
      sort: '-start_at',
    },
  },
);
const incidentsWithActiveHotline = computed(() =>
  (data.value?.results ?? []).filter((i) =>
    isValidActiveHotline(i.active_phone_number),
  ),
);
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
