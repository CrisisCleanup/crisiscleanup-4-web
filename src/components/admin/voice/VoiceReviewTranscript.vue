<template>
  <div
    ref="listEl"
    class="relative flex max-h-[50vh] flex-col gap-1 overflow-y-auto"
    data-testid="testVoiceReviewTranscript"
  >
    <p v-if="turns.length === 0" class="text-crisiscleanup-dark-300">
      {{ t('~~(no transcript saved)') }}
    </p>
    <template v-for="(turn, index) in turns" :key="turn.id">
      <button
        type="button"
        class="grid min-h-[40px] w-full grid-cols-[3.5rem_minmax(0,1fr)] gap-2 rounded px-2 py-1 text-left hover:bg-crisiscleanup-grey-100/40"
        :class="{ 'bg-crisiscleanup-yellow-100/50': match?.turnId === turn.id }"
        :data-turn-id="turn.id"
        data-testid="testVoiceTranscriptLine"
        :title="canSeek ? t('~~Play the recording from here') : undefined"
        @click="emit('seek', { turn, index, count: turns.length })"
      >
        <span
          class="pt-0.5 text-xs font-bold uppercase"
          :class="
            isAgent(turn)
              ? 'text-crisiscleanup-green-900'
              : 'text-crisiscleanup-dark-400'
          "
        >
          {{ isAgent(turn) ? t('~~Agent') : t('~~Caller') }}
        </span>
        <span class="min-w-0 break-words">
          <template v-if="match?.turnId === turn.id">
            {{ turn.text.slice(0, match.start)
            }}<mark
              class="rounded bg-crisiscleanup-yellow-100 px-0.5"
              data-testid="testVoiceEvidenceMark"
              >{{ turn.text.slice(match.start, match.end) }}</mark
            >{{ turn.text.slice(match.end) }}
          </template>
          <template v-else>{{ turn.text }}</template>
        </span>
      </button>
      <!-- Room under a line, for example the decisions it led to. -->
      <slot name="after" :turn="turn" :index="index" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { EvidenceMatch } from '@/hooks/voice/voiceTranscript';
import type { SpeechTurn } from '@/hooks/voice/voiceSessions';

const props = withDefaults(
  defineProps<{
    turns: SpeechTurn[];
    match?: EvidenceMatch;
    /** A recording is there to seek in. */
    canSeek?: boolean;
    /** A hidden transcript cannot scroll; it scrolls when it shows again. */
    visible?: boolean;
  }>(),
  { visible: true },
);
const emit = defineEmits<{
  seek: [line: { turn: SpeechTurn; index: number; count: number }];
}>();

const { t } = useI18n();
const listEl = ref<HTMLElement>();

const isAgent = (turn: SpeechTurn) =>
  turn.role === 'assistant' || turn.role === 'agent';

// Keep the quoted line in view inside the transcript, not the page.
watch(
  () => [props.match?.turnId, props.visible] as const,
  async ([turnId, visible]: readonly [number | undefined, boolean]) => {
    if (turnId === undefined || !visible) return;
    await nextTick();
    const line = listEl.value?.querySelector<HTMLElement>(
      `[data-turn-id="${turnId}"]`,
    );
    const list = listEl.value;
    if (line && list) {
      list.scrollTo?.({
        top: line.offsetTop - list.clientHeight / 2 + line.clientHeight / 2,
        behavior: 'smooth',
      });
    }
  },
);
</script>
