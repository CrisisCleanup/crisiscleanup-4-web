<template>
  <Home no-hotline>
    <div class="bg-crisiscleanup-light-smoke p-6 h-full">
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
              class="flex gap-3 items-center"
            >
              <a
                class="bg-primary-light bg-opacity-30 py-1 px-3 rounded-full"
                :href="`tel:${ani.phone_number}`"
              >
                {{ $t('~~Hotline:') }}
                {{ formatNationalNumber(String(ani.phone_number)) }}
              </a>
              <span class="italic opacity-50 text-sm">
                {{ $t('Hotline closes in') }} {{ momentFromNow(ani.end_at) }}
              </span>
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
import { ref, onMounted } from 'vue';
import moment from 'moment/moment';
import type Incident from '@/models/Incident';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { formatNationalNumber, momentFromNow } from '@/filters';
import camelCase from 'lodash/camelCase';
import Accordion from '@/components/accordion/Accordion.vue';
import AccordionItem from '@/components/accordion/AccordionItem.vue';
import type { Ani } from '@/models/types';

interface Faq {
  name: string;
  content: string | { text?: string; items?: string[]; isList: boolean }[];
}

const route = useRoute();
const incidents = ref<Incident[]>([]);
const incidentAniMap = ref<Record<number, Ani[]>>({});
const sixtyDaysAgo = moment().subtract(60, 'days');
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

onMounted(async () => {
  const response: AxiosResponse<{ results: Incident[] }> = await axios.get(
    `${
      import.meta.env.VITE_APP_API_BASE_URL
    }/incidents?fields=id,name,short_name,active_phone_number,start_at&start_at__gt=${sixtyDaysAgo.toISOString()}`,
  );
  incidents.value = response.data.results.filter(
    (incident) => incident.active_phone_number,
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
});
</script>

<style scoped></style>
