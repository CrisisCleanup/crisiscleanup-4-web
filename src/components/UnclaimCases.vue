<template>
  <div class="p-3 flex flex-col" data-testid="testBulkUnclaimReassignStatusDiv">
    <span class="text-base pb-3">
      {{
        $t('casesVue.bulk_unclaim_reassign_status', {
          length: selectedTableItems.size,
        })
      }}
    </span>
    <base-checkbox
      class="mb-5"
      data-testid="testBulkUnclaimNoChangeStatusCheckbox"
      :model-value="unchangedStatusOnUnclaim"
      @update:model-value="
        () => {
          unchangedStatusOnUnclaim = !unchangedStatusOnUnclaim;
          updateStatusOnUnclaim = !unchangedStatusOnUnclaim;
          $emit('onUnclaimSelect', {
            unchangedStatusOnUnclaim,
            updateStatusOnUnclaim,
          });
        }
      "
      >{{ $t('casesVue.no_change') }}</base-checkbox
    >
    <base-checkbox
      class="mb-5"
      data-testid="testBulkUnclaimOpenUnassignedStatusCheckbox"
      :model-value="updateStatusOnUnclaim"
      @update:model-value="
        () => {
          updateStatusOnUnclaim = !updateStatusOnUnclaim;
          unchangedStatusOnUnclaim = !updateStatusOnUnclaim;
          $emit('onUnclaimSelect', {
            unchangedStatusOnUnclaim,
            updateStatusOnUnclaim,
          });
        }
      "
      >{{ $t('status.open_unassigned') }}</base-checkbox
    >
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';

export default defineComponent({
  name: 'UnclaimCases',
  props: {
    selectedTableItems: { type: Set, default: null, required: false },
  },
  emits: ['onUnclaimSelect'],
  setup() {
    const unchangedStatusOnUnclaim = ref(true);
    const updateStatusOnUnclaim = ref(false);

    return {
      unchangedStatusOnUnclaim,
      updateStatusOnUnclaim,
    };
  },
});
</script>

<style scoped></style>
