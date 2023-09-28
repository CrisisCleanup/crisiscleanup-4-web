import { ref } from 'vue';
import { useModelInstance } from '@/hooks';
import { vi, describe, test } from 'vitest';
import { Model } from '@vuex-orm/core';

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

describe('useModelInstance', () => {
  test('should fetch instance immediately when not lazy and not in store', async () => {
    const { MockModel, findFn, apiGetFn } = makeMockModel();
    findFn.mockReturnValueOnce().mockReturnValueOnce({
      id: 1,
      name: 'MyModel',
    });
    apiGetFn.mockResolvedValue({
      entities: [{ id: 1, name: 'MyModel' }],
    });

    const hook = useModelInstance(MockModel, ref(1), { lazy: false });
    await until(() => hook.isLoading.value).toBe(false);

    expect(hook.itemId.value).toBe(1);
    expect(hook.hasItem.value).toBe(true);
    expect(hook.isLoading.value).toBe(false);

    expect(apiGetFn.mock.calls.length).toBe(1);
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
});
