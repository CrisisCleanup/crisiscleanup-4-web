<template>
  <div data-testid="testVoiceDecision">
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
      <span v-if="decision.intake_answer" class="text-crisiscleanup-dark-300">
        {{ t('~~Intake answer') }}
      </span>
      <span
        v-if="decision.service_question"
        class="text-crisiscleanup-dark-300"
      >
        {{ t('~~Service question') }}
      </span>
    </div>
    <p v-if="showCaller" class="mt-1" data-testid="testVoiceDecisionCaller">
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
  </div>
</template>

<script setup lang="ts">
import {
  formatWhen,
  humanize,
  ruleLabel,
  type SessionDecision,
} from '@/hooks/voice/voiceSessions';

withDefaults(
  defineProps<{
    decision: SessionDecision;
    /** Show what the caller said, when the decision is not under that line. */
    showCaller?: boolean;
  }>(),
  { showCaller: true },
);
const { t } = useI18n();
</script>
