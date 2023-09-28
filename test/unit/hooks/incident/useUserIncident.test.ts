import { nextTick, ref } from 'vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import { describe, it, type Mock, vi } from 'vitest';
import { useUserIncident } from '@/hooks/incident/useUserIncident';

vi.mock('@/hooks/useCurrentUser', () => ({
  default: vi.fn(),
}));

describe('hooks>>incident>>useUserIncident', () => {
  const updateUserStatesMock = vi.fn();

  it('should return userIncidentId from userStates', async () => {
    (useCurrentUser as Mock).mockReturnValue({
      updateUserStates: updateUserStatesMock,
      userStates: { value: { incident: 123 } },
    });
    const { userIncidentId } = useUserIncident();
    await nextTick();
    expect(userIncidentId.value).toBe(123);
  });

  it('should return hasUserIncidentId as true when userIncidentId is present', async () => {
    (useCurrentUser as Mock).mockReturnValue({
      updateUserStates: updateUserStatesMock,
      userStates: { value: { incident: 123 } },
    });
    const { hasUserIncidentId } = useUserIncident();
    await nextTick();
    expect(hasUserIncidentId.value).toBe(true);
  });

  it('should return hasUserIncidentId as false when userIncidentId is not present', async () => {
    (useCurrentUser as Mock).mockReturnValue({
      updateUserStates: updateUserStatesMock,
      userStates: { value: {} },
    });
    const { hasUserIncidentId } = useUserIncident();
    await nextTick();
    expect(hasUserIncidentId.value).toBe(false);
  });

  it('should call updateUserStatesDebounced with new incident id', async () => {
    (useCurrentUser as Mock).mockReturnValue({
      updateUserStates: updateUserStatesMock,
      userStates: { value: { incident: 123 } },
    });
    const { updateUserIncident } = useUserIncident();
    await updateUserIncident(456);
    expect(updateUserStatesMock).toHaveBeenCalledWith({
      incident: 456,
    });
  });

  it('should call updateUserStatesDebounced when incidentId changes', async () => {
    const incidentId = ref(123);
    updateUserStatesMock.mockResolvedValue({});
    useUserIncident(incidentId);
    incidentId.value = 456;
    await nextTick();
    expect(updateUserStatesMock).toHaveBeenCalledWith({
      incident: 456,
    });
  });
});
