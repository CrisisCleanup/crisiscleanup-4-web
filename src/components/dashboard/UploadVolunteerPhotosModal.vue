<template>
  <div class="p-6 bg-white">
    <div class="mb-4">
      <h2 class="text-2xl font-bold mb-3">
        {{
          $t('dashboard.upload_volunteer_photos_title') ||
          'Upload Photos of Volunteers'
        }}
      </h2>
      <div
        class="text-sm text-gray-600 mb-4"
        v-html="
          $t('dashboard.upload_volunteer_photos_description') ||
          defaultDescription
        "
      />
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-2">
        {{ $t('dashboard.select_incident') || 'Select Incident' }}
      </label>
      <base-select
        v-model="selectedIncidentId"
        :options="incidentOptions"
        item-key="value"
        label="label"
        :placeholder="
          $t('dashboard.select_incident_placeholder') || 'Choose an incident...'
        "
        class="w-full"
      />
    </div>

    <div class="mb-4">
      <DragDrop
        v-if="!uploading"
        class="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-light transition-colors"
        :multiple="true"
        @files="handleFileSelection"
      >
        <div class="flex flex-col items-center justify-center h-full">
          <font-awesome-icon
            icon="cloud-upload-alt"
            size="2x"
            class="text-gray-400 mb-2"
          />
          <p class="text-sm text-gray-600">
            {{
              $t('dashboard.drag_drop_photos') || 'Drag and drop photos here'
            }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            {{
              $t('dashboard.or_click_to_select') || 'or click to select files'
            }}
          </p>
        </div>
      </DragDrop>

      <div v-else class="flex items-center justify-center h-32">
        <div class="text-center">
          <spinner size="lg" />
          <p class="mt-2 text-sm text-gray-600">
            {{ $t('dashboard.uploading_photos') || 'Uploading photos...' }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            {{ uploadProgress }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="selectedFiles.length > 0 && !uploading" class="mb-4">
      <h3 class="text-sm font-medium mb-2">
        {{ $t('dashboard.selected_files') || 'Selected Files' }} ({{
          selectedFiles.length
        }})
      </h3>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="relative"
        >
          <img
            v-if="file.preview"
            :src="file.preview"
            :alt="file.name"
            class="w-20 h-20 object-cover rounded border"
          />
          <div
            v-else
            class="w-20 h-20 flex items-center justify-center bg-gray-100 rounded border"
          >
            <font-awesome-icon icon="file" class="text-gray-400" />
          </div>
          <button
            type="button"
            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
            @click="removeFile(index)"
          >
            <font-awesome-icon icon="times" size="xs" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-4 border-t">
      <base-button
        variant="outline"
        :disabled="uploading"
        @click="$emit('close')"
      >
        {{ $t('actions.cancel') }}
      </base-button>
      <base-button
        variant="solid"
        :disabled="
          selectedFiles.length === 0 || !selectedIncidentId || uploading
        "
        @click="uploadPhotos"
      >
        {{ $t('actions.upload') || 'Upload' }}
      </base-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { useI18n } from 'vue-i18n';
import DragDrop from '@/components/DragDrop.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import Organization from '@/models/Organization';
import Incident from '@/models/Incident';
import { uploadFile } from '@/utils/file';
import { getErrorMessage } from '@/utils/errors';

const props = defineProps<{
  organizationId: string;
  incidents: Incident[];
  currentIncidentId?: string;
}>();

const emit = defineEmits<{
  close: [];
  uploaded: [];
}>();

const { t } = useI18n();
const $toasted = useToast();

const defaultDescription = `Upload pictures of your volunteers (or yourself volunteering) on the current disaster. 
Crisis Cleanup may include some of these photos in our 60-day 
<a href="https://www.crisiscleanup.org/magazine" target="_blank" title="Crisis Cleanup Magazine" class="text-primary-dark underline">Magazine</a> 
report. WE LOVE VOLUNTEERS!`;

const selectedIncidentId = ref(props.currentIncidentId || '');
const selectedFiles = ref<
  Array<{ file: File; preview?: string; name: string }>
>([]);
const uploading = ref(false);
const uploadProgress = ref('');

const incidentOptions = computed(() => {
  return props.incidents.map((incident) => ({
    value: incident.id,
    label: `${incident.name} (${incident.short_name})`,
  }));
});

const handleFileSelection = (files: File[]) => {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'));

  for (const file of imageFiles) {
    const reader = new FileReader();
    reader.addEventListener('load', (e) => {
      selectedFiles.value.push({
        file,
        name: file.name,
        preview: e.target?.result as string,
      });
    });
    reader.readAsDataURL(file);
  }

  if (imageFiles.length < files.length) {
    $toasted.warning(
      t('dashboard.only_image_files') || 'Only image files are allowed',
    );
  }
};

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
};

const uploadPhotos = async () => {
  if (!selectedIncidentId.value) {
    $toasted.error(
      t('dashboard.select_incident_first') || 'Please select an incident first',
    );
    return;
  }

  uploading.value = true;
  let uploadedCount = 0;

  try {
    for (const fileData of selectedFiles.value) {
      uploadProgress.value = `Uploading ${uploadedCount + 1} of ${selectedFiles.value.length}...`;

      const formData = new FormData();
      formData.append('upload', fileData.file);
      formData.append('type_t', 'fileTypes.volunteer_photos');

      // Upload file to S3
      const uploadResult = await uploadFile(formData);
      const fileId = uploadResult.data.id;

      // Attach file to organization
      await Organization.api().addFile(
        props.organizationId,
        fileId,
        'fileTypes.volunteer_photos',
      );

      // Attach file to selected incident
      await Incident.api().addFile(
        selectedIncidentId.value,
        fileId,
        'fileTypes.volunteer_photos',
      );

      uploadedCount++;
    }

    $toasted.success(
      t('dashboard.photos_uploaded_success') ||
        `Successfully uploaded ${uploadedCount} photo${uploadedCount === 1 ? '' : 's'}!`,
    );

    emit('uploaded');
    emit('close');
  } catch (error) {
    console.error('Error uploading photos:', error);
    $toasted.error(getErrorMessage(error));
  } finally {
    uploading.value = false;
    uploadProgress.value = '';
  }
};
</script>
