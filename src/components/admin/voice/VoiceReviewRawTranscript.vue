<template>
  <section
    class="min-w-0"
    :class="{ 'lg:hidden': hidden }"
    data-testid="testVoiceRawTranscript"
  >
    <div class="mb-2 flex items-center gap-2">
      <button
        type="button"
        class="inline-flex min-h-[40px] items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900 lg:hidden"
        :aria-expanded="mobileOpen"
        data-testid="testVoiceRawTranscriptToggle"
        @click="mobileOpen = !mobileOpen"
      >
        {{ mobileOpen ? '▾' : '▸' }} {{ t('~~Transcript') }}
      </button>
      <h3
        class="hidden text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900 lg:block"
      >
        {{ t('~~Transcript') }}
      </h3>
      <button
        v-if="lines.length > 0"
        type="button"
        class="ml-auto min-h-[40px] rounded border border-crisiscleanup-dark-100 px-2 text-xs font-semibold lg:min-h-0 lg:py-0.5"
        :class="{ 'max-lg:hidden': !mobileOpen }"
        data-testid="testVoiceRawTranscriptCopy"
        @click="copy"
      >
        {{ copied ? t('~~Copied') : t('~~Copy') }}
      </button>
      <button
        type="button"
        class="hidden min-h-0 rounded border border-crisiscleanup-dark-100 px-2 py-0.5 text-xs font-semibold lg:inline-block"
        :class="{ 'ml-auto': lines.length === 0 }"
        data-testid="testVoiceRawTranscriptHide"
        @click="emit('update:hidden', true)"
      >
        {{ t('~~Hide') }}
      </button>
    </div>

    <div
      class="rounded border border-crisiscleanup-grey-100 lg:block"
      :class="mobileOpen ? 'block' : 'hidden'"
      data-testid="testVoiceRawTranscriptBody"
    >
      <p
        v-if="lines.length === 0"
        class="p-3 text-crisiscleanup-dark-300"
        data-testid="testVoiceRawTranscriptEmpty"
      >
        {{ t('~~No transcript') }}
      </p>
      <div
        v-else
        ref="listEl"
        class="relative max-h-[60vh] overflow-y-auto p-2 font-mono text-xs leading-5 lg:max-h-[calc(100vh-8rem)]"
        data-testid="testVoiceRawTranscriptLines"
      >
        <p
          v-for="line in lines"
          :key="line.id"
          class="whitespace-pre-wrap break-words rounded px-1"
          :class="{
            'bg-crisiscleanup-yellow-100/50': match?.lineId === line.id,
          }"
          :data-line-id="line.id"
          data-testid="testVoiceRawTranscriptLine"
        >
          <template v-if="match?.lineId === line.id"
            >{{ line.role }}: {{ line.text.slice(0, match.start)
            }}<mark
              class="rounded bg-crisiscleanup-yellow-100 px-0.5"
              data-testid="testVoiceRawEvidenceMark"
              >{{ line.text.slice(match.start, match.end) }}</mark
            >{{ line.text.slice(match.end) }}</template
          ><template v-else>{{ line.role }}: {{ line.text }}</template>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getErrorMessage } from '@/utils/errors';
import {
  findEvidence,
  rawSpeechLines,
  rawSpeechText,
} from '@/hooks/voice/voiceTranscript';

const props = defineProps<{
  /** The stored transcript of the call. */
  transcript: string;
  /** The words the chosen finding quotes, to mark. */
  evidence?: string;
  /** Hidden by the reviewer (wide screens only). */
  hidden?: boolean;
}>();
const emit = defineEmits<{ 'update:hidden': [hidden: boolean] }>();

const { t } = useI18n();
const $toasted = useToast();
const listEl = ref<HTMLElement>();
// A narrow screen shows the transcript only when asked.
const mobileOpen = ref(false);
const copied = ref(false);

const lines = computed(() => rawSpeechLines(props.transcript));
const match = computed(() => {
  const found = props.evidence
    ? findEvidence(lines.value, props.evidence)
    : undefined;
  return found && { ...found, lineId: found.turnId };
});

async function copy() {
  try {
    await navigator.clipboard.writeText(rawSpeechText(props.transcript));
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

// Keep the quoted line in view inside the transcript, not the page.
watch(
  () => match.value?.lineId,
  async (lineId?: number) => {
    if (lineId === undefined) return;
    await nextTick();
    const list = listEl.value;
    const line = list?.querySelector<HTMLElement>(`[data-line-id="${lineId}"]`);
    if (line && list && list.offsetParent !== null) {
      list.scrollTo?.({
        top: line.offsetTop - list.clientHeight / 2 + line.clientHeight / 2,
        behavior: 'smooth',
      });
    }
  },
);
</script>
