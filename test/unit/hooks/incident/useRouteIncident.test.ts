import { ref } from 'vue';
import { describe, it, type Mock, vi } from 'vitest';
import { useRouteParams } from '@vueuse/router';
import { useRouteIncident } from '@/hooks/incident/useRouteIncident';

vi.mock('@vueuse/router');
vi.mock('@vueuse/core');
describe('hooks>>incident>>useRouteIncident', () => {
  it('should return undefined when route param is not a number', () => {
    (useRouteParams as Mock).mockReturnValue({ value: 'no-a-number' });

    const { routeIncidentId, hasRouteIncidentId } = useRouteIncident();

    expect(routeIncidentId.value).toBeUndefined();
    expect(hasRouteIncidentId.value).toBeFalsy();
  });

  it('should return the incident id when route param is a number', () => {
    (useRouteParams as Mock).mockReturnValue(ref('123'));

    const { routeIncidentId, hasRouteIncidentId } = useRouteIncident();

    expect(routeIncidentId.value).toBe(123);
    expect(hasRouteIncidentId.value).toBeTruthy();
  });

  it('should return undefined when route param is NaN', () => {
    (useRouteParams as Mock).mockReturnValue(ref(Number.NaN));

    const { routeIncidentId, hasRouteIncidentId } = useRouteIncident();

    expect(routeIncidentId.value).toBeUndefined();
    expect(hasRouteIncidentId.value).toBeFalsy();
  });
});
