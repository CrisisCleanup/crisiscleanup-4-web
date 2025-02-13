<template>
  <form class="flex flex-col">
    <!-- Status Selector Section -->
    <div
      class="flex flex-col flex-wrap text-center status-wrapper gap-4 md:gap-6"
      data-testid="testStatusSelectorDiv"
    >
      <div
        v-for="(section, index) in sortedValues"
        :key="index"
        class="flex flex-col items-center"
      >
        <div class="font-bold text-base sm:text-lg">
          {{ section.name }}
        </div>
        <div
          v-for="(item, idx) in section.values"
          :key="idx"
          class="m-1 p-1 rounded cursor-pointer text-sm sm:text-base w-full sm:w-auto"
          :class="
            item.value === status
              ? 'outline border border-gray-700'
              : 'opacity-80'
          "
          :style="`background: ${section.color}`"
          @click="status = item.value"
        >
          {{ item.name_t }}
        </div>
      </div>
    </div>

    <!-- Notes Section -->
    <textarea
      v-model="callNotes"
      data-testid="testCallNoteTextarea"
      rows="3"
      class="text-sm sm:text-base border border-crisiscleanup-dark-100 placeholder-crisiscleanup-dark-200 outline-none p-2 my-4 resize-none w-full rounded"
      :placeholder="$t('phoneDashboard.notes')"
      @update:modelValue="(value) => (updateNotes = value)"
    ></textarea>

    <!-- Buttons Section -->
    <div class="flex flex-wrap gap-2 justify-center sm:justify-start mt-4">
      <base-button
        data-testid="testCompleteCallButton"
        class="p-2 rounded text-sm sm:text-base"
        size="small"
        variant="solid"
        :alt="$t('phoneDashboard.complete_call')"
        :action="
          () =>
            $emit('onCompleteCall', {
              status: status,
              notes: callNotes,
            })
        "
      >
        {{ $t('phoneDashboard.complete_call') }}
      </base-button>
      <base-button
        v-if="allowCancel"
        class="p-2 rounded text-sm sm:text-base"
        :alt="$t('actions.cancel')"
        :action="
          () =>
            $emit('onCancel', {
              status: status,
              notes: callNotes,
            })
        "
        size="small"
        variant="outline"
      >
        {{ $t('actions.cancel') }}
      </base-button>
    </div>
  </form>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import PhoneStatus from '@/models/PhoneStatus';
import useEmitter from '@/hooks/useEmitter';
import BaseButton from '@/components/BaseButton.vue';

export default defineComponent({
  name: 'UpdateStatus',
  components: { BaseButton },
  props: {
    allowCancel: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const { t } = useI18n();
    const { emitter } = useEmitter();
    const status = ref(null);
    const callNotes = ref('');
    const statuses = computed(() => PhoneStatus.all());
    const sortedValues = {
      answered: {
        name: t('phoneState.answered'),
        values: [
          {
            name_t: t('phoneStatus.answered_added'),
            value: 1,
          },
          {
            name_t: t('phoneStatus.answered_duplicate-or-updated-existing'),
            value: 2,
          },
          {
            name_t: t('phoneStatus.answered_no-help-wanted'),
            value: 3,
          },
          {
            name_t: t('phoneStatus.answered_hung-up'),
            value: 5,
          },
          {
            name_t: t('phoneStatus.answered_out-of-scope'),
            value: 7,
          },
          {
            name_t: t('phoneStatus.answered_will-call-back'),
            value: 4,
          },
          {
            name_t: t('phoneStatus.answered_other'),
            value: 8,
          },
        ],
        color: '#15d671',
      },
      noAnswer: {
        name: t('phoneState.no-answer'),
        values: [
          {
            name_t: t('phoneStatus.no-answer_voicemail'),
            value: 15,
          },
          {
            name_t: t('phoneStatus.no-answer_voicemail-full-or-none'),
            value: 16,
          },
          {
            name_t: t('phoneStatus.no-answer_technical-difficulty'),
            value: 17,
          },
          {
            name_t: t('phoneStatus.either_bad-number'),
            value: 19,
          },
        ],
        color: '#FAB92E',
      },
      skipped: {
        name: t('phoneState.skipped'),
        values: [
          {
            name_t: t('phoneStatus.skipped_did-not-outbound'),
            value: 20,
          },
          {
            name_t: t('phoneStatus.skipped_did-not-inbound'),
            value: 22,
          },
          {
            name_t: t('phoneStatus.no-answer_premature-disconnection'),
            value: 23,
          },
          {
            name_t: t('phoneStatus.answered_test-call'),
            value: 24,
          },
        ],
        color: '#F0F032',
      },
    };
    async function updateStatus(statusId) {
      status.value = statusId;
    }

    async function updateNotes(e) {
      callNotes.value = e.target.value;
    }

    emitter.on('phone:clear_call', () => {
      callNotes.value = '';
      status.value = null;
    });
    return {
      status,
      callNotes,
      statuses,
      sortedValues,
      updateStatus,
      updateNotes,
    };
  },
});
</script>

<style scoped lang="postcss">
.status-wrapper {
  height: 18rem;
}
</style>
