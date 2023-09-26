import { ref, computed } from 'vue';
import createDebug from 'debug';
import { store } from '@/store';
import useCurrentUser from './useCurrentUser';
import Incident from '@/models/Incident';
import { useRouteParams } from '@vueuse/router';
import { getErrorMessage } from '@/utils/errors';
import { createSharedComposable } from '@vueuse/core';

const debug = createDebug('@ccu:hooks:useCurrentIncident');

function useCurrentIncident() {
  // const debug = (...args: any[]) => console.debug(...args);
  const { currentUser, hasCurrentUser, updateUserStates } = useCurrentUser();
  const incidentFieldsStr = computed(() => Incident.basicFields().join(','));

  /**
   * Order of priority of incident id (descending):
   * - Route path parameter (incidents/123/work)
   * - User states current incident id
   * - Most recent incident they have access too
   */
  const incidentIdFromRoute = useRouteParams('incident_id');
  const recentIncidentIdFromState = computed(
    () => currentUser.value?.states?.incident as number | undefined,
  );
  const recentIncidentId = ref<number>();
  const isCurrentIncidentLoading = ref(false);
  const incidentId = computed(() => {
    const _id = Number(
      incidentIdFromRoute.value ??
        recentIncidentIdFromState.value ??
        recentIncidentId.value,
    );
    debug('Resolved incident id %s | Sources %o', _id, {
      incidentIdFromRoute: incidentIdFromRoute.value,
      recentIncidentIdFromState: recentIncidentIdFromState.value,
      recentIncidentId: recentIncidentId.value,
    });
    return Number.isNaN(_id) ? undefined : _id;
  });
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

  // populate recentIncidentId if not available in route or user state
  whenever(
    () =>
      hasCurrentUser.value &&
      !incidentIdFromRoute.value &&
      !recentIncidentIdFromState.value,
    async () => {
      debug(
        'Fetching recent incident. fromRoute %o | fromState %o',
        incidentIdFromRoute.value,
        recentIncidentIdFromState.value,
      );
      const _recentIncident = await Incident.api().get(
        `/incidents?fields=${incidentFieldsStr.value}&limit=1&sort=-start_at`,
        { dataKey: 'results' },
      );
      const incident = Incident.query().orderBy('id', 'desc').first();
      debug('fetched recentIncident', { _recentIncident, incident });
      if (incident) {
        recentIncidentId.value = incident.id as number;
      } else {
        console.error('Failed to fetch recentIncident', { _recentIncident });
      }
    },
  );

  whenever(
    () => hasCurrentUser.value && incidentId.value,
    async () => {
      debug(
        'Saving current incident id to store & user states %s',
        incidentId.value,
      );
      store.commit('incident/setCurrentIncidentId', incidentId.value);
      await updateUserStates({ incident: incidentId.value }).catch(
        getErrorMessage,
      );
    },
  );

  return {
    currentIncidentId: incidentId,
    currentIncident,
    hasCurrentIncident,
  };
}

export default createSharedComposable(useCurrentIncident);
