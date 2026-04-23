<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';
import useCallSimulator from '@/hooks/phone/useCallSimulator';
import type { SimulateInput } from '@/hooks/phone/useCallSimulator';
import useCurrentUser from '@/hooks/useCurrentUser';
import { store } from '@/store';
import { getErrorMessage } from '@/utils/errors';

const { t } = useI18n();
const { isAdmin, userPreferences } = useCurrentUser();
const enabled = computed(
  () =>
    Boolean(isAdmin.value) &&
    Boolean(userPreferences.value?.enable_call_simulator),
);
const $toasted = useToast();
const { simulateInbound, simulateOutbound, endSimulation } = useCallSimulator();

type Direction = 'INBOUND' | 'OUTBOUND';

const direction = ref<Direction>('INBOUND');
const dnisId = ref('');
const dnis = ref('');
const phoneInboundId = ref('');
const phoneInboundSessionId = ref('');
const phoneOutboundId = ref('');
const incidentIdInput = ref('');
const busy = ref(false);

const currentIncidentId = computed(
  () => store.getters['incident/currentIncidentId'],
);
const caller = computed(() => store.getters['phone/caller']);
const call = computed(() => store.getters['phone/call']);
const callType = computed(() => store.getters['phone/callType']);
const callState = computed(() => store.getters['phone/callState']);
const currentDnisHistoryRecord = computed(
  () => store.getters['phone/currentDnisHistoryRecord'],
);
const isOnCall = computed(() => store.getters['phone/isOnCall']);

const debugDump = computed(() =>
  JSON.stringify(
    {
      callState: callState.value,
      callType: callType.value,
      caller: caller.value,
      call: call.value,
      currentDnisHistoryRecord: currentDnisHistoryRecord.value,
    },
    null,
    2,
  ),
);

function buildInput(): SimulateInput {
  return {
    dnisId: dnisId.value.trim() || undefined,
    dnis: dnis.value.trim() || undefined,
    phoneInboundId: phoneInboundId.value.trim() || undefined,
    phoneInboundSessionId: phoneInboundSessionId.value.trim() || undefined,
    phoneOutboundId: phoneOutboundId.value.trim() || undefined,
    incidentId:
      incidentIdInput.value.trim() || currentIncidentId.value || undefined,
  };
}

async function handleSimulate() {
  busy.value = true;
  try {
    const input = buildInput();
    await (direction.value === 'INBOUND'
      ? simulateInbound(input)
      : simulateOutbound(input));
    $toasted.success(
      t('phoneDashboard.call_simulator_started', 'Simulated call started'),
    );
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    busy.value = false;
  }
}

async function handleEnd() {
  busy.value = true;
  try {
    await endSimulation();
    $toasted.success(
      t('phoneDashboard.call_simulator_ended', 'Simulated call ended'),
    );
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div
    v-if="enabled"
    class="call-simulator p-6 overflow-auto"
    data-testid="testCallSimulator"
  >
    <div class="max-w-2xl mx-auto flex flex-col gap-4">
      <div>
        <h2 class="text-xl font-semibold">
          {{ t('phoneDashboard.call_simulator', 'Call Simulator') }}
        </h2>
        <p class="text-sm text-crisiscleanup-dark-300 mt-1">
          {{
            t(
              'phoneDashboard.call_simulator_description',
              'Dev-only. Hydrates the phone UI as if a real call had arrived — no WebSocket, no audio. Provide at least a DNIS id or raw phone number; existing inbound/outbound ids override creation of a dummy record.',
            )
          }}
        </p>
      </div>

      <div class="flex gap-2" role="radiogroup">
        <BaseButton
          :variant="direction === 'INBOUND' ? 'solid' : 'outline'"
          data-testid="testSimDirectionInbound"
          :text="t('phoneDashboard.inbound', 'Inbound')"
          :alt="t('phoneDashboard.inbound', 'Inbound')"
          class="px-4 py-2 flex-1"
          @click="direction = 'INBOUND'"
        />
        <BaseButton
          :variant="direction === 'OUTBOUND' ? 'solid' : 'outline'"
          data-testid="testSimDirectionOutbound"
          :text="t('phoneDashboard.outbound', 'Outbound')"
          :alt="t('phoneDashboard.outbound', 'Outbound')"
          class="px-4 py-2 flex-1"
          @click="direction = 'OUTBOUND'"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <BaseInput
          v-model="dnisId"
          data-testid="testSimDnisIdInput"
          :placeholder="t('phoneDashboard.dnis_id', 'DNIS id (numeric)')"
          size="large"
        />
        <BaseInput
          v-model="dnis"
          data-testid="testSimDnisInput"
          :placeholder="
            t(
              'phoneDashboard.raw_dnis',
              'Raw DNIS phone number (e.g. 5551234567)',
            )
          "
          size="large"
        />

        <template v-if="direction === 'INBOUND'">
          <BaseInput
            v-model="phoneInboundId"
            data-testid="testSimPhoneInboundId"
            :placeholder="
              t(
                'phoneDashboard.phone_inbound_id',
                'Existing phone_inbound id (optional)',
              )
            "
            size="large"
          />
          <BaseInput
            v-model="phoneInboundSessionId"
            data-testid="testSimPhoneInboundSessionId"
            :placeholder="
              t(
                'phoneDashboard.phone_inbound_session_id',
                'Existing phone_inbound session_id (optional)',
              )
            "
            size="large"
          />
        </template>

        <template v-else>
          <BaseInput
            v-model="phoneOutboundId"
            data-testid="testSimPhoneOutboundId"
            :placeholder="
              t(
                'phoneDashboard.phone_outbound_id',
                'Existing phone_outbound id (optional)',
              )
            "
            size="large"
          />
        </template>

        <BaseInput
          v-model="incidentIdInput"
          data-testid="testSimIncidentId"
          :placeholder="
            t(
              'phoneDashboard.incident_id_override',
              `Incident id (defaults to current: ${currentIncidentId ?? 'none'})`,
            )
          "
          size="large"
        />
      </div>

      <div class="flex gap-2">
        <BaseButton
          variant="solid"
          data-testid="testSimRunButton"
          class="px-5 py-2 flex-1"
          :disabled="busy"
          :text="
            busy
              ? t('phoneDashboard.simulating', 'Simulating…')
              : t('phoneDashboard.simulate_call', 'Simulate call')
          "
          :alt="t('phoneDashboard.simulate_call', 'Simulate call')"
          @click="handleSimulate"
        />
        <BaseButton
          v-if="isOnCall"
          variant="outline"
          data-testid="testSimEndButton"
          class="px-5 py-2 flex-1"
          :disabled="busy"
          :text="t('phoneDashboard.end_simulated_call', 'End simulated call')"
          :alt="t('phoneDashboard.end_simulated_call', 'End simulated call')"
          @click="handleEnd"
        />
      </div>

      <div>
        <h3 class="text-sm font-semibold mb-1">
          {{ t('phoneDashboard.simulator_state', 'Current phone store state') }}
        </h3>
        <pre
          class="text-xs bg-crisiscleanup-light-grey p-3 rounded overflow-auto max-h-80"
          data-testid="testSimDebugDump"
          >{{ debugDump }}</pre
        >
      </div>
    </div>
  </div>
</template>
