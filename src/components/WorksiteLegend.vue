<script setup lang="ts">
import ColoredCircle from '@/components/ColoredCircle.vue';
import F7PlusApp from '~icons/f7/plus-app';
import { colors, templates } from '@/icons/icons_templates';
import { getWorkTypeName } from '@/filters';

export interface WorksiteMapLegendProps {
  availableWorkTypes: Record<string, any>[];
}

const props = withDefaults(defineProps<WorksiteMapLegendProps>(), {
  availableWorkTypes: () => [],
});

const { t } = useI18n();

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
</script>

<template>
  <div class="ws-legend">
    <div class="ws-legend__section">
      <div class="ws-legend__section-title">
        {{ $t('~~Work Types') }}
      </div>
      <div class="ws-legend__section-content">
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
    </div>
    <div class="ws-legend__section">
      <div class="ws-legend__section-title">
        {{ $t('worksiteMap.case_status') }}
      </div>
      <div class="ws-legend__section-content">
        <div
          v-for="(value, key) in legendColors"
          :key="key"
          class="flex items-start gap-x-2 w-1/2"
        >
          <ColoredCircle
            class="shrink-0 w-4 h-4 border border-black rounded-full"
            :color="value"
          />
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
  </div>
</template>

<style lang="postcss" scoped>
.ws-legend {
  @apply bg-white flex flex-col gap-2;

  &__section {
    @apply flex flex-col gap-1;
  }

  &__section-title {
    @apply text-sm font-semibold;
  }

  &__section-content {
    @apply flex flex-wrap gap-y-0.5;
  }
}

.worktype-svg-item {
  @apply flex items-center gap-2 w-1/2;
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
