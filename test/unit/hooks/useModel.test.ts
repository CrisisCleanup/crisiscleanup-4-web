import { nextTick, Ref, ref } from 'vue';
import { useModelInstance } from '@/hooks';
import { vi, describe, test } from 'vitest';
import { Model } from '@vuex-orm/core';
import { getErrorMessage } from '@/utils/errors';

vi.mock('@/utils/errors');

const makeMockModel = () => {
  const findFn = vi.fn();
  const apiGetFn = vi.fn();

  class MockModel extends Model {
    static entity = 'mockModel';

    static api() {
      return {
        get: apiGetFn,
      };
    }

    static find(id: number) {
      return findFn(id);
    }
  }

  return {
    MockModel,
    findFn,
    apiGetFn,
  };
};

describe('hooks>>useModelInstance', () => {
  test('should fetch instance immediately when not lazy and not in store', async () => {
    const { MockModel, findFn, apiGetFn } = makeMockModel();
    findFn.mockReturnValueOnce().mockReturnValueOnce({
      id: 1,
      name: 'MyModel',
    });
    apiGetFn.mockResolvedValue({
      entities: [{ id: 1, name: 'MyModel' }],
    });

    const hook = useModelInstance(
      MockModel as unknown as typeof Model,
      ref(1),
      { lazy: false },
    );
    await nextTick();
    await until(() => hook.isLoading.value).toBe(false);

    console.log({
      findCalls: findFn.mock.results,
      apiGetCalls: apiGetFn.mock.calls,
    });

    expect(hook.itemId.value).toBe(1);
    expect(hook.hasItem.value).toBe(true);
    expect(hook.isLoading.value).toBe(false);

    expect(apiGetFn.mock.calls.length).toBe(1);
    expect(hook.item).toStrictEqual({
      id: 1,
      name: 'MyModel',
    });
  });

  test('should not fetch instance immediately when lazy', async () => {
    const { MockModel, findFn, apiGetFn } = makeMockModel();

    findFn.mockReturnValueOnce({}).mockReturnValueOnce({
      id: 1,
      name: 'MyModel',
    });

    apiGetFn.mockResolvedValue({
      entities: [{ id: 1, name: 'MyModel' }],
    });

    const hook = useModelInstance(ref(MockModel), ref(1), { lazy: true });
    console.log(findFn.mock.calls);
    console.log(apiGetFn.mock.calls);
    expect(apiGetFn.mock.calls.length).toBe(0);

    expect(hook.itemId.value).toBe(1);
    expect(hook.hasItem.value).toBe(false);
    expect(hook.isLoading.value).toBe(false);
    expect(hook.item).toEqual({});

    await hook.fetchInstance();
    console.log(apiGetFn.mock.calls);
    expect(apiGetFn.mock.calls.length).toBe(1);

    expect(hook.item).toEqual({ id: 1, name: 'MyModel' });
  });

  test('should call getErrorMessage when there is an error', async () => {
    const { MockModel, findFn, apiGetFn } = makeMockModel();
    const error = new Error('Test error');
    apiGetFn.mockRejectedValue(error);

    const hook = useModelInstance(
      MockModel as unknown as typeof Model,
      ref(1),
      { lazy: false },
    );

    await nextTick();
    await until(() => hook.isLoading.value).toBe(false);

    expect((getErrorMessage as Mock).mock.calls.length).toBe(1);
    expect((getErrorMessage as Mock).mock.calls[0][0]).toBe(error);
  });
});
