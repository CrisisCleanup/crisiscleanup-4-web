<template>
  <div>
    <div class="flex items-center justify-between">
      <base-input
        v-if="enableSearch"
        data-testid="testTableSearchTextInput"
        :model-value="search"
        icon="search"
        class="w-72"
        :placeholder="$t('info.search_items')"
        @update:model-value="
          (value) => {
            search = value;
            meta.pagination.page = 1;
            queueRefresh();
          }
        "
      ></base-input>
      <slot name="header-actions"> </slot>
    </div>
    <Table
      :columns="columns"
      :data="data"
      :body-style="bodyStyle"
      :pagination="meta.pagination"
      :sorter="meta.sorter"
      data-testid="testTableContent"
      enable-pagination
      :enable-selection="enableSelection"
      :loading="loading"
      v-bind="$attrs"
      @change="getData"
      @row-click="(payload) => $emit('rowClick', payload)"
      @selection-changed="(payload) => $emit('selectionChanged', payload)"
    >
      <template v-for="(_, slot) of $slots" #[slot]="scope"
        ><slot :name="slot" v-bind="scope"
      /></template>
    </Table>
  </div>
</template>

<script lang="ts">
import { throttle } from 'lodash';
import type { PropType } from 'vue';
import { defineComponent, onMounted, ref, watch } from 'vue';
import axios from 'axios';
import Table from './Table.vue';
import useEmitter from '@/hooks/useEmitter';

interface TablePagination {
  pageSize: number;
  page: number;
  current: number;
  total?: number;
}

interface TableSorter {
  key?: string | null;
  direction?: string | null;
}

interface TableMeta {
  pagination?: TablePagination;
  sorter?: TableSorter;
}

interface TableApiParameters {
  search?: string;
  sort?: string;
  offset?: number;
  limit?: number;
}

export default defineComponent({
  name: 'AjaxTable',
  components: { Table },
  props: {
    url: {
      type: String,
      default: '',
      required: true,
    },
    enableSearch: {
      type: Boolean,
    },
    enableSelection: {
      type: Boolean,
    },
    columns: {
      type: Array,
      default() {
        return [];
      },
    },
    query: {
      type: Object as PropType<TableApiParameters>,
      default() {
        return {};
      },
    },
    bodyStyle: {
      type: Object,
      default() {
        return { height: '300px' };
      },
    },
    pageSize: {
      type: Number,
      default: 100,
    },
    tableId: {
      type: String,
      default: '',
    },
  },
  emits: [
    'rowClick',
    'selectionChanged',
    'dataFetched',
    'update:items',
    'error',
  ],
  setup(props, { emit }) {
    const { emitter } = useEmitter();

    const defaultColumns = ref<any[]>([]);
    const data = ref<any[]>([]);
    const search = ref<string>('');
    const visible = ref(false);
    const loading = ref(false);
    const meta = ref<TableMeta>({
      pagination: {
        pageSize: props.pageSize,
        page: 1,
        current: 1,
      },
      sorter: {
        key: null,
        direction: null,
      },
    });

    let requestId = 0;
    let controller: AbortController | undefined;
    const cancelRequest = () => {
      requestId += 1;
      controller?.abort();
    };

    const getData = async (tableMeta: TableMeta = {}) => {
      cancelRequest();
      const currentRequest = requestId;
      controller = new AbortController();
      loading.value = true;
      const pagination = { ...(tableMeta.pagination || meta.value.pagination) };
      const sorter = tableMeta.sorter || meta.value.sorter;
      const params = {
        offset: pagination ? pagination.pageSize * (pagination.page - 1) : 0,
        limit: pagination ? pagination.pageSize : 10,
        ...props.query,
      };
      const searchValue = props.query.search || search.value;
      if (searchValue) {
        params.search = searchValue;
      }
      if (sorter && sorter.key) {
        params.sort = `${sorter.direction === 'desc' ? '-' : ''}${sorter.key}`;
      }

      try {
        const response = await axios.get(`${props.url}`, {
          params,
          signal: controller.signal,
        });
        if (currentRequest !== requestId) return;
        data.value = response.data.results || response.data;
        meta.value.pagination = {
          ...pagination,
          total: response.data.count,
        };
        meta.value.sorter = {
          ...sorter,
        };
        emit('update:items', data.value);
        emit('dataFetched', response.data.count);
      } catch (error_) {
        if (currentRequest === requestId && !axios.isCancel(error_)) {
          emit('error', error_);
        }
      } finally {
        if (currentRequest === requestId) loading.value = false;
      }
    };

    const throttledRefresh = throttle(() => void getData(), 1000);
    const queueRefresh = () => {
      cancelRequest();
      throttledRefresh();
    };

    onMounted(async () => {
      await getData();
    });

    watch(
      () => props.query,
      () => {
        meta.value.pagination.page = 1;
        queueRefresh();
      },
    );

    const refreshEvent = `refreshTable-${props.tableId}`;
    const refresh = () => void getData();
    onBeforeMount(() => {
      emitter.on(refreshEvent, refresh);
    });
    onBeforeUnmount(() => {
      emitter.off(refreshEvent, refresh);
      throttledRefresh.cancel();
      cancelRequest();
    });

    return {
      defaultColumns,
      data,
      meta,
      search,
      visible,
      queueRefresh,
      getData,
      loading,
    };
  },
});
</script>

<style scoped></style>
