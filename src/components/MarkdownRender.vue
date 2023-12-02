<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import MarkdownItFootnote from 'markdown-it-footnote';
import { computed } from 'vue';

const markdown = MarkdownIt({
  breaks: true,
  typographer: true,
  linkify: true,
})
  .use(MarkdownItAnchor)
  .use(MarkdownItFootnote);

const props = withDefaults(defineProps<{ source: string }>(), { source: '' });
const content = computed(() => markdown.render(props.source));
</script>

<template>
  <slot :content="content">
    <div class="markdown" v-html="content" />
  </slot>
</template>

<style lang="postcss">
.markdown {
  h1 {
    @apply text-h1 font-h1 font-bold text-crisiscleanup-dark-500;
  }
  h2 {
    @apply text-h2 font-h2 text-crisiscleanup-dark-500;
  }
  h3 {
    @apply text-h3 font-h3 text-crisiscleanup-dark-500;
  }
  h4 {
    @apply text-h4 font-h4 text-crisiscleanup-dark-400;
  }
  p {
    @apply text-body font-body text-crisiscleanup-dark-500;
  }
}
</style>
