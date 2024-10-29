<template>
  <div class="ws-legend">
    <div v-if="showingLegend" data-testid="testShowingLegendDiv">
      <div
        class="flex items-center justify-between cursor-pointer"
        @click="() => toggleLegend(false)"
      >
        <div class="text-base font-bold">
          {{ $t('worksiteMap.legend') }}
        </div>
        <MdiChevronDown
          class="toggle-icon"
          data-testid="testHideLegendIcon"
          :title="$t('worksiteMap.hide_legend')"
        />
      </div>
      <div class="mt-2 flex flex-wrap justify-between gap-y-1">
        <div
          v-for="entry in displayedWorkTypeSvgs"
          :key="entry.key"
          class="worktype-svg-item"
        >
          <div class="w-4 h-4">
            <div class="map-svg-container" v-html="entry.svg"></div>
          </div>
          <span class="text-xs">{{ getWorkTypeName(entry.key) }}</span>
        </div>
        <div
          v-for="entry in defaultWorkTypeSvgs"
          :key="entry.name"
          class="worktype-svg-item"
        >
          <div class="w-4 h-4">
            <div class="map-svg-container" v-html="entry.svg"></div>
          </div>
          <span class="text-xs">{{ entry.name }}</span>
        </div>
      </div>
      <div class="mt-2 text-sm font-bold">
        {{ $t('worksiteMap.case_status') }}
      </div>
      <div class="mt-1 flex flex-wrap gap-y-1">
        <div
          v-for="(value, key) in legendColors"
          :key="key"
          class="flex items-start gap-x-2 w-1/2"
        >
          <div class="w-4 h-4">
            <MaterialSymbolsCircle
              class="text-xs border border-black rounded-full"
              :style="{
                color: value,
              }"
            />
          </div>
          <div class="flex-grow text-xs">{{ key }}</div>
        </div>
        <div class="flex items-center gap-1 w-1/2">
          <div class="w-4 h-4">
            <F7PlusApp class="text-sm" />
          </div>
          <div class="text-xs">
            {{ $t('worksiteMap.multiple_work_types') }}
          </div>
        </div>
      </div>
    </div>
    <div v-else data-testid="testHiddenLegendDiv">
      <div
        class="cursor-pointer flex items-center justify-between"
        @click="() => toggleLegend(true)"
      >
        <div class="text-base font-bold">
          {{ $t('worksiteMap.legend') }}
        </div>
        <MdiChevronUp
          class="toggle-icon"
          data-testid="testShowLegendIcon"
          :title="$t('worksiteMap.show_legend')"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { colors, templates } from '../icons/icons_templates';
import MaterialSymbolsCircle from '~icons/material-symbols/circle';
import useCurrentUser from '../hooks/useCurrentUser';
import F7PlusApp from '~icons/f7/plus-app';
import MdiChevronUp from '~icons/mdi/chevron-up';
import MdiChevronDown from '~icons/mdi/chevron-down';
import { getWorkTypeName } from '../filters/index';
import { getErrorMessage } from '@/utils/errors';

export default defineComponent({
  name: 'WorksiteLegend',
  components: {
    MaterialSymbolsCircle,
    F7PlusApp,
    MdiChevronUp,
    MdiChevronDown,
  },
  props: {
    availableWorkTypes: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const { t } = useI18n();
    const { currentUser, userStates, updateUserStates } = useCurrentUser();

    const showingLegend = ref(userStates.value?.showingLegend ?? true);
    const displayedWorkTypeSvgs = computed(() => {
      return Object.keys(props.availableWorkTypes).map((workType) => {
        const template = templates[workType] || templates.unknown;
        const svg = template
          .replaceAll('{{fillColor}}', 'black')
          .replaceAll('{{strokeWidth}}', '0.5')
          .replaceAll('{{strokeColor}}', 'black')
          .replaceAll('{{multiple}}', '');
        return {
          svg,
          key: workType,
        };
      });
    });
    const defaultWorkTypeSvgs = [
      {
        svg: templates.important
          .replaceAll('{{fillColor}}', 'black')
          .replaceAll('{{strokeWidth}}', '0.5'),
        name: t(`worksiteMap.high_priority`),
      },
      {
        svg: templates.favorite
          .replaceAll('{{fillColor}}', 'black')
          .replaceAll('{{strokeWidth}}', '0.5'),
        name: t(`worksiteMap.member_of_my_organization`),
      },
    ];
    const legendColors = {
      [t('worksiteMap.unclaimed')]: colors.open_unassigned_unclaimed.fillColor,
      [t('worksiteMap.claimed_not_started')]:
        colors.open_unassigned_claimed.fillColor,
      [t('worksiteMap.in_progress')]: colors.open_assigned_claimed.fillColor,
      [t('worksiteMap.partially_completed')]:
        colors['open_partially-completed_claimed'].fillColor,
      [t('worksiteMap.needs_follow_up')]:
        colors['open_needs-follow-up_claimed'].fillColor,
      [t('worksiteMap.completed')]: colors.closed_completed_claimed.fillColor,
      [t('worksiteMap.done_by_others_no_help_wanted')]:
        colors['closed_done-by-others_unclaimed'].fillColor,
      [t('worksiteMap.out_of_scope_duplicate_unresponsive')]:
        colors.open_unresponsive_unclaimed.fillColor,
    };

    function toggleLegend(status) {
      showingLegend.value = status;
      updateUserStates({ showingLegend: status }, {}).catch(getErrorMessage);
    }

    watch(showingLegend, async (newValue) => {
      await updateUserStates({ showingLegend: newValue }, {});
    });

    return {
      showingLegend,
      toggleLegend,
      displayedWorkTypeSvgs,
      legendColors,
      defaultWorkTypeSvgs,
      templates,
      getWorkTypeName,
    };
  },
});
</script>

<style lang="postcss" scoped>
.ws-legend {
  @apply bg-white border-crisiscleanup-dark-red border-x-2 border-t-2 p-2;
}

.worktype-svg-item {
  @apply flex items-center gap-2 w-1/2;
}

.toggle-icon {
  @apply text-lg;
}

.map-svg-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.map-svg-container svg {
  width: 100%;
  height: 100%;
}
</style>
