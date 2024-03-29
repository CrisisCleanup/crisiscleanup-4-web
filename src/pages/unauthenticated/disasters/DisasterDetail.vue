<script setup lang="ts">
import Incident from '@/models/Incident';
import Home from '@/layouts/Home.vue';
import { getAssets } from '@/utils/incident_assets';
import LanguageTag from '@/components/tags/LanguageTag.vue';
import Card from '@/components/cards/Card.vue';
import BaseButton from '@/components/BaseButton.vue';
import IncidentAssetEditor from '@/components/IncidentAssetEditor.vue';
import moment from 'moment';
import { formatNationalNumber } from '@/filters';
import type { CmsItem } from '@/models/types';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { formatCmsItem } from '@/utils/helpers';
import { transformGraphData } from '@/utils/reports';
import ReportWidget from '@/components/reports/ReportWidget.vue';

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
    <div class="text-sm">{{ moment(incident.start_at).format('MMMM Y') }}</div>
    <div
      v-if="
        incident.active_phone_number && incident.active_phone_number.length > 0
      "
      class="flex items-center gap-5 my-1"
    >
      {{ $t('disasters.hotlines') }}
      <div class="flex gap-2">
        <span
          v-for="number in incident.active_phone_number"
          :key="number"
          class="bg-primary-light bg-opacity-30 py-1 px-3 rounded-full"
        >
          {{ formatNationalNumber(String(number)) }}
        </span>
      </div>
    </div>

    <tabs>
      <tab name="Resources">
        <div class="overflow-auto h-[calc(100vh-55px)]">
          <Card
            v-for="(assetGroup, assetType) in assets"
            :key="assetType"
            class="p-3 my-2 min-w-max max-w-6xl"
            :title="$t(assetType)"
          >
            <template #header>
              <base-text class="px-2 py-3 text-base font-bold">
                {{ $t(assetType) }}
              </base-text>
            </template>
            <div class="grid grid-cols-2 mt-4">
              <div
                v-for="asset in assetGroup"
                :key="`${asset.asset_type}:${asset.language}:${asset.ani}`"
                class="p-3 h-max w-min"
              >
                <incident-asset-editor
                  :key="asset.content"
                  v-model="asset.content"
                  read-only
                  class="scale-75 origin-top-left -mb-16"
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
        <ul class="overflow-auto h-[calc(100vh-55px)]">
          <li v-for="cmsItem in cmsItems" :key="cmsItem.id" class="p-5">
            <div class="flex gap-5">
              <!--              <img-->
              <!--                v-if="cmsItem.thumbnail_file"-->
              <!--                :src="cmsItem.thumbnail_file.blog_url"-->
              <!--                class="w-20 h-20 mr-2"-->
              <!--                :alt="cmsItem.thumbnail_file"-->
              <!--              />-->
              <!--              <img-->
              <!--                v-else-->
              <!--                src="../../../assets/cc-logo.svg"-->
              <!--                class="w-20 h-20 mr-2"-->
              <!--                alt="crisis-cleanup-logo"-->
              <!--              />-->
              <div
                class="px-5 h-16 bg-blue-400 text-white font-bold flex items-center justify-center"
              >
                <div class="text-center">
                  {{ moment(cmsItem.publish_at).format('MMM') }}
                  <br />
                  <div class="text-2xl">
                    {{ moment(cmsItem.publish_at).format('D') }}
                  </div>
                </div>
              </div>
              <div class="h-44 overflow-y-hidden">
                <div
                  class="text-xl font-bold truncate"
                  v-html="$t(formatCmsItem(cmsItem.title))"
                ></div>
                <p
                  class="text-base line-clamp-8"
                  v-html="$t(formatCmsItem(cmsItem.content))"
                ></p>
              </div>
            </div>
          </li>
        </ul>
      </tab>
      <tab name="Reports">
        <div class="overflow-auto h-[calc(100vh-55px)]">
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
                (value.data.length > 0 || Object.keys(value.data).length > 0) &&
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
  </Home>
</template>

<style scoped></style>
