<script setup lang="ts">
import useConnectFirst from '@/hooks/useConnectFirst';
import { computed, watch } from 'vue';
import Worksite from '@/models/Worksite';
import useScripts from '@/hooks/phone/useScripts';
import { useStore } from 'vuex';
import type { WorkType } from '@/models/types';
import useWorktypeImages from '@/hooks/worksite/useWorktypeImages';
import { getQueryString } from '@/utils/urls';
import moment from '@/utils/dates';
import PhoneFaqRAG from '@/components/phone/PhoneFaqRAG.vue';
import CurrentCallVoicemail from '@/components/phone/CurrentCallVoicemail.vue';
import BasePill from '@/components/BasePill.vue';
import PaneEmpty from '@/components/phone/foundation/PaneEmpty.vue';
import useVoicemailContext from '@/hooks/phone/useVoicemailContext';

const emit = defineEmits(['setCase']);
const { getWorktypeSVG } = useWorktypeImages();
const { t } = useI18n();

const { caseId } = defineProps({
  caseId: {
    type: Number,
    default: null,
  },
});

const { callType, call, caller } = useConnectFirst({ emit });
const store = useStore();

const cases = ref<Record<string, any>[]>([]);
const currentIncident = store.getters['incident/currentIncidentId'];

const voicemailCtx = useVoicemailContext(call, caller);
const callerAgeInDays = computed(() =>
  caller.value ? moment().diff(moment(caller.value.created_at), 'days') : 0,
);

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
  <div
    class="w-full h-full min-h-0 flex flex-col gap-4 overflow-y-auto"
    data-testid="testCurrentCall"
  >
    <!-- Call details header -->
    <section
      class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex items-center gap-3 flex-wrap"
    >
      <h2
        class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900"
      >
        {{ $t('phoneDashboard.details') }}
      </h2>
      <div
        v-if="caller"
        class="ml-auto flex items-center gap-2"
        data-testid="testNumberOfInboundCallsDiv"
      >
        <BasePill variant="dark">
          {{ $t('~~{n} calls', { n: caller.number_of_inbound_calls }) }}
        </BasePill>
        <BasePill variant="incident">
          {{ $t('~~{n} days', { n: callerAgeInDays }) }}
        </BasePill>
      </div>
    </section>

    <!-- Suggested Script — full width, extends downward as the script grows -->
    <section
      class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3 min-w-0"
    >
      <h3
        class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900"
      >
        {{ $t('phoneDashboard.suggested_script') }}
      </h3>
      <div
        class="text-[15px] leading-relaxed text-black min-w-0 prose-script max-h-[50vh] overflow-y-auto pr-1"
        v-html="suggestedScript"
      />
    </section>

    <!-- Cases + FAQ — two columns below -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Existing Cases -->
      <section
        class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3 min-w-0"
      >
        <h3
          class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900"
        >
          {{ $t('phoneDashboard.existing_cases') }}
        </h3>
        <div
          v-if="cases.length > 0"
          class="max-h-80 overflow-auto flex flex-col gap-2 -mx-1 px-1"
        >
          <button
            v-for="c in cases"
            :key="c.id"
            type="button"
            :data-testid="`test${c.id}Content`"
            class="text-left p-3 border rounded transition"
            :class="
              c.id === caseId
                ? 'border-primary bg-primary-light'
                : 'border-crisiscleanup-grey-100 bg-white hover:bg-crisiscleanup-smoke'
            "
            @click="() => setCase(c)"
          >
            <div class="flex items-center gap-2 mb-1">
              <span
                class="cases-svg-container p-1 bg-crisiscleanup-smoke rounded"
                data-testid="testWorktypeSVGIcon"
                v-html="getSVG(c.worktype)"
              />
              <span
                class="text-[13px] font-semibold text-black"
                data-testid="testCaseNumberDiv"
              >
                {{ c.caseNumber }}
              </span>
            </div>
            <div class="text-[13px] text-black" data-testid="testCaseNameDiv">
              {{ c.name }}
            </div>
            <div
              class="text-[12px] text-crisiscleanup-grey-900"
              data-testid="testCaseAddressStateDiv"
            >
              {{ c.address }} {{ c.state }}
            </div>
          </button>
        </div>
        <PaneEmpty
          v-else
          :title="$t('~~No recent cases')"
          :description="
            $t('~~New cases from this phone number will appear here.')
          "
        />
      </section>

      <!-- FAQ -->
      <section
        class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3 min-w-0"
      >
        <h3
          class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900"
        >
          {{ $t('phoneDashboard.faq') }}
        </h3>
        <PhoneFaqRAG />
      </section>
    </div>

    <!-- Voicemail pane (conditional, below grid, scrolls internally) -->
    <CurrentCallVoicemail
      v-if="voicemailCtx.hasVoicemail"
      :key="call?.id ?? 'no-call'"
      :outbound="call"
      :caller="caller"
    />
  </div>
</template>

<style scoped lang="postcss">
.cases-svg-container :deep(svg) {
  width: 20px;
  height: 20px;
}

.prose-script :deep(p) {
  margin-bottom: 0.75rem;
}
.prose-script :deep(p:last-child) {
  margin-bottom: 0;
}
.prose-script :deep(strong) {
  @apply font-semibold text-crisiscleanup-grey-900;
}
.prose-script :deep(br + strong) {
  @apply block mt-2;
}
</style>
