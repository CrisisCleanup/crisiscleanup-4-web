<template>
  <div>
    <div v-if="loading" class="flex justify-center py-8">
      <Spinner size="large" />
    </div>
    <div
      v-else-if="magazines.length === 0"
      class="text-center py-8 text-gray-500"
    >
      {{ $t('magazine.no_magazines') }}
    </div>
    <div v-else>
      <!-- Latest Issue Section -->
      <div v-if="showLatestIssue" class="mb-4 bg-gray-100 p-8">
        <h2
          class="text-md font-bold uppercase text-gray-700 underline decoration-primary-light mb-2"
        >
          {{ $t('magazine.latest_issue') }}
        </h2>
        <div class="flex flex-col md:flex-row gap-8 items-center">
          <div
            v-if="latestPrimaryEdition?.thumbnail_details?.general_file_url"
            class="w-32 h-44 flex-shrink-0 transform -rotate-3 hover:rotate-0 transition-transform duration-300"
          >
            <img
              :src="latestPrimaryEdition.thumbnail_details.general_file_url"
              alt="Magazine Cover"
              class="w-full h-full object-cover rounded shadow"
            />
          </div>
          <div
            v-else
            class="flex-shrink-0 transform -rotate-3 hover:rotate-0 transition-transform duration-300"
          >
            <PdfViewer
              :pdf="latestPrimaryEdition.file_details"
              :page="1"
              :show-download-button="false"
              :width="150"
            />
          </div>

          <div class="flex-1">
            <div class="text-sm mb-1">
              Volume {{ latestMagazine.volume }}. Issue
              {{ latestMagazine.issue }}.
            </div>
            <div class="text-xl text-gray-600 mb-1 uppercase">
              {{ latestMagazine.incident_name }}
            </div>
            <div class="text-base mb-1 uppercase">
              {{ latestMagazine.subtitle }}
            </div>

            <div class="text-sm text-gray-600 mb-1 uppercase">
              {{ formatDate(latestMagazine.timeframe_start) }} -
              {{ formatDate(latestMagazine.timeframe_end) }}
            </div>
            <div class="mt-4 flex gap-2">
              <a
                v-if="latestPrimaryEdition?.file_details?.general_file_url"
                :href="latestPrimaryEdition.file_details.general_file_url"
                target="_blank"
                class="bg-primary-light hover:bg-yellow-500 text-black font-semibold px-3 py-1 rounded flex items-center gap-2 w-fit"
                download
              >
                Download <i class="fa fa-file-pdf"></i>
              </a>
              <button
                v-if="latestPrimaryEdition?.file_details?.general_file_url"
                class="bg-primary-dark hover:bg-primary text-white font-semibold px-3 py-1 rounded flex items-center gap-2 w-fit read-button"
                @click="openPdfViewer(latestPrimaryEdition.file_details)"
              >
                Read <i class="fa fa-eye"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Available Issues Section -->
      <div class="mb-4 p-8">
        <h2
          class="text-md font-bold mb-2 uppercase text-gray-700 underline decoration-primary-light"
        >
          {{ $t('magazine.available_issues') }}
        </h2>
        <div class="flex flex-col gap-8">
          <div
            v-for="magazine in magazines"
            :key="magazine.id"
            class="border-b pb-8 mb-8 last:border-b-0 last:mb-0"
          >
            <div class="flex flex-col md:flex-row gap-8 items-center">
              <div
                v-if="
                  getPrimaryEdition(magazine)?.thumbnail_details
                    ?.general_file_url
                "
                class="w-32 h-44 flex-shrink-0 transform -rotate-3 hover:rotate-0 transition-transform duration-300"
              >
                <img
                  :src="
                    getPrimaryEdition(magazine).thumbnail_details
                      .general_file_url
                  "
                  alt="Magazine Cover"
                  class="w-full h-full object-cover rounded shadow"
                />
              </div>
              <div
                v-else
                class="flex-shrink-0 transform -rotate-3 hover:rotate-0 transition-transform duration-300"
              >
                <PdfViewer
                  :pdf="getPrimaryEdition(magazine).file_details"
                  :page="1"
                  :show-download-button="false"
                  :width="125"
                />
              </div>

              <div class="flex-1 flex items-start gap-12">
                <div>
                  <div class="text-sm mb-1">
                    Volume {{ magazine.volume }}. Issue {{ magazine.issue }}.
                  </div>
                  <div class="text-lg text-gray-600 mb-1 uppercase">
                    {{ magazine.incident_name }}
                  </div>
                  <div class="text-base mb-1 uppercase">
                    {{ magazine.subtitle }}
                  </div>
                  <div class="text-sm text-gray-600 mb-1 uppercase">
                    {{ formatDate(magazine.timeframeStart) }} -
                    {{ formatDate(magazine.timeframeEnd) }}
                  </div>
                  <div class="mt-2 flex gap-2">
                    <a
                      v-if="
                        getPrimaryEdition(magazine)?.file_details
                          ?.general_file_url
                      "
                      :href="
                        getPrimaryEdition(magazine).file_details
                          .general_file_url
                      "
                      target="_blank"
                      class="bg-primary-light hover:bg-yellow-500 text-black font-semibold px-3 py-1 rounded flex items-center gap-2 w-fit"
                      download
                    >
                      Download <i class="fa fa-file-pdf"></i>
                    </a>
                    <button
                      v-if="
                        getPrimaryEdition(magazine)?.file_details
                          ?.general_file_url
                      "
                      class="bg-primary-dark hover:bg-primary text-white font-semibold px-3 py-1 rounded flex items-center gap-2 w-fit read-button"
                      @click="
                        openPdfViewer(getPrimaryEdition(magazine).file_details)
                      "
                    >
                      Read <i class="fa fa-eye"></i>
                    </button>
                  </div>
                </div>
                <div class="flex">
                  <div class="w-0.5 bg-primary-light mr-4"></div>
                  <!-- State Focused Editions -->
                  <div class="md:w-64 w-full mt-4 md:mt-0">
                    <div class="font-semibold mb-2">
                      {{ $t('magazine.download_other_editions') }}
                    </div>
                    <ul class="columns-2 gap-4 h-32 [column-fill:auto]">
                      <li
                        v-for="edition in getOtherEditions(magazine)"
                        :key="edition.id"
                      >
                        <a
                          :href="edition.file_details.general_file_url"
                          target="_blank"
                          class="text-blue-700 hover:underline flex items-center gap-1"
                          download
                        >
                          {{ edition.name }} <i class="fa fa-file-pdf"></i>
                        </a>
                      </li>
                      <li
                        v-if="getOtherEditions(magazine).length === 0"
                        class="text-gray-400 text-xs"
                      >
                        {{ $t('magazine.no_other_editions') }}
                      </li>
                    </ul>
                  </div>
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
        @page-changed="$emit('page-changed', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import moment from 'moment';
import axios from 'axios';
import Spinner from '@/components/Spinner.vue';
import BlogPagination from '@/components/blog/Pagination.vue';
import PdfViewer from '@/components/PdfViewer.vue';
import useDialogs from '@/hooks/useDialogs';
import type { CCUFileItem } from '@/models/types';

interface MagazineEdition {
  id: string;
  name: string;
  short_name: string;
  file: string;
  file_details: CCUFileItem;
  thumbnail_file: string | null;
  thumbnail_details: CCUFileItem | null;
  is_primary: boolean;
}

interface Magazine {
  id: string;
  title: string;
  subtitle: string;
  incident_ids: string[];
  incident_name: string;
  volume: number;
  issue: number;
  publish_at: string;
  timeframeStart: string;
  timeframeEnd: string;
  editions: MagazineEdition[];
}

interface MagazineResponse {
  count: number;
  results: Magazine[];
}

const props = defineProps<{
  showLatestIssue?: boolean;
  itemsPerPage?: number;
  filters?: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: 'page-changed', page: number): void;
}>();

const { t } = useI18n();
const dialogs = useDialogs();

const magazines = ref<Magazine[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(0);

async function fetchMagazines(page = 1): Promise<void> {
  loading.value = true;

  try {
    const response = await axios.get<MagazineResponse>(
      `${import.meta.env.VITE_APP_API_BASE_URL}/magazines`,
      {
        params: {
          limit: props.itemsPerPage ?? 9,
          offset: (page - 1) * (props.itemsPerPage ?? 9),
          sort: '-publish_at',
          ...props.filters,
        },
      },
    );

    magazines.value = response.data.results || [];
    totalPages.value = Math.ceil(
      response.data.count / (props.itemsPerPage ?? 9),
    );
    currentPage.value = page;
  } catch (error: unknown) {
    console.error('Error fetching magazines:', error);
    magazines.value = [];
  } finally {
    loading.value = false;
  }
}

function formatDate(date: string): string {
  if (!date) return '';
  return moment(date).format('MMM. D, YYYY');
}

function getPrimaryEdition(magazine: Magazine) {
  return magazine.editions.find((e) => e.is_primary) || magazine.editions[0];
}

function getOtherEditions(magazine: Magazine) {
  return magazine.editions.filter((e) => !e.is_primary);
}

const latestMagazine = computed(() => {
  return magazines.value.length > 0
    ? [...magazines.value].sort(
        (a, b) =>
          new Date(b.publish_at).getTime() - new Date(a.publish_at).getTime(),
      )[0]
    : null;
});

const latestPrimaryEdition = computed(() => {
  if (!latestMagazine.value) return null;
  return getPrimaryEdition(latestMagazine.value);
});

async function openPdfViewer(pdf: CCUFileItem) {
  await dialogs.component({
    title: t('magazine.magazine_viewer'),
    component: PdfViewer,
    props: {
      pdf,
      showDownloadButton: Boolean(false),
      showPagination: Boolean(true),
      width: window.innerWidth < 768 ? window.innerWidth - 32 : 500,
      page: Number(1),
    },
    modalClasses: 'max-w-4xl w-full',
    hideFooter: true,
  });
}

onMounted(() => {
  void fetchMagazines();
});
</script>
