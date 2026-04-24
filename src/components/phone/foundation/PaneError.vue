<template>
  <div
    class="flex items-start gap-3 p-3 rounded border border-crisiscleanup-red-700 bg-[#FCD9DA]"
    role="alert"
  >
    <ccu-icon
      type="attention-red"
      size="medium"
      alt=""
      aria-hidden="true"
      class="flex-none"
    />
    <div class="flex-1 min-w-0 text-[13px] text-crisiscleanup-red-900">
      <p class="font-semibold">{{ title }}</p>
      <p v-if="description" class="opacity-90">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="flex-none">
      <slot name="action" />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string;
  description?: string;
}>();
</script>
