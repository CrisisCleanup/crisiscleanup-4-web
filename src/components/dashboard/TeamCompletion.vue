<template>
  <div class="status-card border rounded p-4 shadow">
    <!-- Percentage and Links -->
    <div class="flex items-center justify-between">
      <div class="text-6xl font-bold">
        {{ completionPercentage }}<span class="text-2xl">%</span>
      </div>
      <div class="text-right">
        <a href="#" class="text-blue-600"
          >{{ closedCases }} {{ $t('~~cases closed') }}</a
        ><br />
        <a href="#" class="text-blue-600"
          >{{ openCases }} {{ $t('~~open cases') }}</a
        ><br />
        <a href="#" class="text-blue-600"
          >{{ overdueCases }} {{ $t('~~overdue cases') }}</a
        >
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="my-4">
      <div class="relative w-full h-4 rounded bg-gray-200">
        <div
          class="absolute left-0 h-4 rounded-l"
          :style="{ width: closedWidth, backgroundColor: '#8dd362' }"
        ></div>
        <div
          class="absolute h-4"
          :style="{
            left: closedWidth,
            width: inProgressWidth,
            backgroundColor: '#f2b85d',
          }"
        ></div>
        <div
          class="absolute h-4"
          :style="{
            left: `${parseFloat(closedWidth) + parseFloat(inProgressWidth)}%`,
            width: overdueWidth,
            backgroundColor: '#f05454',
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  teams: {
    type: Array,
    required: true,
  },
});

const closedCases = computed(() => {
  return props.teams.reduce((acc, team) => {
    return (
      acc +
      team.assigned_work_types.filter((workType) =>
        workType.status.includes('closed'),
      ).length
    );
  }, 0);
});

const openCases = computed(() => {
  return props.teams.reduce((acc, team) => {
    return (
      acc +
      team.assigned_work_types.filter((workType) =>
        workType.status.includes('open'),
      ).length
    );
  }, 0);
});

const overdueCases = computed(() => {
  return props.teams.reduce((acc, team) => {
    return (
      acc +
      team.assigned_work_types.filter(
        (workType) => workType.status === 'open_unassigned',
      ).length
    );
  }, 0);
});

const completionPercentage = computed(() => {
  const totalCases = closedCases.value + openCases.value + overdueCases.value;
  return totalCases ? Math.round((closedCases.value / totalCases) * 100) : 0;
});

const closedWidth = computed(() => {
  const totalCases = closedCases.value + openCases.value + overdueCases.value;
  return `${(closedCases.value / totalCases) * 100}%`;
});

const inProgressWidth = computed(() => {
  const totalCases = closedCases.value + openCases.value + overdueCases.value;
  return `${(openCases.value / totalCases) * 100}%`;
});

const overdueWidth = computed(() => {
  const totalCases = closedCases.value + openCases.value + overdueCases.value;
  return `${(overdueCases.value / totalCases) * 100}%`;
});
</script>

<style scoped></style>
