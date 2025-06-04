<template>
  <div class="p-4">
    <div class="bg-white rounded-lg shadow-lg">
      <!-- Header Section -->
      <div class="border-b border-gray-200 p-6">
        <div class="flex items-center mb-2">
          <ccu-icon
            type="heart"
            size="large"
            class="text-green-500 mr-3"
            :alt="t('~~Story Analysis')"
          />
          <h1 class="text-2xl font-bold text-gray-900">
            {{ t('~~Story Analysis') }}
          </h1>
        </div>
        <p class="text-gray-600">
          {{ t('~~Find uplifting survivor stories') }}
        </p>
      </div>

      <!-- Filters Section -->
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold mb-4 text-gray-900">
          {{ t('~~Filters') }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('~~Disaster') }}
            </label>
            <base-select
              v-model="selectedIncident"
              :options="incidents"
              :placeholder="t('~~Select a disaster')"
              item-key="id"
              label="name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('~~Story Rating Threshold') }}
            </label>
            <base-input
              v-model="sentimentThreshold"
              type="number"
              min="0"
              max="1"
              step="0.1"
              :placeholder="t('~~Enter rating threshold (0-1)')"
              class="w-full"
              size="medium"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('~~Photo Filter') }}
            </label>
            <base-select
              v-model="imagesOnly"
              :options="imageFilterOptions"
              :placeholder="t('~~Select photo filter')"
              item-key="value"
              label="label"
              select-classes="bg-white border border-gray-300 w-full h-10"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex space-x-3">
            <base-button
              :action="analyzeSentiment"
              :disabled="analyzing || !selectedIncident"
              variant="solid"
              size="medium"
              class="px-6 py-2"
              :text="analyzing ? t('~~Analyzing...') : t('~~Find Stories')"
              :alt="t('~~Find Stories')"
              :show-spinner="analyzing"
            />
            <base-button
              :action="downloadCsv"
              :disabled="!hasResults || selectedWorksites.length === 0"
              variant="outline"
              size="medium"
              class="px-6 py-2"
              :text="t('~~Download List')"
              :alt="t('~~Download List')"
            />
            <base-button
              :action="downloadZip"
              :disabled="!hasResults || selectedWorksites.length === 0"
              variant="solid"
              size="medium"
              class="px-6 py-2 bg-blue-600 hover:bg-blue-700"
              :text="t('~~Download Package')"
              :alt="t('~~Download Package')"
            />
          </div>
          <div v-if="analyzing" class="flex items-center text-blue-600">
            <ccu-icon type="spinner" class="animate-spin mr-2" size="small" />
            <span class="text-sm">{{ t('~~Processing...') }}</span>
          </div>
        </div>
      </div>

      <!-- Results Summary -->
      <div v-if="showSummary" class="p-6 bg-blue-50 border-b border-gray-200">
        <h4 class="text-lg font-semibold mb-3 text-gray-900 flex items-center">
          <ccu-icon type="chart-line" class="mr-2" size="medium" />
          {{ t('~~Analysis Results') }}
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">
              {{ resultsSummary.totalCases }}
            </div>
            <div class="text-sm text-gray-600">{{ t('~~Total Stories') }}</div>
          </div>
          <div class="bg-white p-4 rounded-lg">
            <div class="text-2xl font-bold text-green-600">
              {{ resultsSummary.casesWithImages }}
            </div>
            <div class="text-sm text-gray-600">{{ t('~~With Photos') }}</div>
          </div>
          <div class="bg-white p-4 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">
              {{ resultsSummary.avgSentiment }}
            </div>
            <div class="text-sm text-gray-600">{{ t('~~Average Rating') }}</div>
          </div>
          <div class="bg-white p-4 rounded-lg">
            <div class="text-2xl font-bold text-gray-600">
              {{ resultsSummary.processingTime }}s
            </div>
            <div class="text-sm text-gray-600">
              {{ t('~~Processing Time') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Results Table -->
      <div v-if="hasResults" class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-900">
            {{ t('~~Results') }}
          </h4>
          <div class="flex items-center space-x-4">
            <base-checkbox
              v-model="selectAll"
              @update:model-value="toggleSelectAll"
            >
              {{ t('~~Select All') }}
            </base-checkbox>
            <span class="text-sm text-gray-600">
              {{ selectedWorksites.length }} {{ t('~~Selected') }}
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t('~~Select') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t('~~Case Number') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t('~~Survivor Initials') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t('~~Location') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t('~~Story Rating') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t('~~Note') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t('~~Organizations') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t('~~Photos') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t('~~Actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="worksite in results"
                :key="worksite.worksite_id"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-4 whitespace-nowrap">
                  <base-checkbox
                    :model-value="
                      selectedWorksites.includes(worksite.worksite_id)
                    "
                    @update:model-value="
                      (value) =>
                        toggleWorksiteSelection(worksite.worksite_id, value)
                    "
                  />
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div
                    class="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800"
                    @click="viewWorksite(worksite.worksite_id)"
                  >
                    {{ worksite.case_number }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm font-semibold text-gray-900">
                    {{ worksite.survivor_initials }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ worksite.city }}, {{ worksite.state }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {{ worksite.sentiment_score.toFixed(3) }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div
                    class="text-sm text-gray-900 max-w-xs truncate"
                    :title="worksite.note"
                  >
                    {{ worksite.note }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-600">
                    <div
                      v-for="org in worksite.claimed_organizations"
                      :key="org"
                      class="mb-1"
                    >
                      {{ org }}
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <base-button
                    v-if="worksite.images && worksite.images.length > 0"
                    :action="() => showImages(worksite)"
                    variant="outline"
                    size="small"
                    class="px-3 py-1"
                    :text="`${worksite.images.length} ${t('~~Photos')}`"
                    :alt="t('~~View Photos')"
                  />
                  <span v-else class="text-sm text-gray-400">{{
                    t('~~No Photos')
                  }}</span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <base-button
                    :action="() => viewWorksite(worksite.worksite_id)"
                    variant="outline"
                    size="small"
                    class="px-3 py-1"
                    :text="t('~~View')"
                    :alt="t('~~View Case')"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="pagination.total > pagination.limit"
          class="mt-6 flex items-center justify-between"
        >
          <div class="text-sm text-gray-700">
            {{ t('~~Showing') }} {{ pagination.offset + 1 }} -
            {{
              Math.min(pagination.offset + pagination.limit, pagination.total)
            }}
            {{ t('~~of') }} {{ pagination.total }} {{ t('~~Results') }}
          </div>
          <div class="flex space-x-2">
            <base-button
              :action="() => changePage(pagination.offset - pagination.limit)"
              :disabled="pagination.offset === 0"
              variant="outline"
              size="small"
              class="px-3 py-1"
              :text="t('~~Previous')"
              :alt="t('~~Previous Page')"
            />
            <base-button
              :action="() => changePage(pagination.offset + pagination.limit)"
              :disabled="
                pagination.offset + pagination.limit >= pagination.total
              "
              variant="outline"
              size="small"
              class="px-3 py-1"
              :text="t('~~Next')"
              :alt="t('~~Next Page')"
            />
          </div>
        </div>
      </div>

      <!-- No Results Message -->
      <div
        v-else-if="!analyzing && !hasResults && hasSearched"
        class="p-6 text-center"
      >
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <ccu-icon
            type="exclamation-triangle"
            class="text-yellow-500 mb-4"
            size="large"
          />
          <h3 class="text-lg font-semibold text-yellow-800 mb-2">
            {{ t('~~No Results Found') }}
          </h3>
          <p class="text-yellow-700">
            {{ t('~~Try adjusting your filters or search criteria') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Historical Downloads Section -->
    <div class="mt-8 bg-white rounded-lg shadow-lg">
      <div class="border-b border-gray-200 p-6">
        <div class="flex items-center mb-2">
          <ccu-icon
            type="history"
            size="large"
            class="text-blue-500 mr-3"
            :alt="t('~~Download History')"
          />
          <h2 class="text-xl font-bold text-gray-900">
            {{ t('~~Download History') }}
          </h2>
        </div>
        <p class="text-gray-600">
          {{ t('~~View and download previously generated packages') }}
        </p>
      </div>

      <div class="p-6">
        <AjaxTable
          :url="batchTableUrl"
          :columns="batchColumns"
          :body-style="{ height: '400px' }"
          :query="batchQuery"
          class="shadow-sm"
        >
          <template #status="slotProps">
            <span :class="getStatusClass(slotProps.item)">
              {{ getStatusText(slotProps.item) }}
            </span>
          </template>
          <template #progress="slotProps">
            <div class="flex items-center gap-2">
              <div class="flex-1 min-w-[100px] bg-gray-200 rounded-full h-2.5">
                <div
                  class="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  :style="{
                    width: `${getProgressPercentage(slotProps.item)}%`,
                  }"
                ></div>
              </div>
              <span class="text-sm text-gray-600 whitespace-nowrap">
                {{ slotProps.item.items_processed }}/{{
                  slotProps.item.total_items
                }}
                ({{ getProgressPercentage(slotProps.item) }}%)
              </span>
            </div>
          </template>
          <template #created_at="slotProps">
            {{ formatDate(slotProps.item.created_at) }}
          </template>
          <template #actions="slotProps">
            <div class="flex space-x-2">
              <base-button
                v-if="slotProps.item.completed"
                :action="() => downloadBatch(slotProps.item.id)"
                variant="solid"
                size="small"
                class="px-3 py-1 bg-green-600 hover:bg-green-700"
                :text="t('~~Download')"
                :alt="t('~~Download Batch')"
              />
              <span
                v-else-if="isStuck(slotProps.item)"
                class="text-red-600 text-sm"
              >
                {{ t('~~Stuck') }}
              </span>
              <span v-else class="text-blue-600 text-sm">
                {{ $t('adminSentimentAnalysis.processing') }}
              </span>
            </div>
          </template>
        </AjaxTable>
      </div>
    </div>
  </div>

  <!-- Image Modal -->
  <modal
    v-if="showImageModal"
    :title="$t('adminSentimentAnalysis.case_images')"
    modal-classes="max-w-4xl bg-white shadow-lg"
    closeable
    @close="closeImageModal"
  >
    <div class="p-6">
      <div v-if="selectedWorksiteForImages" class="mb-4">
        <h4 class="text-lg font-semibold">
          {{ $t('adminSentimentAnalysis.case') }} #{{
            selectedWorksiteForImages.case_number
          }}
        </h4>
        <p class="text-gray-600">
          {{ selectedWorksiteForImages.survivor_initials }}
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div
          v-for="(image, index) in currentImages"
          :key="image.id"
          class="relative group cursor-pointer"
          @click="selectImage(index)"
        >
          <img
            :src="image.thumbnail_url || image.general_file_url"
            :alt="image.filename"
            class="w-full h-32 object-cover rounded-lg border-2"
            :class="
              selectedImageIndex === index
                ? 'border-blue-500'
                : 'border-gray-300'
            "
          />
          <div
            class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center"
          >
            <ccu-icon
              type="eye"
              class="text-white opacity-0 group-hover:opacity-100"
              size="large"
            />
          </div>
        </div>
      </div>

      <div v-if="selectedImage" class="text-center">
        <img
          :src="selectedImage.general_file_url"
          :alt="selectedImage.filename"
          class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
        />
        <div class="mt-4 flex justify-center space-x-4">
          <base-button
            :action="applyMonetFilter"
            :disabled="applyingFilter"
            variant="solid"
            size="medium"
            class="px-6 py-2 bg-purple-600 hover:bg-purple-700"
            :text="
              applyingFilter
                ? t('~~Applying Filter...')
                : t('~~Apply Monet Filter')
            "
            :alt="t('~~Apply Monet Filter')"
            :show-spinner="applyingFilter"
            ccu-icon="paint-brush"
          />
        </div>
      </div>
    </div>
  </modal>

  <!-- File Selection Modal -->
  <modal
    v-if="showFileSelectionModal"
    :title="$t('adminSentimentAnalysis.select_files_to_filter')"
    modal-classes="max-w-4xl bg-white shadow-lg"
    closeable
    @close="closeFileSelectionModal"
  >
    <div class="p-6">
      <div
        v-for="worksite in fileSelectionWorksites"
        :key="worksite.worksite_id"
        class="mb-6"
      >
        <h4 class="text-lg font-semibold mb-3">
          {{ $t('adminSentimentAnalysis.case') }} #{{ worksite.case_number }}
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="image in worksite.images"
            :key="image.id"
            class="relative"
          >
            <base-checkbox
              :model-value="isFileSelected(worksite.worksite_id, image.id)"
              class="absolute top-2 left-2 z-10"
              @update:model-value="
                (value) =>
                  toggleFileSelection(worksite.worksite_id, image.id, value)
              "
            />
            <img
              :src="image.thumbnail_url || image.general_file_url"
              :alt="image.filename"
              class="w-full h-24 object-cover rounded-lg border"
            />
            <p class="text-xs text-gray-600 mt-1 truncate">
              {{ image.filename }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3 p-6 border-t">
        <base-button
          :action="closeFileSelectionModal"
          variant="outline"
          size="medium"
          class="px-6 py-2"
          :text="t('~~Cancel')"
          :alt="t('~~Cancel')"
        />
        <base-button
          :action="confirmFileSelection"
          variant="solid"
          size="medium"
          class="px-6 py-2"
          :text="t('~~Confirm Selection')"
          :alt="t('~~Confirm Selection')"
        />
      </div>
    </template>
  </modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import axios from 'axios';
import moment from 'moment';
import { makeTableColumns } from '@/utils/table';
import { getErrorMessage } from '@/utils/errors';
import AjaxTable from '@/components/AjaxTable.vue';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import Modal from '@/components/Modal.vue';

const { t } = useI18n();
const $toasted = useToast();

// Reactive state
const selectedIncident = ref(null);
const sentimentThreshold = ref(0.1);
const imagesOnly = ref('true');
const analyzing = ref(false);
const hasSearched = ref(false);
const showSummary = ref(false);
const results = ref([]);
const selectedWorksites = ref([]);
const selectAll = ref(false);
const showImageModal = ref(false);
const selectedWorksiteForImages = ref(null);
const currentImages = ref([]);
const selectedImageIndex = ref(0);
const applyingFilter = ref(false);
const showFileSelectionModal = ref(false);
const fileSelectionWorksites = ref([]);
const selectedFiles = ref({});

// Data
const incidents = ref([]);
const resultsSummary = reactive({
  totalCases: 0,
  casesWithImages: 0,
  avgSentiment: '0.000',
  processingTime: 0,
});

const pagination = reactive({
  limit: 10,
  offset: 0,
  total: 0,
});

// Computed properties
const hasResults = computed(() => results.value.length > 0);

const selectedImage = computed(() => {
  if (currentImages.value.length > 0 && selectedImageIndex.value >= 0) {
    return currentImages.value[selectedImageIndex.value];
  }
  return null;
});

const imageFilterOptions = computed(() => [
  { value: 'true', label: t('~~Only with Photos') },
  { value: 'false', label: t('~~All Cases') },
]);

// Table setup for batch history
const batchTableUrl = computed(
  () => `${import.meta.env.VITE_APP_API_BASE_URL}/batch_process`,
);
const batchQuery = ref({ batch_type: 'worksite_positive_sentiment_zip' });

const batchColumns = makeTableColumns([
  ['id', '1fr', t('~~Batch ID')],
  ['created_at', '1fr', t('~~Created At')],
  ['status', '1fr', t('~~Status')],
  ['progress', '1fr', t('~~Progress')],
  ['total_items', '1fr', t('~~Total Items')],
  ['actions', '1fr', t('~~Actions')],
]);

// Methods
const loadIncidents = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/incidents_list`,
      {
        params: {
          fields: 'id,name,short_name,geofence,locations',
          limit: 200,
          sort: '-start_at',
        },
      },
    );
    incidents.value = response.data.results || response.data;
  } catch (error) {
    console.error('Error loading incidents:', error);
    await $toasted.error(getErrorMessage(error));
  }
};

const analyzeSentiment = async () => {
  if (!selectedIncident.value) {
    await $toasted.error(t('adminSentimentAnalysis.select_incident_required'));
    return;
  }

  analyzing.value = true;
  hasSearched.value = true;
  showSummary.value = false;
  const startTime = performance.now();

  try {
    const params = {
      incident_id: selectedIncident.value,
      limit: pagination.limit,
      offset: pagination.offset,
    };

    const response = await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/sentiment_analysis/analyze_positive_sentiment`,
      { params },
    );

    const endTime = performance.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);

    if (response.data.results) {
      results.value = response.data.results.worksites || [];
      pagination.total = response.data.count || 0;

      // Update summary
      resultsSummary.totalCases = response.data.results.total_count || 0;
      resultsSummary.casesWithImages = results.value.filter(
        (w: { has_images: boolean }) => w.has_images,
      ).length;
      resultsSummary.avgSentiment =
        results.value.length > 0
          ? (
              results.value.reduce(
                (acc: number, w: { sentiment_score: number }) =>
                  acc + w.sentiment_score,
                0,
              ) / results.value.length
            ).toFixed(3)
          : '0.000';
      resultsSummary.processingTime = processingTime;

      showSummary.value = true;

      // Auto-select all results
      selectedWorksites.value = results.value.map(
        (w: { worksite_id: number }) => w.worksite_id,
      );
      selectAll.value = true;

      await $toasted.success(t('adminSentimentAnalysis.analysis_complete'));
    } else {
      await $toasted.error(t('adminSentimentAnalysis.analysis_failed'));
    }
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    await $toasted.error(getErrorMessage(error));
  } finally {
    analyzing.value = false;
  }
};

const toggleSelectAll = (value: boolean) => {
  selectedWorksites.value = value
    ? results.value.map((w: { worksite_id: number }) => w.worksite_id)
    : [];
};

const toggleWorksiteSelection = (worksiteId: number, selected: boolean) => {
  if (selected) {
    if (!selectedWorksites.value.includes(worksiteId)) {
      selectedWorksites.value.push(worksiteId);
    }
  } else {
    selectedWorksites.value = selectedWorksites.value.filter(
      (id: number) => id !== worksiteId,
    );
  }

  // Update select all checkbox
  selectAll.value = selectedWorksites.value.length === results.value.length;
};

const changePage = async (newOffset: number) => {
  pagination.offset = Math.max(0, newOffset);
  await analyzeSentiment();
};

const downloadCsv = async () => {
  if (selectedWorksites.value.length === 0) {
    await $toasted.error(t('adminSentimentAnalysis.select_worksites_required'));
    return;
  }

  // For CSV, we'll use the existing generate_zip endpoint but request only CSV
  await generateDownload(selectedWorksites.value, []);
};

const downloadZip = async () => {
  if (selectedWorksites.value.length === 0) {
    await $toasted.error(t('adminSentimentAnalysis.select_worksites_required'));
    return;
  }

  // Show file selection modal for ZIP downloads
  const worksitesWithImages = results.value.filter(
    (w: { worksite_id: number; images: string[] }) =>
      selectedWorksites.value.includes(w.worksite_id) &&
      w.images &&
      w.images.length > 0,
  );

  if (worksitesWithImages.length === 0) {
    await generateDownload(selectedWorksites.value, []);
  } else {
    fileSelectionWorksites.value = worksitesWithImages;
    selectedFiles.value = {};
    showFileSelectionModal.value = true;
  }
};

const generateDownload = async (
  worksiteIds: number[],
  filesToFilter: { worksite_id: number; file_ids: string[] }[] = [],
) => {
  try {
    const payload = {
      worksite_ids: worksiteIds,
      files_to_filter: filesToFilter,
    };

    const response = await axios.post(
      `${import.meta.env.VITE_APP_API_BASE_URL}/sentiment_analysis/generate_zip`,
      payload,
    );

    if (response.data.batch_id) {
      await $toasted.success(t('adminSentimentAnalysis.download_started'));
      pollBatchStatus(response.data.batch_id);
    }
  } catch (error) {
    console.error('Error generating download:', error);
    await $toasted.error(getErrorMessage(error));
  }
};

const pollBatchStatus = async (batchId: string) => {
  const maxAttempts = 60; // 5 minutes max
  let attempts = 0;

  const checkStatus = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/sentiment_analysis/check_zip_status`,
        { params: { batch_id: batchId } },
      );

      if (response.data.status === 'completed') {
        window.location.href = response.data.download_url;
        await $toasted.success(t('adminSentimentAnalysis.download_ready'));
        return;
      } else if (response.data.status === 'failed') {
        await $toasted.error(
          response.data.error || t('adminSentimentAnalysis.download_failed'),
        );
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkStatus, 5000); // Check every 5 seconds
      } else {
        await $toasted.error(t('adminSentimentAnalysis.download_timeout'));
      }
    } catch (error) {
      console.error('Error checking batch status:', error);
      await $toasted.error(getErrorMessage(error));
    }
  };

  checkStatus();
};

const viewWorksite = (worksiteId: number) => {
  if (selectedIncident.value) {
    const url = `/incident/${selectedIncident.value}/work/${worksiteId}`;
    window.open(url, '_blank');
  }
};

const showImages = (worksite: { images: string[] }) => {
  selectedWorksiteForImages.value = worksite;
  currentImages.value = worksite.images || [];
  selectedImageIndex.value = 0;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  selectedWorksiteForImages.value = null;
  currentImages.value = [];
  selectedImageIndex.value = 0;
};

const selectImage = (index: number) => {
  selectedImageIndex.value = index;
};

const applyMonetFilter = async () => {
  if (!selectedImage.value) return;

  applyingFilter.value = true;
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_APP_API_BASE_URL}/sentiment_analysis/apply_monet_filter`,
      { image_url: selectedImage.value.general_file_url },
    );

    if (response.data.filtered_image_url) {
      // Update the current image with the filtered version
      currentImages.value[selectedImageIndex.value] = {
        ...selectedImage.value,
        general_file_url: response.data.filtered_image_url,
        original_url: selectedImage.value.general_file_url,
      };
      await $toasted.success(t('adminSentimentAnalysis.filter_applied'));
    }
  } catch (error) {
    console.error('Error applying Monet filter:', error);
    await $toasted.error(getErrorMessage(error));
  } finally {
    applyingFilter.value = false;
  }
};

const closeFileSelectionModal = () => {
  showFileSelectionModal.value = false;
  fileSelectionWorksites.value = [];
  selectedFiles.value = {};
};

const isFileSelected = (worksiteId: number, fileId: string) => {
  return selectedFiles.value[worksiteId]?.includes(fileId) || false;
};

const toggleFileSelection = (
  worksiteId: number,
  fileId: string,
  selected: boolean,
) => {
  if (!selectedFiles.value[worksiteId]) {
    selectedFiles.value[worksiteId] = [];
  }

  if (selected) {
    if (!selectedFiles.value[worksiteId].includes(fileId)) {
      selectedFiles.value[worksiteId].push(fileId);
    }
  } else {
    selectedFiles.value[worksiteId] = selectedFiles.value[worksiteId].filter(
      (id: string) => id !== fileId,
    );
  }
};

const confirmFileSelection = async () => {
  const filesToFilter = Object.entries(selectedFiles.value)
    .filter(([_, fileIds]) => fileIds.length > 0)
    .map(([worksiteId, fileIds]) => ({
      worksite_id: Number.parseInt(worksiteId),
      file_ids: fileIds,
    }));

  closeFileSelectionModal();
  await generateDownload(selectedWorksites.value, filesToFilter);
};

const downloadBatch = (batchId: string) => {
  window.location.href = `${import.meta.env.VITE_APP_API_BASE_URL}/sentiment_analysis/${batchId}/download_zip`;
};

// Utility functions for batch table
const formatDate = (date: string) => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

const getStatusClass = (item: {
  completed: boolean;
  metadata: { status: string; error_message: string };
  created_at: string;
}) => {
  if (item.completed)
    return 'text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-medium';
  if (isStuck(item))
    return 'text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-medium';
  if (item.metadata?.status === 'pending')
    return 'text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium';
  if (item.metadata?.error_message)
    return 'text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-medium';
  return 'text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium';
};

const getStatusText = (item: {
  completed: boolean;
  metadata: { status: string; error_message: string };
  created_at: string;
}) => {
  if (item.completed) return t('~~Completed');
  if (isStuck(item)) return t('~~Stuck');
  if (item.metadata?.status === 'pending') return t('~~Pending');
  if (item.metadata?.error_message) return t('~~Error');
  return t('~~Unknown');
};

const getProgressPercentage = (item: {
  total_items: number;
  items_processed: number;
}) => {
  if (item.total_items === 0) return 0;
  return Math.round((item.items_processed / item.total_items) * 100);
};

const isStuck = (item: {
  completed: boolean;
  metadata: { status: string; error_message: string };
  created_at: string;
}) => {
  if (
    !item.metadata?.status ||
    item.metadata.status !== 'pending' ||
    item.completed
  ) {
    return false;
  }

  const created = moment(item.created_at);
  const now = moment();
  const minutesDiff = now.diff(created, 'minutes');

  return minutesDiff >= 15;
};

// Lifecycle
onMounted(async () => {
  await loadIncidents();
});
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
