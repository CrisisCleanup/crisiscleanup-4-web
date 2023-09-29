import { nextTick, ref } from 'vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import { describe, it, type Mock, vi } from 'vitest';
import { useUserIncident } from '@/hooks/incident/useUserIncident';

vi.mock('@/hooks/useCurrentUser', () => ({
  default: vi.fn(),
}));

describe('hooks>>incident>>useUserIncident', () => {
  const updateUserStatesMock = vi.fn();

  const mockCurrentUser = (
    incidentId?: number | undefined,
    hasCurrentUser: boolean = true,
  ) => {
    (useCurrentUser as Mock).mockReturnValue({
      updateUserStates: updateUserStatesMock,
      userStates: ref(incidentId ? { incident: incidentId } : {}),
      hasCurrentUser: ref(hasCurrentUser),
    });
  };

  it('should return userIncidentId from userStates', async () => {
    mockCurrentUser(123);
    const { userIncidentId } = useUserIncident();
    await nextTick();
    expect(userIncidentId.value).toBe(123);
  });

  it('should return hasUserIncidentId as true when userIncidentId is present', async () => {
    mockCurrentUser(123);
    const { hasUserIncidentId } = useUserIncident();
    await nextTick();
    expect(hasUserIncidentId.value).toBe(true);
  });

  it('should return hasUserIncidentId as false when userIncidentId is not present', async () => {
    mockCurrentUser();
    const { hasUserIncidentId } = useUserIncident();
    await nextTick();
    expect(hasUserIncidentId.value).toBe(false);
  });

  it('should call updateUserStates with new incident id', async () => {
    mockCurrentUser(123);
    const { updateUserIncident } = useUserIncident();
    await updateUserIncident(456);
    expect(updateUserStatesMock).toHaveBeenCalledWith({
      incident: 456,
    });
  });

  it('should call updateUserStates when incidentId changes', async () => {
    mockCurrentUser();
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
