<template>
  <span :class="['ccu-pill', `ccu-pill--${variant}`]">
    <span
      v-if="showDot && !isSquareVariant"
      class="ccu-pill__dot"
      aria-hidden="true"
    />
    <slot />
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

export type BasePillVariant =
  | 'open'
  | 'claimed'
  | 'in-progress'
  | 'completed'
  | 'urgent'
  | 'new'
  | 'dark'
  | 'incident';

const props = withDefaults(
  defineProps<{ variant?: BasePillVariant; showDot?: boolean }>(),
  { variant: 'dark', showDot: false },
);

const isSquareVariant = computed(() => props.variant === 'new');
</script>

<style scoped>
.ccu-pill {
  @apply inline-flex
    items-center
    gap-1.5
    px-2.5
    rounded-full
    text-[11px]
    font-bold
    leading-[1.4]
    whitespace-nowrap;
  padding-top: 3px;
  padding-bottom: 3px;
}
.ccu-pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.85;
}
.ccu-pill--open {
  @apply bg-phone-inbound-light text-phone-inbound-dark;
}
.ccu-pill--in-progress {
  @apply bg-phone-outbound-light text-phone-outbound-dark;
}
.ccu-pill--urgent {
  background: #fcd9da;
  @apply text-crisiscleanup-red-900;
}
.ccu-pill--claimed {
  background: #fff4c2;
  color: #7a5a00;
}
.ccu-pill--completed {
  background: #e3e3e3;
  color: #444;
}
.ccu-pill--dark {
  background: #000;
  color: #fff;
}
.ccu-pill--incident {
  @apply bg-primary-light text-black;
}
.ccu-pill--new {
  @apply bg-crisiscleanup-red-700 text-white uppercase;
  border-radius: 3px;
  padding: 2px 8px;
  font-size: 10px;
  letter-spacing: 0.04em;
}
</style>
