import { describe, vi, beforeEach, expect, test } from 'vitest';
import { ref } from 'vue';
import useCurrentIncident from '@/hooks/useCurrentIncident';

const routeIncidentId = ref<string | undefined>();
const userStateIncidentId = ref<number | undefined>();
const useStoreMock = {
  commit: vi.fn(),
};
const useCurrentUserMock = {
  hasCurrentUser: ref(true),
  updateUserStates: (state: Record<string, any>) => {
    userStateIncidentId.value = state.incident as number;
    return Promise.resolve(state);
  },
  currentUser: computed(() => {
    return {
      states: {
        incident: userStateIncidentId.value,
      },
    };
  }),
};

vi.mock('vuex', () => ({
  useStore() {
    return useStoreMock;
  },
}));
vi.mock('@/hooks/useCurrentUser', async () => {
  return {
    default() {
      return useCurrentUserMock;
    },
  };
});
vi.mock('@/models/Incident', () => {
  class MockIncidentModel {
    static entity = 'incidents';

    id!: number;
    static find(id: number) {
      return { id };
    }

    static query() {
      return {
        orderBy: vi.fn().mockReturnThis(),
        first: vi.fn(),
      };
    }

    static api() {
      return {
        fetchById: vi.fn((id: number) => {
          return { id };
        }),
        addLocation: vi.fn(),
        removeLocation: vi.fn(),
      };
    }

    static basicFields() {
      return ['id'];
    }
    static fields() {
      return {
        id: undefined,
      };
    }
  }
  return {
    default: MockIncidentModel,
  };
});
vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core');
  return {
    ...actual,
    // your mocked methods
    createSharedComposable: vi.fn((fn) => {
      console.info('Using mocked fn', fn);
      return fn;
    }),
  };
});
vi.mock('@vueuse/router', () => ({
  useRouteParams(param: string) {
    return routeIncidentId;
  },
}));

describe('useCurrentIncident', () => {
  beforeEach(() => {
    routeIncidentId.value = undefined;
    userStateIncidentId.value = undefined;
    vi.resetAllMocks();
  });

  it('should initialize current incident id from route', async () => {
    const { currentIncidentId } = useCurrentIncident();
    expect(currentIncidentId.value).toBe(undefined);

    routeIncidentId.value = '123';
    await nextTick();
    expect(currentIncidentId.value).toBe(123);

    routeIncidentId.value = '456';
    await nextTick();
    expect(currentIncidentId.value).toBe(456);
  });

  it('should return hasCurrentIncident', async () => {
    const { hasCurrentIncident } = useCurrentIncident();
    expect(hasCurrentIncident.value).toBe(false);
    routeIncidentId.value = '123';
    await nextTick();
    expect(hasCurrentIncident.value).toBe(true);
  });

  it('should resolve current incident from route', async () => {
    const { currentIncident } = useCurrentIncident();
    expect(currentIncident.value).toBe(undefined);
    routeIncidentId.value = '123';
    await nextTick();
    expect(currentIncident.value).toMatchInlineSnapshot(`
      {
        "id": 123,
      }
    `);
    routeIncidentId.value = '456';
    await nextTick();
    expect(currentIncident.value).toMatchInlineSnapshot(`
      {
        "id": 456,
      }
    `);
  });

  it('should resolve current incident from user state', async () => {
    const { currentIncident } = useCurrentIncident();
    expect(currentIncident.value).toBe(undefined);
    userStateIncidentId.value = 111;
    await nextTick();
    expect(currentIncident.value).toMatchInlineSnapshot(`
      {
        "id": 111,
      }
    `);
    routeIncidentId.value = undefined;
    userStateIncidentId.value = 222;
    await nextTick();
    expect(currentIncident.value).toMatchInlineSnapshot(`
      {
        "id": 222,
      }
    `);
  });

  it('should prioritize incident from route over user state', async () => {
    const { currentIncident } = useCurrentIncident();
    expect(currentIncident.value).toBe(undefined);
    routeIncidentId.value = '111';
    await nextTick();
    expect(currentIncident.value).toMatchInlineSnapshot(`
      {
        "id": 111,
      }
    `);
    userStateIncidentId.value = 222;
    await nextTick();
    expect(currentIncident.value).toMatchInlineSnapshot(`
      {
        "id": 111,
      }
    `);

    routeIncidentId.value = undefined;
    await nextTick();
    expect(currentIncident.value).toMatchInlineSnapshot(`
      {
        "id": 222,
      }
    `);
  });

  it('should commit incident id to store', async () => {
    expect.assertions(1);
    useCurrentIncident();
    routeIncidentId.value = '123';
    await nextTick();
    expect(useStoreMock.commit).toHaveBeenCalledWith(
      'incident/setCurrentIncidentId',
      123,
    );
  });

  it('should update user states', async () => {
    expect.assertions(1);
    vi.spyOn(useCurrentUserMock, 'updateUserStates');
    useCurrentIncident();
    routeIncidentId.value = '123';
    await nextTick();
    expect(useCurrentUserMock.updateUserStates).toHaveBeenCalledWith({
      incident: 123,
    });
  });
});
