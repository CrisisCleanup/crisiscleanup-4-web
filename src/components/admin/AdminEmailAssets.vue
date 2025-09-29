<!-- EmailImageLibrary.vue -->
<template>
  <div class="email-images-library">
    <div class="header-section">
      <h3>{{ $t('Email Images') }}</h3>
      <base-button
        :text="$t('Clear Cache')"
        :alt="$t('Clear Cache')"
        data-testid="testClearEmailImagesCacheButton"
        variant="outline"
        size="small"
        :disabled="isClearing"
        :show-spinner="isClearing"
        :action="clearEmailImagesCache"
      >
        {{ $t('Clear Cache') }}
      </base-button>
    </div>
    <div class="images-grid">
      <div
        v-for="image in emailImages"
        :key="image.file_key"
        class="image-item"
      >
        <img :src="image.signed_url" alt="" class="image-thumbnail" />
        <base-button
          variant="outline"
          size="small"
          @click="copyImageLink(image.signed_url)"
        >
          {{ $t('Copy Link') }}
        </base-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import BaseButton from '@/components/BaseButton.vue';
import { useEmailImagesClearCache } from '@/hooks/useEmailImagesClearCache';

const { t } = useI18n();
const $toasted = useToast();
const { clearEmailImagesCache, isClearing } = useEmailImagesClearCache();

const emailImages = ref<any[]>([]);

const copyImageLink = (url: string) => {
  navigator.clipboard
    .writeText(url)
    .then(() => {
      $toasted.success(t('Image link copied to clipboard.'));
    })
    .catch(() => {
      $toasted.error(t('Failed to copy image link.'));
    });
};

// Fetch email images on component mount
onMounted(async () => {
  try {
    const response = await axios.get('admins/email-images');
    emailImages.value = response.data;
  } catch {
    $toasted.error(t('Failed to load email images.'));
  }
});
</script>

<style scoped>
.email-images-library {
  padding: 1rem;
  max-height: 80vh;
  overflow-y: auto;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.email-images-library h3 {
  font-size: 1.25rem;
  margin: 0;
}
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}
.image-item {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: center;
}
.image-thumbnail {
  max-height: 100px;
  object-fit: contain;
  margin-bottom: 0.5rem;
}
</style>
