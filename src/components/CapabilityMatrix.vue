<template>
  <div class="p-4">
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th class="px-4 py-2 border"></th>
            <th
              v-for="phase in phases"
              :key="phase.id"
              class="px-4 py-2 border text-left"
            >
              {{ $t(phase.phase_name_t) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="cap in capabilities"
            :key="cap.capability_id"
            class="hover:bg-gray-100"
          >
            <td class="px-4 py-2 border font-medium">
              {{ $t(cap.capability_name) }}
            </td>
            <td
              v-for="phase in phases"
              :key="phase.id"
              class="px-4 py-2 border text-center"
            >
              <span
                v-if="matrix[phase.id]?.includes(cap.capability_id)"
                class="text-green-500"
              >
                ✓
              </span>
              <span v-else class="text-red-500">✗</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';

// Define the structure of the incoming rawData prop
const props = defineProps({
  rawData: {
    type: Array,
    required: true,
    default: () => [],
  },
});

const store = useStore();

// Extract unique phases from rawData
const phases = computed(() => store.getters['enums/phases']);

// Extract unique capabilities from rawData
const capabilities = computed(() => {
  const capMap = new Map();
  for (const item of props.rawData) {
    if (!capMap.has(item.capability_id)) {
      capMap.set(item.capability_id, {
        capability_id: item.capability_id,
        capability_name: item.capability_name,
      });
    }
  }
  return [...capMap.values()].sort((a, b) => a.capability_id - b.capability_id);
});

// Create the matrix mapping phases to their capabilities
const matrix = computed(() => {
  const mat = {};
  for (const item of props.rawData) {
    if (!mat[item.phase_id]) {
      mat[item.phase_id] = new Set();
    }
    mat[item.phase_id].add(item.capability_id);
  }
  // Convert Sets to Arrays for easier handling in the template
  for (const key of Object.keys(mat)) {
    mat[key] = [...mat[key]];
  }
  return mat;
});

// Utility function to format names for better readability
const formatName = (name) => {
  return name
    .split('.')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
</script>

<style scoped>
/* Optional: Add any additional styles if needed */
</style>
