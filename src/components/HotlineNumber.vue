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
  $toasted.success(t('info.copied_to_clipboard'), { timeout: 2000 });
}
</script>

<template>
  <div class="flex">
    <div
      class="flex items-center bg-primary-light bg-opacity-30 py-1 px-3 rounded-l-full text-xs md:text-sm"
    >
      <span class="pr-1">{{ $t('disasters.hotline') }}</span>
      <a :href="`tel:${phoneNumber}`" @click.stop>
        {{ formatNationalNumber(String(phoneNumber)) }}
      </a>
    </div>
    <div
      v-tooltip="{
        content: copied ? t('actions.copied') : t('actions.copy_to_clipboard'),
        showTriggers: ['hover', 'click'],
        hideTriggers: ['hover'],
        popperClass: 'interactive-tooltip',
      }"
      class="flex items-center cursor-pointer bg-primary-light text-sm bg-opacity-80 p-2 rounded-r-full"
      @click.stop="copyToClipboard(phoneNumber)"
    >
      <span class="flex gap-1 items-center text-xs">
        <ccu-icon
          size="sm"
          fa
          :type="copied ? 'fa-solid fa-copy' : 'fa-regular fa-copy'"
        />
      </span>
    </div>
  </div>
</template>

<style scoped></style>
