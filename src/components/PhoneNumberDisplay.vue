<script setup lang="ts">
import CopyText from '@/components/CopyText.vue';
import { formatNationalNumber } from '@/filters';

export type PhoneNumberDisplayType = 'plain' | 'styled';
export interface PhoneNumberDisplayProps {
  phoneNumber: string;
  type?: PhoneNumberDisplayType;
}

const props = withDefaults(defineProps<PhoneNumberDisplayProps>(), {
  type: 'styled',
});

const formattedPhoneNumber = computed(() =>
  formatNationalNumber(String(props.phoneNumber)),
);

const iconClass = computed(() => {
  return props.type === 'styled'
    ? 'p-2 rounded-r-full text-sm bg-primary-light bg-opacity-80'
    : '';
});

const mainClass = computed(() => {
  return props.type === 'styled'
    ? 'py-2 px-3 rounded-l-full text-xs md:text-sm bg-primary-light bg-opacity-30 text-black'
    : '';
});
</script>

<template>
  <CopyText :text="formattedPhoneNumber" :icon-class="iconClass">
    <div :class="mainClass">
      <a :href="`tel:${props.phoneNumber}`" @click.stop>
        <span class="underline">
          {{ formattedPhoneNumber }}
        </span>
      </a>
    </div>
  </CopyText>
</template>

<style scoped></style>
