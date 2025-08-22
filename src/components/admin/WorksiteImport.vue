<template>
  <div class="p-3">
    <base-text variant="h2">{{
      $t('worksiteImport.worksite_imports')
    }}</base-text>

    <!-- Stuck Imports Alert -->
    <div
      v-if="stuckImports.length > 0"
      class="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded"
    >
      <base-text variant="h3" class="text-yellow-800 mb-2">
        {{ $t('worksiteImport.stuck_imports_detected') }} ({{
          stuckImports.length
        }})
      </base-text>
      <div class="space-y-1">
        <div
          v-for="stuckImport in stuckImports"
          :key="stuckImport.id"
          class="text-sm text-yellow-700"
        >
          Import {{ stuckImport.id.slice(0, 8) }}... -
          {{ stuckImport.progress }} - Created by {{ stuckImport.created_by }}
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <DragDrop
          v-if="imports"
          :key="imports.length"
          class="cursor-pointer w-32 py-2 mr-2"
          container-class="items-center justify-start cursor-pointer"
          :disabled="uploading"
          :multiple="false"
          @files="
            (files) => {
              handleFileUpload(files);
            }
          "
        >
          <base-button
            class="cursor-pointer px-3 py-1"
            variant="solid"
            data-testid="testUploadCsvFile"
            :show-spinner="uploading"
            :disabled="uploading"
            :text="$t('actions.upload_csv')"
            :alt="$t('actions.upload_csv')"
          />
        </DragDrop>
        <base-checkbox
          v-model="ignoreDuplicates"
          data-testid="testIgnoreDuplicatesCheckbox"
          >{{ $t('worksiteImport.ignore_duplicates') }}
        </base-checkbox>
        <base-select
          v-model="uploadType"
          data-testid="testUploadTypeSelect"
          :options="['worksite', 'pda']"
          select-classes="bg-white border w-64 mx-2"
          :placeholder="$t('worksiteImport.upload_type')"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-2">
        <base-button
          variant="outline"
          size="small"
          :text="$t('worksiteImport.refresh_status')"
          :show-spinner="refreshingStatus"
          :disabled="refreshingStatus"
          :action="refreshAllStatus"
        />
        <base-button
          variant="outline"
          size="small"
          :text="$t('worksiteImport.check_stuck_imports')"
          :show-spinner="checkingStuck"
          :disabled="checkingStuck"
          :action="checkStuckImports"
        />
      </div>
    </div>
    <Table
      :columns="columns"
      :data="enhancedImports"
      :body-style="{ height: '300px' }"
    >
      <template #status="slotProps">
        <div class="flex items-center space-x-2">
          <div class="flex items-center space-x-1">
            <div
              class="w-2 h-2 rounded-full"
              :class="getStatusColor(slotProps.item.status)"
            ></div>
            <span class="text-sm capitalize">{{ slotProps.item.status }}</span>
          </div>
          <div
            v-if="slotProps.item.is_stuck"
            class="text-xs text-red-500 font-semibold"
          >
            STUCK
          </div>
        </div>
      </template>

      <template #progress="slotProps">
        <div class="w-full">
          <div class="flex justify-between text-xs mb-1">
            <span
              >{{ slotProps.item.progress?.processed || 0 }}/{{
                slotProps.item.progress?.total || 0
              }}</span
            >
            <span
              >{{ Math.round(slotProps.item.progress?.percentage || 0) }}%</span
            >
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-300"
              :class="getProgressColor(slotProps.item.status)"
              :style="{ width: `${slotProps.item.progress?.percentage || 0}%` }"
            ></div>
          </div>
          <div
            v-if="slotProps.item.progress"
            class="text-xs text-gray-500 mt-1"
          >
            Success: {{ slotProps.item.progress.successful }} | Failed:
            {{ slotProps.item.progress.failed }}
          </div>
        </div>
      </template>

      <template #actions="slotProps">
        <div class="flex mr-2 justify-end w-full items-center space-x-2">
          <base-button
            icon="sync"
            variant="outline"
            size="small"
            :text="$t('worksiteImport.refresh')"
            :show-spinner="
              refreshingStatus && slotProps.item.id === currentRefreshingId
            "
            :disabled="refreshingStatus"
            :action="() => refreshSingleImport(slotProps.item.id)"
          />
          <base-button
            v-if="slotProps.item.is_stuck || slotProps.item.status === 'stuck'"
            icon="wrench"
            variant="solid"
            size="small"
            :text="$t('worksiteImport.recover')"
            :action="() => recoverStuckImport(slotProps.item.id)"
          />
          <base-button
            v-if="
              slotProps.item.recent_errors &&
              slotProps.item.recent_errors.length > 0
            "
            :text="$t('worksiteImport.view_errors')"
            variant="outline"
            size="small"
            :action="() => showErrors(slotProps.item)"
          />
          <base-button
            :text="`${$t('worksiteImport.successful_imports')} (${
              slotProps.item.success_count ||
              slotProps.item.progress?.successful ||
              0
            })`"
            :alt="`${$t('worksiteImport.successful_imports')} (${
              slotProps.item.success_count ||
              slotProps.item.progress?.successful ||
              0
            })`"
            data-testid="testSuccessfulImportsButton"
            variant="solid"
            size="small"
            :action="
              () => {
                downloadSuccessful(slotProps.item.id);
              }
            "
          />
          <base-button
            :text="`${$t('worksiteImport.failed_imports')} (${
              slotProps.item.failed_count ||
              slotProps.item.progress?.failed ||
              0
            })`"
            :alt="`${$t('worksiteImport.failed_imports')} (${
              slotProps.item.failed_count ||
              slotProps.item.progress?.failed ||
              0
            })`"
            data-testid="testFailedImportsButton"
            variant="outline"
            size="small"
            :action="
              () => {
                downloadFailed(slotProps.item.id);
              }
            "
          />
        </div>
      </template>
    </Table>

    <!-- Error Details Modal -->
    <modal
      v-if="showErrorModal"
      :title="$t('worksiteImport.import_errors')"
      closeable
      @close="showErrorModal = false"
    >
      <div class="max-h-96 overflow-y-auto space-y-3">
        <div
          v-for="(error, index) in selectedImportErrors"
          :key="index"
          class="p-3 bg-red-50 border border-red-200 rounded"
        >
          <div class="text-sm font-medium text-red-800 mb-2">
            Row {{ index + 1 }} -
            {{ new Date(error.timestamp).toLocaleString() }}
          </div>
          <div class="text-xs text-gray-600 mb-2">
            <strong>Data:</strong> {{ JSON.stringify(error.row, null, 2) }}
          </div>
          <div class="text-xs text-red-600">
            <strong>Errors:</strong> {{ JSON.stringify(error.errors, null, 2) }}
          </div>
        </div>
      </div>
    </modal>
  </div>
</template>

<script lang="ts">
import { onMounted, ref, computed, defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import Table from '../Table.vue';
import { hash } from '../../utils/promise';
import { forceFileDownload } from '../../utils/downloads';
import DragDrop from '../DragDrop.vue';
import useDialogs from '../../hooks/useDialogs';

export default defineComponent({
  name: 'WorksiteImport',
  components: { DragDrop, Table },
  setup() {
    const { t } = useI18n();
    const { confirm } = useDialogs();
    const uploading = ref(false);
    const ignoreDuplicates = ref(false);
    const uploadType = ref('worksite');
    const imports = ref([]);
    const stuckImports = ref([]);
    const showErrorModal = ref(false);
    const selectedImportErrors = ref([]);
    const refreshingStatus = ref(false);
    const checkingStuck = ref(false);
    const currentRefreshingId = ref(null);

    async function loadPageData() {
      try {
        const pageData = await hash({
          imports: axios.get(
            `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_import`,
          ),
          stuckImports: axios.get(
            `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_import/stuck_imports`,
          ),
        });
        imports.value = pageData.imports.data.results || [];

        // Handle different possible response structures for stuck imports
        stuckImports.value =
          pageData.stuckImports.data?.stuck_imports ||
          pageData.stuckImports.data ||
          [];
      } catch (error) {
        console.error('Failed to load page data:', error);
        imports.value = [];
        stuckImports.value = [];
      }
    }

    async function getImportStatus(importId: string) {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_import/${importId}/status`,
        );
        return response.data;
      } catch (error) {
        console.error('Failed to get import status:', error);
        return null;
      }
    }

    async function recoverStuckImport(importId: string) {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_import/${importId}/recover`,
        );
        console.log('Recovery initiated for import:', importId);

        // Refresh the data after recovery
        await loadPageData();

        // Show success message
        await confirm({
          title: 'Recovery Initiated',
          content: `Recovery process has been started for import ${importId.slice(0, 8)}...`,
          actions: {
            ok: {
              text: 'OK',
              type: 'solid',
            },
          },
        });

        return response.data;
      } catch (error) {
        console.error('Failed to recover import:', error);

        // Show error message
        await confirm({
          title: 'Recovery Failed',
          content: 'Failed to initiate recovery process. Please try again.',
          actions: {
            ok: {
              text: 'OK',
              type: 'solid',
            },
          },
        });

        return null;
      }
    }

    function showErrors(importItem: any) {
      selectedImportErrors.value = importItem.recent_errors || [];
      showErrorModal.value = true;
    }

    function getStatusColor(status: string) {
      const colors: Record<string, string> = {
        pending: 'bg-yellow-400',
        processing: 'bg-blue-400',
        completed: 'bg-green-400',
        completed_with_errors: 'bg-orange-400',
        stuck: 'bg-red-400',
      };
      return colors[status] || 'bg-gray-400';
    }

    function getProgressColor(status: string) {
      const colors: Record<string, string> = {
        pending: 'bg-yellow-400',
        processing: 'bg-blue-400',
        completed: 'bg-green-400',
        completed_with_errors: 'bg-orange-400',
        stuck: 'bg-red-400',
      };
      return colors[status] || 'bg-gray-400';
    }

    async function refreshAllStatus() {
      try {
        refreshingStatus.value = true;

        // Refresh all imports status
        for (const imp of imports.value) {
          const status = await getImportStatus(imp.id);
          if (status) {
            const index = imports.value.findIndex((i: any) => i.id === imp.id);
            if (index !== -1) {
              imports.value[index] = { ...imports.value[index], ...status };
            }
          }
        }

        console.log('Status refreshed for all imports');
      } catch (error) {
        console.error('Failed to refresh status:', error);
      } finally {
        refreshingStatus.value = false;
      }
    }

    async function checkStuckImports() {
      try {
        checkingStuck.value = true;

        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_import/stuck_imports`,
        );

        // Handle different possible response structures
        const stuckImportsData =
          response.data?.stuck_imports || response.data || [];
        stuckImports.value = stuckImportsData;

        // Show dialog with results
        showStuckImportsDialog(stuckImportsData);

        console.log(`Found ${stuckImportsData.length} stuck imports`);
      } catch (error) {
        console.error('Failed to check stuck imports:', error);
        stuckImports.value = []; // Reset to empty array on error

        // Show error dialog
        showStuckImportsDialog([], true);
      } finally {
        checkingStuck.value = false;
      }
    }

    async function showStuckImportsDialog(
      stuckImportsData: any[],
      isError = false,
    ) {
      if (isError) {
        await confirm({
          title: 'Error Checking Stuck Imports',
          content: 'Failed to check for stuck imports. Please try again.',
          actions: {
            ok: {
              text: 'OK',
              type: 'solid',
            },
          },
        });
      } else if (stuckImportsData.length === 0) {
        await confirm({
          title: 'No Stuck Imports Found',
          content:
            '✅ All imports are processing normally. No stuck imports detected.',
          actions: {
            ok: {
              text: 'OK',
              type: 'solid',
            },
          },
        });
      } else {
        const importsList = stuckImportsData
          .map(
            (imp) =>
              `• Import ${imp.id.slice(0, 8)}... (${imp.progress}) - Created by ${imp.created_by}`,
          )
          .join('\n');

        const result = await confirm({
          title: `Found ${stuckImportsData.length} Stuck Import${stuckImportsData.length > 1 ? 's' : ''}`,
          content: `The following imports appear to be stuck and may need attention:\n\n${importsList}\n\nWould you like to recover all stuck imports?`,
          actions: {
            recover: {
              text: 'Recover All',
              type: 'solid',
            },
            cancel: {
              text: 'Cancel',
              type: 'outline',
            },
          },
        });

        // If user chose to recover all stuck imports
        if (result === 'recover') {
          await recoverAllStuckImports(stuckImportsData);
        }
      }
    }

    async function recoverAllStuckImports(stuckImportsData: any[]) {
      let successCount = 0;
      let failCount = 0;

      for (const imp of stuckImportsData) {
        try {
          await axios.post(
            `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_import/${imp.id}/recover`,
          );
          successCount++;
          console.log(`Recovery initiated for import: ${imp.id}`);
        } catch (error) {
          failCount++;
          console.error(`Failed to recover import ${imp.id}:`, error);
        }
      }

      // Refresh data after recovery attempts
      await loadPageData();

      // Show results
      await (failCount === 0
        ? confirm({
            title: 'Recovery Initiated',
            content: `Recovery process has been started for all ${successCount} stuck imports.`,
            actions: {
              ok: {
                text: 'OK',
                type: 'solid',
              },
            },
          })
        : confirm({
            title: 'Recovery Partially Completed',
            content: `Recovery initiated for ${successCount} imports. ${failCount} imports failed to recover.`,
            actions: {
              ok: {
                text: 'OK',
                type: 'solid',
              },
            },
          }));
    }

    async function refreshSingleImport(importId: string) {
      try {
        refreshingStatus.value = true;
        currentRefreshingId.value = importId;

        const status = await getImportStatus(importId);
        if (status) {
          const index = imports.value.findIndex((i: any) => i.id === importId);
          if (index !== -1) {
            imports.value[index] = { ...imports.value[index], ...status };
          }
        }

        console.log(`Status refreshed for import ${importId}`);
      } catch (error) {
        console.error('Failed to refresh single import:', error);
      } finally {
        refreshingStatus.value = false;
        currentRefreshingId.value = null;
      }
    }

    const enhancedImports = computed(() => {
      return imports.value.map((imp: any) => ({
        ...imp,
        progress: imp.progress || {
          total: imp.total_items || 0,
          processed: imp.items_processed || 0,
          successful: imp.success_count || 0,
          failed: imp.failed_count || 0,
          percentage: imp.total_items
            ? ((imp.items_processed || 0) / imp.total_items) * 100
            : 0,
        },
      }));
    });

    async function handleFileUpload(fileList: File[]) {
      if (fileList.length === 0) {
        return;
      }

      const formData = new FormData();
      formData.append('file', fileList[0]);
      formData.append('type', uploadType.value);
      if (ignoreDuplicates.value) {
        formData.append('skip_duplicate_check', JSON.stringify(true));
      }

      uploading.value = true;
      await axios.post(
        `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
          },
        },
      );
      uploading.value = false;
      await loadPageData();
    }

    async function downloadSuccessful(reportId: string) {
      try {
        const response = await axios.request({
          url: `${
            import.meta.env.VITE_APP_API_BASE_URL
          }/worksites_import/${reportId}/get_successes`,
          method: 'GET',
          responseType: 'blob',
          headers: { Accept: 'text/csv' },
        });
        forceFileDownload(response);
      } catch {
        // console.error(e)
      }
    }

    async function downloadFailed(reportId: string) {
      try {
        const response = await axios.request({
          url: `${
            import.meta.env.VITE_APP_API_BASE_URL
          }/worksites_import/${reportId}/get_failures`,
          method: 'GET',
          responseType: 'blob',
          headers: { Accept: 'text/csv' },
        });
        forceFileDownload(response);
      } catch {
        // console.error(e)
      }
    }

    onMounted(async () => {
      await loadPageData();
    });

    return {
      uploading,
      ignoreDuplicates,
      uploadType,
      imports,
      stuckImports,
      enhancedImports,
      showErrorModal,
      selectedImportErrors,
      refreshingStatus,
      checkingStuck,
      currentRefreshingId,
      loadPageData,
      handleFileUpload,
      downloadSuccessful,
      downloadFailed,
      showErrors,
      getStatusColor,
      getProgressColor,
      refreshAllStatus,
      checkStuckImports,
      refreshSingleImport,
      recoverStuckImport,
      recoverAllStuckImports,
      columns: [
        {
          title: t('worksiteImport.id'),
          dataIndex: 'id',
          key: 'id',
          width: '0.8fr',
        },
        {
          title: t('worksiteImport.created_at'),
          dataIndex: 'created_at',
          key: 'created_at',
          width: '1fr',
        },
        {
          title: t('worksiteImport.status'),
          dataIndex: 'status',
          key: 'status',
          width: '0.8fr',
        },
        {
          title: t('worksiteImport.progress'),
          dataIndex: 'progress',
          key: 'progress',
          width: '1.5fr',
        },
        {
          title: t('worksiteImport.total_items'),
          dataIndex: 'total_items',
          key: 'total_items',
          width: '0.5fr',
        },
        {
          title: '',
          dataIndex: 'actions',
          key: 'actions',
          width: '3fr',
        },
      ],
    };
  },
});
</script>

<style scoped></style>
