import { useCurrentIncident } from '@/hooks';
import { useStore } from 'vuex';
import useCurrentUser from '@/hooks/useCurrentUser';
import { useRouteIncident } from '@/hooks/incident/useRouteIncident';
import { useUserIncident } from '@/hooks/incident/useUserIncident';
import { useModelInstance } from '@/hooks/useModel';
import Incident from '@/models/Incident';
import { test, type Mock, vi, expect } from 'vitest';

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

test('hooks>>incident>>useCurrentIncident', async () => {
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
  Incident.api.mockReturnValue({
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
