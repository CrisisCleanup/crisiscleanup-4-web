import type { MaybeRef } from '@vueuse/core';
import { computedEager, whenever } from '@vueuse/core';
import { computed, ref } from 'vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import { getErrorMessage } from '@/utils/errors';
import createDebug from 'debug';

const debug = createDebug('@ccu:hooks:incident:useUserIncident');

/**
 * Use current user incident state.
 * @param currentIncidentId Optional current incident id to synchronize to user states.
 */
export const useUserIncident = (
  currentIncidentId?: MaybeRef<number | undefined>,
) => {
  const incidentId = ref(currentIncidentId);
  const { updateUserStates, userStates, hasCurrentUser } = useCurrentUser();

  // user incident from states.
  const incidentFromStates = computed<number | undefined>(() => {
    const _id = userStates.value?.incident as number | undefined;
    debug('Resolved incident id from user state %s', _id);
    return _id;
  });

  // Current incident is defined and does not match incident id from states.
  const newCurrentIncident = computed(() =>
    hasCurrentUser.value &&
    incidentId.value !== undefined &&
    incidentId.value !== incidentFromStates.value
      ? incidentId.value
      : undefined,
  );

  const updateUserIncident = (newIncidentId: number) =>
    updateUserStates({ incident: newIncidentId });

  // update user states whenever current incident id changes.
  whenever(
    newCurrentIncident,
    async (newValue) => {
      debug('Updating incident id in user state %o', {
        newValue,
        incidentStates: incidentFromStates.value,
        incidentId: incidentId.value,
      });
      await updateUserIncident(newValue).catch(getErrorMessage);
    },
    { immediate: true },
  );

  return {
    userIncidentId: incidentFromStates,
    hasUserIncidentId: computedEager(() => Boolean(incidentFromStates.value)),
    updateUserIncident,
  };
};
