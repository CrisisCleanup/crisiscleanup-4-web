/**
 * Use Tabs Hook
 */

import type { Ref } from 'vue';
import { computed, onMounted, reactive, ref, watch, watchEffect } from 'vue';
import _ from 'lodash';
import type {
  RouteLocationNormalized,
  Router,
  RouteRecordNormalized,
  RouteRecordRaw,
} from 'vue-router';
import { useRoute, useRouter } from 'vue-router';
import { useElementSize, reactiveComputed } from '@vueuse/core';

export interface Tab {
  key: string;
  title?: string;
  route?: RouteRecordRaw;
  disabled?: boolean;
}

export interface UseTabProps {
  tabs: Tab[] | Ref<Tab[]>;
  tabContainer: Ref<null | HTMLElement>;
  tabSelector: Ref<null | HTMLElement>;
  useRoutes?: boolean;
  rootRoute?: string;
  onNavigate?: (route: RouteRecordRaw) => RouteRecordRaw;
}

/**
 * Hook for using a dynamically resizing tab bar.
 * @param tabs - list of tabs to use.
 * @param useRoutes - optionally use vue router routes.
 * @param rootRoute
 * @param tabContainer - HTML ref to tabs parent container.
 * @param tabSelector - HTML ref to tab selector element.
 * @param onNavigate
 */
export const useTabs = ({
  tabs: tabsIn,
  useRoutes = false,
  rootRoute,
  tabContainer,
  tabSelector,
  onNavigate = (route) => route,
}: UseTabProps) => {
  // const Log = Logger({ name: 'useTabs' });
  const Log = console;
  const tabs = isRef(tabsIn) ? tabsIn : ref(tabsIn);
  const state = reactiveComputed(() => ({
    tabs: tabs.value.map(({ key, ...rest }) =>
      reactive(
        _.defaults(rest, {
          title: _.startCase(key.split('.').at(-1)?.split('_').at(-1)),
          route: { name: key },
          key,
        }),
      ),
    ),
  }));
  const activeIndex = ref(0);
  const selectorState = reactive({
    transform: 0,
    scale: 0,
  });

  const containerNodes = computed(() =>
    tabContainer ? _.get(tabContainer.value, 'children', null) : null,
  );
  const activeTab = computed(
    () => containerNodes.value && containerNodes.value.item(activeIndex.value),
  );

  const updateSelector = () => {
    if (!tabContainer || !tabContainer.value) return;
    if (!containerNodes.value || containerNodes.value.length === 0) return;
    if (!activeTab.value) return;
    if (!tabSelector || !tabSelector.value) return;
    // get scale multiplier (ratio of active tab to tab container width)
    const scaleMulti =
      activeTab.value.clientWidth / tabContainer.value.clientWidth;
    // selector displacement from left edge
    const selectOffsetLeft = tabSelector.value.offsetWidth / 2;
    // find the scaled offset and determine distance to left edge of container.
    const selectScaledOffsetDiff = selectOffsetLeft * scaleMulti;
    const selectDistToEdge = selectOffsetLeft - selectScaledOffsetDiff;
    const selectDistToLeftEdge = selectDistToEdge * -1;
    // now take the distance to the left edge of container and add the
    // active tab's offset distance from the left edge.
    selectorState.transform =
      selectDistToLeftEdge + (activeTab.value as HTMLElement).offsetLeft;
    selectorState.scale = scaleMulti;
  };

  const selectorStyle = computed(() => ({
    transform: `translateX(${selectorState.transform}px) scaleX(${selectorState.scale})`,
  }));

  // grab router in case tabs are using routes.
  let route: null | RouteLocationNormalized = null;
  let router: null | Router;
  if (useRoutes && rootRoute) {
    route = useRoute();
    router = useRouter();
    // dynamically add child routes.
    state.tabs.map(({ route }) => {
      if (
        route.path &&
        route.name &&
        route.component &&
        !router?.hasRoute(route.name)
      ) {
        router?.addRoute(rootRoute, route as RouteRecordRaw);
      }
    });
    // // TODO: verify first index has a valid route.
    const stop = watchEffect(async () => {
      await router?.replace(onNavigate(state.tabs[0].route as RouteRecordRaw));
    });
    stop(); // only want to do it once.
  }

  const setTab = async (idx: number, newRoute?: RouteRecordNormalized) => {
    activeIndex.value = idx;
    updateSelector();
    if (useRoutes && router && newRoute) {
      try {
        await router.replace(onNavigate(newRoute));
      } catch (error) {
        Log.error('Failed to navigate tab!', error);
      }
    }
  };

  // let removeResize: { (): void; (): void };

  onMounted(() => {
    // const { remove, width, height } = useOnResize(tabContainer, 100);
    const { width, height } = useElementSize(tabContainer);
    // removeResize = remove;
    watch([width, height], () => updateSelector());
    // watchEffect(() => updateSelector());
    if (useRoutes && router) {
      router.beforeEach((to, from, next) => {
        updateSelector();
        next();
      });
    }
  });

  return {
    state,
    activeIndex,
    selectorState,
    setTab,
    selectorStyle,
    route,
  };
};
