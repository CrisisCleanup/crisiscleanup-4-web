<template>
  <Home>
    <div>
      <div class="text-4xl font-bold" data-testid="testCurrentDisastersHeader">
        {{ $t('~~Current Disasters') }}
      </div>
      <div v-for="incident in incidents" :key="incident.id" class="mb-10">
        <div
          :id="camelCase(incident.short_name)"
          class="text-2xl my-4 block flex items-center justify-between"
        >
          {{ incident.name }} - {{ getIncidentPhoneNumbers(incident) }}
          <span
            class="cursor-pointer"
            @click="
              () =>
                (showIncidentDetails[incident.id] =
                  !showIncidentDetails[incident.id])
            "
          >
            <font-awesome-icon
              v-if="showIncidentDetails[incident.id]"
              icon="minus"
              :alt="$t('~~Hide Incident Information')"
            />
            <font-awesome-icon
              v-else
              icon="plus"
              :alt="$t('~~Show Incident Information')"
            />
          </span>
        </div>
        <template v-if="showIncidentDetails[incident.id]">
          <Card class="border p-3 my-2 min-w-max max-w-6xl">
            <template #header>
              <base-text class="px-2 py-3 text-base font-bold">
                {{ $t('~~Incident Information') }}
              </base-text>
            </template>
            <ul class="h-80 overflow-auto">
              <li
                v-for="cmsItem in cmsItems[incident.id]"
                :key="cmsItem.id"
                class="hover:bg-crisiscleanup-light-grey cursor-pointer border-b-2"
                @click="() => showCmsDetails(cmsItem)"
              >
                <div class="p-2 flex">
                  <img
                    v-if="cmsItem.thumbnail_file"
                    :src="cmsItem.thumbnail_file.blog_url"
                    class="w-20 h-20 mr-2"
                    :alt="cmsItem.thumbnail_file"
                  />
                  <img
                    v-else
                    src="../../assets/cc-logo.svg"
                    class="w-20 h-20 mr-2"
                    alt="crisis-cleanup-logo"
                  />
                  <div class="h-20 overflow-y-hidden">
                    <div
                      class="text-xl sm:text-sm my-1 font-bold truncate"
                      v-html="$t(formatCmsItem(cmsItem.title))"
                    ></div>
                    <p
                      class="text-xs line-clamp-3"
                      v-html="$t(formatCmsItem(cmsItem.content))"
                    ></p>
                  </div>
                </div>
              </li>
            </ul>
          </Card>
          <Card
            v-for="(assetGroup, assetType) in incidentAssets[incident.id]"
            :key="assetType"
            class="border p-3 my-2 min-w-max max-w-6xl"
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
                <IncidentAssetEditor
                  :key="asset.content"
                  v-model="asset.content"
                  read-only
                  class="scale-75 origin-top-left -mb-16"
                />
                <div class="flex mt-2 items-center justify-between">
                  <div class="flex gap-5 items-center">
                    <LanguageTag
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
        </template>
      </div>
    </div>
  </Home>
</template>

<script setup lang="ts">
import Home from '@/layouts/Home.vue';
import { ref, onMounted } from 'vue';
import moment from 'moment/moment';
import type Incident from '@/models/Incident';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { hash } from '@/utils/promise';
import type {
  GroupedAssets,
  IncidentAniAsset,
} from '@/components/admin/incidents/IncidentAssetBuilder.vue';
import Card from '@/components/cards/Card.vue';
import IncidentAssetEditor from '@/components/IncidentAssetEditor.vue';
import BaseButton from '@/components/BaseButton.vue';
import LanguageTag from '@/components/tags/LanguageTag.vue';
import { formatCmsItem } from '@/utils/helpers';
import CmsViewer from '@/components/cms/CmsViewer.vue';
import useDialogs from '@/hooks/useDialogs';
import { forceFileDownload } from '@/utils/downloads';
import { formatNationalNumber } from '@/filters';
import type { CmsItem } from '@/models/types';
import camelCase from 'lodash/camelCase';

const { component } = useDialogs();
const route = useRoute();
const incidents = ref<Incident>([]);
const cmsItems = ref<Record<string, any[]>>([]);
const incidentAssets = ref<Record<string, GroupedAssets[]>>([]);
const showIncidentDetails = ref<Record<string, boolean>>({});
const sixtyDaysAgo = moment().subtract(60, 'days');

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

async function getAssets(incidentId: string): Promise<GroupedAssets> {
  const response: AxiosResponse<{ results: IncidentAniAsset[] }> =
    await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/incident_assets`,
      {
        params: {
          incident: incidentId,
        },
      },
    );
  return groupAssets(response.data.results);
}

function groupAssets(assets: IncidentAniAsset[]) {
  const assetsByType = {} as GroupedAssets;

  // Group assets by their asset type
  for (const asset of assets) {
    const assetType: string = asset.asset_type;
    if (!assetsByType[assetType]) {
      assetsByType[assetType] = [];
    }
    assetsByType[assetType].push(asset);
  }

  return assetsByType;
}

async function showCmsDetails(newItem) {
  await component({
    title: formatCmsItem(newItem.title),
    component: CmsViewer,
    classes: 'w-full h-96 overflow-auto p-3',
    modalClasses: 'bg-white max-w-3xl shadow',
    props: {
      title: formatCmsItem(newItem.title),
      content: formatCmsItem(newItem.content),
      image: newItem.thumbnail_file?.blog_url,
    },
  });
}

function getIncidentPhoneNumbers(incident) {
  if (!incident.active_phone_number) {
    return '';
  }

  if (Array.isArray(incident.active_phone_number)) {
    return incident.active_phone_number
      .map((number) => formatNationalNumber(String(number)))
      .join(', ');
  }

  return formatNationalNumber(String(incident.active_phone_number));
}

const downloadAsset = async (asset: IncidentAniAsset) => {
  const response = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/incident_assets/${
      asset.id
    }/download`,
    {
      responseType: 'blob',
    },
  );

  forceFileDownload(response);
};

function scrollToHash(hash: string) {
  if (hash) {
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView();
    }
  }
}

onMounted(async () => {
  const response: AxiosResponse<{ results: Incident[] }> = await axios.get(
    `${
      import.meta.env.VITE_APP_API_BASE_URL
    }/incidents?fields=id,name,short_name,active_phone_number&start_at__gt=${sixtyDaysAgo.toISOString()}`,
  );
  incidents.value = response.data.results;

  const cmsItemsPromises = incidents.value.reduce((acc, incident) => {
    acc[incident.id] = getCmsItems(incident.id);
    return acc;
  }, {});

  cmsItems.value = await hash(cmsItemsPromises);

  const assetPromises = incidents.value.reduce((acc, incident) => {
    acc[incident.id] = getAssets(incident.id);
    return acc;
  }, {});
  incidentAssets.value = await hash(assetPromises);

  showIncidentDetails.value = incidents.value.reduce((acc, incident) => {
    acc[incident.id] = true;
    return acc;
  }, {});

  showIncidentDetails.value = { ...showIncidentDetails.value };

  nextTick(() => {
    scrollToHash(route.hash);
  });
});
</script>

<style scoped></style>
