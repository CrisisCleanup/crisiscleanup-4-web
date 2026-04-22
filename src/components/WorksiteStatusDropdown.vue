<template>
  <v-popover
    popper-class="popover menu"
    placement="bottom-end"
    class="text-xs"
    @apply-show="onPopoverShow"
  >
    <button
      type="button"
      class="badge-holder rounded border border-crisiscleanup-grey-100 text-crisiscleanup-dark-500 transition focus-visible:outline-none focus-visible:border-primary-light focus-visible:shadow-[0_0_0_2px_rgba(254,206,9,.25)]"
      data-testid="testCurrentWorkTypeStatusDiv"
      :class="size === 'sm' ? 'px-1 min-h-[20px]' : 'px-2 min-h-[28px]'"
      :style="triggerStyle"
    >
      <div
        v-if="useIcon"
        ref="svgContainer"
        class="case-svg-container flex"
        :class="size === 'sm' ? '' : 'mr-1'"
        v-html="workTypeImage"
      ></div>
      <div v-if="!hideName" class="tooltip-target">
        {{ getStatusName(currentWorkType.status) }}
      </div>
      <font-awesome-icon
        class="ml-1 text-[12px] text-crisiscleanup-grey-900"
        :alt="$t('actions.select_status')"
        icon="chevron-down"
      />
    </button>
    <template #popper="{ hide }">
      <div
        ref="panelRef"
        role="listbox"
        tabindex="-1"
        :aria-activedescendant="`status-opt-${currentItem}`"
        class="bg-white rounded shadow-crisiscleanup-card border border-crisiscleanup-grey-100 mt-1 overflow-auto outline-none max-h-64 w-56 tooltip-content"
        @keydown="(e) => onPanelKeydown(e, hide)"
      >
        <div
          v-for="status in displayStatuses"
          :id="`status-opt-${status.selectionKey}`"
          :key="`${status.id}`"
          role="option"
          :aria-selected="status.status === currentWorkType.status"
          :data-testid="`testStatus${status.id}Div`"
          class="cursor-pointer min-h-[24px] px-3 py-0.5 text-[13px] flex items-center transition-colors hover:bg-crisiscleanup-smoke"
          :class="rowClass(status)"
          @click="
            () => {
              $emit('input', status.status);
              hide();
            }
          "
        >
          <ColoredCircle
            class="mx-1 w-4 h-4"
            :title="getStatusName(status.status)"
            :color="getColorForStatus(status.status)"
          />
          <div>{{ $t(status.status_name_t) }}</div>
        </div>
      </div>
    </template>
  </v-popover>
</template>

<script lang="ts">
import { useStore } from 'vuex';
import { computed, nextTick, ref } from 'vue';
import { getColorForStatus, getStatusName, getWorkTypeImage } from '../filters';
import useWorktypeImages from '../hooks/worksite/useWorktypeImages';
import ColoredCircle from '@/components/ColoredCircle.vue';

export default defineComponent({
  name: 'WorksiteStatusDropdown',
  components: { ColoredCircle },
  props: {
    currentWorkType: {
      type: Object,
      default() {
        return {};
      },
    },
    useIcon: {
      type: Boolean,
      default: false,
    },
    hideName: {
      type: Boolean,
      default: false,
    },
    phase: {
      type: Number,
      default: null,
    },
    iconSize: {
      type: Number,
      default: 40,
    },
    size: {
      type: String,
      default: '',
    },
  },
  emits: ['input'],
  setup(props, { emit }: { emit: (event: 'input', payload: string) => void }) {
    const currentItem = ref(1);
    const svgContainer = ref<HTMLElement | null>(null);
    const panelRef = ref<HTMLElement | null>(null);
    const store = useStore();

    const { getWorktypeSVG } = useWorktypeImages();
    const statuses = computed(() => store.getters['enums/statuses']);
    const displayStatuses = computed(() => {
      return statuses.value
        .filter((status) =>
          props.phase ? status.phases.includes(props.phase) : true,
        )
        .filter((status) => {
          if (
            props.currentWorkType &&
            !props.currentWorkType.recur_default &&
            status.primary_state === 'need'
          ) {
            return false;
          }

          return true;
        })
        .map((status, index) => {
          return {
            ...status,
            selectionKey: index + 1,
          };
        });
    });
    const workTypeImage = computed(() => {
      if (props.iconSize) {
        return getWorktypeSVG(props.currentWorkType, props.iconSize);
      }

      return getWorkTypeImage(props.currentWorkType);
    });
    const triggerStyle = computed(() => {
      const fill = getColorForStatus(
        props.currentWorkType.status,
        Boolean(props.currentWorkType.claimed_by),
      );
      // Tint the fill at 24% alpha for the badge background. Text color is
      // carried by a Tailwind class (crisiscleanup-dark-500) instead of the
      // fill itself so pastel statuses (soft green, yellow) stay legible.
      return {
        backgroundColor: `${fill}3D`,
      };
    });

    function rowClass(status: { status: string; selectionKey: number }) {
      const isSelected = status.status === props.currentWorkType.status;
      const isFocused = currentItem.value === status.selectionKey;
      return [
        isSelected && 'bg-primary-light text-black font-bold',
        isFocused && !isSelected && 'bg-crisiscleanup-smoke',
        isFocused && 'ring-1 ring-primary-light',
      ];
    }

    function onPanelKeydown(e: KeyboardEvent, hide: () => void) {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          currentItem.value = Math.min(
            currentItem.value + 1,
            displayStatuses.value.length,
          );

          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          currentItem.value = Math.max(currentItem.value - 1, 1);

          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          const picked = displayStatuses.value.find(
            (s: { selectionKey: number }) =>
              s.selectionKey === currentItem.value,
          );
          if (picked) {
            emit('input', picked.status);
            hide();
          }

          break;
        }
        // No default
      }
    }

    function onPopoverShow() {
      const current = displayStatuses.value.find(
        (s: { status: string }) => s.status === props.currentWorkType.status,
      );
      currentItem.value = current?.selectionKey ?? 1;
      nextTick(() => {
        panelRef.value?.focus();
        setSVGStyles();
      });
    }

    function setSVGStyles() {
      if (!svgContainer.value) return;
      if (props.iconSize) {
        svgContainer.value.style.minHeight = `${props.iconSize}px`;
        svgContainer.value.style.minWidth = `${props.iconSize}px`;
      }
    }

    return {
      getColorForStatus,
      getWorkTypeImage,
      statuses,
      displayStatuses,
      workTypeImage,
      triggerStyle,
      getStatusName,
      currentItem,
      panelRef,
      rowClass,
      onPanelKeydown,
      onPopoverShow,
      svgContainer,
    };
  },
});
</script>

<style scoped>
.badge-holder {
  @apply inline-flex items-center cursor-pointer bg-white;
}
</style>
