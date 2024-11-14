<template>
  <div :class="classes">
    <slot :icon-style="iconStyle"></slot>
  </div>
</template>

<script>
export default {
  name: 'Accordion',
  props: {
    iconStyle: {
      type: String,
      default: 'chevron', // Options: 'chevron', 'plus-minus'
    },
    classes: {
      type: String,
      default: 'divide-y divide-gray-200',
    },
  },
};
</script>
