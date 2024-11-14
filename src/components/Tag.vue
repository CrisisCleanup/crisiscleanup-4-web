<template>
  <div :class="classes">
    <ccu-icon
      v-if="closeable"
      data-testid="testCancelIcon"
      :alt="$t('actions.cancel')"
      size="xxs"
      class="mx-1"
      type="cancel"
      @click="$emit('closed')"
    />
    <slot></slot>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  name: 'Tag',
  props: {
    closeable: {
      type: Boolean,
      default: false,
    },
    classes: {
      type: String,
      default:
        'tag flex items-center px-1 justify-center text-xs border bg-white',
    },
  },
});
</script>

<style scoped>
.tag {
  font-weight: lighter;
}

.close {
  margin-top: 1px;
  cursor: pointer;
}

.close:after {
  content: '\00d7';
  font-weight: lighter;
  font-size: 15px;
  opacity: 0.5;
}
</style>
