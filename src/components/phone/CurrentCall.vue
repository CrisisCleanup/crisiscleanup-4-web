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
      // Get the worksites for the phone number within the last 60 days
      const params = {
        phone1_dnis: newValue.dnis1,
        created_at__gte: moment().subtract(60, 'days').toISOString(),
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
  <div class="bg-white rounded-lg shadow-sm p-6 w-full">
    <!-- Details Header Section -->
    <div
      class="flex flex-wrap gap-4 items-center mb-6 border-b border-gray-100 pb-4"
    >
      <div class="font-semibold text-lg text-gray-800">
        {{ $t('phoneDashboard.details') }}
      </div>
      <div
        v-if="caller"
        data-testid="testNumberOfInboundCallsDiv"
        class="text-sm text-gray-500 flex items-center gap-4"
      >
        <span class="flex items-center gap-1">
          <span class="inline-block w-2 h-2 rounded-full bg-green-500"></span>
          {{
            `${caller.number_of_inbound_calls} ${$t('phoneDashboard.calls')}`
          }}
        </span>
        <span class="text-gray-400">|</span>
        <span>
          {{
            `${moment().diff(moment(caller.created_at), 'days')} ${$t('phoneDashboard.days')}`
          }}
        </span>
      </div>
    </div>

    <!-- Content Grid Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Suggested Script Section -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div
          class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center"
        >
          <span
            class="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"
          ></span>
          {{ $t('phoneDashboard.suggested_script') }}
        </div>
        <div
          class="text-sm text-gray-700 leading-relaxed bg-white rounded-md p-4 shadow-sm"
          v-html="suggestedScript"
        ></div>
      </div>

      <!-- Cases Section -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div
          class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center"
        >
          <span
            class="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"
          ></span>
          {{ $t('phoneDashboard.existing_cases') }}
        </div>
        <div
          class="h-60 sm:h-80 lg:h-96 overflow-auto bg-white rounded-md shadow-sm custom-scrollbar"
        >
          <div
            v-for="c in cases"
            :key="`${c.id}`"
            :data-testid="`test${c.id}Content`"
            class="m-2"
          >
            <div
              class="cursor-pointer p-3 border rounded-md transition-all duration-200 hover:shadow-md hover:border-gray-400"
              :class="
                c.id === caseId
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500'
                  : 'border-gray-200 bg-white'
              "
              @click="() => setCase(c)"
            >
              <div class="flex items-center mb-2">
                <div
                  class="cases-svg-container p-1.5 bg-gray-100 rounded mr-2"
                  data-testid="testWorktypeSVGIcon"
                  v-html="getSVG(c.worktype)"
                ></div>
                <div
                  class="text-sm font-medium text-gray-800"
                  data-testid="testCaseNumberDiv"
                >
                  {{ c.caseNumber }}
                </div>
              </div>
              <div
                class="text-sm text-gray-700 mb-1"
                data-testid="testCaseNameDiv"
              >
                {{ c.name }}
              </div>
              <div
                class="text-xs text-gray-500"
                data-testid="testCaseAddressStateDiv"
              >
                {{ c.address }} {{ c.state }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div
          class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center"
        >
          <span
            class="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"
          ></span>
          {{ $t('phoneDashboard.faq') }}
        </div>
        <div class="bg-white rounded-md shadow-sm p-4">
          <PhoneFaqRAG />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.400') theme('colors.gray.100');
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}

.cases-svg-container :deep(svg) {
  width: 20px;
  height: 20px;
}
</style>
