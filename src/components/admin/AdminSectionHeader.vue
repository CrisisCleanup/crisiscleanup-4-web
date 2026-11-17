<template>
  <div
    class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-crisiscleanup-grey-100"
  >
    <button
      type="button"
      class="flex items-center gap-2 text-left font-semibold text-black"
      :aria-expanded="visible"
      :aria-label="title"
      @click="$emit('update:visible', !visible)"
    >
      <font-awesome-icon
        icon="chevron-down"
        size="xs"
        class="transition-transform text-gray-500"
        :class="{ '-rotate-90': !visible }"
      />
      {{ title }}
    </button>
    <div class="flex flex-wrap items-center gap-2 ml-auto">
      <slot name="actions" />
      <base-input
        v-if="search !== undefined"
        :model-value="search"
        icon="search"
        class="w-full sm:w-72"
        :placeholder="$t('actions.search')"
        @update:model-value="$emit('update:search', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  visible?: boolean;
  search?: string;
}>();

defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update:search', value: string): void;
}>();
</script>
