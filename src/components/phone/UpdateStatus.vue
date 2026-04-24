<template>
  <form class="w-full flex flex-col gap-4" @submit.prevent>
    <!-- Status grid pane -->
    <section
      class="bg-white rounded border border-crisiscleanup-grey-100 p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
      data-testid="testStatusSelectorDiv"
    >
      <div
        v-for="(section, key) in sortedValues"
        :key="key"
        class="flex flex-col gap-2 min-w-0"
      >
        <h3
          class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900"
        >
          {{ section.name }}
        </h3>
        <ul class="flex flex-col gap-1.5">
          <li v-for="item in section.values" :key="item.value">
            <button
              type="button"
              :data-testid="`testStatusOption_${item.value}`"
              :aria-pressed="item.value === status"
              class="w-full h-9 px-3 flex items-center gap-2 text-left text-[13px] rounded border bg-white transition"
              :class="[
                leftBorderClass(key),
                item.value === status
                  ? 'border-primary bg-primary-light font-semibold text-black'
                  : 'border-crisiscleanup-grey-100 hover:bg-crisiscleanup-smoke text-black',
              ]"
              @click="status = item.value"
            >
              {{ item.name_t }}
            </button>
          </li>
        </ul>
      </div>
    </section>

    <!-- Notes pane -->
    <section
      class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-2"
    >
      <label
        for="update-status-notes"
        class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900"
      >
        {{ $t('phoneDashboard.notes') }}
      </label>
      <textarea
        id="update-status-notes"
        v-model="callNotes"
        data-testid="testCallNoteTextarea"
        rows="4"
        class="w-full border border-crisiscleanup-grey-100 rounded px-3 py-2 text-[15px] leading-snug resize-y min-h-[96px] focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary transition"
        :placeholder="$t('~~Add any context the next volunteer should know.')"
      />
    </section>

    <!-- Actions -->
    <div class="flex flex-wrap gap-2 justify-end">
      <base-button
        v-if="allowCancel"
        size="medium"
        variant="outline"
        :alt="$t('actions.cancel')"
        :action="() => $emit('onCancel', { status, notes: callNotes })"
        data-testid="testCancelUpdateStatusButton"
      >
        {{ $t('actions.cancel') }}
      </base-button>
      <base-button
        size="medium"
        variant="solid"
        :disabled="status === null"
        :alt="$t('phoneDashboard.complete_call')"
        :action="() => $emit('onCompleteCall', { status, notes: callNotes })"
        data-testid="testCompleteCallButton"
      >
        {{ $t('phoneDashboard.complete_call') }}
      </base-button>
    </div>
  </form>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import PhoneStatus from '@/models/PhoneStatus';
import useEmitter from '@/hooks/useEmitter';
import BaseButton from '@/components/BaseButton.vue';

type StatusKey = 'answered' | 'noAnswer' | 'skipped';

function leftBorderClass(key: StatusKey) {
  if (key === 'answered') return 'border-l-4 border-l-phone-outbound-dark';
  if (key === 'noAnswer') return 'border-l-4 border-l-[#FAB92E]';
  return 'border-l-4 border-l-crisiscleanup-grey-900';
}

export default defineComponent({
  name: 'UpdateStatus',
  components: { BaseButton },
  props: {
    allowCancel: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['onCompleteCall', 'onCancel'],
  setup() {
    const { t } = useI18n();
    const { emitter } = useEmitter();
    const status = ref<number | null>(null);
    const callNotes = ref('');
    const statuses = computed(() => PhoneStatus.all());
    const sortedValues: Record<
      StatusKey,
      { name: string; values: { name_t: string; value: number }[] }
    > = {
      answered: {
        name: t('phoneState.answered'),
        values: [
          { name_t: t('phoneStatus.answered_added'), value: 1 },
          {
            name_t: t('phoneStatus.answered_duplicate-or-updated-existing'),
            value: 2,
          },
          { name_t: t('phoneStatus.answered_no-help-wanted'), value: 3 },
          { name_t: t('phoneStatus.answered_hung-up'), value: 5 },
          { name_t: t('phoneStatus.answered_out-of-scope'), value: 7 },
          { name_t: t('phoneStatus.answered_will-call-back'), value: 4 },
          { name_t: t('phoneStatus.answered_other'), value: 8 },
        ],
      },
      noAnswer: {
        name: t('phoneState.no-answer'),
        values: [
          { name_t: t('phoneStatus.no-answer_voicemail'), value: 15 },
          {
            name_t: t('phoneStatus.no-answer_voicemail-full-or-none'),
            value: 16,
          },
          {
            name_t: t('phoneStatus.no-answer_technical-difficulty'),
            value: 17,
          },
          { name_t: t('phoneStatus.either_bad-number'), value: 19 },
        ],
      },
      skipped: {
        name: t('phoneState.skipped'),
        values: [
          { name_t: t('phoneStatus.skipped_did-not-outbound'), value: 20 },
          { name_t: t('phoneStatus.skipped_did-not-inbound'), value: 22 },
          {
            name_t: t('phoneStatus.no-answer_premature-disconnection'),
            value: 23,
          },
          { name_t: t('phoneStatus.answered_test-call'), value: 24 },
        ],
      },
    };

    emitter.on('phone:clear_call', () => {
      callNotes.value = '';
      status.value = null;
    });

    return {
      status,
      callNotes,
      statuses,
      sortedValues,
      leftBorderClass,
    };
  },
});
</script>
