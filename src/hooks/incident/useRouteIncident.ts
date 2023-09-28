import { useRouteParams } from '@vueuse/router';
import { computed } from 'vue';
import createDebug from 'debug';

const debug = createDebug('@ccu:hooks:incident:useRouteIncident');

/**
 * Use current incident from route.
 */
export const useRouteIncident = () => {
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
    hasRouteIncidentId: computed(() => Boolean(normalizedIncidentId.value)),
  };
};
