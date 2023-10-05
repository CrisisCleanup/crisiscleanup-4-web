<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import appStoreLinks from '@/utils/app_store_links';
import { defineProps, ref, onMounted } from 'vue';
const { t } = useI18n();

const downloadIos = ref(null);
const downloadAndroid = ref(null);

const props = defineProps({
  redirectToStore: Boolean,
  hideBadges: Boolean,
});

const getOs = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return {
    ios: /\b(iphone|ipad|ipod|mac)\b/i.test(userAgent),
    android: /\bandroid\b/i.test(userAgent),
  };
};

onMounted(() => {
  const os = getOs();
  if (props.redirectToStore) {
    if (os.ios) {
      window.location.href = appStoreLinks.apple;
    } else if (os.android) {
      window.location.href = `https://play.app.goo.gl/?link=${appStoreLinks.android}`;
    }
  }

  if (props.hideBadges) {
    const hideBadges: Array<any> = [];
    if (os.ios) {
      hideBadges.push(downloadAndroid);
    } else if (os.android) {
      hideBadges.push(downloadIos);
    }
    for (const b of hideBadges) {
      b.value.style.display = 'none';
    }
  }
});
</script>

<template>
  <div class="h-full flex flex-col">
    <div id="top" class="logo flex justify-center p-3 border border-b">
      <img
        id="header"
        data-testid="testCcuLogoIcon"
        src="@/assets/ccu-logo-black-500w.png"
        style="height: 100px"
      />
    </div>
    <div class="download-links">
      <a
        ref="downloadIos"
        :href="appStoreLinks.apple"
        target="_blank"
        class="download-link"
      >
        <img
          data-testid="testDownloadIosLink"
          :alt="t('nav.ccu_ios')"
          src="@/assets/icons/download-appstore-badge.svg"
          class="download-icon"
          width="350"
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
          :alt="t('nav.ccu_android')"
          src="@/assets/icons/download-playstore-badge.svg"
          class="download-icon"
          width="350"
        />
      </a>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.download-links {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 1em;
}

.download-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1em;
}

.download-link ccu-icon {
  margin-bottom: 0.5em;
}

.download-icon {
  padding: 1rem;
}
</style>
