<script setup lang="ts">
import CopyText from '@/components/CopyText.vue';
import { formatNationalNumber } from '@/filters';

interface PhoneNumberDisplayProps {
  phoneNumber: string;
}

const props = defineProps<PhoneNumberDisplayProps>();

const formattedPhoneNumber = computed(() =>
  formatNationalNumber(props.phoneNumber),
);
</script>

<template>
  <CopyText
    :text="formattedPhoneNumber"
    icon-class="p-2 rounded-r-full text-sm bg-primary-light bg-opacity-80"
  >
    <div
      class="py-2 px-3 rounded-l-full text-xs md:text-sm bg-primary-light bg-opacity-30"
    >
      <a :href="`tel:${props.phoneNumber}`" @click.stop>
        <span class="text-black underline">
          {{ formattedPhoneNumber }}
        </span>
      </a>
    </div>
  </CopyText>
</template>

<style scoped></style>
