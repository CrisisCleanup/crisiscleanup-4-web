import type { MaybeRef } from '@vueuse/core';
import { computedEager, whenever } from '@vueuse/core';
import { computed, ref } from 'vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import { getErrorMessage } from '@/utils/errors';

/**
 * Use current user incident state.
 * @param currentIncidentId Optional current incident id to synchronize to user states.
 */
export const useUserIncident = (
  currentIncidentId?: MaybeRef<number | undefined>,
) => {
  const incidentId = ref(currentIncidentId);
  const { updateUserStatesDebounced, userStates } = useCurrentUser();

  // user incident from states.
  const incidentFromStates = computed<number | undefined>(
    () => userStates.value?.incident as number | undefined,
  );

  // Current incident is defined and does not match incident id from states.
  const newCurrentIncident = computed(() =>
    incidentId.value !== undefined &&
    incidentId.value !== incidentFromStates.value
      ? incidentId.value
      : undefined,
  );

  const updateUserIncident = (newIncidentId: number) =>
    updateUserStatesDebounced({ incident: newIncidentId });

  // update user states whenever current incident id changes.
  whenever(
    newCurrentIncident,
    (newValue) => updateUserIncident(newValue).catch(getErrorMessage),
    { immediate: true },
  );

  return {
    userIncidentId: incidentFromStates,
    hasUserIncidentId: computedEager(() => Boolean(incidentFromStates.value)),
    updateUserIncident,
  };
};
