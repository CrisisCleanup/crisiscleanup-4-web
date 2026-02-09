import '@vuex-orm/plugin-axios/dist/src/types/vuex-orm.d.ts';
import type { MaybeRef } from '@vueuse/core';
import {
  reactiveComputed,
  useAsyncState,
  whenever,
  computedEager,
} from '@vueuse/core';
import { type Model } from '@vuex-orm/core';
import { readonly, ref, type Ref, shallowRef, computed } from 'vue';
import createDebug from 'debug';
import { getErrorMessage } from '@/utils/errors';

const debug = createDebug('@ccu:hooks:useModel');

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
      resetOnExecute: true,
    },
  );

  // ensure its ref if it isnt already.
  const itemId = ref(targetId);
  const item = reactiveComputed<ModelT | { id: number | undefined }>(() =>
    itemId.value && !itemState.isLoading.value
      ? ((model.value.find(itemId.value) as ModelT) ?? { id: undefined })
      : { id: undefined },
  );

  // only track surface-level changes.
  const hasItem = computedEager(
    () => itemId.value !== undefined && 'id' in item && item.id !== undefined,
  );

  // if eager, ensure incident data exists in store.
  const shouldFetch = computed(
    () =>
      !hasItem.value &&
      !itemState.isLoading.value &&
      itemId.value !== undefined,
  );

  if (!lazy) {
    whenever(shouldFetch, async () => {
      debug(
        'retrieving data for (model=%s, itemId=%s)',
        model.value.entity,
        itemId.value,
      );
      // error is not thrown, but exposed via `error` ref.
      await itemState.execute();
    });
  }

  // handle errors when fetching item.
  whenever(itemState.error, (newValue) => getErrorMessage(newValue));

  return {
    hasItem,
    itemId: readonly(itemId),
    isLoading: readonly(itemState.isLoading),
    fetchInstance: (delay?: number) => itemState.execute(delay),
    item: item as InstanceType<ModelT>,
  };
};
