<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import MarkdownItFootnote from 'markdown-it-footnote';
import { computed } from 'vue';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

const highlighter = (str: string, lang: string): string => {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return (
        '<pre><code class="hljs">' +
        hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
        '</code></pre>'
      );
    } catch (error) {
      console.warn('failed to highlight code block:', str, lang, error);
    }
  }

  return (
    '<pre><code class="hljs">' +
    markdown.utils.escapeHtml(str) +
    '</code></pre>'
  );
};

const markdown = MarkdownIt({
  breaks: true,
  typographer: true,
  linkify: true,
  highlight: highlighter,
})
  .use(MarkdownItAnchor)
  .use(MarkdownItFootnote);

const props = withDefaults(defineProps<{ source: string }>(), { source: '' });
const content = computed(() => markdown.render(props.source));
</script>

<template>
  <slot :content="content">
    <div v-bind="$attrs" class="markdown" v-html="content" />
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

  h5 {
    @apply text-body font-body font-bold text-crisiscleanup-dark-400;
  }

  h6 {
    @apply text-body font-body font-bold text-crisiscleanup-dark-500;
  }

  p {
    @apply text-bodysm font-bodysm text-crisiscleanup-dark-500;
  }

  a {
    @apply text-body font-body text-primary-dark;
    text-decoration: underline;
    transition: text-decoration 0.2s ease-in-out;

    &:hover {
      text-decoration: none;
    }
  }

  ol {
    @apply list-decimal list-inside;
  }

  ul {
    @apply list-disc list-inside text-left;
  }

  li {
    @apply text-bodysm font-bodysm text-crisiscleanup-dark-500;

    > p {
      display: inline;
    }
  }

  pre {
    border: 1px solid #ccc;
    overflow-x: auto;
    border-radius: 4px;
    @apply font-mono bg-crisiscleanup-light-smoke;
  }
}
</style>
