<script setup lang="ts">
import { useTabs, type Tab } from '@/hooks';
import type { RouteRecordNormalized } from 'vue-router';

const props = defineProps<{
  tabs: Tab[];
}>();

const tabContainer = ref(null);
const tabSelector = ref(null);
const { selectorStyle, setTab, activeIndex, state } = useTabs({
  tabs: props.tabs,
  useRoutes: true,
  tabContainer,
  tabSelector,
  rootRoute: '/admin',
  onNavigate: (route) => {
    console.log('route', route);
    return route;
  },
});

const emit = defineEmits(['onTotalDashboardCountFetched']);

function handleTotalDashboardCountFetched(count: number) {
  emit('onTotalDashboardCountFetched', count);
}
</script>

<template>
  <div class="page flex flex-col h-full" data-testid="testAdminDashboardDiv">
    <div
      ref="tabContainer"
      class="h-max bg-white mx-5 border-t md:flex grid grid-cols-2 justify-around page__container relative transition-all"
    >
      <template v-for="(r, idx) in state.tabs" :key="r.key">
        <div
          class="flex justify-center mx-2 cursor-pointer"
          :data-testid="`testAdminNav${r.title}Link`"
          :class="{ 'router-link-active': idx === activeIndex }"
          @click="() => setTab(idx, r.route as RouteRecordNormalized)"
        >
          <base-text
            variant="h3"
            class="p-2 hover:translate-y-[-1px] transition-all"
          >
            {{ $t(r.title) }}
          </base-text>
        </div>
      </template>
      <div ref="tabSelector" class="page__selector" :style="selectorStyle" />
    </div>
    <div class="flex-grow p-3 mb-16">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component
            :is="Component"
            @on-total-dashboard-count-fetched="handleTotalDashboardCountFetched"
          />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.page {
  &__selector {
    height: 4px;
    @apply bg-primary-light z-50;
    position: absolute;
    bottom: 0;
    width: 100%;
    display: inline-block;
    transition: transform 300ms ease-in-out;
  }
}
</style>
