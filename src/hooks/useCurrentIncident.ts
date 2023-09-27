import { ref, computed } from 'vue';
import createDebug from 'debug';
import useCurrentUser from './useCurrentUser';
import Incident from '@/models/Incident';
import { useStore } from 'vuex';
import { useRouteParams } from '@vueuse/router';
import { getErrorMessage } from '@/utils/errors';
import type { MaybeRef } from '@vueuse/core';
import {
  createSharedComposable,
  get,
  whenever,
  computedEager,
  computedAsync,
} from '@vueuse/core';

const debug = createDebug('@ccu:hooks:useCurrentIncident');

function useIncident(id?: MaybeRef<number | undefined>) {
  const incidentId = computed(() => get(id));
  const isCurrentIncidentLoading = ref(false);
  const currentIncident = computedAsync(
    async () => {
      const iId = incidentId.value;
      if (!iId) return;
      const incidentFromStore = Incident.find(iId);
      if (incidentFromStore) {
        return incidentFromStore;
      }
      await Incident.api().fetchById(iId);
      const _incident = Incident.find(iId);
      debug('fetched incident not available in store', {
        incidentFromStore,
        _incident,
      });
      return _incident;
    },
    undefined,
    isCurrentIncidentLoading,
  );
  const hasCurrentIncident = computedEager(
    () => currentIncident.value && !isCurrentIncidentLoading.value,
  );
  return {
    incidentId,
    currentIncident,
    hasCurrentIncident,
    isLoading: isCurrentIncidentLoading,
  };
}

function useUserIncident(incidentId?: MaybeRef<number | undefined>) {
  const { currentUser, updateUserStates } = useCurrentUser();
  const recentIncidentIdFromState = computed(
    () => currentUser.value?.states?.incident as number | undefined,
  );
  whenever(
    () => get(incidentId),
    async (newIncidentId) => {
      debug('Saving current incident id in user states %s', newIncidentId);
      await updateUserStates({ incident: newIncidentId }).catch(
        getErrorMessage,
      );
    },
  );
  return {
    userIncidentId: recentIncidentIdFromState,
    hasUserIncidentId: computed(() => Boolean(recentIncidentIdFromState.value)),
  };
}

function useRouteIncident(incidentId?: MaybeRef<number | undefined>) {
  const incidentIdParam = 'incident_id';
  const incidentIdFromRoute = useRouteParams(incidentIdParam);
  const normalizedIncidentId = computed(() => {
    const _id = Number(incidentIdFromRoute.value);
    const id = Number.isNaN(_id) ? undefined : _id;
    debug('Resolved incident id from route %s', id);
    return id;
  });
  whenever(
    () => get(incidentId),
    (newIncidentId) => {
      debug(`Updating ${incidentIdParam} in route %s`, newIncidentId);
      incidentIdFromRoute.value = String(newIncidentId);
    },
  );
  return {
    routeIncidentId: normalizedIncidentId,
    hasRouteIncidentId: computedEager(() =>
      Boolean(normalizedIncidentId.value),
    ),
  };
}

/**
 * Order of priority of incident id (descending):
 * - Route path parameter (incidents/123/work)
 * - User states current incident id
 * - Most recent incident they have access too
 */
function useCurrentIncident() {
  const currentIncidentId = ref<number | undefined>();
  const { currentUser: user } = useCurrentUser();
  const store = useStore();
  const { routeIncidentId, hasRouteIncidentId } =
    useRouteIncident(currentIncidentId);
  const { userIncidentId, hasUserIncidentId } =
    useUserIncident(currentIncidentId);
  const { currentIncident, hasCurrentIncident, isLoading } =
    useIncident(currentIncidentId);

  const hasNewIncidentRoute = computedEager(
    () =>
      hasRouteIncidentId.value &&
      routeIncidentId.value !== userIncidentId.value,
  );

  const setIncidentIdInStore = () => {
    debug('Setting incident id in store', currentIncidentId.value);
    store.commit('incident/setCurrentIncidentId', currentIncidentId.value);
  };

  // Sync currentIncidentId with incidentId in vuex store
  whenever(currentIncidentId, setIncidentIdInStore);

  // Set incident id from route param
  whenever(
    hasNewIncidentRoute,
    () => {
      if (routeIncidentId.value !== currentIncidentId.value) {
        debug('Setting incident id from route %s', routeIncidentId.value);
        currentIncidentId.value = routeIncidentId.value;
      }
    },
    { immediate: true },
  );

  // Set incident id from user state if not available in route
  whenever(
    () => hasUserIncidentId.value && !hasRouteIncidentId.value,
    () => {
      if (userIncidentId.value !== currentIncidentId.value) {
        debug('Setting incident id from user state %s', userIncidentId.value);
        currentIncidentId.value = userIncidentId.value;
      }
    },
  );

  // Set incident id by fetching most recent incident as fallback
  whenever(
    () =>
      user.value &&
      !hasRouteIncidentId.value &&
      !hasUserIncidentId.value &&
      !currentIncidentId.value &&
      !isLoading.value,
    async () => {
      debug('Falling back to fetching recent incident to set incident id %o', {
        routeIncidentId: routeIncidentId.value,
        userIncidentId: userIncidentId.value,
      });
      const incidentFieldsStr = Incident.basicFields().join(',');
      const _recentIncident = await Incident.api().get(
        `/incidents?fields=${incidentFieldsStr}&limit=1&sort=-start_at`,
        { dataKey: 'results' },
      );
      const incident = Incident.query().orderBy('id', 'desc').first();
      debug('fetched recentIncident', { _recentIncident, incident });
      if (incident) {
        currentIncidentId.value = incident.id as number;
      } else {
        console.error('Failed to fetch recentIncident', { _recentIncident });
      }
    },
  );

  return {
    currentIncidentId: computed(() => currentIncidentId.value),
    currentIncident,
    hasCurrentIncident,
    isCurrentIncidentLoading: isLoading,
  };
}

export default createSharedComposable(useCurrentIncident);
