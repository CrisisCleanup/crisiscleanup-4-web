import type { Ref } from 'vue';
import { nextTick, ref } from 'vue';
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
  beforeEach(() => {
    // getErrorMessage is a module-level mock: clear its call history so
    // error-producing tests do not leak counts into each other.
    vi.clearAllMocks();
  });

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

  test('does not refetch after a failed fetch (no infinite request loop)', async () => {
    const { MockModel, findFn, apiGetFn } = makeMockModel();
    findFn.mockReturnValue();
    // Reject asynchronously, like a real failed HTTP request.
    apiGetFn.mockImplementation(
      () =>
        new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error('404 not found')), 5),
        ),
    );

    useModelInstance(MockModel as unknown as typeof Model, ref(123), {
      lazy: false,
    });

    // Let several reactive flush cycles pass; the buggy implementation
    // reached dozens of calls in this window.
    const started = Date.now();
    while (Date.now() - started < 300) {
      await nextTick();
      await new Promise((r) => setTimeout(r, 10));
    }

    expect(apiGetFn.mock.calls.length).toBe(1);
  });

  test('fetches again when the id changes after a failure', async () => {
    const { MockModel, findFn, apiGetFn } = makeMockModel();
    findFn.mockReturnValue();
    apiGetFn
      .mockRejectedValueOnce(new Error('404 not found'))
      .mockResolvedValue({ entities: [{ id: 2, name: 'Second' }] });

    const itemId: Ref<number | undefined> = ref(1);
    const hook = useModelInstance(
      MockModel as unknown as typeof Model,
      itemId,
      {
        lazy: false,
      },
    );

    await nextTick();
    await until(() => hook.isLoading.value).toBe(false);
    expect(apiGetFn.mock.calls.length).toBe(1);
    expect(hook.error.value).toBeTruthy();

    itemId.value = 2;
    await nextTick();
    await until(() => hook.isLoading.value).toBe(false);
    expect(hook.error.value).toBeFalsy();

    // The second fetch resolves but the entity never lands in the store
    // (findFn is always undefined): that must NOT loop either.
    const started = Date.now();
    while (Date.now() - started < 200) {
      await nextTick();
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(apiGetFn.mock.calls.length).toBe(2);
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
