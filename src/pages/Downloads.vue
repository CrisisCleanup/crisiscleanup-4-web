<template>
  <div class="p-3">
    <div class="flex items-center justify-between">
      <base-text variant="h1" class="my-3"
        >{{ $t('nav.user_downloads') }}
      </base-text>

      <base-button
        :action="() => deleteDownloads(selectedDownloads)"
        :alt="$t('actions.delete')"
        variant="outline"
        size="small"
        :disabled="selectedDownloads.length === 0"
      >
        {{ $t('actions.delete') }} ({{ selectedDownloads.length }})
      </base-button>
    </div>
    <AjaxTable
      :url="tableUrl"
      :columns="columns"
      :body-style="{ height: '30rem' }"
      data-testid="testDownloadsTable"
      class="border"
      :query="query"
      enable-selection
      @selection-changed="
        (selectedItems) => {
          selectedDownloads = Array.from(selectedItems);
        }
      "
    >
      <template #name="{ item }">
        <div class="flex gap-1 items-center">
          {{ item.name }}
          <ccu-icon
            v-if="item.name"
            :alt="$t('actions.edit')"
            data-testid="testEditIcon"
            type="edit"
            size="small"
            :action="() => editDownloadName(item.id)"
          />
        </div>
      </template>
      <template #file="{ item }">
        <div class="flex gap-1">
          <ccu-icon
            v-if="item.file"
            :action="() => downloadFile(item.file)"
            class="ml-3"
            size="small"
            type="download"
          >
          </ccu-icon>
          <ccu-icon
            :action="() => deleteDownload(item.id)"
            class="ml-3"
            size="small"
            type="trash"
          >
          </ccu-icon>
        </div>
      </template>
      <template #status="{ item }">
        <div v-if="item.celery_task_status === 'SUCCESS'">
          <div class="text-green-600">
            {{ $t('downloads.completed') }}
          </div>
        </div>
        <div v-else-if="item.celery_task_status === 'FAILURE'">
          <div class="text-red-600">
            {{ $t('downloads.failed') }}
          </div>
        </div>
        <div v-else-if="item.status === 'completed'">
          <div class="text-green-600">
            {{ $t('downloads.completed') }}
          </div>
        </div>
        <div v-else-if="item.status === 'failed'">
          <div class="text-red-600">
            {{ $t('downloads.failed') }}
          </div>
        </div>
        <div v-else>
          <div class="text-blue-600">
            {{ $t('downloads.processing') }}
          </div>
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
import CcuIcon from '@/components/BaseIcon.vue';
import useDialogs from '@/hooks/useDialogs';
import Table from '@/components/Table.vue';

export default defineComponent({
  name: 'Downloads',
  components: { Table, CcuIcon, BaseButton, BaseText, AjaxTable },
  setup() {
    const { prompt } = useDialogs();
    const { t } = useI18n();
    const tableUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/user_downloads`;
    const columns = makeTableColumns([
      ['name', '1fr', 'Name'],
      ['created_at', '1fr', 'Created At'],
      ['status', '1fr', 'Status'],
      ['file', '1fr', ''],
    ]);
    const query = ref({});
    const selectedDownloads = ref([]);
    for (const column of columns) {
      // overwrite default column title from `Name` to `Organization`
      if (column.key === 'created_at') {
        column.transformer = (field) => {
          return moment(field).format('ddd MMMM Do YYYY h:mm:ss a');
        };
      }
    }

    const reloadTable = async () => {
      query.value = { _t: Date.now() };
    };

    const downloadFile = async (file: any) => {
      const { data } = await axios.get(`/files/${file}`);
      const url = data.csv_url;
      return forceFileDownloadFromURl(url, data.filename_original);
    };

    const deleteDownload = async (id: string) => {
      try {
        await axios.delete(`/user_downloads/${id}`);
        await reloadTable();
      } catch (error) {
        console.error('Error deleting download:', error);
      }
    };

    async function editDownloadName(id: string) {
      const result = await prompt({
        title: t('downloads.edit_file_name'),
        content: t('downloads.edit_file_name_description'),
      });
      if (result) {
        try {
          await axios.patch(`/user_downloads/${id}`, { name: result });
          await reloadTable();
        } catch (error) {
          console.error('Error updating download name:', error);
        }
      }
    }

    const deleteDownloads = async (downloads: any[]) => {
      try {
        await Promise.all(
          downloads.map((download) =>
            axios.delete(`/user_downloads/${download}`),
          ),
        );
        await reloadTable();
      } catch (error) {
        console.error('Error deleting downloads:', error);
      }
    };

    return {
      tableUrl,
      columns,
      downloadFile,
      deleteDownload,
      editDownloadName,
      query,
      selectedDownloads,
      deleteDownloads,
    };
  },
});
</script>

<style scoped></style>
