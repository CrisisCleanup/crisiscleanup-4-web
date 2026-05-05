<script setup lang="ts">
import BaseInput from '@/components/BaseInput.vue';
import type { CCUDocumentFileItem } from '@/hooks';

defineProps<{
  documentFile: CCUDocumentFileItem;
}>();

const value = defineModel<string>({ required: true });
</script>

<template>
  <div class="p-3">
    <p class="text-sm text-crisiscleanup-grey-900 mb-2">
      {{ documentFile.filenameOriginal }}
    </p>
    <BaseInput
      v-model="value"
      :placeholder="$t('~~Folder path (e.g. policies/2026)')"
    />
  </div>
</template>
