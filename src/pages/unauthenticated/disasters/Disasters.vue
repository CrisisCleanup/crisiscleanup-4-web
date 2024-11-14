<template>
  <Home no-hotline>
    <div
      v-if="loading"
      class="flex justify-center items-center h-full bg-crisiscleanup-light-smoke"
    >
      <spinner />
    </div>
    <div v-else class="bg-crisiscleanup-light-smoke p-6 h-full">
      <div class="text-3xl mb-6" data-testid="testCurrentDisastersHeader">
        {{ $t('disasters.active_disasters') }}
      </div>
      <div
        v-for="incident in incidents"
        :key="incident.id"
        class="mb-5 border rounded cursor-pointer bg-white"
        @click="$router.push('/disasters/' + incident.id)"
      >
        <div :id="camelCase(incident.short_name)" class="p-5 my-3 block">
          <div class="text-2xl font-semibold flex items-center justify-between">
            {{ incident.name }}
            <font-awesome-icon
              :icon="['fas', 'chevron-right']"
              class="cursor-pointer"
            />
          </div>
          <div class="text-lg mb-3 opacity-60">
            {{ moment(incident.start_at).format('MMMM Y') }}
          </div>
          <div class="inline-block items-center overflow-hidden">
            <div
              v-if="
                incidentAniMap[incident.id] &&
                incidentAniMap[incident.id].length > 0
              "
              class="grid items-center gap-2"
            >
              <div
                v-for="ani in incidentAniMap[incident.id]"
                :key="ani.id"
                class="flex flex-wrap items-center gap-2"
              >
                <PhoneNumberDisplay :phone-number="ani.phone_number" />
                <span class="italic opacity-50 text-sm">
                  {{ $t('disasters.hotline_closes_in') }}
                  {{ formatHotlineClosingDate(getAniClosingDate(ani)) }}
                </span>
              </div>
            </div>
            <div v-if="incidentsAssetsMap[incident.id]">
              <div
                class="flex mt-4 items-end overflow-x-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-none"
              >
                <template v-for="assetGroup in incidentsAssetsMap[incident.id]">
                  <div
                    v-for="asset in assetGroup.filter(
                      (a) => a.files.length > 0,
                    )"
                    :key="`${asset.asset_type}:${asset.language}:${asset.ani}`"
                    class="p-3 w-min cursor-pointer"
                  >
                    <PdfViewer
                      v-if="
                        asset.files[0].mime_content_type === 'application/pdf'
                      "
                      :pdf="asset.files[0]"
                      :show-download-button="false"
                      :width="75"
                    />
                    <img
                      v-else
                      :src="asset.files[0].general_file_url"
                      :alt="asset.files[0].filename"
                      class="h-18 max-w-84"
                    />
                    <div class="mt-2 w-min">
                      <LanguageTag :language-id="asset.language" />
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="flex items-center gap-2 text-base text-crisiscleanup-dark-blue mb-3 underline"
      >
        <router-link to="/disasters/archived">
          {{ $t('disasters.view_archived_disasters') }}
        </router-link>
        <font-awesome-icon
          :icon="['fas', 'arrow-right']"
          class="text-primary cursor-pointer"
        />
      </div>

      <div class="text-3xl mt-6" data-testid="testCurrentDisastersHeader">
        {{ $t('disasters.for_survivors') }}
      </div>

      <div class="font-semibold mb-2">
        {{ $t('disasters.faq') }}
      </div>

      <Accordion>
        <AccordionItem
          v-for="(faq, index) in faqs"
          :key="index"
          :name="$t(faq.name)"
          icon-style="plus-minus"
          classes="my-2"
          button-classes="w-full text-left bg-white py-2 px-4 focus:outline-none flex justify-between items-center"
          body-classes="bg-white p-4"
        >
          <div v-if="Array.isArray(faq.content)">
            <div v-for="(item, subIndex) in faq.content" :key="subIndex">
              <p v-if="!item.isList" v-html="$t(item.text)"></p>
              <ul v-else>
                <li
                  v-for="(listItem, listIndex) in item.items"
                  :key="listIndex"
                  v-html="$t(listItem)"
                ></li>
              </ul>
            </div>
          </div>
          <p v-else v-html="$t(faq.content)"></p>
        </AccordionItem>
      </Accordion>
    </div>
  </Home>
</template>

<script setup lang="ts">
import Home from '@/layouts/Home.vue';
import moment from 'moment/moment';
import type Incident from '@/models/Incident';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import camelCase from 'lodash/camelCase';
import Accordion from '@/components/accordion/Accordion.vue';
import AccordionItem from '@/components/accordion/AccordionItem.vue';
import type { Ani } from '@/models/types';
import Spinner from '@/components/Spinner.vue';
import type { GroupedAssets } from '@/components/admin/incidents/IncidentAssetBuilder.vue';
import { hash } from '@/utils/promise';
import { getAssets } from '@/utils/incident_assets';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay.vue';
import PdfViewer from '@/components/PdfViewer.vue';
import LanguageTag from '@/components/tags/LanguageTag.vue';
import { formatHotlineClosingDate, getAniClosingDate } from '@/utils/helpers';

interface Faq {
  name: string;
  content: string | { text?: string; items?: string[]; isList: boolean }[];
}

const route = useRoute();
const loading = ref(false);
const incidents = ref<Incident[]>([]);
const incidentAniMap = ref<Record<number, Ani[]>>({});
const incidentsAssetsMap = ref<Record<number, GroupedAssets>>({});
const faqs: Faq[] = [
  {
    name: 'survivor.what_is_ccu',
    content: 'survivor.ccu_for_relief_agencies',
  },
  {
    name: 'survivor.can_i_ask_for_help',
    content: 'survivor.yes_call_number_at_top',
  },
  {
    name: 'survivor.when',
    content: 'survivor.we_dont_know',
  },
  {
    name: 'survivor.is_it_in_scope',
    content: [
      { text: 'survivor.in_scope', isList: false },
      {
        isList: true,
        items: [
          'survivor.small_tree',
          'survivor.tarping',
          'survivor.muck_out',
          'survivor.debris_to_curb',
        ],
      },
      { text: 'survivor.out_of_scope', isList: false },
      {
        isList: true,
        items: [
          'survivor.large_tree',
          'survivor.fire_cleanup',
          'survivor.permits',
          'survivor.debris_to_landfill',
        ],
      },
    ],
  },
  {
    name: 'survivor.guarantee_good_job',
    content: 'survivor.non_professional_volunteers',
  },
  {
    name: 'survivor.can_i_view',
    content: 'survivor.cannot_view_can_request_delete',
  },
  {
    name: 'survivor.relief_agencies_using_ccu',
    content: 'survivor.just_ask',
  },
  {
    name: 'survivor.what_can_i_do',
    content: [
      { text: 'survivor.be_patient', isList: false },
      { text: 'survivor.be_persistent', isList: false },
      { text: 'survivor.never_give_up_hope', isList: false },
    ],
  },
];

async function fetchAllAssets() {
  const promises = incidents.value.reduce((acc, incident) => {
    acc[incident.id] = getAssets(incident.id);
    return acc;
  }, {});

  return await hash(promises);
}

onMounted(async () => {
  loading.value = true;
  const response: AxiosResponse<{ results: Incident[] }> = await axios.get(
    `${
      import.meta.env.VITE_APP_API_BASE_URL
    }/incidents_list?fields=id,name,short_name,active_phone_number,start_at&limit=20&sort=-start_at`,
  );
  incidents.value = response.data.results.filter(
    (incident) =>
      Array.isArray(incident.active_phone_number) &&
      incident.active_phone_number.length > 0,
  );

  const aniIncidentResponse = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/ani_incidents`,
    {
      params: {
        incident__in: incidents.value.map((incident) => incident.id).join(','),
      },
    },
  );

  for (const incident of incidents.value) {
    const aniIncidents = aniIncidentResponse.data.results.filter(
      (aniIncident: Ani) => aniIncident.incident === incident.id,
    );

    incidentAniMap.value[incident.id] = aniIncidents;
  }

  incidentsAssetsMap.value = await fetchAllAssets();

  loading.value = false;
});
</script>

<style scoped></style>
