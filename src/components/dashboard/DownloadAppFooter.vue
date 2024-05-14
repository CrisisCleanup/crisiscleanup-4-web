<template>
  <div class="flex items-center gap-4">
    <QRCode :value="getQRValue()" width="100" class="shadow-xl"></QRCode>
    <div>
      Download the app

      <div class="flex items-center gap-2">
        <a
          ref="downloadIos"
          :href="appStoreLinks.apple"
          target="_blank"
          class="download-link"
        >
          <img
            data-testid="testDownloadIosLink"
            :alt="$t('nav.ccu_ios')"
            src="@/assets/icons/download-appstore-badge.svg"
            width="120"
          />
        </a>
        <a
          ref="downloadAndroid"
          :href="appStoreLinks.android"
          target="_blank"
          class="download-link"
        >
          <img
            data-testid="testDownloadAndroidLink"
            :alt="$t('nav.ccu_android')"
            src="@/assets/icons/download-playstore-badge.svg"
            width="120"
          />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import QRCode from '@/components/QRCode.vue';
import appStoreLinks from '@/utils/app_store_links';

const emit = defineEmits(['update:show']);
const getQRValue = () => {
  return appStoreLinks.apple;
};
</script>

<style scoped>
button {
  background: transparent;
  border: none;
}
</style>
