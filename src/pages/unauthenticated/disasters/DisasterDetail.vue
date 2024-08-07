<script setup lang="ts">
import Incident from '@/models/Incident';
import Home from '@/layouts/Home.vue';
import { getAssets } from '@/utils/incident_assets';
import LanguageTag from '@/components/tags/LanguageTag.vue';
import Card from '@/components/cards/Card.vue';
import BaseButton from '@/components/BaseButton.vue';
import moment from 'moment';
import { formatNationalNumber } from '@/filters';
import type { CmsItem } from '@/models/types';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { transformGraphData } from '@/utils/reports';
import ReportWidget from '@/components/reports/ReportWidget.vue';
import BlogPosts from '@/components/blog/BlogPosts.vue';
import PdfViewer from '@/components/PdfViewer.vue';
import { forceFileDownload } from '@/utils/downloads';
import type { IncidentAniAsset } from '@/components/admin/incidents/IncidentAssetBuilder.vue';

const route = useRoute();
const REPORT_ID = 22;

const incident = computed(() => {
  return Incident.find(route.params.id);
});

const assets = ref({});
const cmsItems = ref([]);
const graphData = ref<Array<any> | null>([]);
const transformedData = computed<Record<any, any>>(() => {
  return transformGraphData(graphData.value);
});
const loadingReports = ref(false);
async function getCmsItems(incidentId: string): Promise<CmsItem[]> {
  const response: AxiosResponse<{ results: CmsItem[] }> = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/cms`,
    {
      params: {
        tags: incidentId,
      },
    },
  );
  return response.data.results;
}

const downloadAsset = async (asset: IncidentAniAsset) => {
  const response = await axios.get(asset.files[0].general_file_url, {
    responseType: 'blob',
    headers: {
      Authorization: null,
    },
  });
  forceFileDownload(response, asset.files[0].filename);
};

onMounted(async () => {
  await Incident.api().fetchById(route.params.id);
  assets.value = await getAssets(route.params.id);
  cmsItems.value = await getCmsItems(route.params.id);
  try {
    loadingReports.value = true;
    const response = await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/reports/${REPORT_ID}/data`,
      {
        params: {
          incident_id: route.params.id,
          the_date: `${moment(incident?.value?.start_at).format(
            'YYYY-MM-DD',
          )}|${moment().format('YYYY-MM-DD')}`,
        },
      },
    );
    graphData.value = Object.entries(response.data.widget_data);
  } finally {
    loadingReports.value = false;
  }
});
</script>

<template>
  <Home v-if="incident" no-hotline>
    <div class="bg-crisiscleanup-light-smoke p-6">
      <div
        class="flex items-center gap-0.5 text-base text-crisiscleanup-dark-blue mb-3"
      >
        <font-awesome-icon
          :icon="['fas', 'arrow-left']"
          class="text-primary cursor-pointer"
        />
        <router-link to="/disasters">
          {{ $t('disasters.back_to_active') }}
        </router-link>
      </div>
      <div class="text-2xl font-semibold">{{ incident.name }}</div>
      <div class="text-sm">
        {{ moment(incident.start_at).format('MMMM Y') }}
      </div>
      <div
        v-if="
          incident.active_phone_number &&
          incident.active_phone_number.length > 0
        "
        class="flex items-center gap-5 my-1"
      >
        <div class="flex gap-2">
          <a
            v-for="number in incident.active_phone_number"
            :key="number"
            class="bg-primary-light bg-opacity-30 py-1 px-3 rounded-full"
            :href="`tel:${number}`"
          >
            {{ $t('disasters.hotline') }}
            {{ formatNationalNumber(String(number)) }}
          </a>
        </div>
      </div>

      <tabs>
        <tab name="Resources">
          <div class="overflow-auto h-[calc(100vh-200px)] bg-white">
            <Card
              v-for="(assetGroup, assetType) in assets"
              :key="assetType"
              class="p-3 my-2 min-w-max max-w-6xl !h-max"
              :title="$t(assetType)"
            >
              <template #header>
                <base-text class="px-2 py-3 text-base font-bold">
                  {{ $t(assetType) }}
                </base-text>
              </template>
              <div class="grid grid-cols-2 mt-4">
                <div
                  v-for="asset in assetGroup.filter((a) => a.files.length > 0)"
                  :key="`${asset.asset_type}:${asset.language}:${asset.ani}`"
                  class="p-3 w-min cursor-pointer"
                  @click="() => downloadAsset(asset)"
                >
                  <PdfViewer
                    v-if="
                      asset.files[0].mime_content_type === 'application/pdf'
                    "
                    :pdf="asset.files[0]"
                    :show-download-button="false"
                  />
                  <img
                    v-else
                    :src="asset.files[0].general_file_url"
                    :alt="asset.files[0].filename"
                    class="h-64 max-w-84"
                  />
                  <div class="flex mt-2 items-center justify-between">
                    <div class="flex gap-5 items-center">
                      <language-tag
                        class="tag-item mx-0.5"
                        :language-id="asset.language"
                      />
                      <div class="flex justify-self-end">
                        <base-button
                          :action="() => downloadAsset(asset)"
                          class="p-2"
                          ccu-icon="download"
                          icon-size="md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </tab>
        <tab name="Latest">
          <BlogPosts
            :cms-items="cmsItems"
            class="px-5 h-[calc(100vh-55px)] bg-white"
          />
        </tab>
        <tab name="Reports">
          <div class="overflow-auto h-[calc(100vh-55px)] bg-white">
            <spinner v-if="loadingReports" size="xl" />
            <div
              v-for="[key, value] in Object.entries(transformedData)"
              v-else
              :key="key"
              :data-testid="`testReportCard${key}Div`"
              class="flex flex-col justify-center my-10 ml-8"
            >
              <ReportWidget
                v-if="
                  (value.data.length > 0 ||
                    Object.keys(value.data).length > 0) &&
                  value.type !== 'pie'
                "
                hide-download
                hide-print
                data-testid="testReportWidgetContent"
                :widget-key="key"
                :value="value"
              />
            </div>
          </div>
        </tab>
      </tabs>
    </div>
  </Home>
</template>
