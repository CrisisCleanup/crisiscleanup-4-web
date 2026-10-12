<template>
  <span class="inline-flex flex-wrap gap-1" data-testid="testVoiceFlags">
    <span
      v-for="flag in flags"
      :key="flag"
      class="inline-block rounded px-1.5 py-0.5 text-xs leading-tight"
      :class="flagClasses(flag)"
      :data-flag="flag"
    >
      {{ t(flagLabel(flag)) }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { flagClasses, flagLabel } from '@/hooks/voice/voiceSessions';

defineProps<{ flags: string[] }>();
const { t } = useI18n();
</script>
