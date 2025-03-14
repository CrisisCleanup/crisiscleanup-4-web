<template>
  <v-popover popper-class="popover menu" placement="bottom-end" class="text-xs">
    <div
      class="badge-holder rounded-lg"
      data-testid="testCurrentWorkTypeStatusDiv"
      :class="size === 'sm' ? 'px-1' : 'px-2'"
      :style="dropdownStyle"
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
        class="tooltip-target"
        :alt="$t('actions.select_status')"
        :class="size === 'sm' ? '' : 'mx-1'"
        size="sm"
        icon="chevron-down"
      />
    </div>
    <template #popper="{ hide }">
      <div
        class="bg-white border outline-none h-84 w-56 overflow-auto tooltip-content"
        @keyup="nextItem"
      >
        <div
          v-for="status in displayStatuses"
          :key="`${status.id}`"
          :data-testid="`testStatus${status.id}Div`"
          class="cursor-pointer py-1 hover:bg-crisiscleanup-light-grey"
          :class="{ selected: currentItem === status.selectionKey }"
        >
          <div
            class="badge-holder text-xs"
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
      </div>
    </template>
  </v-popover>
</template>

<script lang="ts">
import { useStore } from 'vuex';
import { computed, ref, nextTick, onMounted } from 'vue';
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
  setup(props) {
    const currentItem = ref(1);
    const svgContainer = ref(null);
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
    const dropdownStyle = computed(() => {
      return {
        color: getColorForStatus(
          props.currentWorkType.status,
          Boolean(props.currentWorkType.claimed_by),
        ),
        backgroundColor: `${getColorForStatus(
          props.currentWorkType.status,
          Boolean(props.currentWorkType.claimed_by),
        )}3D`,
      };
    });

    function nextItem(e) {
      if (e.keyCode === 38 && currentItem.value > 1) {
        currentItem.value -= 1;
      } else if (
        e.keyCode === 40 &&
        currentItem.value < displayStatuses.value.length
      ) {
        currentItem.value += 1;
      }
    }

    function setSVGStyles() {
      if (!svgContainer.value) return;
      if (props.iconSize) {
        svgContainer.value.style.minHeight = `${props.iconSize}px`;
        svgContainer.value.style.minWidth = `${props.iconSize}px`;
      }
    }

    onMounted(() => {
      document.addEventListener('keyup', nextItem);
      nextTick(() => setSVGStyles());
    });

    return {
      getColorForStatus,
      getWorkTypeImage,
      statuses,
      displayStatuses,
      workTypeImage,
      dropdownStyle,
      getStatusName,
      nextItem,
      currentItem,
    };
  },
});
</script>

<style>
.status-dropdown {
}
</style>

<style scoped>
.badge-holder {
  @apply flex items-center cursor-pointer;
}
</style>
