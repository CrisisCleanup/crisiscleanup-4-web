<template>
  <div class="flex justify-end p-2 gap-2 items-center">
    <a
      v-if="showDownloadButton"
      class="p-2 bg-primary-light border-primary-light"
      data-testid="testDownloadLink"
      :href="pdf.general_file_url"
      :download="pdf.filename_original"
      >{{ $t('actions.download') }}</a
    >
  </div>
  <div
    class="h-max overflow-y-auto border w-min mx-auto"
    @click="$emit('clickPdf')"
  >
    <vue-pdf-embed
      v-if="pdf.general_file_url"
      :source="pdf.general_file_url"
      :width="width"
      :page="currentPage"
      @loaded="onLoaded"
    />
  </div>
  <div
    v-if="showPagination && numPages > 1"
    class="flex justify-center items-center gap-4 p-2"
  >
    <button
      class="p-2 bg-primary-light border-primary-light disabled:opacity-50"
      :disabled="currentPage <= 1"
      @click="goToPreviousPage"
    >
      {{ $t('actions.previous') }}
    </button>
    <span>{{ currentPage }} / {{ numPages }}</span>
    <button
      class="p-2 bg-primary-light border-primary-light disabled:opacity-50"
      :disabled="currentPage >= numPages"
      @click="goToNextPage"
    >
      {{ $t('actions.next') }}
    </button>
  </div>
</template>

<script lang="ts">
import VuePdfEmbed from 'vue-pdf-embed';

interface PdfViewerProps {
  pdf: {
    general_file_url: string;
    filename_original: string;
  };
  page: number;
}

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
    showPagination: {
      type: Boolean,
      default: false,
    },
    width: {
      type: Number,
      default: 300,
    },
    page: {
      type: Number,
      default: 1,
    },
  },
  emits: ['clickPdf', 'pageChange'],
  setup(
    props: PdfViewerProps,
    {
      emit,
    }: { emit: (event: 'clickPdf' | 'pageChange', ...args: any[]) => void },
  ) {
    const numPages = ref(0);
    const currentPage = ref(props.page);

    function onLoaded(pdf: any) {
      numPages.value = pdf.numPages;
    }

    function goToPreviousPage() {
      if (currentPage.value > 1) {
        currentPage.value--;
        emit('pageChange', currentPage.value);
      }
    }

    function goToNextPage() {
      if (currentPage.value < numPages.value) {
        currentPage.value++;
        emit('pageChange', currentPage.value);
      }
    }

    onMounted(() => {
      currentPage.value = props.page;
    });

    watch(
      () => props.page,
      (newPage: number) => {
        currentPage.value = newPage;
      },
    );

    return {
      numPages,
      currentPage,
      onLoaded,
      goToPreviousPage,
      goToNextPage,
    };
  },
});
</script>

<style scoped></style>
