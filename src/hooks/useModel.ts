import '@vuex-orm/plugin-axios/dist/src/types/vuex-orm.d.ts';
import type { MaybeRef } from '@vueuse/core';
import {
  computedEager,
  reactiveComputed,
  useAsyncState,
  whenever,
} from '@vueuse/core';
import { type Model } from '@vuex-orm/core';
import { readonly, ref, type Ref, shallowReactive, shallowRef } from 'vue';
import { logicAnd, logicNot } from '@vueuse/math/index';

export interface UseModelOptions {
  /**
   * Only allow fetching incident through external invocation of the returned `fetchInstance` method.
   */
  lazy?: boolean;
}

export interface UseModel<T extends Model> {
  hasItem: Readonly<Ref<boolean>>;
  itemId: Readonly<Ref<number | undefined>>;
  isLoading: Readonly<Ref<boolean>>;
  fetchInstance: (delay?: number) => Promise<unknown>;
  item: T;
}

export const useModelInstance = <ModelT extends typeof Model>(
  targetModel: MaybeRef<ModelT>,
  targetId: MaybeRef<number | undefined>,
  options?: UseModelOptions,
): UseModel<InstanceType<ModelT>> => {
  const model = shallowRef(targetModel);
  const { lazy = false } = options ?? {};

  // async state for fetching incident data if it isnt already in the store.
  const itemState = useAsyncState(
    () => model.value.api().get(`/${model.value.entity}/${itemId.value}`),
    undefined,
    {
      immediate: false,
      resetOnExecute: false,
    },
  );

  // ensure its ref if it isnt already.
  const itemId = ref(targetId);
  const item = reactiveComputed<ModelT>(() =>
    itemId.value && !itemState.isLoading.value
      ? model.value.find(itemId.value) ?? {}
      : {},
  );

  // only track surface-level changes.
  const shallowItem = shallowReactive(item);
  const hasItem = computedEager(
    () =>
      itemId.value !== undefined &&
      Boolean(shallowItem) &&
      item.id === itemId.value,
  );

  // if eager, ensure incident data exists in store.
  if (!lazy) {
    whenever(
      logicAnd(
        logicNot(hasItem),
        logicNot(itemState.isLoading),
        logicAnd(itemId),
      ),
      async () => await itemState.execute(),
      { immediate: true },
    );
  }

  return {
    hasItem,
    itemId: readonly(itemId),
    isLoading: readonly(itemState.isLoading),
    fetchInstance: (delay?: number) => itemState.execute(delay),
    item: item as InstanceType<ModelT>,
  };
};
