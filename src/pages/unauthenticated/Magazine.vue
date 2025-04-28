<template>
  <Home no-hotline>
    <div class="p-6 w-full">
      <h1 class="text-3xl mb-6">{{ $t('~~magazine.title') }}</h1>

      <div v-if="loading" class="flex justify-center py-8">
        <Spinner size="large" />
      </div>

      <div
        v-else-if="magazines.length === 0"
        class="text-center py-8 text-gray-500"
      >
        {{ $t('~~magazine.no_magazines') }}
      </div>

      <div v-else>
        <!-- Grid layout of magazines with PDF previews -->
        <div class="">
          <div
            v-for="magazine in magazines"
            :key="magazine.id"
            class="bg-white overflow-hidden"
          >
            <div class="">
              <h2 class="text-xl font-bold truncate">{{ magazine.title }}</h2>
              <div class="text-sm">
                {{ $t('~~magazine.volume') }} {{ magazine.volume }},
                {{ $t('~~magazine.issue') }} {{ magazine.issue }}
              </div>
              <div class="text-sm">
                {{ formatDate(magazine.publish_date) }}
              </div>
            </div>

            <!-- Issues with PDF previews -->
            <div class="">
              <h3 class="font-bold mb-3">
                {{ $t('~~magazine.available_issues') }}
              </h3>

              <div class="flex flex-wrap gap-4">
                <div
                  v-for="issue in magazine.issues"
                  :key="issue.id"
                  class="w-min"
                >
                  <div class="mb-2 font-medium">{{ issue.name }}</div>

                  <!-- PDF Preview -->
                  <div class="mb-3">
                    <PdfViewer
                      :pdf="issue.file"
                      :page="1"
                      :show-download-button="false"
                      :width="200"
                    />
                  </div>

                  <!-- Download button -->
                  <a
                    :href="issue.file.general_file_url"
                    target="_blank"
                    class="bg-primary-light px-3 py-2 text-sm transition w-full flex items-center justify-center"
                    download
                  >
                    {{ $t('~~magazine.download') }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BlogPagination
        v-if="!loading && totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-changed="fetchMagazines"
      />
    </div>
  </Home>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import moment from 'moment';
import Spinner from '@/components/Spinner.vue';
import BlogPagination from '@/components/blog/Pagination.vue';
import PdfViewer from '@/components/PdfViewer.vue';
import Home from '@/layouts/Home.vue';

export default defineComponent({
  name: 'Magazine',
  components: {
    Spinner,
    BlogPagination,
    PdfViewer,
    Home,
  },
  setup() {
    const ITEMS_PER_PAGE = 9;
    const { t } = useI18n();

    const magazines = ref<any[]>([]);
    const loading = ref(true);
    const currentPage = ref(1);
    const totalPages = ref(0);

    function formatDate(date: string): string {
      return moment(date).format('MMMM D, YYYY');
    }

    async function fetchMagazines(page = 1): Promise<void> {
      loading.value = true;

      try {
        // Use the files endpoint with filter for magazine issues
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/files`,
          {
            params: {
              type_t: 'fileTypes.magazine_issue',
              limit: ITEMS_PER_PAGE,
              offset: (page - 1) * ITEMS_PER_PAGE,
              sort: '-created_at',
            },
          },
        );

        // Process the files into magazine groups
        const results = response.data.results || [];
        const magazineMap = new Map();

        // Group files by magazine metadata
        for (const file of results) {
          const attr = file.attr || {};
          const key = `${file.title} ${attr.volume || '0'}-${attr.issue || '0'}`;

          if (!magazineMap.has(key)) {
            magazineMap.set(key, {
              id: key,
              title: file.title,
              volume: attr.volume || 1,
              issue: attr.issue || 1,
              publish_date: attr.publish_date || file.created_at,
              name: file.attr.name,
              issues: [],
            });
          }

          // Add this file as an issue
          magazineMap.get(key).issues.push({
            id: file.id,
            name:
              file.attr.name || file.filename || file.title || 'Untitled Issue',
            file: file,
          });
        }

        // Convert map to array and sort by publish date (most recent first)
        magazines.value = [...magazineMap.values()].sort((a, b) =>
          moment(b.publish_date).diff(moment(a.publish_date)),
        );

        totalPages.value = Math.ceil(response.data.count / ITEMS_PER_PAGE);
        currentPage.value = page;
      } catch (error) {
        console.error('Error fetching magazines:', error);
        magazines.value = [];
      } finally {
        loading.value = false;
      }
    }

    onMounted(() => {
      fetchMagazines();
    });

    return {
      magazines,
      loading,
      currentPage,
      totalPages,
      formatDate,
      fetchMagazines,
    };
  },
});
</script>
