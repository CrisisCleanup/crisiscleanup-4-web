<template>
  <div class="divide-y divide-gray-200">
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
  },
};
</script>
