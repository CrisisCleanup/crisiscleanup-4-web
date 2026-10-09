<template>
  <div
    class="flex flex-col gap-4 bg-crisiscleanup-smoke p-3"
    data-testid="testAdminVoiceConsole"
  >
    <div
      class="rounded border border-primary-dark bg-primary-light/30 p-2 text-sm"
      data-testid="testVoiceConsoleTestNotice"
    >
      {{
        t(
          'voiceConsole.test_call_notice',
          'Calls from this page are test calls. No text message goes to the caller, and a case the agent creates is flagged for deletion and removed after one hour.',
        )
      }}
    </div>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)]">
      <!-- Call -->
      <section
        class="flex flex-col gap-3 rounded-lg border border-crisiscleanup-grey-100 bg-white p-4"
      >
        <div
          class="grid grid-cols-2 gap-3 md:grid-cols-4"
          :class="{ 'pointer-events-none opacity-60': isLive }"
        >
          <label
            class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
          >
            {{ t('voiceConsole.line', 'Line') }}
            <select
              v-model="settings.language"
              class="mt-1 rounded border p-1.5 text-sm normal-case text-black"
              data-testid="testVoiceLanguageSelect"
            >
              <option
                v-for="(label, code) in config.languages"
                :key="code"
                :value="code"
              >
                {{ label }}
              </option>
            </select>
          </label>
          <label
            class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
          >
            {{ t('voiceConsole.model', 'Model') }}
            <select
              v-model="settings.model"
              class="mt-1 rounded border p-1.5 text-sm normal-case text-black"
              data-testid="testVoiceModelSelect"
            >
              <option
                v-for="model in config.models"
                :key="model"
                :value="model"
              >
                {{ model }}
              </option>
            </select>
          </label>
          <label
            class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
          >
            {{ t('voiceConsole.voice', 'Voice') }}
            <select
              v-model="settings.voice"
              class="mt-1 rounded border p-1.5 text-sm normal-case text-black"
              data-testid="testVoiceVoiceSelect"
            >
              <option v-for="voice in voices" :key="voice" :value="voice">
                {{ voice }}
              </option>
            </select>
          </label>
          <div
            class="flex flex-col justify-end text-xs text-crisiscleanup-dark-300"
          >
            <span v-if="target"
              >{{ target.label }} ·
              {{
                target.agent ||
                t('voiceConsole.auto_dispatch', 'automatic dispatch')
              }}</span
            >
          </div>
        </div>

        <div
          class="flex flex-wrap items-center gap-3 border-y border-crisiscleanup-grey-100 py-3"
        >
          <BaseButton
            variant="solid"
            :action="startCall"
            :disabled="isLive || status === 'connecting'"
            :text="
              isLive
                ? t('voiceConsole.on_call', 'On call')
                : t('voiceConsole.start_call', 'Start call')
            "
            :alt="t('voiceConsole.start_call', 'Start call')"
            data-testid="testVoiceStartCallButton"
          />
          <BaseButton
            variant="outline"
            :action="disconnect"
            :disabled="!isLive"
            :text="t('voiceConsole.hang_up', 'Hang up')"
            :alt="t('voiceConsole.hang_up', 'Hang up')"
            data-testid="testVoiceHangUpButton"
          />
          <BaseCheckbox
            :model-value="muted"
            :disabled="!isLive"
            @update:model-value="setMuted"
          >
            {{ t('voiceConsole.mute', 'Mute mic') }}
          </BaseCheckbox>
          <span class="ml-auto flex items-center gap-3 text-sm">
            <span class="font-semibold uppercase" :class="agentStateClass">{{
              agentStateLabel
            }}</span>
            <span class="text-xl font-bold tabular-nums">{{
              formatClock(elapsed)
            }}</span>
          </span>
        </div>

        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">
            {{ t('voiceConsole.transcript', 'Transcript') }}
          </h2>
          <div class="flex gap-3 text-sm">
            <button type="button" class="underline" @click="exportJson">
              {{ t('voiceConsole.export_json', 'Export JSON') }}
            </button>
            <button type="button" class="underline" @click="exportText">
              {{ t('voiceConsole.export_text', 'Export text') }}
            </button>
          </div>
        </div>
        <div
          ref="transcriptEl"
          class="flex h-[40vh] flex-col gap-2 overflow-y-auto"
          data-testid="testVoiceTranscript"
        >
          <p
            v-if="call.transcript.length === 0"
            class="text-sm text-crisiscleanup-dark-300"
          >
            {{
              t(
                'voiceConsole.transcript_empty',
                'Start a call, or run a simulated caller. The conversation shows here as it happens.',
              )
            }}
          </p>
          <div
            v-for="line in call.transcript"
            :key="line.id"
            class="grid grid-cols-[4.5rem_1fr] gap-2 text-sm"
          >
            <span
              class="pt-1.5 text-right text-xs font-bold uppercase"
              :class="whoClass(line.who)"
            >
              {{ whoLabel(line.who) }}
              <span
                class="block font-normal normal-case text-crisiscleanup-dark-300"
                >{{ line.at }}</span
              >
            </span>
            <span
              class="rounded px-3 py-1.5"
              :class="[
                bubbleClass(line.who),
                { 'italic opacity-60': !line.final },
              ]"
              >{{ line.text }}</span
            >
          </div>
        </div>

        <!-- Simulated caller -->
        <div
          class="flex flex-col gap-2 border-t border-crisiscleanup-grey-100 pt-3"
          data-testid="testVoiceSimulatedCaller"
        >
          <h2 class="text-lg font-semibold">
            {{ t('voiceConsole.simulated_caller', 'Simulated caller') }}
          </h2>
          <p class="text-sm text-crisiscleanup-dark-300">
            {{
              t(
                'voiceConsole.simulated_caller_help',
                'A small model plays the caller from the fact sheet and answers out loud. Load an eval scenario or write your own facts.',
              )
            }}
          </p>
          <select
            v-model="scenarioKey"
            class="rounded border p-1.5 text-sm"
            data-testid="testVoiceScenarioSelect"
            @change="loadScenario"
          >
            <option value="">
              {{ t('voiceConsole.pick_scenario', 'Pick an eval scenario…') }}
            </option>
            <option
              v-for="scenario in scenarios"
              :key="scenario.key"
              :value="scenario.key"
            >
              {{ scenario.title }}
            </option>
          </select>
          <p
            v-if="expectation"
            class="rounded bg-crisiscleanup-green-100/15 p-2 text-sm"
          >
            {{ t('voiceConsole.pass_looks_like', 'Pass looks like:') }}
            {{ expectation }}
          </p>
          <textarea
            v-model="facts"
            rows="7"
            class="rounded border p-2 font-mono text-xs"
            data-testid="testVoiceFacts"
          />
          <div class="flex items-center gap-3">
            <BaseButton
              variant="solid"
              size="small"
              :action="runSimulated"
              :disabled="simulation.running || !facts.trim()"
              :text="t('voiceConsole.run_simulated_call', 'Run simulated call')"
              :alt="t('voiceConsole.run_simulated_call', 'Run simulated call')"
              data-testid="testVoiceRunSimulationButton"
            />
            <BaseButton
              variant="outline"
              size="small"
              :action="stopSimulation"
              :disabled="!simulation.running"
              :text="t('actions.stop', 'Stop')"
              :alt="t('actions.stop', 'Stop')"
            />
            <span class="text-sm text-crisiscleanup-dark-300">{{
              simulation.status
            }}</span>
          </div>
          <details class="text-xs text-crisiscleanup-dark-300">
            <summary class="cursor-pointer">
              {{ t('voiceConsole.connection_log', 'Connection log') }}
            </summary>
            <ul class="max-h-40 overflow-y-auto font-mono">
              <li v-for="(entry, index) in log" :key="index">{{ entry }}</li>
            </ul>
          </details>
        </div>
      </section>

      <!-- Inspector -->
      <aside
        class="self-start rounded-lg border border-crisiscleanup-grey-100 bg-white p-4 lg:sticky lg:top-3"
      >
        <div
          class="mb-3 flex gap-4 border-b border-crisiscleanup-grey-100"
          role="tablist"
        >
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.key"
            class="-mb-px border-b-2 pb-2 text-sm font-semibold"
            :class="
              activeTab === tab.key
                ? 'border-primary-dark'
                : 'border-transparent text-crisiscleanup-dark-300'
            "
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
            <span
              v-if="tab.key === 'tools' && call.tools.length > 0"
              class="text-xs text-primary-dark"
              >{{ call.tools.length }}</span
            >
          </button>
        </div>
        <VoiceCasePanel
          v-if="activeTab === 'case'"
          :case-state="call.caseState"
          :finalized="call.finalized"
        />
        <VoiceToolLog v-else-if="activeTab === 'tools'" :tools="call.tools" />
        <VoiceMetrics
          v-else-if="activeTab === 'metrics'"
          :metrics="call.metrics"
        />
        <VoiceCallHistory v-else />
        <p v-if="call.config" class="mt-3 text-xs text-crisiscleanup-dark-300">
          {{ t('voiceConsole.agent_running', 'Agent running') }}
          {{ call.config.model }} · {{ call.config.voice }} ·
          {{ call.config.language }}
        </p>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { useToast } from 'vue-toastification';
import VoiceCasePanel from '@/components/admin/voice/VoiceCasePanel.vue';
import VoiceToolLog from '@/components/admin/voice/VoiceToolLog.vue';
import VoiceMetrics from '@/components/admin/voice/VoiceMetrics.vue';
import VoiceCallHistory from '@/components/admin/voice/VoiceCallHistory.vue';
import { downloadText } from '@/components/admin/voice/download';
import {
  useVoiceConsole,
  voiceConsoleUrl,
} from '@/hooks/voice/useVoiceConsole';
import {
  type TranscriptLine,
  callToText,
  formatClock,
} from '@/hooks/voice/voiceConsoleState';
import { getErrorMessage } from '@/utils/errors';

interface ConsoleConfig {
  targets: { key: string; label: string; url: string; agent: string }[];
  languages: Record<string, string>;
  models: string[];
  default_model: string;
  openai_voices: string[];
  google_voices: string[];
  default_voice: string;
  default_google_voice: string;
}

interface Scenario {
  key: string;
  title: string;
  language: string;
  expectation: string;
  facts: string;
}

const { t } = useI18n();
const $toasted = useToast();
const {
  call,
  status,
  agentState,
  elapsed,
  muted,
  log,
  simulation,
  connect,
  disconnect,
  setMuted,
  runSimulation,
  stopSimulation,
} = useVoiceConsole();

const config = ref<ConsoleConfig>({
  targets: [],
  languages: { en: 'English', es: 'Español' },
  models: [],
  default_model: '',
  openai_voices: [],
  google_voices: [],
  default_voice: '',
  default_google_voice: '',
});
const settings = reactive({ language: 'en', model: '', voice: '' });
const scenarios = ref<Scenario[]>([]);
const scenarioKey = ref('');
const facts = ref('');
const expectation = ref('');
const activeTab = ref<'case' | 'tools' | 'metrics' | 'history'>('case');
const transcriptEl = ref<HTMLElement | null>(null);

const tabs = computed(() => [
  { key: 'case' as const, label: t('voiceConsole.case', 'Case') },
  { key: 'tools' as const, label: t('voiceConsole.tools', 'Tools') },
  { key: 'metrics' as const, label: t('voiceConsole.metrics', 'Metrics') },
  { key: 'history' as const, label: t('voiceConsole.history', 'History') },
]);

const isLive = computed(() => status.value === 'live');
const target = computed(() =>
  config.value.targets.find(
    (x: ConsoleConfig['targets'][number]) => x.key === 'local',
  ),
);
const isGemini = computed(() => settings.model.startsWith('gemini'));
const voices = computed(() =>
  isGemini.value ? config.value.google_voices : config.value.openai_voices,
);

watch(isGemini, () => {
  settings.voice = isGemini.value
    ? config.value.default_google_voice
    : config.value.default_voice;
});

const AGENT_STATES: Record<string, string> = {
  initializing: 'Agent joining',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  idle: 'Idle',
};
const agentStateLabel = computed(() =>
  agentState.value
    ? t(
        `voiceConsole.agent_${agentState.value}`,
        AGENT_STATES[agentState.value] ?? agentState.value,
      )
    : t('voiceConsole.agent_offline', 'Agent offline'),
);
const agentStateClass = computed(() => ({
  'text-crisiscleanup-dark-300': !agentState.value,
  'text-crisiscleanup-lightblue-700': agentState.value === 'listening',
  'text-primary-dark': agentState.value === 'thinking',
  'text-crisiscleanup-green-900': agentState.value === 'speaking',
}));

function whoLabel(who: TranscriptLine['who']) {
  return {
    agent: t('voiceConsole.agent', 'Agent'),
    caller: t('voiceConsole.caller', 'Caller'),
    simulated: t('voiceConsole.sim', 'Sim'),
  }[who];
}
function whoClass(who: TranscriptLine['who']) {
  return who === 'agent'
    ? 'text-crisiscleanup-green-900'
    : 'text-crisiscleanup-dark-400';
}
function bubbleClass(who: TranscriptLine['who']) {
  if (who === 'agent') return 'bg-crisiscleanup-green-100/15';
  if (who === 'simulated')
    return 'border border-dashed border-crisiscleanup-lightblue-700';
  return 'bg-crisiscleanup-lightblue-900';
}

watch(
  () => call.transcript.length,
  async () => {
    await nextTick();
    transcriptEl.value?.scrollTo({ top: transcriptEl.value.scrollHeight });
  },
);

async function startCall() {
  try {
    await connect({ ...settings });
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

async function runSimulated() {
  await runSimulation(facts.value, { ...settings });
}

function loadScenario() {
  const scenario = scenarios.value.find(
    (s: Scenario) => s.key === scenarioKey.value,
  );
  expectation.value = scenario?.expectation ?? '';
  if (!scenario) return;
  facts.value = scenario.facts;
  if (!isLive.value && scenario.language) settings.language = scenario.language;
}

function exportJson() {
  downloadText(
    `${call.room || 'voice-call'}.json`,
    JSON.stringify({ exported_at: new Date().toISOString(), ...call }, null, 2),
    'application/json',
  );
}

function exportText() {
  downloadText(
    `${call.room || 'voice-call'}.txt`,
    callToText(call),
    'text/plain',
  );
}

onMounted(async () => {
  try {
    const [configResponse, scenarioResponse] = await Promise.all([
      axios.get<ConsoleConfig>(voiceConsoleUrl('config')),
      axios.get<{ scenarios: Scenario[] }>(voiceConsoleUrl('eval_scenarios')),
    ]);
    config.value = configResponse.data;
    scenarios.value = scenarioResponse.data.scenarios;
    settings.model = config.value.models.includes(config.value.default_model)
      ? config.value.default_model
      : (config.value.models[0] ?? '');
    settings.voice = settings.model.startsWith('gemini')
      ? config.value.default_google_voice
      : config.value.default_voice;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
});
</script>
