<template>
  <router-link
    v-if="to"
    :to="to"
    :class="linkVariant === 'light' ? 'link' : 'link-dark'"
    :target="target || undefined"
  >
    <base-text :variant="textVariant">
      <slot />
    </base-text>
  </router-link>
  <a
    v-else
    :href="href || undefined"
    :class="linkVariant === 'light' ? 'link' : 'link-dark'"
    :target="target || undefined"
  >
    <base-text :variant="textVariant">
      <slot />
    </base-text>
  </a>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  name: 'BaseLink',
  props: {
    href: {
      type: String,
      default: '',
    },
    textVariant: {
      type: String,
      default: 'body',
    },
    to: null,
    target: {
      type: String,
      default: '',
    },
    linkVariant: {
      type: String as PropType<'light' | 'dark'>,
      default: 'dark',
    },
  },
});
</script>

<style scoped lang="scss">
.link {
  @apply text-primary-dark;
  text-decoration: underline;
  &:hover {
    text-decoration: none;
  }
}
</style>
