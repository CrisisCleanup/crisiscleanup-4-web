<template>
  <div class="min-w-0" data-testid="testVoiceCallConversation">
    <audio
      v-if="audioUrl"
      ref="audioEl"
      controls
      preload="metadata"
      class="mb-3 w-full"
      :src="audioUrl"
      data-testid="testVoiceReviewAudio"
    />
    <p
      v-else
      class="mb-3 text-crisiscleanup-dark-300"
      data-testid="testVoiceNoRecording"
    >
      {{ t('~~No recording link is available for this call.') }}
    </p>

    <VoiceReviewTranscript
      :turns="turns"
      :match="match"
      :can-seek="Boolean(audioUrl)"
      :visible="visible"
      @seek="seekTo"
    >
      <template #after="{ turn }">
        <div
          v-for="{ decision, exact } in placed.byTurn.get(turn.id) ?? []"
          :key="decision.turn"
          class="ml-[3.5rem] rounded border border-crisiscleanup-grey-100 bg-crisiscleanup-grey-100/20 p-2"
        >
          <VoiceDecision :decision="decision" :show-caller="!exact" />
        </div>
      </template>
    </VoiceReviewTranscript>

    <VoiceDecisionTimeline
      v-if="placed.unplaced.length > 0"
      class="mt-3"
      :decisions="placed.unplaced"
      :title="t('~~Decisions that match no line')"
    />
  </div>
</template>

<script setup lang="ts">
import type { SessionDecision, SpeechTurn } from '@/hooks/voice/voiceSessions';
import {
  findEvidence,
  placeDecisions,
  seekSeconds,
} from '@/hooks/voice/voiceTranscript';
import VoiceDecision from './VoiceDecision.vue';
import VoiceDecisionTimeline from './VoiceDecisionTimeline.vue';
import VoiceReviewTranscript from './VoiceReviewTranscript.vue';

const props = withDefaults(
  defineProps<{
    turns: SpeechTurn[];
    audioUrl?: string | null;
    decisions?: SessionDecision[];
    /** The words a finding quotes, to mark in the transcript. */
    evidence?: string;
    /** The tab shows; a hidden transcript cannot scroll to the words. */
    visible?: boolean;
  }>(),
  {
    audioUrl: undefined,
    decisions: () => [],
    evidence: undefined,
    visible: true,
  },
);

const { t } = useI18n();
const audioEl = ref<HTMLAudioElement>();

const match = computed(() =>
  props.evidence ? findEvidence(props.turns, props.evidence) : undefined,
);
const placed = computed(() => placeDecisions(props.turns, props.decisions));

function seekTo(line: { turn: SpeechTurn; index: number; count: number }) {
  const audio = audioEl.value;
  if (!audio) return;
  const go = () => {
    const seconds = seekSeconds(
      line.turn,
      line.index,
      line.count,
      audio.duration,
    );
    if (seconds === undefined) return;
    audio.currentTime = seconds;
    void audio.play?.();
  };
  // The length of the recording is not known until its start has loaded.
  if (
    typeof line.turn.offset_seconds !== 'number' &&
    !Number.isFinite(audio.duration)
  ) {
    audio.addEventListener('loadedmetadata', go, { once: true });
    audio.load();
  } else {
    go();
  }
}
</script>
