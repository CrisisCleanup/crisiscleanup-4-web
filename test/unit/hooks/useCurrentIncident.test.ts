import { describe, vi, beforeEach, expect, test } from 'vitest';
import { ref } from 'vue';
import useCurrentIncident from '@/hooks/useCurrentIncident';

const routeIncidentId = ref<string | undefined>();
const userStateIncidentId = ref<number | undefined>();

vi.mock('vuex', () => ({
  useStore() {
    return {
      commit: vi.fn(),
    };
  },
}));
vi.mock('@/hooks/useCurrentUser', async () => {
  const actual = await vi.importActual('@/hooks/useCurrentUser');
  return {
    ...actual,
    default() {
      return {
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
        fetchById(id: number) {
          return { id };
        },
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
  return { default: MockIncidentModel };
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
});
