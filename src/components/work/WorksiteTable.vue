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
      <div class="flex flex-col" data-testid="testWorksiteTableDiv">
        <div
          v-for="work_type in slotProps.item.work_types"
          :key="`${work_type.id}`"
          class="badge-holder flex items-center cursor-pointer"
          :title="getStatusName(work_type.status)"
        >
          <ColoredCircle
            class="mx-1 w-4 h-4"
            :title="getStatusName(work_type.status)"
            :color="
              getColorForStatus(work_type.status, Boolean(work_type.claimed_by))
            "
          />
          {{ getWorkTypeName(work_type.work_type) }}
        </div>
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
        width: '0.5fr',
        sortable: true,
      },
      {
        title: t('casesVue.work_type'),
        dataIndex: 'work_types',
        key: 'work_types',
        scopedSlots: { customRender: 'work_types' },
        width: '1.5fr',
      },
      {
        title: t('casesVue.name'),
        dataIndex: 'name',
        key: 'name',
        width: '1.5fr',
        sortable: true,
      },
      {
        title: t('casesVue.full_address'),
        dataIndex: 'address',
        key: 'address',
      },
      {
        title: t('casesVue.city'),
        dataIndex: 'city',
        key: 'city',
        sortable: true,
      },
      {
        title: t('casesVue.county_parish'),
        dataIndex: 'county',
        key: 'county',
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

<style scoped></style>
