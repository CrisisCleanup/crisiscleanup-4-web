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
    const _userIncidentId = userStates.value?.incident as
      | number
      | string
      | undefined;
    const _id = Number(_userIncidentId);
    const id = Number.isNaN(_id) ? undefined : _id;
    debug('Resolved incident id from user state %s', _id);
    return id;
  });

  // Current incident is defined and does not match incident id from states.
  const newCurrentIncident = computed(() =>
    hasCurrentUser.value &&
    incidentId.value !== undefined &&
    incidentId.value !== incidentFromStates.value
      ? incidentId.value
      : undefined,
  );

  /**
   * Set user states incident id
   * @param newIncidentId new incident id to set in user states.
   */
  const updateUserIncident = (newIncidentId: number) => {
    debug('Updating incident id in user state -> %s', newIncidentId);
    return updateUserStates({ incident: newIncidentId });
  };

  // update user states whenever current incident id changes.
  whenever(
    newCurrentIncident,
    async (newValue) => {
      debug('Updating incident id in user state %o', {
        newValue,
        incidentStates: incidentFromStates.value,
        incidentId: incidentId.value,
      });
      // update user states if new incident id is defined and does not match incident id from states.
      if (newValue) {
        await updateUserIncident(newValue).catch(getErrorMessage);
      }
    },
    { immediate: true },
  );

  return {
    userIncidentId: incidentFromStates,
    hasUserIncidentId: computedEager(() => Boolean(incidentFromStates.value)),
    updateUserIncident,
  };
};
