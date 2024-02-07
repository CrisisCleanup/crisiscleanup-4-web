import { readonly, watch } from 'vue';
import createDebug from 'debug';
import useCurrentUser from '@/hooks/useCurrentUser';
import Incident from '@/models/Incident';
import { useStore } from 'vuex';
import { getErrorMessage } from '@/utils/errors';
import { useAsyncState, whenever } from '@vueuse/core';
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
  const { hasCurrentUser } = useCurrentUser();
  const { routeIncidentId, hasRouteIncidentId, updateRouteIncidentId } =
    useRouteIncident();
  // synchronize route incident to states if found, but always use user states as source.
  const { userIncidentId, updateUserIncident } =
    useUserIncident(routeIncidentId);

  // use incident from user as source of truth.
  const {
    itemId: currentIncidentId,
    item: currentIncident,
    isLoading: isCurrentIncidentLoading,
    hasItem: hasCurrentIncident,
    fetchInstance,
  } = useModelInstance(Incident, userIncidentId);

  // TODO: remove redundant incident store.
  const store = useStore();
  const setIncidentIdInStore = (value: number) => {
    debug('Setting incident id in store %s', value);
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

  // lazy state for fetching most recent incident id from api.
  const recentIncidentState = useAsyncState(
    () =>
      Incident.api()
        .get(`/incidents?fields=id&limit=1&sort=-start_at`, {
          dataKey: 'results',
          save: false,
        })
        .then(
          ({ response }) =>
            response?.data?.results?.[0]?.id as number | undefined,
        ),
    undefined,
    {
      immediate: false,
      resetOnExecute: false,
    },
  );

  // if incident id cannot be sourced through states or route, no incident is known.
  const noKnownIncident = computed(
    () =>
      currentIncidentId.value === undefined || currentIncidentId.value === null,
  );

  // when incident cannot be provided from states or route, fetch most recent incident id
  // and set it as the current incident id in user states.
  whenever(
    logicAnd(
      noKnownIncident,
      logicNot(isCurrentIncidentLoading),
      hasCurrentUser,
    ),
    () => {
      debug('invoking recent incident state: %O', {
        noKnownIncident: noKnownIncident.value,
        hasCurrentUser: hasCurrentUser.value,
      });
      recentIncidentState.execute().catch(getErrorMessage);
    },
    // this watcher is dependent on the incident route param, which is sourced through dom.
    // therefore, it must be flushed only after the dom is updated.
    { flush: 'post' },
  );

  // feed fetched recent incident into state update.
  watch(recentIncidentState.state, async (newValue) => {
    debug('fell back to fetching recent incident to set incident id %o', {
      routeIncidentId: routeIncidentId.value,
      userIncidentId: userIncidentId.value,
      fetched: newValue,
    });
    if (newValue && newValue !== currentIncidentId.value) {
      await updateUserIncident(newValue);
    }
  });

  /**
   * Update the current incident id for the user.
   *
   * @remarks
   * This will update the route if an incident id is currently in use, which will then propagate to user states.
   * Otherwise, just updates the user states.
   *
   * @param newIncidentId New incident id.
   */
  const updateCurrentIncidentId = async (newIncidentId: number) => {
    await (hasRouteIncidentId.value
      ? updateRouteIncidentId(newIncidentId)
      : updateUserIncident(newIncidentId));
  };

  const loadRecentIncident = async () => {
    await recentIncidentState.execute().catch(getErrorMessage);
  };

  return {
    currentIncidentId: readonly(currentIncidentId),
    currentIncident,
    hasCurrentIncident,
    isCurrentIncidentLoading,
    updateCurrentIncidentId,
    loadRecentIncident,
    fetchIncidentDetails: async () => {
      debug('Fetching incident details...');
      await fetchInstance().catch(getErrorMessage);
    },
  };
};
