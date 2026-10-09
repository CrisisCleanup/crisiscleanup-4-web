<template>
  <div class="flex flex-col gap-4 text-sm" data-testid="testVoiceCasePanel">
    <div
      v-if="finalized"
      class="flex items-center justify-between rounded bg-primary-light p-3"
      data-testid="testVoiceCaseCreated"
    >
      <div>
        <div class="text-xs font-semibold uppercase tracking-wide">
          {{ t('voiceConsole.case_created', 'Case created (test)') }}
        </div>
        <div class="text-2xl font-bold">{{ finalized.case_number }}</div>
      </div>
      <router-link
        v-if="caseState.incident"
        class="font-semibold underline"
        :to="`/incident/${caseState.incident.id}/work/${finalized.worksite_id}/edit`"
      >
        {{ t('voiceConsole.open_case', 'Open case') }}
      </router-link>
    </div>

    <div class="flex items-start justify-between gap-3">
      <div>
        <div
          class="text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
        >
          {{ t('voiceConsole.disaster', 'Disaster') }}
        </div>
        <div
          class="font-semibold"
          :class="{
            'font-normal text-crisiscleanup-dark-300': !caseState.incident,
          }"
        >
          {{
            caseState.incident?.name ??
            t('voiceConsole.not_resolved', 'Not resolved yet')
          }}
        </div>
      </div>
      <BasePill
        v-if="caseState.incident"
        :variant="caseState.ready ? 'completed' : 'in-progress'"
        show-dot
      >
        {{
          caseState.ready
            ? t('voiceConsole.ready', 'Ready to finalize')
            : t('voiceConsole.collecting', 'Collecting')
        }}
      </BasePill>
    </div>

    <div v-if="caseState.missing.length > 0">
      <div
        class="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
      >
        {{ t('voiceConsole.still_needed', 'Still needed') }}
      </div>
      <ul class="flex flex-wrap gap-1">
        <li
          v-for="item in caseState.missing"
          :key="item"
          class="rounded border border-dashed border-primary-dark px-2 py-0.5 text-xs"
        >
          {{ item }}
        </li>
      </ul>
    </div>

    <div>
      <div
        class="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
      >
        {{ t('voiceConsole.recorded', 'Recorded') }}
      </div>
      <p v-if="fieldEntries.length === 0" class="text-crisiscleanup-dark-300">
        {{
          t(
            'voiceConsole.nothing_recorded',
            'Nothing recorded yet. Fields show here when the agent saves them.',
          )
        }}
      </p>
      <table v-else class="w-full" data-testid="testVoiceCaseFields">
        <tbody>
          <tr
            v-for="[key, value] in fieldEntries"
            :key="key"
            class="border-b border-crisiscleanup-grey-100"
          >
            <td class="w-2/5 py-1 pr-2 text-crisiscleanup-dark-300">
              {{ key.replaceAll('_', ' ') }}
            </td>
            <td class="break-words py-1 font-medium">{{ value }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="caseState.notes.length > 0">
      <div
        class="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
      >
        {{ t('voiceConsole.story_notes', 'Story notes') }}
      </div>
      <ul class="list-disc pl-5 text-crisiscleanup-dark-400">
        <li v-for="(note, index) in caseState.notes" :key="index">
          {{ note }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import BasePill from '@/components/BasePill.vue';
import type { CaseState, FinalizedCase } from '@/hooks/voice/voiceConsoleState';

const props = defineProps<{
  caseState: CaseState;
  finalized: FinalizedCase | null;
}>();

const { t } = useI18n();

const fieldEntries = computed(() => Object.entries(props.caseState.fields));
</script>
