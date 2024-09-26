<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { useClipboard } from '@vueuse/core';
import { formatNationalNumber } from '@/filters';

interface HotlineNumberProps {
  phoneNumber: string;
}

const props = defineProps<HotlineNumberProps>();

const { t } = useI18n();
const $toasted = useToast();

const phoneNumber = computed(() => props.phoneNumber);
const { copy, copied } = useClipboard({
  legacy: true, // copy with execCommand as fallback
});

async function copyToClipboard(text: string) {
  await copy(text);
  $toasted.success(t('~~Text copied to clipboard!'), { timeout: 2000 });
}
</script>

<template>
  <div
    class="flex items-center bg-primary-light bg-opacity-30 py-1 px-3 rounded-l-full text-xs md:text-sm"
  >
    <span class="pr-1">{{ $t('disasters.hotline') }}</span>
    <a :href="`tel:${phoneNumber}`">
      {{ formatNationalNumber(String(phoneNumber)) }}
    </a>
  </div>
  <div
    v-tooltip="{
      content: copied ? t('~~Copied') : t('~~Copy to clipboard'),
      showTriggers: ['hover', 'click'],
      hideTriggers: ['hover'],
      popperClass: 'interactive-tooltip',
    }"
    class="flex items-center cursor-pointer bg-primary-light text-sm bg-opacity-80 p-2 rounded-r-full"
    @click="copyToClipboard(phoneNumber)"
  >
    <span class="flex gap-1 items-center text-xs">
      <ccu-icon
        size="sm"
        fa
        :type="copied ? 'fa-solid fa-copy' : 'fa-regular fa-copy'"
      />
    </span>
  </div>
</template>

<style scoped></style>
