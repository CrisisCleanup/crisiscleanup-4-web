<template>
  <section data-testid="testVoiceDecisions">
    <h3
      class="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
    >
      {{ title ?? t('~~Decision timeline') }}
    </h3>
    <ol class="flex flex-col gap-2">
      <li
        v-for="decision in decisions"
        :key="decision.turn"
        class="rounded border border-crisiscleanup-grey-100 p-2"
      >
        <VoiceDecision :decision="decision" />
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import type { SessionDecision } from '@/hooks/voice/voiceSessions';
import VoiceDecision from './VoiceDecision.vue';

defineProps<{ decisions: SessionDecision[]; title?: string }>();
const { t } = useI18n();
</script>
