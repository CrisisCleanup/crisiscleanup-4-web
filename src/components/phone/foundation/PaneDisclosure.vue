<template>
  <AccordionItem
    :name="name"
    :start-open="startOpen"
    icon-position="right"
    classes="border-b border-crisiscleanup-grey-100 last:border-b-0"
    :button-classes="BUTTON_CLASSES"
    body-classes="px-3 py-2"
  >
    <template #name>
      <span class="flex items-center gap-2 min-w-0 flex-1">
        <slot name="title">{{ title ?? name }}</slot>
        <BasePill
          v-if="count !== undefined && count > 0"
          variant="dark"
          class="ml-auto"
        >
          {{ count }}
        </BasePill>
      </span>
    </template>
    <slot />
  </AccordionItem>
</template>

<script lang="ts" setup>
import AccordionItem from '@/components/accordion/AccordionItem.vue';
import BasePill from '@/components/BasePill.vue';

const BUTTON_CLASSES =
  'w-full h-10 px-3 flex items-center justify-between gap-2 bg-white hover:bg-crisiscleanup-smoke focus:outline-none text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900 transition';

defineProps<{
  name: string;
  title?: string;
  startOpen?: boolean;
  count?: number;
}>();
</script>
