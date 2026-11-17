<template>
  <div
    class="inline-flex rounded border border-crisiscleanup-grey-100 bg-crisiscleanup-smoke p-0.5"
    role="tablist"
  >
    <button
      v-for="option of options"
      :key="option.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === option.value"
      :data-testid="option.testId"
      class="px-3 py-1 text-sm rounded transition-colors"
      :class="
        modelValue === option.value
          ? 'bg-white shadow-sm font-semibold text-black'
          : 'text-gray-500 hover:text-black'
      "
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface SegmentedTabOption {
  value: string;
  label: string;
  testId?: string;
}

defineProps<{
  modelValue: string;
  options: SegmentedTabOption[];
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>
