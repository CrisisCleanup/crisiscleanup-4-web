<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">{{ $t('~~Magazine Management') }}</h1>

    <div class="mb-6">
      <h2 class="text-xl font-bold mb-4">
        {{ magazine.id ? $t('~~Edit Magazine') : $t('~~Create Magazine') }}
      </h2>

      <div class="grid grid-cols-1 gap-6">
        <!-- Basic Magazine Information Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-4">
            {{ $t('~~Basic Information') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('~~Magazine Title') }}
                </label>
                <base-input
                  v-model="magazine.title"
                  :placeholder="$t('~~Enter magazine title')"
                  required
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('~~Subtitle') }}
                </label>
                <base-input
                  v-model="magazine.subtitle"
                  :placeholder="$t('~~Enter magazine subtitle')"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('~~Incident ID') }}
                </label>
                <base-input
                  v-model="magazine.incidentId"
                  :placeholder="$t('~~Enter incident ID')"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('~~Edition') }}
                </label>
                <base-input
                  v-model="magazine.edition"
                  :placeholder="$t('~~Enter edition')"
                />
              </div>
            </div>

            <div>
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium mb-2">
                    {{ $t('~~Volume') }}
                  </label>
                  <base-input
                    v-model="magazine.volume"
                    type="number"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">
                    {{ $t('~~Issue') }}
                  </label>
                  <base-input
                    v-model="magazine.issue"
                    type="number"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('~~ISSN') }}
                </label>
                <base-input
                  v-model="magazine.issn"
                  :placeholder="$t('~~Enter ISSN')"
                />
              </div>

              <label class="block text-sm font-medium mb-2">
                {{ $t('~~Publication Date') }}
              </label>
              <datepicker
                v-model="magazine.publish_date"
                data-testid="testPublishDatePicker"
                auto-apply
                format="yyyy-MM-dd"
                class="mb-4"
              />
            </div>
          </div>
        </div>

        <!-- Timeframe Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">{{ $t('~~Timeframe') }}</h3>
            <button
              class="text-gray-500 hover:text-gray-700"
              @click="expandedSections.timeframe = !expandedSections.timeframe"
            >
              <i
                :class="[
                  'fa',
                  expandedSections.timeframe
                    ? 'fa-chevron-down'
                    : 'fa-chevron-right',
                ]"
              ></i>
            </button>
          </div>
          <transition name="slide">
            <div v-show="expandedSections.timeframe">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">
                    {{ $t('~~Timeframe Start') }}
                  </label>
                  <datepicker
                    v-model="magazine.timeframeStart"
                    auto-apply
                    format="yyyy-MM-dd"
                    time-picker
                    class="mb-4"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">
                    {{ $t('~~Timeframe End') }}
                  </label>
                  <datepicker
                    v-model="magazine.timeframeEnd"
                    auto-apply
                    format="yyyy-MM-dd"
                    time-picker
                    class="mb-4"
                  />
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Publisher Information Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">
              {{ $t('~~Publisher Information') }}
            </h3>
            <button
              class="text-gray-500 hover:text-gray-700"
              @click="expandedSections.publisher = !expandedSections.publisher"
            >
              <i
                :class="[
                  'fa',
                  expandedSections.publisher
                    ? 'fa-chevron-down'
                    : 'fa-chevron-right',
                ]"
              ></i>
            </button>
          </div>
          <transition name="slide">
            <div v-show="expandedSections.publisher">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Publisher') }}
                    </label>
                    <base-input
                      v-model="magazine.publisher"
                      :placeholder="$t('~~Enter publisher name')"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Publisher City') }}
                    </label>
                    <base-input
                      v-model="magazine.publisherCity"
                      :placeholder="$t('~~Enter publisher city')"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Publisher State') }}
                    </label>
                    <base-input
                      v-model="magazine.publisherState"
                      :placeholder="$t('~~Enter publisher state')"
                    />
                  </div>
                </div>

                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Publisher Email') }}
                    </label>
                    <base-input
                      v-model="magazine.publisherEmail"
                      :placeholder="$t('~~Enter publisher email')"
                      type="email"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Publisher Phone') }}
                    </label>
                    <base-input
                      v-model="magazine.publisherPhone"
                      :placeholder="$t('~~Enter publisher phone')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Subscription Information Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">
              {{ $t('~~Subscription Information') }}
            </h3>
            <button
              class="text-gray-500 hover:text-gray-700"
              @click="
                expandedSections.subscription = !expandedSections.subscription
              "
            >
              <i
                :class="[
                  'fa',
                  expandedSections.subscription
                    ? 'fa-chevron-down'
                    : 'fa-chevron-right',
                ]"
              ></i>
            </button>
          </div>
          <transition name="slide">
            <div v-show="expandedSections.subscription">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Subscription URL') }}
                    </label>
                    <base-input
                      v-model="magazine.subscriptionUrl"
                      :placeholder="$t('~~Enter subscription URL')"
                      type="url"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Subscription Address') }}
                    </label>
                    <base-input
                      v-model="magazine.subscriptionAddress1"
                      :placeholder="$t('~~Enter subscription address')"
                    />
                  </div>
                </div>

                <div>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-2">
                      <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">
                          {{ $t('~~City') }}
                        </label>
                        <base-input
                          v-model="magazine.subscriptionCity"
                          :placeholder="$t('~~Enter city')"
                        />
                      </div>
                    </div>
                    <div>
                      <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">
                          {{ $t('~~State') }}
                        </label>
                        <base-input
                          v-model="magazine.subscriptionState"
                          :placeholder="$t('~~State')"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Postal Code') }}
                    </label>
                    <base-input
                      v-model="magazine.subscriptionPostalCode"
                      :placeholder="$t('~~Enter postal code')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Publication Details Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">
              {{ $t('~~Publication Details') }}
            </h3>
            <button
              class="text-gray-500 hover:text-gray-700"
              @click="
                expandedSections.publication = !expandedSections.publication
              "
            >
              <i
                :class="[
                  'fa',
                  expandedSections.publication
                    ? 'fa-chevron-down'
                    : 'fa-chevron-right',
                ]"
              ></i>
            </button>
          </div>
          <transition name="slide">
            <div v-show="expandedSections.publication">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Availability') }}
                    </label>
                    <base-select
                      v-model="magazine.availability"
                      :options="availabilityOptions"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Frequency') }}
                    </label>
                    <base-input
                      v-model="magazine.frequency"
                      :placeholder="$t('~~Enter publication frequency')"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Type of Publication') }}
                    </label>
                    <base-input
                      v-model="magazine.pubType"
                      :placeholder="$t('~~Enter publication type')"
                    />
                  </div>
                </div>

                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Language') }}
                    </label>
                    <base-input
                      v-model="magazine.language"
                      :placeholder="$t('~~Enter language')"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Format') }}
                    </label>
                    <div class="space-y-2">
                      <div>
                        <input
                          id="format-print"
                          v-model="formatOptions.print"
                          type="checkbox"
                          class="mr-2"
                        />
                        <label for="format-print">{{ $t('~~Print') }}</label>
                      </div>
                      <div>
                        <input
                          id="format-online"
                          v-model="formatOptions.online"
                          type="checkbox"
                          class="mr-2"
                        />
                        <label for="format-online">{{ $t('~~Online') }}</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Magazine Issues Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-4">
            {{ $t('~~Magazine Editions') }}
          </h3>

          <div
            v-if="magazine.issues.length === 0"
            class="text-gray-500 mb-4 p-4 bg-gray-100 rounded"
          >
            {{ $t('~~No editions added yet') }}
          </div>

          <!-- Issue Cards -->
          <div v-else class="space-y-4 mb-4">
            <div
              v-for="(issue, index) in magazine.issues"
              :key="index"
              class="border rounded p-4 bg-white"
              :class="{
                'border-blue-500 bg-blue-50': selectedIssueIndex === index,
              }"
            >
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-medium">
                  {{ $t('~~Edition') }} #{{ index + 1 }}
                </h4>
                <button
                  type="button"
                  class="text-red-500 hover:text-red-700"
                  @click="removeIssue(index)"
                >
                  <i class="fa fa-trash"></i>
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                <!-- Issue Name -->
                <div class="md:col-span-2">
                  <base-input
                    v-model="issue.name"
                    :label="$t('~~Version Name')"
                    :placeholder="$t('~~Enter version name')"
                  />
                </div>

                <!-- PDF Upload -->
                <div class="md:col-span-3">
                  <label class="block text-sm font-medium mb-2">{{
                    $t('~~PDF File')
                  }}</label>

                  <div v-if="issue.file_info" class="flex items-center mb-2">
                    <div class="flex-grow mr-2 text-sm">
                      <div class="flex items-center">
                        <i class="fa fa-file-pdf text-red-500 mr-2"></i>
                        <span class="truncate">{{
                          issue.file_info.filename
                        }}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="text-red-500 hover:text-red-700"
                      @click="removeFile(index)"
                    >
                      <i class="fa fa-times"></i>
                    </button>
                  </div>

                  <DragDrop
                    v-else
                    :multiple="false"
                    container-class="border-2 border-dashed border-gray-300 p-3 text-center rounded"
                    :disabled="saving"
                    @files="(files) => handleFileSelection(files, index)"
                  >
                    <div class="text-gray-500 text-sm">
                      <i class="fa fa-cloud-upload text-xl mb-1"></i>
                      <p>{{ $t('~~Drop PDF file here or click to upload') }}</p>
                    </div>
                  </DragDrop>
                </div>
              </div>
            </div>
          </div>

          <base-button
            variant="outline"
            class="mb-4 p-2"
            :action="addIssue"
            size="small"
          >
            <i class="fa fa-plus mr-2"></i>
            {{ $t('~~Add Edition') }}
          </base-button>
        </div>
      </div>

      <div class="flex justify-end mt-6 border-t pt-4">
        <base-button
          variant="outline"
          class="mr-2"
          :action="resetForm"
          size="large"
        >
          {{ $t('~~Cancel') }}
        </base-button>
        <base-button
          variant="solid"
          :action="saveMagazine"
          :show-spinner="saving"
          :disabled="saving || !isFormValid"
          size="large"
        >
          {{ magazine.id ? $t('~~Update') : $t('~~Save') }}
          <span v-if="uploadProgress > 0 && uploadProgress < 100" class="ml-2">
            ({{ uploadProgress }}%)
          </span>
        </base-button>
      </div>
    </div>
    <div v-if="existingMagazines" class="mt-6">
      <h2 class="text-xl font-bold mb-4">
        {{ $t('~~Existing Magazines') }}
      </h2>
      <div class="space-y-6">
        <div
          v-for="magazine in groupedMagazines"
          :key="magazine.id"
          class="bg-white rounded-lg shadow p-6"
        >
          <div class="mb-4">
            <h3 class="text-xl font-bold truncate">{{ magazine.title }}</h3>
            <div class="text-sm text-gray-600">
              {{ $t('~~Volume') }} {{ magazine.volume }}, {{ $t('~~Issue') }}
              {{ magazine.issue }}
            </div>
            <div class="text-sm text-gray-600">
              {{ formatDate(magazine.publish_date) }}
            </div>
          </div>

          <div>
            <h4 class="font-bold mb-3">
              {{ $t('~~Available Editions') }}
            </h4>

            <div class="flex flex-wrap gap-2">
              <div
                v-for="edition in magazine.editions"
                :key="edition.id"
                class="border rounded p-4"
              >
                <div class="mb-2 font-medium">{{ edition.name }}</div>
                <div class="mb-3">
                  <PdfViewer
                    :pdf="edition.file"
                    :page="1"
                    :show-download-button="false"
                  />
                </div>
                <a
                  :href="edition.file.general_file_url"
                  target="_blank"
                  class="bg-primary-light px-3 py-2 text-sm transition w-full flex items-center justify-center"
                  download
                >
                  {{ $t('~~magazine.download') }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="groupedMagazines.length === 0" class="text-gray-500">
        {{ $t('~~No existing magazines found') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import axios from 'axios';
import moment from 'moment';
import DragDrop from '@/components/DragDrop.vue';
import { getErrorMessage } from '@/utils/errors';
import PdfViewer from '@/components/PdfViewer.vue';

interface MagazineIssue {
  name: string;
  file: string | null;
  file_info: any | null;
  file_data: File | null; // Store actual file here for batch upload
}

interface MagazineData {
  id: string | null;
  title: string;
  subtitle: string;
  incidentId: string;
  edition: string;
  volume: number;
  issue: number;
  issn: string;
  publish_date: string;
  timeframeStart: string;
  timeframeEnd: string;
  publisher: string;
  publisherCity: string;
  publisherState: string;
  publisherEmail: string;
  publisherPhone: string;
  subscriptionUrl: string;
  subscriptionAddress1: string;
  subscriptionCity: string;
  subscriptionState: string;
  subscriptionPostalCode: string;
  availability: string;
  frequency: string;
  pubType: string;
  language: string;
  is_active: boolean;
  issues: MagazineIssue[];
}

const { t } = useI18n();
const $toasted = useToast();

const saving = ref(false);
const selectedIssueIndex = ref<number | null>(null);
const uploadProgress = ref(0);

const existingMagazines = ref<File>(null);

const formatOptions = ref({
  print: false,
  online: false,
});

const availabilityOptions = [
  'Open Access',
  'Subscription Only',
  'Limited Access',
];

const magazine = ref<MagazineData>({
  id: null,
  title: 'Crisis Cleanup',
  subtitle: 'Hurricanes Helene & Milton',
  incidentId: '171',
  edition: 'Florida',
  volume: 1,
  issue: 1,
  issn: '000000000',
  publish_date: '2025-05-12',
  timeframeStart: '2024-09-24T00:00:00Z',
  timeframeEnd: '2024-12-08T00:00:00Z',
  publisher: 'Crisis Cleanup, LLC',
  publisherCity: 'Longmont',
  publisherState: 'Colorado',
  publisherEmail: 'magazine@crisiscleanup.org',
  publisherPhone: '(848) 480-0660',
  subscriptionUrl: 'https://www.crisiscleanup.org/magazine',
  subscriptionAddress1: '5905 Blue Mountain Cir.',
  subscriptionCity: 'Longmont',
  subscriptionState: 'CO',
  subscriptionPostalCode: '80503',
  availability: 'Open Access',
  frequency: 'Twice a month',
  pubType: 'Magazine',
  language: 'English',
  is_active: true,
  issues: [],
});

// Initialize format options based on default values
onMounted(() => {
  formatOptions.value.print = true;
  formatOptions.value.online = true;
});

const isFormValid = computed(() => {
  if (!magazine.value.title || !magazine.value.publish_date) {
    return false;
  }

  if (magazine.value.issues.length === 0) {
    return false;
  }

  // Check if at least one format is selected
  if (!formatOptions.value.print && !formatOptions.value.online) {
    return false;
  }

  return magazine.value.issues.every(
    (issue: MagazineIssue) => issue.name && (issue.file || issue.file_data),
  );
});

function addIssue() {
  magazine.value.issues.push({
    name: '',
    file: null,
    file_info: null,
    file_data: null,
  });
  selectedIssueIndex.value = magazine.value.issues.length - 1;
}

function removeIssue(index: number) {
  if (confirm(t('~~Are you sure you want to remove this issue?'))) {
    magazine.value.issues.splice(index, 1);
    if (selectedIssueIndex.value === index) {
      selectedIssueIndex.value = magazine.value.issues.length > 0 ? 0 : null;
    } else if (
      selectedIssueIndex.value !== null &&
      selectedIssueIndex.value > index
    ) {
      selectedIssueIndex.value--;
    }
  }
}

function removeFile(index: number) {
  magazine.value.issues[index].file = null;
  magazine.value.issues[index].file_info = null;
  magazine.value.issues[index].file_data = null;
}

function handleFileSelection(fileList: File[], issueIndex: number) {
  if (fileList.length === 0) {
    return;
  }

  const file = fileList[0];
  if (file.type !== 'application/pdf') {
    $toasted.error(t('~~Only PDF files are allowed'));
    return;
  }

  // Store file in memory for batch upload later
  magazine.value.issues[issueIndex].file_data = file;
  magazine.value.issues[issueIndex].file_info = {
    filename: file.name,
    size: file.size,
    type: file.type,
  };
}

async function uploadAllFiles(): Promise<boolean> {
  const issuesToUpload = magazine.value.issues.filter(
    (issue: MagazineIssue) => issue.file_data && !issue.file,
  );

  if (issuesToUpload.length === 0) {
    return true; // No files to upload
  }

  uploadProgress.value = 0;
  const totalFiles = issuesToUpload.length;
  let uploadedCount = 0;

  try {
    // Upload all files in parallel
    const uploadPromises = magazine.value.issues.map(
      async (issue: MagazineIssue, index: number) => {
        if (!issue.file_data || issue.file) {
          return; // Skip if no file data or already has a file ID
        }

        // Create format array from checkboxes
        const formats = [];
        if (formatOptions.value.print) formats.push('Print');
        if (formatOptions.value.online) formats.push('Online');

        const formData = new FormData();
        formData.append('upload', issue.file_data);
        formData.append('type_t', 'fileTypes.magazine_issue');
        formData.append('filename', issue.file_info?.filename || '');
        formData.append('content_type', issue.file_info?.type || '');
        formData.append(
          'attr',
          JSON.stringify({
            // Basic information
            title: magazine.value.title,
            subtitle: magazine.value.subtitle,
            incidentId: magazine.value.incidentId,
            edition: magazine.value.edition,
            volume: magazine.value.volume,
            issue: magazine.value.issue,
            issn: magazine.value.issn,
            publish_date: magazine.value.publish_date,
            name: issue.name,

            // Timeframe
            timeframeStart: magazine.value.timeframeStart,
            timeframeEnd: magazine.value.timeframeEnd,

            // Publisher information
            publisher: magazine.value.publisher,
            publisherCity: magazine.value.publisherCity,
            publisherState: magazine.value.publisherState,
            publisherEmail: magazine.value.publisherEmail,
            publisherPhone: magazine.value.publisherPhone,

            // Subscription information
            subscriptionUrl: magazine.value.subscriptionUrl,
            subscriptionAddress1: magazine.value.subscriptionAddress1,
            subscriptionCity: magazine.value.subscriptionCity,
            subscriptionState: magazine.value.subscriptionState,
            subscriptionPostalCode: magazine.value.subscriptionPostalCode,

            // Publication details
            availability: magazine.value.availability,
            frequency: magazine.value.frequency,
            pubType: magazine.value.pubType,
            language: magazine.value.language,
            format: formats,
          }),
        );
        formData.append('title', magazine.value.title);

        const result = await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/files`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Accept: 'application/json',
            },
          },
        );

        // Update file info with server response
        magazine.value.issues[index].file = result.data.id;
        magazine.value.issues[index].file_info = result.data;

        // Update progress
        uploadedCount++;
        uploadProgress.value = Math.round((uploadedCount / totalFiles) * 100);
      },
    );

    await Promise.all(uploadPromises);
    return true;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
    return false;
  } finally {
    uploadProgress.value = 0;
    await getExistingMagazineFiles();
  }
}

async function getExistingMagazineFiles() {
  try {
    const { data } = await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/files`,
      {
        params: {
          type_t: 'fileTypes.magazine_issue',
        },
      },
    );
    existingMagazines.value = data.results;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

async function saveMagazine() {
  if (!isFormValid.value) {
    $toasted.error(t('~~Please fill in all required fields'));
    return;
  }

  saving.value = true;

  try {
    // Step 1: Upload all files first
    const uploadSuccess = await uploadAllFiles();
    if (!uploadSuccess) {
      throw new Error(t('~~File upload failed'));
    }

    $toasted.success(t('~~Magazine saved successfully'));
    resetForm();
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    saving.value = false;
    uploadProgress.value = 0;
  }
}

function resetForm() {
  magazine.value = {
    id: null,
    title: '',
    subtitle: '',
    incidentId: '',
    edition: '',
    volume: 1,
    issue: 1,
    issn: '',
    publish_date: moment().format('YYYY-MM-DD'),
    timeframeStart: '',
    timeframeEnd: '',
    publisher: '',
    publisherCity: '',
    publisherState: '',
    publisherEmail: '',
    publisherPhone: '',
    subscriptionUrl: '',
    subscriptionAddress1: '',
    subscriptionCity: '',
    subscriptionState: '',
    subscriptionPostalCode: '',
    availability: 'Open Access',
    frequency: '',
    pubType: '',
    language: '',
    is_active: true,
    issues: [],
  };
  formatOptions.value.print = false;
  formatOptions.value.online = false;
  selectedIssueIndex.value = null;
}

onMounted(() => {
  // Fetch existing magazine files if needed
  getExistingMagazineFiles();
});

// Add new ref for tracking expanded sections
const expandedSections = ref({
  timeframe: false,
  publisher: false,
  subscription: false,
  publication: false,
  versions: false,
});

const groupedMagazines = computed(() => {
  if (!existingMagazines.value) return [];

  const magazineMap = new Map();

  // Group files by magazine metadata
  for (const file of existingMagazines.value) {
    const attr = file.attr || {};
    const key = `${file.title} ${attr.volume || '0'}-${attr.issue || '0'}`;

    if (!magazineMap.has(key)) {
      magazineMap.set(key, {
        id: key,
        title: file.title,
        volume: attr.volume || 1,
        issue: attr.issue || 1,
        publish_date: attr.publish_date || file.created_at,
        editions: [],
      });
    }

    // Add this file as an edition
    magazineMap.get(key).editions.push({
      id: file.id,
      name: file.attr.name || file.filename || file.title || 'Untitled Edition',
      file: file,
    });
  }

  // Convert map to array and sort by publish date (most recent first)
  return [...magazineMap.values()].sort((a, b) =>
    moment(b.publish_date).diff(moment(a.publish_date)),
  );
});

function formatDate(date: string): string {
  return moment(date).format('MMMM D, YYYY');
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>
