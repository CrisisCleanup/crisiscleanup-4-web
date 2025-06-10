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
        :class="getNoteClass(note)"
      >
        <span class="text-crisiscleanup-grey-700 mr-3 notes-time w-40">
          {{ momentFromNow(note.created_at) }}:
        </span>
        <span class="font-hairline w-64 flex flex-col">
          <template v-if="note.note_type === 'ai_generated_call_summary'">
            <span class="inline-flex items-center mb-1 text-xs text-gray-500">
              <span class="mr-1">🤖</span>{{ $t('formLabels.ai_generated') }}
            </span>
            <span v-if="!expandedNotes[note.id]">
              <span v-html="getAiNotePreview(note.note)"></span>
              <a
                href="#"
                class="text-primary-dark underline cursor-pointer"
                @click.prevent="toggleNoteExpand(note.id)"
                >{{ $t('actions.see_more') }}</a
              >
            </span>
            <span v-else>
              <span v-html="note.note"></span>
              <a
                href="#"
                class="text-primary-dark underline cursor-pointer"
                @click.prevent="toggleNoteExpand(note.id)"
                >{{ $t('actions.see_less') }}</a
              >
            </span>
          </template>
          <template v-else>
            <span
              class="cursor-pointer"
              :class="expandedNotes[note.id] ? '' : 'max-lines'"
              @click="toggleNoteExpand(note.id)"
              v-html="note.note"
            ></span>
          </template>
        </span>
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

      <div class="flex flex-col my-1 space-y-1">
        <div class="flex items-center">
          <ColoredCircle
            class="text-crisiscleanup-yellow-100 text-opacity-50 mx-1 w-4 h-4"
            color=""
          />
          <div class="text-xs opacity-50">
            {{ $t('formLabels.survivor_notes') }}
          </div>
        </div>
        <div class="flex items-center">
          <ColoredCircle
            class="text-crisiscleanup-light-grey text-opacity-50 mx-1 w-4 h-4"
            color=""
          />
          <div class="text-xs opacity-50">
            {{ $t('formLabels.volunteer_notes') }}
          </div>
        </div>
        <div class="flex items-center">
          <ColoredCircle
            class="text-blue-100 text-opacity-50 mx-1 w-4 h-4"
            color=""
          />
          <div class="text-xs opacity-50">
            {{ $t('formLabels.ai_generated_call_summary') }}
          </div>
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
import moment from 'moment';
import { useToast } from 'vue-toastification';
import { useI18n } from 'vue-i18n';
import { momentFromNow } from '../../filters/index';
import ColoredCircle from '@/components/ColoredCircle.vue';

interface Note {
  id: number;
  note: string;
  created_at: string;
  note_type: string;
}

interface WorksiteProps {
  notes?: Note[];
}

interface Props {
  worksite: WorksiteProps;
  canAdd: boolean;
  expanded: boolean;
}

interface Emits {
  (event: 'saveNote', value: string): void;
  (event: 'input', value: string): void;
}

export default defineComponent({
  name: 'WorksiteNotes',
  components: { ColoredCircle },
  props: {
    worksite: {
      type: Object as PropType<WorksiteProps>,
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
  emits: ['saveNote', 'input'],
  setup(props: Props, { emit }: { emit: Emits }) {
    const addingNotes = ref(props.expanded);
    const addingTime = ref(false);
    const expandedNotes = ref<Record<number, boolean>>({});
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
        await toast.error(t('info.submit_longer_note'));
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

    function getNoteClass(note: Note) {
      switch (note.note_type) {
        case 'survivor_note': {
          return 'bg-crisiscleanup-yellow-100';
        }
        case 'volunteer_note': {
          return 'bg-crisiscleanup-light-grey';
        }
        case 'ai_generated_call_summary': {
          return 'bg-blue-100';
        }
        default: {
          return 'bg-gray-100';
        }
      }
    }

    function getAiNotePreview(note: string) {
      // Strip HTML tags for preview, then truncate
      const div = document.createElement('div');
      div.innerHTML = note;
      const text = div.textContent || '';
      if (text.length > 100) {
        return text.slice(0, 100) + '… ';
      }
      return text;
    }

    function toggleNoteExpand(id: number) {
      expandedNotes.value[id] = !expandedNotes.value[id];
      expandedNotes.value = { ...expandedNotes.value };
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
      getNoteClass,
      getAiNotePreview,
      toggleNoteExpand,
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
