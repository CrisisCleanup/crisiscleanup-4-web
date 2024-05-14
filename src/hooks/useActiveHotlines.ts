import { ref, computed } from 'vue';
import { isValidActiveHotline, getIncidentPhoneNumbers } from '@/filters';
import type Incident from '@/models/Incident';
import type { CCUApiListResponse } from '@/models/types';

export function useActiveHotlines() {
  const ccuApi = useApi();
  const fieldsToFetch = [
    'id',
    'name',
    'short_name',
    'active_phone_number',
    'start_at',
  ];
  const isLoading = ref(true);
  const data = ref<CCUApiListResponse<Incident> | null>(null);

  const { isFinished: isInvitationRequestsFinished, data: response } = ccuApi(
    '/incidents?fields=id,name,short_name,active_phone_number&limit=200&sort=-start_at',
    {
      method: 'GET',
      params: {
        fields: fieldsToFetch.join(','),
        limit: 200,
        sort: '-start_at',
      },
    },
  );
  whenever(isInvitationRequestsFinished, () => {
    data.value = response.value;
    isLoading.value = false;
  });

  const incidentsWithActiveHotline = computed(() =>
    (data.value?.results ?? []).filter((i) =>
      isValidActiveHotline(i.active_phone_number),
    ),
  );

  return { isLoading, incidentsWithActiveHotline };
}
