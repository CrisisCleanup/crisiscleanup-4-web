<template>
  <div class="p-3">
    <base-text variant="h1" class="my-3">{{
      $t('nav.user_downloads')
    }}</base-text>
    <AjaxTable
      :url="tableUrl"
      :columns="columns"
      :body-style="{ height: '30rem' }"
      data-testid="testDownloadsTable"
      class="border"
    >
      <template #file="{ item }">
        <div v-if="item.file">
          <base-button
            :action="() => downloadFile(item.file)"
            variant="solid"
            class="ml-3"
            size="small"
          >
            {{ $t('actions.download') }}
          </base-button>
        </div>
      </template>
    </AjaxTable>
  </div>
</template>

<script lang="ts">
import moment from 'moment/moment';
import { makeTableColumns } from '@/utils/table';
import AjaxTable from '@/components/AjaxTable.vue';
import BaseText from '@/components/BaseText.vue';
import BaseButton from '@/components/BaseButton.vue';
import axios from 'axios';
import { forceFileDownloadFromURl } from '@/utils/downloads';

export default defineComponent({
  name: 'Downloads',
  components: { BaseButton, BaseText, AjaxTable },
  setup() {
    const tableUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/user_downloads`;
    const columns = makeTableColumns([
      ['created_at', '1fr', 'Created At'],
      ['status', '1fr', 'Status'],
      ['file', '1fr', ''],
    ]);
    for (const column of columns) {
      // overwrite default column title from `Name` to `Organization`
      if (column.key === 'created_at') {
        column.transformer = (field) => {
          return moment(field).format('ddd MMMM Do YYYY h:mm:ss a');
        };
      }
    }

    const downloadFile = async (file: any) => {
      const { data } = await axios.get(`/files/${file}`);
      const url = data.csv_url;
      return forceFileDownloadFromURl(url, data.filename_original);
    };

    return {
      tableUrl,
      columns,
      downloadFile,
    };
  },
});
</script>

<style scoped></style>
