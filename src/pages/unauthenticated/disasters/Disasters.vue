<template>
  <Home no-hotline>
    <div>
      <div class="text-3xl my-6" data-testid="testCurrentDisastersHeader">
        {{ $t('disasters.active_disasters') }}
      </div>
      <div
        v-for="incident in incidents"
        :key="incident.id"
        class="mb-5 border rounded cursor-pointer"
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
              incident.active_phone_number &&
              incident.active_phone_number.length > 0
            "
            class="flex items-center gap-5 text-base"
          >
            {{ $t('disasters.hotlines') }}
            <div class="flex gap-2">
              <a
                v-for="number in incident.active_phone_number"
                :key="number"
                class="bg-primary-light bg-opacity-30 py-1 px-3 rounded-full"
                :href="`tel:${number}`"
              >
                {{ formatNationalNumber(String(number)) }}
              </a>
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
        <AccordionItem :name="$t('survivor.what_is_ccu')">
          <p v-html="$t('survivor.ccu_for_relief_agencies')"></p>
        </AccordionItem>
        <AccordionItem :name="$t('survivor.can_i_ask_for_help')">
          <p v-html="$t('survivor.yes_call_number_at_top')"></p>
        </AccordionItem>
        <AccordionItem :name="$t('survivor.when')">
          <p v-html="$t('survivor.we_dont_know')"></p>
        </AccordionItem>
        <AccordionItem :name="$t('survivor.is_it_in_scope')">
          <p v-html="$t('survivor.in_scope')"></p>
          <ul>
            <li v-html="$t('survivor.small_tree')"></li>
            <li v-html="$t('survivor.tarping')"></li>
            <li v-html="$t('survivor.muck_out')"></li>
            <li v-html="$t('survivor.debris_to_curb')"></li>
          </ul>
          <p v-html="$t('survivor.out_of_scope')"></p>
          <ul>
            <li v-html="$t('survivor.large_tree')"></li>
            <li v-html="$t('survivor.fire_cleanup')"></li>
            <li v-html="$t('survivor.permits')"></li>
            <li v-html="$t('survivor.debris_to_landfill')"></li>
          </ul>
        </AccordionItem>
        <AccordionItem :name="$t('survivor.guarantee_good_job')">
          <p v-html="$t('survivor.non_professional_volunteers')"></p>
        </AccordionItem>
        <AccordionItem :name="$t('survivor.can_i_view')">
          <p v-html="$t('survivor.cannot_view_can_request_delete')"></p>
        </AccordionItem>
        <AccordionItem :name="$t('survivor.relief_agencies_using_ccu')">
          <p v-html="$t('survivor.just_ask')"></p>
        </AccordionItem>
        <AccordionItem :name="$t('survivor.what_can_i_do')">
          <p v-html="$t('survivor.be_patient')"></p>
          <p v-html="$t('survivor.be_persistent')"></p>
          <p v-html="$t('survivor.never_give_up_hope')"></p>
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
import { formatNationalNumber } from '@/filters';
import camelCase from 'lodash/camelCase';
import Accordion from '@/components/accordion/Accordion.vue';
import AccordionItem from '@/components/accordion/AccordionItem.vue';

const route = useRoute();
const incidents = ref<Incident>([]);
const sixtyDaysAgo = moment().subtract(60, 'days');

onMounted(async () => {
  const response: AxiosResponse<{ results: Incident[] }> = await axios.get(
    `${
      import.meta.env.VITE_APP_API_BASE_URL
    }/incidents?fields=id,name,short_name,active_phone_number,start_at&start_at__gt=${sixtyDaysAgo.toISOString()}`,
  );
  incidents.value = response.data.results;
});
</script>

<style scoped></style>
