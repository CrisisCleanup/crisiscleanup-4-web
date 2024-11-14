<template>
  <div class="navbar overflow-y-auto">
    <router-link :to="logoRoute.to" class="logo--grid">
      <div
        class="logo flex justify-center px-2 py-4 border-b border-crisiscleanup-dark-400"
      >
        <img
          :src="portal?.logo_url || logo"
          style="height: 53px"
          data-testid="testCrisiscleanupLogoIcon"
        />
      </div>
    </router-link>

    <div class="menu overflow-y-auto grid">
      <NavButton
        v-for="r in routes"
        :key="r.key"
        :data-testid="$t(`test${r.key}Link`)"
        class="overflow-y-auto"
        :route="r"
      />
    </div>
    <PoweredByAws class="pt-4 pb-12 px-4" type="square" />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import NavButton from './NavButton.vue';
import type { Portal } from '@/models/types';
import logo from '@/assets/crisiscleanup_logo.png';
import PoweredByAws from '@/components/PoweredByAws.vue';

export default defineComponent({
  name: 'NavMenu',
  components: { PoweredByAws, NavButton },
  props: {
    routes: {
      type: Array as PropType<Record<string, any>[]>,
      default: () => [],
    },
    logoRoute: {
      type: Object,
      default: () => ({}),
    },
  },
  setup() {
    const store = useStore();
    const portal = computed(() => store.getters['enums/portal'] as Portal);
    return {
      portal,
      logo,
    };
  },
});
</script>

<style lang="postcss">
@media only screen and (max-width: 1223px) and (orientation: landscape) {
  .navbar {
    @apply mb-20;
  }
}
</style>
