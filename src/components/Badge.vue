<template>
  <div
    class="badge flex items-center justify-center rounded-full"
    data-testid="testBadgeDiv"
    :style="{
      backgroundColor: color,
      width: width || 'auto',
      height: height || 'auto',
      minWidth: '20px', // Minimum width for small numbers
      padding: '0 6px', // Horizontal padding for larger numbers
    }"
  >
    <div>
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Badge',
  props: {
    color: {
      type: String,
      default: '',
    },
    width: {
      type: String,
      default: '',
    },
    height: {
      type: String,
      default: '',
    },
  },
});
</script>

<style scoped>
.badge {
  height: 20px; /* Set a fixed height for consistency */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
