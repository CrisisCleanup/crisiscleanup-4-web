<template>
  <div
    class="flex flex-col items-center justify-center text-center gap-2 py-8 px-4 text-crisiscleanup-grey-900"
    role="status"
  >
    <component
      :is="icon"
      v-if="icon"
      class="w-8 h-8 opacity-60"
      aria-hidden="true"
    />
    <p class="text-[15px] font-semibold text-black">{{ title }}</p>
    <p v-if="description" class="text-[13px] leading-snug max-w-xs">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Component } from 'vue';

defineProps<{
  title: string;
  description?: string;
  icon?: Component;
}>();
</script>
