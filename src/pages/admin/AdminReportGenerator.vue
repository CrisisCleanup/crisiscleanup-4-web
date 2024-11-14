<template>
  <div class="items-center flex justify-center w-full">
    <div class="w-180">
      <div class="report-generator p-6 bg-white mb-10">
        <h2 class="text-2xl font-semibold mb-4">
          {{ $t('adminDashboard.admin_reports') }}
        </h2>

        <div class="mb-6">
          <base-select
            v-model="selectedReport"
            :options="availableReports"
            class="w-full mb-4"
            placeholder="Select a report"
            item-key="value"
            label="label"
            @update:model-value="onReportChange"
          />
          <div class="text-sm text-crisiscleanup-dark-300">
            {{ selectedReportObject.description }}
          </div>
        </div>
        <div
          v-if="reportInputs && reportInputs.length > 0"
          class="report-inputs mb-6"
        >
          <div
            v-for="(input, index) in reportInputs"
            :key="index"
            class="input-group mb-4"
          >
            <label
              :for="input.name"
              class="block text-gray-700 font-medium mb-2"
              >{{ input.name }}</label
            >
            <base-select
              v-if="input.name === 'incident_id'"
              v-model="inputValues[input.name]"
              data-testid="testIncidentSelect"
              class="my-2"
              :options="incidents"
              searchable
              select-classes="bg-white w-full h-10"
              item-key="id"
              label="name"
              :placeholder="input.description"
            />
            <base-input
              v-else
              v-model="inputValues[input.name]"
              :placeholder="input.description"
              size="large"
            />
          </div>
        </div>

        <base-button
          :text="$t('adminDashboard.generate_csv')"
          :alt="$t('adminDashboard.generate_csv')"
          class="w-full py-2"
          variant="solid"
          @click="generateCsv"
        />
      </div>
      <AjaxTable
        :url="`${baseUrl}/admin_report_downloads`"
        :columns="columns"
        :table-id="tableId"
        class="border"
      >
        <template #link="{ item }">
          <a
            :href="item?.file?.csv_url"
            target="_blank"
            class="text-blue-500 underline"
            >{{ $t('actions.download') }}</a
          >
        </template>
      </AjaxTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import AjaxTable from '@/components/AjaxTable.vue';
import { makeTableColumns } from '@/utils/table';
import useEmitter from '@/hooks/useEmitter';
import Incident from '@/models/Incident';

const { t } = useI18n();
const $toasted = useToast();
const { emitter } = useEmitter();

// State variables
const availableReports = ref([]);
const selectedReport = ref(null);
const selectedReportObject = computed(() => {
  const selected = availableReports.value.find(
    (report) => report.value === selectedReport.value,
  );
  return selected || {};
});
const reportInputs = ref([]);
const inputValues = ref({});

const incidents = computed(() =>
  Incident.query().orderBy('start_at', 'desc').get(),
);
// Base URL from environment
const baseUrl = import.meta.env.VITE_APP_API_BASE_URL;
const tableId = 'admin_report_downloads';
const columns = makeTableColumns([
  ['report_name', '0.75fr', 'Report Name'],
  ['created_at', '0.5fr', 'Created At'],
  ['created_by', '0.5fr', 'Created By'],
  [
    'file_name',
    '1fr',
    'File',
    {
      transformer: (_: string, item) => item?.file?.filename_original,
    },
  ],
  [
    'link',
    '0.5fr',
    'link',
    {
      transformer: (_: string, item) => item?.file?.csv_url,
    },
  ],
]);
// Fetch available reports on component mount
onMounted(async () => {
  try {
    const response = await axios.get(
      `${baseUrl}/admin_csv_reports/available_reports`,
    );
    availableReports.value = response.data.map((report) => ({
      label: report.name,
      value: report.name,
      inputs: report.inputs || [],
      description: report.description,
    }));
  } catch (error) {
    console.error('Error fetching report:', error);
  }
});

// Handle report change
const onReportChange = (value) => {
  selectedReport.value = value;
  const selected = availableReports.value.find(
    (report) => report.value === selectedReport.value,
  );
  reportInputs.value = selected ? selected.inputs : [];
  inputValues.value = reportInputs.value.reduce((acc, input) => {
    acc[input.name] = '';
    return acc;
  }, {});
};

// Generate CSV
const generateCsv = async () => {
  try {
    const response = await axios.post(
      `${baseUrl}/admin_csv_reports/generate_csv`,
      {
        name: selectedReport.value,
        inputs: inputValues.value,
      },
    );
    if (response.status === 201) {
      $toasted.success(t('info.csv_generated'));
    } else if (response.status === 202) {
      $toasted.info(t('info.csv_generating'));
    }
    emitter.emit(`refreshTable-${tableId}`);
  } catch (error) {
    console.error('Error generating CSV:', error);
    $toasted.error(t('info.csv_error'));
  }
};
</script>

<style scoped></style>
