import { computed, ref, watch } from 'vue';
import createDebug from 'debug';
import useCurrentUser from './useCurrentUser';
import Incident from '@/models/Incident';
import { useStore } from 'vuex';
import { useRouteParams } from '@vueuse/router';
import { getErrorMessage } from '@/utils/errors';
import type { MaybeRef } from '@vueuse/core';
import { computedEager, whenever } from '@vueuse/core';
import { logicAnd, logicNot } from '@vueuse/math';
import { useModelInstance } from './useModel';

const debug = createDebug('@ccu:hooks:useCurrentIncident');

/**
 * Use current user incident state.
 * @param currentIncidentId Optional current incident id to synchronize to user states.
 */
export const useUserIncident = (
  currentIncidentId?: MaybeRef<number | undefined>,
) => {
  const incidentId = ref<number | undefined>(currentIncidentId);
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

/**
 * Use current incident from route.
 */
const useRouteIncident = () => {
  const incidentIdParam = 'incident_id';
  const incidentIdFromRoute = useRouteParams(incidentIdParam);
  const normalizedIncidentId = computed(() => {
    const _id = Number(incidentIdFromRoute.value);
    const id = Number.isNaN(_id) ? undefined : _id;
    debug('Resolved incident id from route %s', id);
    return id;
  });
  return {
    routeIncidentId: normalizedIncidentId,
    hasRouteIncidentId: computedEager(() =>
      Boolean(normalizedIncidentId.value),
    ),
  };
};

/**
 * Use current user incident.
 *
 * @remarks Order of priority of incident id (descending):
 * - Route path parameter (incidents/123/work)
 * - User states current incident id
 * - Most recent incident they have access too
 */
const useCurrentIncident = () => {
  const { currentUser: user } = useCurrentUser();
  const { routeIncidentId } = useRouteIncident();
  // synchronize route incident to states if found, but always use user states as source.
  const { userIncidentId, updateUserIncident } =
    useUserIncident(routeIncidentId);

  // use incident from user as source of truth.
  const {
    itemId: currentIncidentId,
    item: currentIncident,
    isLoading,
    hasItem: hasCurrentIncident,
  } = useModelInstance(Incident, userIncidentId);

  // TODO: remove redundant incident store.
  const store = useStore();
  const setIncidentIdInStore = (value) => {
    debug('Setting incident id in store', value);
    store.commit('incident/setCurrentIncidentId', value);
  };

  // Sync currentIncidentId with incidentId in vuex store
  // TODO: remove redundant incident store.
  watch(
    currentIncidentId,
    (newValue) =>
      newValue !== undefined &&
      newValue !== null &&
      setIncidentIdInStore(newValue),
    { immediate: true },
  );

  // when incident cannot be provided from states or route, fetch most recent incident id
  // and set it as the current incident id in user states.
  whenever(logicAnd(logicNot(hasCurrentIncident), user), async () => {
    const { response } = await Incident.api().get(
      `/incidents?fields=id&limit=1&sort=-start_at`,
      { dataKey: 'results', save: false },
    );
    const incidentId = response?.data?.results?.[0]?.id;
    debug('Falling back to fetching recent incident to set incident id %o', {
      routeIncidentId: routeIncidentId.value,
      userIncidentId: userIncidentId.value,
      fetchedId: incidentId,
      fetched: response,
    });
    if (incidentId) {
      await updateUserIncident(incidentId as number);
    } else {
      const err = new Error('Failed to fetch recent incident:', response);
      debug('failed to fetch recent incident: %O', response);
      getErrorMessage(err);
      throw err;
    }
  });

  return {
    currentIncidentId: computed(() => currentIncidentId.value),
    currentIncident,
    hasCurrentIncident,
    isCurrentIncidentLoading: isLoading,
  };
};

export default useCurrentIncident;
