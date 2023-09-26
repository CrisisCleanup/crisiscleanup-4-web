import { ref, computed } from 'vue';
import createDebug from 'debug';
import useCurrentUser from './useCurrentUser';
import Incident from '@/models/Incident';
import { useStore } from 'vuex';
import { useRouteParams } from '@vueuse/router';
import { getErrorMessage } from '@/utils/errors';
import { createSharedComposable } from '@vueuse/core';

const debug = createDebug('@ccu:hooks:useCurrentIncident');

function useCurrentIncident() {
  const { currentUser, hasCurrentUser, updateUserStates } = useCurrentUser();
  const store = useStore();
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
    const id = Number.isNaN(_id) ? undefined : _id;
    debug('Resolved incident id %s | Sources %o', id, {
      incidentIdFromRoute: incidentIdFromRoute.value,
      recentIncidentIdFromState: recentIncidentIdFromState.value,
      recentIncidentId: recentIncidentId.value,
    });
    return id;
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
  const setIncidentIdInStore = () =>
    store.commit('incident/setCurrentIncidentId', incidentId.value);

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

  whenever(incidentId, () => {
    debug('Saving current incident id in store %s', incidentId.value);
    setIncidentIdInStore();
  });

  whenever(
    () =>
      hasCurrentUser.value &&
      incidentId.value &&
      recentIncidentIdFromState.value &&
      recentIncidentIdFromState.value !== incidentId.value,
    async () => {
      debug('Saving current incident id in user states %s', incidentId.value);
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
