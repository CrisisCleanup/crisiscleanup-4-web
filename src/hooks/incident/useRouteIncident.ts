import { useRouter, useRoute } from 'vue-router';
import { useRouteParams } from '@vueuse/router';
import { computed } from 'vue';
import createDebug from 'debug';

const debug = createDebug('@ccu:hooks:incident:useRouteIncident');

/**
 * Use current incident from route.
 */
export const useRouteIncident = () => {
  const router = useRouter();
  const currentRoute = useRoute();
  const incidentIdParam = 'incident_id';
  const incidentIdFromRoute = useRouteParams(incidentIdParam);

  const normalizedIncidentId = computed(() => {
    const _id = Number(incidentIdFromRoute.value);
    const id = Number.isNaN(_id) ? undefined : _id;
    debug('Resolved incident id from route %s', id);
    return id;
  });

  /**
   * Push new incident id route parameter.
   * @param value new incident id
   */
  const updateRouteIncidentId = async (value: number) => {
    debug('Updating incident id in route -> %s', value);
    // incident id param watcher for under `useCurrentIncident`
    await router.push({
      name: currentRoute.name as string,
      params: { ...currentRoute.params, incident_id: value },
      query: { ...currentRoute.query },
    });
  };

  return {
    updateRouteIncidentId,
    routeIncidentId: normalizedIncidentId,
    hasRouteIncidentId: computed(() => Boolean(normalizedIncidentId.value)),
  };
};
