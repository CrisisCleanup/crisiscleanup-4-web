<script lang="ts" setup>
import WorksiteLegend from '@/components/WorksiteLegend.vue';
import MdiChevronUp from '~icons/mdi/chevron-up';
import MdiChevronDown from '~icons/mdi/chevron-down';
import useCurrentUser from '@/hooks/useCurrentUser';
import { getErrorMessage } from '@/utils/errors';

export interface SimpleMapProps {
  mapLoading?: boolean;
  zoomButtonsClass?: string;
  showZoomButtons?: boolean;
  showLegend?: boolean;
  removeLegend?: boolean;
  availableWorkTypes?: Record<string, unknown>[];
  showMapLayerToggle?: boolean;
}

export interface SimpleMapEmits {
  (event: 'onZoomIn'): void;
  (event: 'onZoomIn'): void;
  (event: 'onZoomOut'): void;
  (event: 'onZoomInteractive'): void;
  (event: 'onZoomIncidentCenter'): void;
  (event: 'onToggleMapType'): void;
}

const props = withDefaults(defineProps<SimpleMapProps>(), {
  zoomButtonsClass: '',
  availableWorkTypes: () => [],
});

const emit = defineEmits<SimpleMapEmits>();

const { t } = useI18n();
const { currentUser, userStates, updateUserStates } = useCurrentUser();
const showingLegend = ref(userStates.value?.showingLegend ?? true);
const legendRef = ref<HTMLElement | null>(null);

function toggleLegend(status) {
  showingLegend.value = status;
  updateUserStates({ showingLegend: status }, {}).catch(getErrorMessage);
}

watch(showingLegend, async (newValue) => {
  await updateUserStates({ showingLegend: newValue }, {});
});
</script>

<template>
  <div id="map" ref="map" class="absolute top-0 left-0 right-0 bottom-0 z-50">
    <div
      v-if="props.mapLoading"
      class="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center z-map-controls"
    >
      <spinner show-quote />
    </div>
    <div
      v-if="props.showZoomButtons"
      class="flex flex-col absolute zoom-control-container z-map-controls"
      style="top: 10px; left: 10px"
      :class="props.zoomButtonsClass"
    >
      <div class="zoom-control flex flex-col mb-5">
        <base-button
          text=""
          data-testid="testZoomInButton"
          icon="plus"
          icon-size="xs"
          ccu-event="user_ui-zoom-in"
          :title="$t('worksiteMap.zoom_in')"
          :alt="$t('worksiteMap.zoom_in')"
          :action="
            () => {
              emit('onZoomIn');
            }
          "
          class="w-8 h-8 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
        />
        <base-button
          text=""
          data-testid="testZoomOutButton"
          icon="minus"
          icon-size="xs"
          ccu-event="user_ui-zoom-out"
          :title="$t('worksiteMap.zoom_out')"
          :alt="$t('worksiteMap.zoom_out')"
          :action="
            () => {
              emit('onZoomOut');
            }
          "
          class="w-8 h-8 border border-crisiscleanup-dark-100 bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
        />
      </div>
      <base-button
        v-tooltip="{
          content: $t('worksiteMap.zoom_to_make_interactive'),
          // show: showInteractivePopover,
          triggers: ['hover'],
          popperClass: 'interactive-tooltip',
          placement: 'right-start',
          html: true,
        }"
        data-testid="testZoomToMakeInteractiveButton"
        text=""
        :title="$t('worksiteMap.zoom_to_interactive')"
        :alt="$t('worksiteMap.zoom_to_interactive')"
        ccu-event="user_ui-zoom-details"
        :action="
          () => {
            emit('onZoomInteractive');
          }
        "
        icon="tree"
        icon-size="lg"
        class="w-8 h-8 border my-1 border-crisiscleanup-dark-100 bg-white shadow-xl text-crisiscleanup-dark-400"
      />
      <base-button
        v-tooltip="{
          content: $t('worksiteMap.zoom_to_incident'),
          // show: showInteractivePopover,
          triggers: ['hover'],
          popperClass: 'interactive-tooltip',
          placement: 'right-start',
          html: true,
        }"
        data-testid="testZoomToIncidentButton"
        text=""
        :title="$t('worksiteMap.zoom_to_incident')"
        :alt="$t('worksiteMap.zoom_to_incident')"
        icon="search-minus"
        ccu-event="user_ui-zoom-all"
        icon-size="lg"
        :action="
          () => {
            emit('onZoomIncidentCenter');
          }
        "
        class="w-8 h-8 border border-crisiscleanup-dark-100 my-1 bg-white shadow-xl text-crisiscleanup-dark-400"
      />
      <base-button
        v-if="showMapLayerToggle"
        text=""
        data-testid="testToggleMapTypeButton"
        icon="map"
        icon-size="xs"
        :title="$t('worksiteMap.toggle_map_type')"
        :alt="$t('worksiteMap.toggle_map_type')"
        :action="
          () => {
            emit('onToggleMapType');
          }
        "
        class="w-8 h-8 border-crisiscleanup-dark-100 border-t border-l border-r border-b bg-white shadow-xl text-xl text-crisiscleanup-dark-400 mt-4"
      />
    </div>

    <!-- TODO: Extract to Expandable component -->
    <div
      v-if="(showZoomButtons && !removeLegend) || showLegend"
      ref="legendRef"
      class="worksite-legend pb-6 bg-white border-2 border-crisiscleanup-dark-red"
    >
      <div
        v-if="showingLegend"
        data-testid="testShowingLegendDiv"
        class="flex flex-col"
        @click="toggleLegend(false)"
      >
        <div class="expandable-header">
          <div class="text-base font-bold">
            {{ $t('worksiteMap.legend') }}
          </div>
          <MdiChevronDown
            class="text-lg"
            data-testid="testHideLegendIcon"
            :title="$t('worksiteMap.hide_legend')"
          />
        </div>
        <WorksiteLegend
          :key="availableWorkTypes"
          class="px-2"
          :available-work-types="availableWorkTypes"
        />
      </div>
      <div
        v-else
        data-testid="testHiddenLegendDiv"
        class="expandable-header"
        @click="toggleLegend(true)"
      >
        <div class="text-base font-bold">
          {{ $t('worksiteMap.legend') }}
        </div>
        <MdiChevronUp
          class="text-lg"
          data-testid="testShowLegendIcon"
          :title="$t('worksiteMap.show_legend')"
        />
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.worksite-legend {
  @apply hidden md:block rounded-t-lg absolute bottom-0 left-0 w-72 z-map-controls;
}

.expandable-header {
  @apply p-2 cursor-pointer flex items-center justify-between;
}
</style>
