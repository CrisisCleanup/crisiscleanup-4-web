<script setup lang="ts">
import { useSlots } from 'vue';
import { useTabs, type Tab } from '@/hooks';
import Card from '@/components/cards/Card.vue';

const props = withDefaults(
  defineProps<{
    tabs: Tab[];
    loading: boolean;
  }>(),
  {
    loading: false,
  },
);

const { tabs, loading } = toRefs(props);

const tabContainer = ref<null | HTMLElement>(null);
const tabSelector = ref<null | HTMLElement>(null);
const { activeIndex, selectorStyle, setTab, state } = useTabs({
  tabs: tabs,
  tabSelector,
  tabContainer,
});

const slots = useSlots();
const activeTab = computed(() =>
  state.tabs.find((t, idx) => idx === activeIndex.value),
);
const footerSlot = computed(
  () =>
    Object.entries(slots).find(
      ([k]) => k === activeTab.value?.key + '-footer',
    )?.[1],
);
</script>

<template>
  <Card :loading="loading" :overlay="true">
    <template #header>
      <div ref="tabContainer" :class="`left tabs card__tabbar`">
        <div
          v-for="(t, idx) in state.tabs"
          :key="t.key"
          :class="`card__tab tab-item tab-${idx} ${
            idx === activeIndex ? 'active' : ''
          }`"
          @click="() => setTab(idx)"
        >
          <base-text variant="h3" weight="600">
            {{ $t(t.title) }}
          </base-text>
        </div>
        <div ref="tabSelector" class="card__selector" :style="selectorStyle" />
      </div>
    </template>
    <div
      v-for="(t, idx) in tabs"
      v-show="idx === activeIndex"
      :key="t.key"
      class="flex flex-grow flex-col"
    >
      <slot :name="t.key" />
    </div>
    <template v-if="footerSlot" #footer>
      <component :is="footerSlot" />
    </template>
  </Card>
</template>

<style lang="postcss" scoped>
.card {
  &__tabbar {
    display: flex;
    justify-content: flex-start;
    position: relative;
    @apply h-full w-full bg-white;
  }

  &__selector {
    height: 4px;
    @apply bg-primary-light;
    position: absolute;
    z-index: 99;
    bottom: 0;
    width: 100%;
    display: inline-block;
    transition: transform 300ms cubic-bezier(0.76, 0, 0.24, 1);
  }

  &__tab {
    @apply py-4 px-6 text-crisiscleanup-dark-400;
    position: relative;
    cursor: pointer;
    transition: opacity 300ms ease-in-out;
    opacity: 0.5;
    &:hover,
    &.active {
      opacity: 1;
    }
  }
}
</style>
