<script setup lang="ts">
import Incident from '@/models/Incident';
import Home from '@/layouts/Home.vue';
import { getAssets } from '@/utils/incident_assets';
import LanguageTag from '@/components/tags/LanguageTag.vue';
import Card from '@/components/cards/Card.vue';
import BaseButton from '@/components/BaseButton.vue';
import moment from 'moment';
import type { CmsItem } from '@/models/types';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { transformGraphData } from '@/utils/reports';
import ReportWidget from '@/components/reports/ReportWidget.vue';
import BlogPosts from '@/components/blog/BlogPosts.vue';
import PdfViewer from '@/components/PdfViewer.vue';
import { forceFileDownload } from '@/utils/downloads';
import type {
  GroupedAssets,
  IncidentAniAsset,
} from '@/components/admin/incidents/IncidentAssetBuilder.vue';
import { formatHotlineClosingDate, getAniClosingDate } from '@/utils/helpers';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay.vue';
import { getErrorMessage } from '@/utils/errors';
import type Tabs from '@/components/tabs/Tabs.vue';
import MagazineList from '@/components/magazine/MagazineList.vue';

const route = useRoute();
const router = useRouter();
const REPORT_ID = 22;

const TABINDEX_TO_PATH: Record<number, string> = {
  0: 'resources',
  1: 'latest',
  2: 'reports',
  3: 'magazines',
};

const incident = computed(() => {
  return Incident.find(route.params.id);
});

const { t } = useI18n();
const assets = ref<GroupedAssets>({});
const aniIncidents = ref<Record<string, any>[]>([]);
const cmsItems = ref([]);
const graphData = ref<Array<any> | null>([]);
const transformedData = computed<Record<any, any>>(() => {
  return transformGraphData(graphData.value);
});
const loadingReports = ref(false);
const tabsRef = ref<typeof Tabs | null>(null);

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

async function fetchAssets() {
  assets.value = await getAssets(route.params.id);
}

async function fetchAniIncident() {
  const aniIncidentResponse = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/ani_incidents`,
    {
      params: {
        incident: incident.value.id,
      },
    },
  );
  aniIncidents.value = aniIncidentResponse.data.results;
}

function getAniIncident(phoneNumber: number | string) {
  const matchingAniIncident = aniIncidents.value.find(
    (aniIncident) =>
      aniIncident?.phone_number?.toString() === phoneNumber?.toString(),
  );
  return matchingAniIncident ?? incident.value;
}

const downloadAsset = async (asset: IncidentAniAsset, asLink = false) => {
  // refetch assets before downloading so that they don't have expired link
  // in case user's been on the page for a while
  try {
    await fetchAssets();
    const groupedAssets = assets.value as GroupedAssets;
    for (const assetType in groupedAssets) {
      const groupAssets = groupedAssets[assetType];
      const matchingAsset = groupAssets.find((a) => a.id == asset.id);
      if (matchingAsset) {
        // set asset to newly fetched asset with updated link
        console.info('Updating asset before download', {
          oldAsset: asset,
          newAsset: matchingAsset,
        });
        asset = matchingAsset;
      }
    }

    if (asLink) {
      // Open the link directly in a new tab
      window.open(asset.files[0].general_file_url, '_blank');
    } else {
      // Force file download
      const response = await axios.get(asset.files[0].general_file_url, {
        responseType: 'blob',
        headers: {
          Authorization: null,
        },
      });
      forceFileDownload(response, asset.files[0].filename);
    }
  } catch (error) {
    getErrorMessage(error);
  }
};

const onSelectTab = (tab: VNode) => {
  const tabIndex = tabsRef.value?.tabs.indexOf(tab) as number;
  if (tabIndex !== undefined) {
    router.push(`/disasters/${route.params.id}/${TABINDEX_TO_PATH[tabIndex]}`);
  }
};

onMounted(async () => {
  await Incident.api().fetchById(route.params.id);

  if (route.meta.tabIndex) {
    tabsRef.value?.selectTab(route.meta.tabIndex);
  }

  await Promise.all([fetchAssets(), fetchAniIncident()]);
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
        <div class="flex flex-wrap items-center gap-2">
          <div
            v-for="phoneNumber in incident.active_phone_number"
            :key="phoneNumber"
            class="flex flex-wrap items-center gap-2"
          >
            <PhoneNumberDisplay :phone-number="phoneNumber" />
            <span class="italic opacity-50 text-sm">
              {{ $t('disasters.hotline_closes_in') }}
              {{
                formatHotlineClosingDate(
                  getAniClosingDate(getAniIncident(phoneNumber)),
                )
              }}
            </span>
          </div>
        </div>
      </div>

      <tabs ref="tabsRef" @tab-selected="onSelectTab">
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
                >
                  <PdfViewer
                    v-if="
                      asset.files[0].mime_content_type === 'application/pdf'
                    "
                    :pdf="asset.files[0]"
                    :show-download-button="false"
                    @click-pdf="() => downloadAsset(asset, true)"
                  />
                  <img
                    v-else
                    :src="asset.files[0].general_file_url"
                    :alt="asset.files[0].filename"
                    class="h-64 max-w-84"
                    @click="() => downloadAsset(asset, true)"
                  />
                  <div class="flex mt-2 items-center justify-center gap-2">
                    <div class="flex gap-5 items-center">
                      <language-tag
                        class="tag-item mx-0.5"
                        :language-id="asset.language"
                      />
                      <div class="flex justify-self-end">
                        <base-button
                          :action="() => downloadAsset(asset, true)"
                          variant="solid"
                          :text="$t('actions.download')"
                          :alt="$t('actions.download')"
                          class="py-1 px-2"
                          ccu-icon="download"
                          icon-size="small"
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
        <tab name="Magazines">
          <div class="overflow-auto h-[calc(100vh-55px)] bg-white">
            <MagazineList
              :filters="{
                incident_ids__contains: route.params.id,
              }"
            />
          </div>
        </tab>
      </tabs>
    </div>
  </Home>
</template>
