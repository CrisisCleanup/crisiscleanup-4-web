<script setup lang="ts">
import CopyText from '@/components/CopyText.vue';
import { generateGoogleMapsLink } from '@/utils/helpers';

interface AddressDisplayProps {
  address: string;
  latitude?: number;
  longitude?: number;
}

const props = defineProps<AddressDisplayProps>();

const formattedAddress = computed(() => props.address);
const googleMapsLink = computed(() =>
  generateGoogleMapsLink(props.address, props.latitude, props.longitude),
);
</script>

<template>
  <CopyText :text="formattedAddress" icon-class="px-2">
    <div class="">
      <a :href="googleMapsLink" target="_blank" rel="noopener noreferrer">
        <span class="text-black underline">
          {{ formattedAddress }}
        </span>
      </a>
    </div>
  </CopyText>
</template>

<style scoped lang="postcss"></style>
