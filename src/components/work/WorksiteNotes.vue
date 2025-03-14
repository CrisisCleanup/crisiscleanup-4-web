<template>
  <div class="worksite-notes" data-testid="testWorksiteNotesDiv">
    <div class="flex items-center justify-between">
      <label
        v-if="worksite.notes && worksite.notes.length > 0"
        class="my-1 text-base font-semibold block"
        >{{ $t('formLabels.notes') }}</label
      >

      <base-button
        v-if="worksite.notes && worksite.notes.length > 0"
        data-testid="testShowAllNotesButton"
        icon="caret-down"
        type="link"
        :text="
          showingAllNotes ? $t('actions.some_notes') : $t('actions.all_notes')
        "
        :alt="
          showingAllNotes ? $t('actions.some_notes') : $t('actions.all_notes')
        "
        :action="
          () => {
            showingAllNotes = !showingAllNotes;
          }
        "
      />
    </div>
    <template v-for="(note, index) in sortedNotes">
      <div
        v-if="index < 4 || showingAllNotes"
        :key="`${note.id}`"
        data-testid="testShowNotesDiv"
        class="my-1 p-1 flex items-start bg-opacity-50 rounded"
        :class="
          note.is_survivor
            ? 'bg-crisiscleanup-yellow-100'
            : 'bg-crisiscleanup-light-grey'
        "
        @click="
          () => {
            expandedNotes[note.id] = !expandedNotes[note.id];
            expandedNotes = { ...expandedNotes };
          }
        "
      >
        <span class="text-crisiscleanup-grey-700 mr-3 notes-time w-40"
          >{{ momentFromNow(note.created_at) }}:</span
        ><span
          class="font-hairline w-64 cursor-pointer"
          :class="expandedNotes[note.id] ? '' : 'max-lines'"
          v-html="note.note"
        ></span>
      </div>
    </template>
    <div v-if="canAdd" class="flex items-center justify-between">
      <base-button
        v-if="!addingNotes"
        data-testid="testAddNoteButton"
        class="my-1 text-primary-dark"
        type="link"
        :text="$t('caseView.add_note')"
        :alt="$t('caseView.add_note_alt')"
        :action="() => (addingNotes = true)"
      >
        <ccu-icon
          type="sticky-note-solid"
          data-testid="testStickyNoteIcon"
          :alt="$t('caseView.add_note_alt')"
          class="text-primary-dark filter-yellow mr-1"
          size="sm"
        />
        <span>{{ $t('caseView.add_note') }}</span>
      </base-button>

      <div class="flex my-1">
        <ColoredCircle
          class="text-crisiscleanup-yellow-100 text-opacity-50 mx-1 w-4 h-4"
          color=""
        />
        <div class="text-xs opacity-25">
          {{ $t('formLabels.survivor_notes') }}
        </div>
      </div>
    </div>
    <div v-if="addingNotes">
      {{ $t('caseView.note') }}
      <base-input
        text-area
        data-testid="testCurrentNoteTextarea"
        text-area-auto-resize
        :value="currentNote"
        :rows="3"
        @update:model-value="
          (value) => {
            currentNote = value;
            $emit('input', value);
          }
        "
      />
      <div class="flex items-center justify-between">
        <base-button
          class="my-1"
          data-testid="testCancelNoteButton"
          type="bare"
          :text="$t('actions.cancel')"
          :alt="$t('actions.cancel')"
          :action="cancelNote"
        />
        <base-button
          class="my-1 text-primary-dark"
          data-testid="testSaveNoteButton"
          type="link"
          :text="$t('actions.add')"
          :alt="$t('actions.add')"
          :action="saveNote"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, ref } from 'vue';
import moment from 'moment';
import { useToast } from 'vue-toastification';
import { momentFromNow } from '../../filters/index';
import ColoredCircle from '@/components/ColoredCircle.vue';

export default defineComponent({
  name: 'WorksiteNotes',
  components: { ColoredCircle },
  props: {
    worksite: {
      type: Object,
      default() {
        return {};
      },
    },
    canAdd: {
      type: Boolean,
      default: true,
    },
    expanded: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const addingNotes = ref(props.expanded);
    const addingTime = ref(false);
    const expandedNotes = ref({});
    const showingAllNotes = ref(false);
    const currentNote = ref('');
    const toast = useToast();
    const { t } = useI18n();

    const sortedNotes = computed(() => {
      if (!props.worksite.notes) {
        return [];
      }

      return [...props.worksite.notes].sort((a, b) => {
        return moment(b.created_at).unix() - moment(a.created_at).unix();
      });
    });

    async function saveNote() {
      if (currentNote.value.length <= 1) {
        toast.error(t('info.submit_longer_note'));
      } else {
        emit('saveNote', currentNote.value);
        emit('input', '');
        addingNotes.value = false;
        currentNote.value = '';
      }
    }

    function cancelNote() {
      addingNotes.value = false;
      emit('input', '');
      currentNote.value = '';
    }

    return {
      addingNotes,
      addingTime,
      expandedNotes,
      showingAllNotes,
      currentNote,
      sortedNotes,
      saveNote,
      cancelNote,
      momentFromNow,
    };
  },
});
</script>
<style lang="postcss" scoped>
.notes-time {
  color: #848f99;
}

.worksite-notes {
  &__button {
  }
}
</style>
