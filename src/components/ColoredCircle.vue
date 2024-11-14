<script setup lang="ts">
import MaterialSymbolsCircle from '~icons/material-symbols/circle';
export interface ColoredCircleProps {
  color: string;
}
const props = defineProps<ColoredCircleProps>();
</script>

<template>
  <MaterialSymbolsCircle :style="{ color: props.color }" />
</template>

<style lang="postcss" scoped></style>
