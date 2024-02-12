<template>
  <TermsContent v-if="$route.query.view === 'plain'" class="pb-10" />
  <Home v-else>
    <TermsContent />
  </Home>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import Home from '@/layouts/Home.vue';
import TermsContent from './TermsContent.vue';

export default defineComponent({
  name: 'Terms',
  components: { Home, TermsContent },
});
</script>

<style scoped lang="scss">
.homegrid {
  &.grid-container {
    grid-template-areas:
      'logo . . . . survivors'
      'nav . main main main .'
      'nav . main main main .'
      'actions actions main main main .'
      '. . main main main .';
    overflow: auto;

    .grid {
      &--overlay {
        grid-row: 1 / span 5;
        grid-column: 1 / span 3;
      }
    }
  }
}
@media only screen and (max-width: 640px) {
  .homegrid {
    height: 100vh;
    &.grid-container {
      grid:
        [r1] 'logo survivors' [r1end]
        [r4] 'nav nav' [r4end]
        [r2] 'main main' [r2end]
        [r3] 'actions actions' [r3end]
        / auto;
      grid-template-rows: 0.5fr 0.5fr 4fr 1fr;
    }
  }
}
.form-field {
  @apply w-2/5 m-3;
}

.form-item {
  @apply py-3 ml-6;
}

.activities-checkbox {
  @apply pl-12 my-6;
}
</style>
