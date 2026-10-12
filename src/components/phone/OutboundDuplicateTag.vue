<template>
  <span
    v-if="duplicate"
    class="inline-flex flex-wrap items-center gap-1 rounded bg-yellow-100 px-1 text-xs"
    data-testid="testOutboundPossibleDuplicate"
    :title="$t('~~Check before you call back')"
  >
    <span class="font-semibold">{{ $t('~~Possible duplicate:') }}</span>
    <a
      v-for="worksite in duplicate.cases"
      :key="worksite.id"
      :href="`/incident/${incidentId}/work/${worksite.id}`"
      target="_blank"
      class="underline"
      @click.stop
      >{{ worksite.case_number }}</a
    >
    <span v-if="duplicate.ai_session_ids.length > 0">
      {{ $t('~~AI took a call') }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/** Set by the API when the number may already be handled. */
interface PossibleDuplicate {
  cases: { id: number; case_number: string }[];
  ai_session_ids: number[];
}

const props = defineProps<{
  outbound: {
    incident_id: number[];
    possible_duplicate?: PossibleDuplicate | null;
  };
}>();

const duplicate = computed(() => props.outbound.possible_duplicate);
// The outbound's incident is the highest id, as on the API.
const incidentId = computed(() => Math.max(...props.outbound.incident_id));
</script>
