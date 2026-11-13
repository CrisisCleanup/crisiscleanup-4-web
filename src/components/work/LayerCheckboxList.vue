<template>
  <div v-for="item in items" :key="`${item.id}`">
    <base-checkbox
      :model-value="appliedLocations.has(item.id)"
      :ccu-event="
        appliedLocations.has(item.id)
          ? 'user_ui-turn-off_layer'
          : 'user_ui-turn-on_layer'
      "
      :data-testid="item.testId"
      @update:model-value="(value: boolean) => emit('apply', item.id, value)"
      >{{ item.name }}</base-checkbox
    >
  </div>
</template>

<script setup lang="ts">
export interface LayerItem {
  id: string;
  name: string;
  testId: string;
}

defineProps<{
  items: LayerItem[];
  appliedLocations: Set<string>;
}>();

const emit = defineEmits<{
  apply: [locationId: string, value: boolean];
}>();
</script>
