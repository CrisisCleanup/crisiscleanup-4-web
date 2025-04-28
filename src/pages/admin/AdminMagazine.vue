<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">{{ $t('~~Magazine Management') }}</h1>

    <div class="mb-6">
      <h2 class="text-xl font-bold mb-4">
        {{ magazine.id ? $t('~~Edit Magazine') : $t('~~Create Magazine') }}
      </h2>

      <div class="grid grid-cols-1 gap-6">
        <!-- Magazine Details Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <base-input
              v-model="magazine.title"
              :label="$t('~~Magazine Title')"
              :placeholder="$t('~~Enter magazine title')"
              class="mb-4"
              required
            />

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium mb-2">
                  {{ $t('~~Volume') }}
                </label>
                <base-input
                  v-model="magazine.volume"
                  :label="$t('~~Volume')"
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
                  :label="$t('~~Issue')"
                  type="number"
                  min="1"
                  required
                />
              </div>
            </div>

            <datepicker
              v-model="magazine.publish_date"
              data-testid="testPublishDatePicker"
              auto-apply
              format="yyyy-MM-dd"
            />
          </div>
        </div>

        <!-- Magazine Issues Section -->
        <div>
          <h3 class="text-lg font-semibold mb-4">
            {{ $t('~~Magazine Versions') }}
          </h3>

          <div
            v-if="magazine.issues.length === 0"
            class="text-gray-500 mb-4 p-4 bg-gray-50 rounded"
          >
            {{ $t('~~No versions added yet') }}
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
                  {{ $t('~~Version') }} #{{ index + 1 }}
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
            {{ $t('~~Add Version') }}
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
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(file, index) in existingMagazines"
          :key="index"
          class="flex items-center justify-between p-4"
        >
          <div>
            <PdfViewer :pdf="file" :show-download-button="false" :page="1" />
            <i class="fa fa-file-pdf text-red-500 mt-4 mr-2"></i>
            <span>{{ file.attr.name }}</span>
            <a
              :href="file.general_file_url"
              target="_blank"
              class="bg-primary-light px-3 py-2 text-sm transition w-full flex items-center justify-center mt-2"
              download
            >
              {{ $t('~~magazine.download') }}
            </a>
          </div>
        </div>
      </div>
      <div v-if="existingMagazines.length === 0" class="text-gray-500">
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
  volume: number;
  issue: number;
  publish_date: string;
  is_active: boolean;
  issues: MagazineIssue[];
}

const { t } = useI18n();
const $toasted = useToast();

const saving = ref(false);
const selectedIssueIndex = ref<number | null>(null);
const uploadProgress = ref(0);

const existingMagazines = ref<File>(null);

const magazine = ref<MagazineData>({
  id: null,
  title: '',
  volume: 1,
  issue: 1,
  publish_date: moment().format('YYYY-MM-DD'),
  is_active: true,
  issues: [],
});

const isFormValid = computed(() => {
  if (!magazine.value.title || !magazine.value.publish_date) {
    return false;
  }

  if (magazine.value.issues.length === 0) {
    return false;
  }

  return magazine.value.issues.every(
    (issue) => issue.name && (issue.file || issue.file_data),
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
    (issue) => issue.file_data && !issue.file,
  );

  if (issuesToUpload.length === 0) {
    return true; // No files to upload
  }

  uploadProgress.value = 0;
  const totalFiles = issuesToUpload.length;
  let uploadedCount = 0;

  try {
    // Upload all files in parallel
    const uploadPromises = magazine.value.issues.map(async (issue, index) => {
      if (!issue.file_data || issue.file) {
        return; // Skip if no file data or already has a file ID
      }

      const formData = new FormData();
      formData.append('upload', issue.file_data);
      formData.append('type_t', 'fileTypes.magazine_issue');
      formData.append('filename', issue.file_info?.filename || '');
      formData.append('content_type', issue.file_info?.type || '');
      formData.append(
        'attr',
        JSON.stringify({
          volume: magazine.value.volume,
          issue: magazine.value.issue,
          publish_date: magazine.value.publish_date,
          title: magazine.value.title,
          name: issue.name,
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
    });

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
    volume: 1,
    issue: 1,
    publish_date: moment().format('YYYY-MM-DD'),
    is_active: true,
    issues: [],
  };
  selectedIssueIndex.value = null;
}

onMounted(() => {
  // Fetch existing magazine files if needed
  getExistingMagazineFiles();
});
</script>
