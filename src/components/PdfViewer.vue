<template>
  <div class="flex justify-end p-2 gap-2 items-center">
    <a
      v-if="showDownloadButton"
      class="p-2 bg-primary-light border-primary-light"
      data-testid="testDownloadLink"
      :href="pdf.full_url"
      :download="pdf.filename_original"
      >{{ $t('actions.download') }}</a
    >
  </div>
  <div class="h-max overflow-y-auto border" @click="$emit('clickPdf')">
    <vue-pdf-embed :source="pdf.full_url" :width="width" />
  </div>
</template>

<script lang="ts">
// eslint-disable-next-line import/default
import VuePdfEmbed from 'vue-pdf-embed';

export default defineComponent({
  name: 'PdfViewer',
  components: { VuePdfEmbed },
  props: {
    pdf: {
      type: Object,
      required: true,
    },
    showDownloadButton: {
      type: Boolean,
      default: true,
    },
    width: {
      type: Number,
      default: 300,
    },
  },
  emits: ['clickPdf'],
});
</script>

<style scoped></style>
