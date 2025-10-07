<template>
  <div class="portal-files-library">
    <div class="header-section">
      <h3>{{ $t('Portal Files') }}</h3>
      <div class="header-actions">
        <base-input
          v-model="searchQuery"
          :placeholder="$t('Search files...')"
          class="search-input"
        />
        <base-button
          :text="$t('Upload File')"
          :alt="$t('Upload File')"
          data-testid="testUploadFileButton"
          variant="solid"
          class="upload-button"
          :action="triggerFileInput"
        >
          {{ $t('Upload File') }}
        </base-button>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        style="display: none"
        @change="handleFileUpload"
      />
    </div>
    <div v-if="isLoading" class="loading-state">
      {{ $t('Loading files...') }}
    </div>
    <div v-else-if="filteredFiles.length === 0" class="empty-state">
      {{
        searchQuery
          ? $t('No files match your search')
          : $t('No files uploaded yet')
      }}
    </div>
    <div v-else class="files-grid">
      <div v-for="file in filteredFiles" :key="file.id" class="file-item">
        <div v-if="isImageFile(file)" class="file-preview">
          <img
            :src="file.small_thumbnail_url || file.url"
            alt=""
            class="file-thumbnail"
          />
        </div>
        <div v-else class="file-preview file-icon">
          <span class="file-extension">{{ getFileExtension(file) }}</span>
        </div>
        <div class="file-name" :title="file.filename">
          {{ truncateFilename(file.filename) }}
        </div>
        <div class="file-actions">
          <base-button
            variant="outline"
            size="small"
            @click="copyFileLink(file.blog_url)"
          >
            {{ $t('Copy Link') }}
          </base-button>
          <base-button
            variant="outline"
            size="small"
            :action="() => deleteFile(file.id)"
          >
            {{ $t('Delete') }}
          </base-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';
import { uploadFile } from '@/utils/file';
import useCurrentPortal from '@/hooks/useCurrentPortal';

const { t } = useI18n();
const $toasted = useToast();
const { portal } = useCurrentPortal();

interface PortalFile {
  id: number;
  filename: string;
  url: string;
  small_thumbnail_url?: string;
  file_type_t: string;
}

const portalFiles = ref<PortalFile[]>([]);
const isLoading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');

const filteredFiles = computed(() => {
  if (!searchQuery.value.trim()) {
    return portalFiles.value;
  }
  const query = searchQuery.value.toLowerCase();
  return portalFiles.value.filter((file: PortalFile) =>
    file.filename.toLowerCase().includes(query),
  );
});

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    $toasted.info(t('Uploading file...'));

    // Upload file to get file ID
    const formData = new FormData();
    formData.append('upload', file);
    const uploadResult = await uploadFile(formData, true, true);
    const fileId = uploadResult.data.id;

    // Attach file to current portal
    if (!portal.value?.id) {
      throw new Error('No portal ID available');
    }
    await axios.post(`portals/${portal.value.id}/files`, { file: fileId });

    $toasted.success(t('File uploaded successfully'));
    await loadPortalFiles();

    // Reset file input
    if (target) {
      target.value = '';
    }
  } catch (error) {
    console.error('File upload failed:', error);
    $toasted.error(t('Failed to upload file'));
  }
};

const loadPortalFiles = async () => {
  isLoading.value = true;
  try {
    if (!portal.value?.id) {
      portalFiles.value = [];
      return;
    }
    const response = await axios.get(`portals/${portal.value.id}/files`);
    portalFiles.value = response.data;
  } catch (error) {
    console.error('Failed to load portal files:', error);
    $toasted.error(t('Failed to load portal files'));
  } finally {
    isLoading.value = false;
  }
};

const deleteFile = async (fileId: number) => {
  try {
    if (!portal.value?.id) {
      throw new Error('No portal ID available');
    }
    await axios.delete(`portals/${portal.value.id}/files`, {
      data: { file: fileId },
    });
    $toasted.success(t('File deleted successfully'));
    await loadPortalFiles();
  } catch (error) {
    console.error('Failed to delete file:', error);
    $toasted.error(t('Failed to delete file'));
  }
};

const copyFileLink = (url: string) => {
  navigator.clipboard
    .writeText(url)
    .then(() => {
      $toasted.success(t('File link copied to clipboard'));
    })
    .catch(() => {
      $toasted.error(t('Failed to copy file link'));
    });
};

const isImageFile = (file: PortalFile) => {
  if (file.file_type_t?.startsWith('image/')) {
    return true;
  }
  // Fallback to checking file extension
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some((ext) =>
    file.filename.toLowerCase().endsWith(ext),
  );
};

const getFileExtension = (file: PortalFile) => {
  const ext = file.filename.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
};

const truncateFilename = (filename: string, maxLength = 20) => {
  if (filename.length <= maxLength) return filename;
  const ext = filename.split('.').pop();
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
  const truncated = nameWithoutExt.slice(0, maxLength - ext!.length - 4);
  return `${truncated}...${ext}`;
};

onMounted(() => {
  loadPortalFiles();
});
</script>

<style scoped>
.portal-files-library {
  padding: 1rem;
  max-height: 80vh;
  overflow-y: auto;
}

.header-section {
  margin-bottom: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

.search-input {
  flex: 1;
}

.upload-button {
  padding: 0.75rem 1.5rem !important;
  white-space: nowrap;
}

.portal-files-library h3 {
  font-size: 1.25rem;
  margin: 0;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.file-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-preview {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f5f5f5;
  border-radius: 4px;
}

.file-thumbnail {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}

.file-icon {
  background: #e0e0e0;
}

.file-extension {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

.file-name {
  font-size: 0.875rem;
  word-break: break-word;
  min-height: 2.5em;
}

.file-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
