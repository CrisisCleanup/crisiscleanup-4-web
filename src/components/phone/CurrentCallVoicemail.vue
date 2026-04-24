<template>
  <section
    class="bg-white rounded border border-crisiscleanup-grey-100 flex flex-col max-h-[32rem] min-h-0 overflow-hidden"
    :aria-label="$t('~~Voicemail')"
  >
    <header
      class="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-crisiscleanup-grey-100"
    >
      <h2
        class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900"
      >
        {{ $t('~~Voicemail') }}
      </h2>
      <BasePill v-if="ctx.summary || ctx.isSummaryPending" variant="ai">
        {{ $t('~~AI-generated') }}
      </BasePill>
      <BasePill
        v-if="ctx.priorCount > 1"
        variant="dark"
        class="ml-auto"
        data-testid="testVoicemailPriorRibbon"
      >
        {{
          $t('~~{n} prior voicemails from this caller', { n: ctx.priorCount })
        }}
      </BasePill>
    </header>

    <div
      class="flex-1 min-h-0 overflow-auto px-4 py-3 flex flex-col gap-3"
      data-testid="testVoicemailBody"
    >
      <!-- Current-call block: summary, audio, transcript -->
      <template v-if="hasCurrentCallVoicemail">
        <p
          v-if="ctx.summary"
          class="text-[15px] leading-snug whitespace-pre-line text-black"
          data-testid="testVoicemailSummary"
        >
          {{ ctx.summary }}
        </p>
        <PaneSkeleton
          v-else-if="ctx.isSummaryPending"
          variant="block"
          data-testid="testVoicemailSummaryPending"
        />

        <PaneDisclosure
          v-if="ctx.audioUrl"
          name="voicemail-audio"
          :title="$t('~~Play recording')"
          :start-open="false"
          data-testid="testVoicemailAudioDisclosure"
        >
          <audio
            controls
            preload="none"
            :src="ctx.audioUrl"
            class="w-full"
            data-testid="testVoicemailAudio"
          />
        </PaneDisclosure>

        <PaneDisclosure
          v-if="ctx.transcription"
          name="voicemail-transcript"
          :title="$t('~~Transcript')"
          :start-open="false"
        >
          <p
            class="text-[15px] leading-snug whitespace-pre-line text-black"
            data-testid="testVoicemailTranscription"
          >
            {{ ctx.transcription }}
          </p>
        </PaneDisclosure>
      </template>

      <!-- Prior voicemails — inline heading + compact list, no outer accordion -->
      <div
        v-if="ctx.priorHistory.length > 0"
        class="flex flex-col gap-2"
        data-testid="testVoicemailHistoryDisclosure"
      >
        <div
          v-if="hasCurrentCallVoicemail"
          class="h-px bg-crisiscleanup-grey-100 my-1"
        />
        <h3
          class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900 flex items-center gap-2"
        >
          {{ $t('~~Prior voicemails') }}
          <BasePill variant="dark">{{ ctx.priorHistory.length }}</BasePill>
        </h3>
        <ul class="flex flex-col">
          <li
            v-for="item in ctx.priorHistory"
            :key="item.id"
            class="flex flex-col gap-1.5 py-3 border-b border-crisiscleanup-grey-100 last:border-b-0"
            :data-testid="`testVoicemailHistoryItem_${item.id}`"
          >
            <div
              class="flex items-center gap-2 text-[11px] text-crisiscleanup-grey-900 uppercase tracking-[0.04em]"
            >
              <span>{{ formatDate(item.created_at) }}</span>
              <BasePill
                v-if="item.source === 'inbound'"
                variant="open"
                class="ml-auto"
              >
                {{ $t('~~Inbound') }}
              </BasePill>
              <BasePill v-else variant="completed" class="ml-auto">
                {{ $t('~~Callback') }}
              </BasePill>
            </div>
            <p class="text-[13px] leading-snug text-black whitespace-pre-line">
              {{ item.vm_summary }}
            </p>
            <PaneDisclosure
              v-if="item.vm_transcription"
              :name="`voicemail-history-transcript-${item.id}`"
              :title="$t('~~Transcript')"
              :start-open="false"
            >
              <p class="text-[13px] leading-snug whitespace-pre-line">
                {{ item.vm_transcription }}
              </p>
            </PaneDisclosure>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import type PhoneOutbound from '@/models/PhoneOutbound';
import type { PhoneDnisResult } from '@/models/types';
import useVoicemailContext from '@/hooks/phone/useVoicemailContext';
import BasePill from '@/components/BasePill.vue';
import PaneDisclosure from '@/components/phone/foundation/PaneDisclosure.vue';
import PaneSkeleton from '@/components/phone/foundation/PaneSkeleton.vue';
import moment from '@/utils/dates';

const props = defineProps<{
  outbound: PhoneOutbound | null;
  caller: PhoneDnisResult | null;
}>();
const ctx = useVoicemailContext(
  toRef(props, 'outbound'),
  toRef(props, 'caller'),
);

const hasCurrentCallVoicemail = computed(
  () =>
    Boolean(ctx.value.summary) ||
    Boolean(ctx.value.audioUrl) ||
    Boolean(ctx.value.transcription) ||
    ctx.value.isSummaryPending,
);

function formatDate(iso: string) {
  return moment(iso).format('MMM D, YYYY · h:mm A');
}
</script>
