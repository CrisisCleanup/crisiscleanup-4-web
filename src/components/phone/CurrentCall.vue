<script setup lang="ts">
import useConnectFirst from '@/hooks/useConnectFirst';
import { computed, watch } from 'vue';
import Worksite from '@/models/Worksite';
import useScripts from '@/hooks/phone/useScripts';
import { useStore } from 'vuex';
import type { WorkType } from '@/models/types';
import useWorktypeImages from '@/hooks/worksite/useWorktypeImages';
import { getQueryString } from '@/utils/urls';
const emit = defineEmits(['setCase']);
const { getWorktypeSVG } = useWorktypeImages();
import moment from 'moment';
import PhoneFaqRAG from '@/components/phone/PhoneFaqRAG.vue';
const { t } = useI18n();

const { caseId } = defineProps({
  caseId: {
    type: Number,
    default: null,
  },
});

const {
  isTakingCalls,
  isTransitioning,
  isOnCall,
  callType,
  call,
  caller,
  callState,
  isInboundCall,
  isOutboundCall,
  setPotentialFailedCall,
} = useConnectFirst({
  emit,
});
const store = useStore();

const cases = ref<Record<string, any>[]>([]);
const currentIncident = store.getters['incident/currentIncidentId'];
function getSVG(worktype: WorkType) {
  return getWorktypeSVG(worktype);
}
function setCase(caseObject: Record<string, any> | null) {
  emit('setCase', caseObject);
}
watch(
  () => call.value,
  (newValue) => {
    if (newValue && newValue.dnis1) {
      const params = {
        phone1_dnis: newValue.dnis1,
      };
      Worksite.api()
        .get(`/worksites?${getQueryString(params)}`, {
          dataKey: 'results',
        })
        .then((results) => {
          const worksites = (results.entities?.worksites || []) as Worksite[];
          cases.value = worksites
            .map((c) => {
              return {
                name: c.name,
                caseNumber: c.case_number ?? `PDA-${c.id}`,
                address: c.short_address,
                state: c.state,
                worktype: Worksite.getWorkType(c.work_types, null, null),
                fullAddress: c.full_address,
                id: c.id,
                type: c.case_number ? 'worksite' : 'pda',
                incident: c.incident,
                updated_at: c.updated_at,
              };
            })
            .filter((c) => Boolean(c.worktype));
        })
        .catch((error) => {
          console.error(error);
        });
    }
  },
);

const suggestedScript = computed(() => {
  const scripts = useScripts({
    callType: callType.value,
    incident: currentIncident,
    recentWorksite: cases.value[0],
  });
  return t(scripts.currentScript.value);
});
</script>

<template>
  <div>
    <div class="flex gap-4">
      <div class="font-bold mb-4">{{ $t('phoneDashboard.details') }}</div>
      <div
        v-if="caller"
        data-testid="testNumberOfInboundCallsDiv"
        class="text-sm text-crisiscleanup-dark-200 mt-1"
      >
        {{
          `${caller.number_of_inbound_calls} ${$t(
            'phoneDashboard.calls',
          )} | ${moment().diff(moment(caller.created_at), 'days')} ${$t(
            'phoneDashboard.days',
          )}`
        }}
      </div>
    </div>
    <div class="grid grid-cols-3 gap-5">
      <div class="prompts">
        <div class="font-bold">{{ $t('phoneDashboard.suggested_script') }}</div>
        <span v-html="suggestedScript"></span>
      </div>
      <div class="cases">
        <div class="font-bold">{{ $t('phoneDashboard.existing_cases') }}</div>
        <div class="h-120 overflow-auto">
          <div
            v-for="c in cases"
            :key="`${c.id}`"
            :data-testid="`test${c.id}Content`"
            class="flex-grow-0 flex-shrink-0 w-56 m-1"
          >
            <div
              class="cursor-pointer p-1 h-full w-full"
              :class="c.id === caseId ? 'border border-black' : ''"
              @click="() => setCase(c)"
            >
              <div class="flex items-center">
                <div
                  class="cases-svg-container p-1"
                  data-testid="testWorktypeSVGIcon"
                  v-html="getSVG(c.worktype)"
                ></div>
                <div class="px-1" data-testid="testCaseNumberDiv">
                  {{ c.caseNumber }}
                </div>
              </div>
              <div class="px-1" data-testid="testCaseNameDiv">{{ c.name }}</div>
              <div class="text-sm p-1" data-testid="testCaseAddressStateDiv">
                {{ c.address }} {{ c.state }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="faq">
        <div class="font-bold">{{ $t('phoneDashboard.faq') }}</div>
        <PhoneFaqRAG />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
