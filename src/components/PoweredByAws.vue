<script setup lang="ts">
import poweredByAws from '@/assets/powered_by_aws.png';
import poweredByAwsSquare from '@/assets/powered_by_aws_dark_square.png';

export type AwsLogoType = 'regular' | 'square';
export interface PoweredByAwsProps {
  type: AwsLogoType;
}

const props = defineProps<PoweredByAwsProps>();

const logoSrc = computed(() => {
  const logoMap: Record<AwsLogoType, any> = {
    regular: poweredByAws,
    square: poweredByAwsSquare,
  };
  return logoMap[props.type];
});
</script>

<template>
  <a
    data-testid="testAwsLink"
    target="_blank"
    href="https://aws.amazon.com/government-education/nonprofits/disaster-response/"
  >
    <img :src="logoSrc" data-testid="testAwsImgIcon" />
  </a>
</template>

<style lang="postcss" scoped></style>
