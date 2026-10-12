<template>
  <span
    v-if="links.length > 0"
    class="inline-flex flex-wrap items-center gap-x-2 gap-y-1"
    data-testid="testVoiceCaseLinks"
  >
    <router-link
      v-for="link in links"
      :key="link.id"
      :to="link.to"
      class="underline max-md:inline-flex max-md:min-h-[40px] max-md:items-center"
      data-testid="testVoiceCaseLink"
      @click.stop
    >
      {{ link.caseNumber }}
    </router-link>
    <span
      v-if="links.length > 1"
      class="rounded bg-crisiscleanup-green-100/20 px-1.5 text-xs text-crisiscleanup-green-900"
      :title="
        t('~~The caller had a second address, so the call made two cases.')
      "
      data-testid="testVoiceExtraCases"
    >
      +{{ links.length - 1 }}
    </span>
  </span>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import {
  caseEditPath,
  type SessionCase,
  type SessionRow,
} from '@/hooks/voice/voiceSessions';

const props = defineProps<{
  session: Pick<
    SessionRow,
    'cases' | 'case_number' | 'incident_id' | 'worksite_id'
  >;
}>();
const { t } = useI18n();

// Calls saved before the API listed every case carry only the first one.
const links = computed(() => {
  const { cases, case_number, incident_id, worksite_id } = props.session;
  const all = cases?.length
    ? cases
    : case_number && incident_id && worksite_id
      ? [{ id: worksite_id, case_number, incident_id }]
      : [];
  return all.map((item: SessionCase) => ({
    id: item.id,
    caseNumber: item.case_number,
    to: caseEditPath(item),
  }));
});
</script>
