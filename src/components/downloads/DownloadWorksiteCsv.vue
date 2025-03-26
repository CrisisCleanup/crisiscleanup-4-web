<script setup lang="ts">
import axios from 'axios';
import { forceFileDownloadFromURl } from '@/utils/downloads';
import Spinner from '@/components/Spinner.vue';

const props = defineProps<{
  downloadId: string;
  wait?: number;
}>();

const { t } = useI18n();

// Reactive variables for UI feedback
const waitingForFile = ref(true);
const errorMessage = ref<string | null>(null);
const message = ref<string | null>(null);

// Function to download the file
const downloadFile = async (fileId: string) => {
  try {
    const url = `/files/${fileId}`;
    const { data } = await axios.get(url);
    const csvUrl = data.csv_url;
    forceFileDownloadFromURl(csvUrl, data.filename_original);
    waitingForFile.value = false;
    message.value = t('downloads.download_complete');
  } catch (error) {
    console.error('Error downloading file:', error);
    errorMessage.value = t('downloads.download_failed');
    waitingForFile.value = false;
  }
};

onMounted(() => {
  const maxAttempts = props.wait || 20; // 20 seconds by default
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts += 1;
    try {
      const { data } = await axios.get(`/user_downloads/${props.downloadId}`);
      if (data.file) {
        clearInterval(interval);
        await downloadFile(data.file);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        message.value = t('info.processing_download_d');
        waitingForFile.value = false;
      }
    } catch (error) {
      console.error('Error checking file status:', error);
      clearInterval(interval);
      errorMessage.value = 'An error occurred while checking the file status.';
      waitingForFile.value = false;
    }
  }, 1000);
});
</script>

<template>
  <div>
    <div v-if="waitingForFile">
      <p>{{ $t('downloads.waiting_for_file') }}</p>
      <spinner />
    </div>
    <div v-else-if="message">
      <p v-html="message"></p>
    </div>
    <div v-else-if="errorMessage">
      <p>{{ errorMessage }}</p>
    </div>
    <!-- Optionally, you can add more UI elements here -->
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>
