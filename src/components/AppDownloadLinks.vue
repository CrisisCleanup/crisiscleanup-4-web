<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import BaseText from '@/components/BaseText.vue';
import appStoreLinks from '@/utils/app_store_links';

const { t } = useI18n();
</script>

<template>
  <div class="flex items-center p-1 space-x-2">
    <BaseText> {{ t('nav.download_app') }}</BaseText>
    <a :href="appStoreLinks.apple" target="_blank">
      <ccu-icon
        data-testid="testDownloadIosLink"
        :alt="t('nav.ccu_ios')"
        size="xl"
        type="ios-round"
        linked
      />
    </a>
    <a :href="appStoreLinks.android" target="_blank">
      <ccu-icon
        data-testid="testDownloadAndroidLink"
        :alt="t('nav.ccu_android')"
        size="xl"
        type="android-round"
        linked
      />
    </a>
  </div>
</template>

<style scoped></style>
