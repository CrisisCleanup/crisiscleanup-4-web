<template>
  <form class="flex flex-col bg-white rounded-lg shadow-sm p-6 w-full">
    <!-- Status Selector Section -->
    <div
      class="grid grid-cols-1 md:grid-cols-3 gap-6 status-wrapper overflow-x-hidden p-0.5"
      data-testid="testStatusSelectorDiv"
    >
      <div
        v-for="(section, index) in sortedValues"
        :key="index"
        class="flex flex-col"
      >
        <div
          class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center"
        >
          <span
            class="inline-block w-3 h-3 rounded-full mr-2"
            :style="`background: ${section.color}`"
          ></span>
          {{ section.name }}
        </div>
        <div class="space-y-2">
          <div
            v-for="(item, idx) in section.values"
            :key="idx"
            class="px-3 py-2.5 rounded-md cursor-pointer text-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
            :class="
              item.value === status
                ? 'ring-2 ring-offset-2 ring-gray-600 shadow-md scale-105 font-medium'
                : 'opacity-85 hover:opacity-100'
            "
            :style="`background: ${
              item.value === status ? section.color : section.color + '40'
            }`"
            @click="status = item.value"
          >
            {{ item.name_t }}
          </div>
        </div>
      </div>
    </div>

    <!-- Notes Section -->
    <div class="mt-8">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        {{ $t('phoneDashboard.notes') }}
      </label>
      <textarea
        v-model="callNotes"
        data-testid="testCallNoteTextarea"
        rows="4"
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
        :placeholder="$t('phoneDashboard.notes')"
        @update:modelValue="(value) => (updateNotes = value)"
      ></textarea>
    </div>

    <!-- Buttons Section -->
    <div class="flex flex-wrap gap-3 mt-6">
      <base-button
        data-testid="testCompleteCallButton"
        class="flex-1 sm:flex-initial px-6 py-2.5 font-medium shadow-sm hover:shadow-md transition-all duration-200"
        size="medium"
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
        class="flex-1 sm:flex-initial px-6 py-2.5 font-medium transition-all duration-200"
        :alt="$t('actions.cancel')"
        :action="
          () =>
            $emit('onCancel', {
              status: status,
              notes: callNotes,
            })
        "
        size="medium"
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
  max-height: 24rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.400') theme('colors.gray.100');
}

.status-wrapper::-webkit-scrollbar {
  width: 6px;
}

.status-wrapper::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.status-wrapper::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded;
}

.status-wrapper::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}
</style>
