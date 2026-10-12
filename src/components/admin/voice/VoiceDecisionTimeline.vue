<template>
  <section data-testid="testVoiceDecisions">
    <h3
      class="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
    >
      {{ t('~~Decision timeline') }}
    </h3>
    <ol class="flex flex-col gap-2">
      <li
        v-for="decision in decisions"
        :key="decision.turn"
        class="rounded border border-crisiscleanup-grey-100 p-2"
        data-testid="testVoiceDecision"
      >
        <div class="flex flex-wrap items-baseline gap-x-2 text-xs">
          <span class="font-bold tabular-nums">#{{ decision.turn }}</span>
          <span
            v-if="decision.at"
            class="text-crisiscleanup-dark-300"
            data-testid="testVoiceDecisionAt"
          >
            {{ formatWhen(decision.at) }}
          </span>
          <span
            v-if="decision.route"
            class="rounded bg-crisiscleanup-grey-100/60 px-1.5"
            data-testid="testVoiceDecisionRoute"
          >
            {{ humanize(decision.route) }}
          </span>
          <span
            v-if="decision.callback"
            class="rounded bg-crisiscleanup-chat-blue px-1.5 text-crisiscleanup-dashboard-blue"
            data-testid="testVoiceDecisionCallback"
          >
            {{ t('~~Callback') }}: {{ humanize(decision.callback) }}
          </span>
          <span
            v-if="decision.intake_answer"
            class="text-crisiscleanup-dark-300"
          >
            {{ t('~~Intake answer') }}
          </span>
          <span
            v-if="decision.service_question"
            class="text-crisiscleanup-dark-300"
          >
            {{ t('~~Service question') }}
          </span>
        </div>
        <p class="mt-1" data-testid="testVoiceDecisionCaller">
          {{ decision.caller_text || '—' }}
        </p>
        <div
          v-if="decision.rules_applied.length > 0"
          class="mt-1 flex flex-wrap gap-1"
        >
          <span
            v-for="rule in decision.rules_applied"
            :key="rule"
            class="rounded bg-crisiscleanup-yellow-100/60 px-1.5 text-xs"
            :title="rule"
            data-testid="testVoiceDecisionRule"
          >
            {{ t(ruleLabel(rule)) }}
          </span>
        </div>
        <p
          v-if="decision.actions.length > 0"
          class="mt-1 text-xs text-crisiscleanup-dark-300"
        >
          {{ decision.actions.map(humanize).join(' · ') }}
        </p>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import {
  formatWhen,
  humanize,
  ruleLabel,
  type SessionDecision,
} from '@/hooks/voice/voiceSessions';

defineProps<{ decisions: SessionDecision[] }>();
const { t } = useI18n();
</script>
