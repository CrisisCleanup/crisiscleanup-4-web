<template>
  <div class="flex items-center gap-2">
    <ccu-icon
      :alt="$t('casesVue.map_view')"
      data-testid="testMapViewIcon"
      size="medium"
      class="cursor-pointer"
      :class="showingMap ? 'filter-yellow' : 'filter-gray'"
      type="map"
      ccu-event="user_ui-view-map"
      @click="handleShowMap"
    />
    <ccu-icon
      :alt="$t('casesVue.table_view')"
      data-testid="testTableViewIcon"
      size="medium"
      class="cursor-pointer"
      :class="showingTable ? 'filter-yellow' : 'filter-gray'"
      type="table"
      ccu-event="user_ui-view-table"
      @click="handleShowTable"
    />
    <ccu-icon
      v-if="caseImages.length > 0"
      :alt="$t('casesVue.photo_map_view')"
      data-testid="testPhotoMapViewIcon"
      size="medium"
      class="cursor-pointer"
      :class="
        showingPhotoMap ? 'text-primary-light' : 'text-crisiscleanup-dark-100'
      "
      ccu-event="user_ui-view-photo-map"
      type="image"
      :fa="true"
      @click="handleShowPhotoMap"
    />
    <ccu-icon
      v-if="$can('beta_feature.enable_feed')"
      :alt="$t('casesVue.feed_view')"
      data-testid="testFeedViewIcon"
      size="medium"
      class="cursor-pointer"
      :class="
        showingFeed ? 'text-primary-light' : 'text-crisiscleanup-dark-100'
      "
      ccu-event="user_ui-view-feed"
      type="scroll"
      :fa="true"
      @click="handleShowFeed"
    />

    <ccu-icon
      :alt="$t('casesVue.calendar_view')"
      data-testid="testCalendarIcon"
      size="medium"
      class="cursor-pointer"
      :class="showingCalendar ? 'filter-yellow' : 'filter-gray'"
      ccu-event="user_ui-view-calendar"
      type="calendar"
      :fa="true"
      @click="handleShowCalendar"
    />
    <ccu-icon
      :alt="$t('casesVue.calendar_list_view')"
      data-testid="testCalendarListViewIcon"
      size="base"
      class="cursor-pointer"
      :class="showingCalendarList ? 'filter-yellow' : 'filter-gray'"
      ccu-event="user_ui-view-calendar-list"
      type="calendar-list"
      @click="handleShowCalendarList"
    />
    <ccu-icon
      :alt="$t('casesVue.calendar_map_view')"
      data-testid="testCalendarMapViewIcon"
      size="base"
      class="cursor-pointer"
      :class="showingCalendarMap ? 'filter-yellow' : 'filter-gray'"
      ccu-event="user_ui-view-calendar-map"
      type="calendar-map"
      @click="handleShowCalendarMap"
    />
  </div>
</template>

<script setup lang="ts">
import useAcl from '@/hooks/useAcl';
import CcuIcon from '@/components/BaseIcon.vue';

interface Props {
  caseImages: any[];
  showingFeed: boolean;
  showingMap: boolean;
  showingPhotoMap: boolean;
  showingTable: boolean;
  showingCalendar: boolean;
  showingCalendarList: boolean;
  showingCalendarMap: boolean;
}

const props = defineProps<Props>();

// Define the events that this component emits
const emit = defineEmits<{
  (e: 'showFeed'): void;
  (e: 'showMap'): void;
  (e: 'showPhotoMap'): void;
  (e: 'showTable'): void;
  (e: 'showCalendar'): void;
  (e: 'showCalendarList'): void;
  (e: 'showCalendarMap'): void;
}>();

const { $can } = useAcl();

// Event handler methods that emit the corresponding events
const handleShowMap = () => {
  emit('showMap');
};

const handleShowTable = () => {
  emit('showTable');
};

const handleShowPhotoMap = () => {
  emit('showPhotoMap');
};

const handleShowFeed = () => {
  emit('showFeed');
};

const handleShowCalendar = () => {
  emit('showCalendar');
};

const handleShowCalendarList = () => {
  emit('showCalendarList');
};

const handleShowCalendarMap = () => {
  emit('showCalendarMap');
};
</script>
