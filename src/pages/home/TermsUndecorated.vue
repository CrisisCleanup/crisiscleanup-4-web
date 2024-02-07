<template>
  <div class="main m-8 overflow-scroll">
    <TermsContent />
    <p>&nbsp;</p>
  </div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import TermsContent from './TermsContent.vue';

export default defineComponent({
  name: 'TermsUndecorated',
  components: { TermsContent },
});
</script>

<style lang="scss">
// TODO Use common styles from Home.vue rather than duplicating
.grid--main {
  h1 {
    @apply text-2xl font-bold mt-3;
  }

  h2 {
    @apply text-xl font-bold mt-3;
  }

  h3 {
    @apply text-lg font-semibold mt-3;
  }

  h4 {
    @apply text-base mt-3;
  }

  h5 {
    @apply text-sm mt-3;
  }

  h6 {
    @apply text-xs mt-3;
  }

  p {
    @apply my-2;
  }

  strong {
    @apply font-bold;
  }

  u {
    @apply underline;
  }

  em {
    @apply italic;
  }

  a {
    @apply text-primary-dark underline;

    &:hover {
      text-decoration: none;
    }
  }
}

ol.outline {
  list-style-type: none;
  margin-left: 0;
  counter-reset: item;
  outline-style: none;
}
ol.outline > li {
  counter-increment: customlistcounter;
  display: block;
}
ol.outline:first-child,
ol.outline:second-child {
  counter-reset: customlistcounter;
}
ol.outline > li:before {
  counter-increment: item;
  /*content: "#" counter(customlistcounter);*/
  font-weight: bold;
  float: left;
  width: 3em;
}
ol.one > li:before {
  content: '1.' counters(item, '.') ' ';
}
ol.two > li:before {
  content: '2.' counters(item, '.') ' ';
}
ol.three > li:before {
  content: '3.' counters(item, '.') ' ';
}
ol.four > li:before {
  content: '4.' counters(item, '.') ' ';
}
ol.five > li:before {
  content: '5.' counters(item, '.') ' ';
}
ol.six > li:before {
  content: '6.' counters(item, '.') ' ';
}
ol.seven > li:before {
  content: '7.' counters(item, '.') ' ';
}
ol.eight > li:before {
  content: '8.' counters(item, '.') ' ';
}
ol.nine > li:before {
  content: '9.' counters(item, '.') ' ';
}
ol.ten > li:before {
  content: '10.' counters(item, '.') ' ';
}
ol.eleven > li:before {
  content: '11.' counters(item, '.') ' ';
}
ol.twelve > li:before {
  content: '12.' counters(item, '.') ' ';
}
ol.thirteen > li:before {
  content: '13.' counters(item, '.') ' ';
}
ol.fourteen > li:before {
  content: '14.' counters(item, '.') ' ';
}
ol.fifteen > li:before {
  content: '15.' counters(item, '.') ' ';
}
</style>

<style lang="scss" scoped>
.main {
  margin: 0;
  padding: 0;
}
</style>
