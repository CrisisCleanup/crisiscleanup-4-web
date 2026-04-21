<template>
  <div
    role="tablist"
    :aria-label="$t('casesVue.view_mode', 'View mode')"
    class="inline-flex flex-wrap items-center rounded border border-crisiscleanup-grey-100 bg-white overflow-hidden"
  >
    <button
      v-for="tab in visibleTabs"
      :key="tab.key"
      type="button"
      role="tab"
      :aria-selected="tab.active"
      :data-testid="tab.testid"
      :title="tab.label"
      :aria-label="tab.label"
      class="w-9 h-9 grid place-items-center transition"
      :class="
        tab.active
          ? 'bg-primary-light text-black'
          : 'text-crisiscleanup-grey-900 hover:bg-crisiscleanup-smoke'
      "
      @click="tab.emit"
    >
      <component :is="tab.icon" class="w-[18px] h-[18px]" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import useAcl from '@/hooks/useAcl';
import LucideMap from '~icons/lucide/map';
import LucideRows3 from '~icons/lucide/rows-3';
import LucideImage from '~icons/lucide/image';
import LucideScrollText from '~icons/lucide/scroll-text';
import LucideCalendar from '~icons/lucide/calendar';
import LucideCalendarDays from '~icons/lucide/calendar-days';
import LucideMapPinned from '~icons/lucide/map-pinned';

interface Props {
  caseImages: unknown[];
  showingFeed: boolean;
  showingMap: boolean;
  showingPhotoMap: boolean;
  showingTable: boolean;
  showingCalendar?: boolean;
  showingCalendarList?: boolean;
  showingCalendarMap?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showingCalendar: false,
  showingCalendarList: false,
  showingCalendarMap: false,
});

const emit = defineEmits<{
  (e: 'showFeed'): void;
  (e: 'showMap'): void;
  (e: 'showPhotoMap'): void;
  (e: 'showTable'): void;
  (e: 'showCalendar'): void;
  (e: 'showCalendarList'): void;
  (e: 'showCalendarMap'): void;
}>();

const { t } = useI18n();
const { $can } = useAcl();

interface Tab {
  key: string;
  icon: Component;
  active: boolean;
  visible: boolean;
  testid: string;
  label: string;
  emit: () => void;
}

const tabs = computed<Tab[]>(() => [
  {
    key: 'map',
    icon: LucideMap,
    active: props.showingMap,
    visible: true,
    testid: 'testMapViewIcon',
    label: t('casesVue.map_view'),
    emit: () => emit('showMap'),
  },
  {
    key: 'table',
    icon: LucideRows3,
    active: props.showingTable,
    visible: true,
    testid: 'testTableViewIcon',
    label: t('casesVue.table_view'),
    emit: () => emit('showTable'),
  },
  {
    key: 'photo-map',
    icon: LucideImage,
    active: props.showingPhotoMap,
    visible: props.caseImages.length > 0,
    testid: 'testPhotoMapViewIcon',
    label: t('casesVue.photo_map_view'),
    emit: () => emit('showPhotoMap'),
  },
  {
    key: 'feed',
    icon: LucideScrollText,
    active: props.showingFeed,
    visible: Boolean($can && $can('beta_feature.enable_feed')),
    testid: 'testFeedViewIcon',
    label: t('casesVue.feed_view'),
    emit: () => emit('showFeed'),
  },
  {
    key: 'calendar',
    icon: LucideCalendar,
    active: props.showingCalendar,
    visible: true,
    testid: 'testCalendarIcon',
    label: t('casesVue.calendar_view'),
    emit: () => emit('showCalendar'),
  },
  {
    key: 'calendar-list',
    icon: LucideCalendarDays,
    active: props.showingCalendarList,
    visible: true,
    testid: 'testCalendarListViewIcon',
    label: t('casesVue.calendar_list_view'),
    emit: () => emit('showCalendarList'),
  },
  {
    key: 'calendar-map',
    icon: LucideMapPinned,
    active: props.showingCalendarMap,
    visible: true,
    testid: 'testCalendarMapViewIcon',
    label: t('casesVue.calendar_map_view'),
    emit: () => emit('showCalendarMap'),
  },
]);

const visibleTabs = computed(() =>
  tabs.value.filter((tab: Tab) => tab.visible),
);
</script>
