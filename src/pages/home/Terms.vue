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
