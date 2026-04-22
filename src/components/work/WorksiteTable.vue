<template>
  <AjaxTable
    ref="table"
    :columns="columns"
    :url="tableUrl"
    class="shadow-sm"
    :query="{
      ...worksiteQuery,
      fields:
        'id,case_number,name,address,city,state,postal_code,county,work_types',
    }"
    enable-selection
    :body-style="bodyStyle"
    @row-click="
      (worksite) => {
        $emit('rowClick', worksite);
      }
    "
    @selection-changed="(payload) => $emit('selectionChanged', payload)"
  >
    <template #work_types="slotProps">
      <div class="flex flex-wrap gap-1 py-1" data-testid="testWorksiteTableDiv">
        <span
          v-for="work_type in slotProps.item.work_types"
          :key="`${work_type.id}`"
          class="ccu-worktype-chip"
          :title="`${getWorkTypeName(work_type.work_type)} — ${getStatusName(
            work_type.status,
          )}`"
        >
          <span
            class="ccu-worktype-chip__dot"
            :style="{
              backgroundColor: getColorForStatus(
                work_type.status,
                Boolean(work_type.claimed_by),
              ),
            }"
            aria-hidden="true"
          />
          <span class="ccu-worktype-chip__label">
            {{ getWorkTypeName(work_type.work_type) }}
          </span>
        </span>
      </div>
    </template>
  </AjaxTable>
</template>

<script lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  getColorForStatus,
  getWorkTypeName,
  getStatusName,
} from '../../filters';
import AjaxTable from '@/components/AjaxTable.vue';
import { useMq } from 'vue3-mq';
import ColoredCircle from '@/components/ColoredCircle.vue';
import Table from '@/components/Table.vue';

export default defineComponent({
  name: 'WorksiteTable',
  components: { Table, ColoredCircle, AjaxTable },
  props: {
    worksiteQuery: { type: Object, default: null, required: false },
    bodyStyle: { type: Object, default: null, required: false },
  },
  emits: ['rowClick'],

  setup() {
    const { t } = useI18n();
    const mq = useMq();

    const columns = ref([
      {
        title: t('casesVue.number_abbrev'),
        dataIndex: 'case_number',
        key: 'case_number',
        sortKey: 'id',
        width: '0.4fr',
        sortable: true,
      },
      {
        title: t('casesVue.work_type'),
        dataIndex: 'work_types',
        key: 'work_types',
        scopedSlots: { customRender: 'work_types' },
        width: '1fr',
      },
      {
        title: t('casesVue.name'),
        dataIndex: 'name',
        key: 'name',
        width: '1fr',
        sortable: true,
      },
      {
        title: t('casesVue.full_address'),
        dataIndex: 'address',
        key: 'address',
        width: '1.4fr',
      },
      {
        title: t('casesVue.city'),
        dataIndex: 'city',
        key: 'city',
        width: '0.6fr',
        sortable: true,
      },
      {
        title: t('casesVue.county_parish'),
        dataIndex: 'county',
        key: 'county',
        width: '0.6fr',
        sortable: true,
      },
    ]);
    const tableUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/worksites`;
    return {
      columns,
      tableUrl,
      getColorForStatus,
      getWorkTypeName,
      getStatusName,
      mq,
    };
  },
});
</script>

<style lang="postcss" scoped>
.ccu-worktype-chip {
  @apply inline-flex items-center gap-1.5 px-2 py-0.5
    bg-crisiscleanup-smoke rounded-full
    text-[11px] font-semibold text-black
    whitespace-nowrap leading-5;
  border: 1px solid theme('colors.crisiscleanup-grey.100');
}
.ccu-worktype-chip__dot {
  @apply inline-block w-2 h-2 rounded-full flex-shrink-0;
}
.ccu-worktype-chip__label {
  @apply truncate max-w-[16ch];
}
</style>
