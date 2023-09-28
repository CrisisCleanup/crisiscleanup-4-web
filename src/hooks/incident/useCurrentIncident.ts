import { computed, watch } from 'vue';
import createDebug from 'debug';
import useCurrentUser from '@/hooks/useCurrentUser';
import Incident from '@/models/Incident';
import { useStore } from 'vuex';
import { getErrorMessage } from '@/utils/errors';
import { whenever } from '@vueuse/core';
import { logicAnd, logicNot } from '@vueuse/math';
import { useModelInstance } from '@/hooks/useModel';
import { useUserIncident } from '@/hooks/incident/useUserIncident';
import { useRouteIncident } from '@/hooks/incident/useRouteIncident';

const debug = createDebug('@ccu:hooks:useCurrentIncident');

/**
 * Use current user incident.
 *
 * @remarks Order of priority of incident id (descending):
 * - Route path parameter (incidents/123/work)
 * - User states current incident id
 * - Most recent incident they have access too
 */
export const useCurrentIncident = () => {
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
