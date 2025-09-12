<script setup lang="ts">
import ringCentralLogo from '@/assets/partners/ringcentral_logo.png';

export interface PoweredByRingCentralProps {
  linkUrl?: string;
}

const props = withDefaults(defineProps<PoweredByRingCentralProps>(), {
  linkUrl: 'https://www.ringcentral.com/',
});
</script>

<template>
  <a data-testid="testRingCentralLink" target="_blank" :href="linkUrl">
    <img
      :src="ringCentralLogo"
      data-testid="testRingCentralImgIcon"
      alt="Powered by RingCentral"
    />
  </a>
</template>

<style lang="postcss" scoped></style>
