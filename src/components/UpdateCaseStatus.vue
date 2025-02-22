<template>
  <div class="p-3 flex flex-col">
    <base-select
      class="bg-white h-12 mb-3 w-120 absolute"
      data-testid="testSelectStatusSelect"
      :options="displayStatuses"
      searchable
      item-key="status"
      label="status"
      :placeholder="$t('actions.select_status')"
      @update:model-value="$emit('updatedStatus', $event)"
    >
      <template #selected-option="{ option }">
        <div class="flex items-center justify-start absolute left-0 top-0 px-2">
          <ColoredCircle
            class="ml-1 mr-3 w-4 h-4"
            :title="getStatusName(option.status)"
            :color="getColorForStatus(option.status, true)"
          />
          {{ getStatusName(option.status) }}
        </div>
      </template>
      <template #option="{ option }">
        <div class="flex items-center justify-start">
          <ColoredCircle
            class="ml-1 mr-3 w-4 h-4"
            :title="getStatusName(option.status)"
            :color="getColorForStatus(option.status, true)"
          />
          {{ getStatusName(option.status) }}
        </div>
      </template>
    </base-select>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import Incident from '@/models/Incident';
import { getColorForStatus, getStatusName } from '@/filters';
import ColoredCircle from '@/components/ColoredCircle.vue';

export default defineComponent({
  name: 'UpdateCaseStatus',
  components: { ColoredCircle },
  emits: ['updatedStatus'],
  setup() {
    const store = useStore();
    const currentIncidentId = computed(
      () => store.getters['incident/currentIncidentId'],
    );
    const currentIncident = computed(() =>
      Incident.find(currentIncidentId.value),
    );

    const statuses = computed(() => store.getters['enums/statuses']);
    const displayStatuses = computed(() => {
      return statuses.value
        .filter((status: any) =>
          currentIncident?.value?.phase
            ? status.phases.includes(currentIncident?.value?.phase)
            : true,
        )
        .map((status: any, index: number) => {
          return {
            ...status,
            selectionKey: index + 1,
          };
        });
    });

    return {
      currentIncident,
      displayStatuses,
      getColorForStatus,
      getStatusName,
    };
  },
});
</script>

<style scoped></style>
