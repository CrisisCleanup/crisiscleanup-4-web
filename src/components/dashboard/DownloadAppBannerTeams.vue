<template>
  <div
    v-if="!userPreferences.hideTeamsAppBanner"
    class="flex items-center bg-crisiscleanup-light-smoke relative px-4 pt-2"
  >
    <div class="relative">
      <img src="@/assets/ccu_app.png" />
      <QRCode
        class="absolute left-24 top-10 shadow"
        :value="getQRValue()"
        width="100"
      ></QRCode>
    </div>
    <div class="rounded-lg relative">
      <div class="p-6 ml-20">
        <h2 class="text-3xl font-bold mb-4">
          {{ $t('~~Ask your teams to download the CC Mobile App') }}
        </h2>
        <p class="mb-4">
          {{
            $t(
              '~~All the same features you need at your fingertips on your smartphone.',
            )
          }}
        </p>
        <div class="flex gap-4 mb-4">
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
    </div>
    <ccu-icon
      data-testid="testModalCancel2Icon"
      :alt="$t('actions.cancel')"
      size="xs"
      type="cancel"
      class="absolute right-5 top-5"
      @click="
        () => {
          closeModal();
        }
      "
    />
  </div>
</template>

<script setup>
import QRCode from '@/components/QRCode.vue';
import appStoreLinks from '@/utils/app_store_links';
import { useCurrentUser } from '@/hooks';

const emit = defineEmits(['update:show']);
const getQRValue = () => {
  return 'https://www.crisiscleanup.org/apps';
};

const { updateCurrentUser, userPreferences } = useCurrentUser();

async function closeModal() {
  await updateCurrentUser({
    preferences: {
      ...userPreferences.value,
      hideTeamsAppBanner: true,
    },
  });
}
</script>

<style scoped>
button {
  background: transparent;
  border: none;
}
</style>
