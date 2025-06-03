<template>
  <component
    :is="linkComponent"
    :to="to"
    :href="href"
    :class="linkVariant === 'light' ? 'link' : 'link-dark'"
    :target="target"
  >
    <base-text :variant="textVariant">
      <slot />
    </base-text>
  </component>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue';

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
  setup(props: { to: string | null; href: string }) {
    const linkComponent = computed(() => (props.to ? 'router-link' : 'a'));

    return {
      linkComponent,
    };
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
