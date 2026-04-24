<template>
  <div
    v-if="variant === 'line'"
    :class="[
      'animate-pulse bg-crisiscleanup-light-smoke rounded',
      widthClass,
      heightClass,
    ]"
    aria-hidden="true"
  />
  <div
    v-else-if="variant === 'block'"
    class="animate-pulse bg-white rounded shadow-crisiscleanup-card p-4 flex flex-col gap-2"
    aria-hidden="true"
  >
    <div class="h-3 w-1/3 bg-crisiscleanup-light-smoke rounded" />
    <div class="h-3 w-5/6 bg-crisiscleanup-light-smoke rounded" />
    <div class="h-3 w-3/4 bg-crisiscleanup-light-smoke rounded" />
  </div>
  <div
    v-else
    class="animate-pulse flex items-center gap-3 h-10 px-3 border-b border-crisiscleanup-grey-100"
    aria-hidden="true"
  >
    <div class="h-3 flex-1 bg-crisiscleanup-light-smoke rounded" />
    <div class="h-3 w-16 bg-crisiscleanup-light-smoke rounded" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'line' | 'block' | 'row';
    width?: 'full' | '3/4' | '1/2' | '1/3';
    height?: 'sm' | 'md' | 'lg';
  }>(),
  { variant: 'line', width: 'full', height: 'md' },
);

const widthClass = computed(
  () =>
    ({ full: 'w-full', '3/4': 'w-3/4', '1/2': 'w-1/2', '1/3': 'w-1/3' })[
      props.width
    ],
);
const heightClass = computed(
  () => ({ sm: 'h-2', md: 'h-3', lg: 'h-4' })[props.height],
);
</script>
