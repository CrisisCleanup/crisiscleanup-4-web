<template>
  <div class="flex items-center">
    <slot>
      <span>{{ text }}</span>
    </slot>
    <div
      v-tooltip="{
        content: copied ? t('actions.copied') : t('actions.copy_to_clipboard'),
        showTriggers: ['hover', 'click'],
        hideTriggers: ['hover'],
        popperClass: 'interactive-tooltip',
      }"
      class="flex items-center cursor-pointer pl-1"
      :class="[iconClass]"
      @click.stop="copyToClipboard(text)"
    >
      <slot name="icon" v-bind="{ copied }">
        <span class="flex gap-1 items-center text-xs">
          <ccu-icon
            size="sm"
            fa
            :type="copied ? 'fa-solid fa-copy' : 'fa-regular fa-copy'"
          />
        </span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';

interface CopyTextProps {
  text: string;
  iconClass: string;
}

const props = defineProps<CopyTextProps>();
const { t } = useI18n();
const $toasted = useToast();

const { copy, copied } = useClipboard({
  legacy: true, // copy with execCommand as fallback
});

async function copyToClipboard(text: string) {
  await copy(text);
  $toasted.success(t('info.copied_to_clipboard'), { timeout: 1000 });
}
</script>

<style scoped lang="postcss"></style>
