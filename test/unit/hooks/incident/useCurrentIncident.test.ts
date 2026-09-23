import { useCurrentIncident } from '@/hooks';
import { useStore } from 'vuex';
import useCurrentUser from '@/hooks/useCurrentUser';
import { useRouteIncident } from '@/hooks/incident/useRouteIncident';
import { useUserIncident } from '@/hooks/incident/useUserIncident';
import { useModelInstance } from '@/hooks/useModel';
import Incident from '@/models/Incident';
import { test, type Mock, vi, expect } from 'vitest';
import { flushPromises } from '@vue/test-utils';

// Mocking necessary imports
vi.mock('vuex');
vi.mock('@/hooks/useCurrentUser');
vi.mock('@/hooks/incident/useRouteIncident');
vi.mock('@/hooks/incident/useUserIncident');
vi.mock('@/hooks/useModel');
vi.mock('@/models/Incident', () => ({
  default: {
    api: vi.fn(),
  },
}));

test('hooks>>incident>>useCurrentIncident', () => {
  // Mocking return values
  (useCurrentUser as Mock).mockReturnValue({ currentUser: { id: 1 } });
  (useRouteIncident as Mock).mockReturnValue({ routeIncidentId: ref(4) });
  (useUserIncident as Mock).mockReturnValue({
    userIncidentId: ref(4),
    updateUserIncident: vi.fn(),
  });
  (useModelInstance as Mock).mockReturnValue({
    itemId: ref(4),
    item: {},
    isLoading: false,
    hasItem: true,
  });
  (Incident.api as Mock).mockReturnValue({
    get: vi
      .fn()
      .mockResolvedValue({ response: { data: { results: [{ id: 4 }] } } }),
  });

  const store = { commit: vi.fn() };
  (useStore as Mock).mockReturnValue(store);

  const {
    currentIncidentId,
    currentIncident,
    hasCurrentIncident,
    isCurrentIncidentLoading,
  } = useCurrentIncident();

  console.log({
    currentIncidentId: currentIncidentId.value,
    currentIncident,
    hasCurrentIncident,
    isCurrentIncidentLoading,
  });

  expect(currentIncidentId.value).toBe(4);
  expect(store.commit.mock.calls[0]).toStrictEqual([
    'incident/setCurrentIncidentId',
    4,
  ]);
});

test('hooks>>incident>>useCurrentIncident refetches a failed incident that is also the most recent one', async () => {
  const fetchInstance = vi.fn().mockResolvedValue(null);
  const error = ref<unknown>();
  const updateUserIncident = vi.fn();
  const updateRouteIncidentId = vi.fn();
  (useCurrentUser as Mock).mockReturnValue({ hasCurrentUser: ref(true) });
  (useRouteIncident as Mock).mockReturnValue({
    routeIncidentId: ref(4),
    hasRouteIncidentId: ref(true),
    updateRouteIncidentId,
  });
  (useUserIncident as Mock).mockReturnValue({
    userIncidentId: ref(4),
    updateUserIncident,
  });
  (useModelInstance as Mock).mockReturnValue({
    itemId: ref(4),
    item: {},
    isLoading: ref(false),
    hasItem: ref(false),
    error,
    fetchInstance,
  });
  (Incident.api as Mock).mockReturnValue({
    get: vi
      .fn()
      .mockResolvedValue({ response: { data: { results: [{ id: 4 }] } } }),
  });
  (useStore as Mock).mockReturnValue({ commit: vi.fn() });

  useCurrentIncident();
  error.value = new Error('timeout');
  await flushPromises();
  await flushPromises();

  expect(fetchInstance).toHaveBeenCalledTimes(1);
  expect(updateRouteIncidentId).not.toHaveBeenCalled();
  expect(updateUserIncident).not.toHaveBeenCalled();
});
