<template>
  <WorksiteSearchInput
    :value="currentSearch"
    data-testid="testWorksiteSearch"
    icon="filters"
    :icon-badge="filtersCount"
    display-property="name"
    :placeholder="$t('actions.search')"
    size="medium"
    skip-validation
    use-recents
    class="mx-4 py-1"
    @selected-existing="$emit('selected-existing', $event)"
    @input="
      (value: string) => {
        currentSearch = value;
      }
    "
    @icon-clicked="showFilters"
  />

  <WorksiteFilters
    ref="worksiteFilter"
    :show="showingFilters"
    :current-filters="initialFilters"
    :incident="currentIncident"
    :locations="organizationLocations"
    @closed-filters="showingFilters = false"
    @updated-filters="handleFilters"
    @update-filters-count="filtersCount = $event"
    @updated-filter-labels="$emit('updatedFilterLabels', $event)"
  />
</template>
<script setup lang="ts">
import WorksiteSearchInput from '@/components/work/WorksiteSearchInput.vue';
import WorksiteFilters from '@/components/work/WorksiteFilters.vue';
import { ref } from 'vue';

defineProps({
  initialFilters: {
    type: Number,
    required: true,
  },
  currentIncident: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(
  'selected-existing',
  'updatedQuery',
  'updatedFilters',
  'closed-filters',
  'update-filters-count',
  'updatedFilterLabels',
);

const currentSearch = ref('');
const showingFilters = ref(false);
const filtersCount = ref<number>(0);
const filters = ref<any>({});
const appliedFilters = ref<any>({});

const organizationLocations = ref([]);
const showFilters = () => {
  showingFilters.value = true;
};
function handleFilters(f) {
  appliedFilters.value = {};
  filters.value = f.filters;
  Object.values(f.filters).forEach((filter: any) => {
    appliedFilters.value = {
      ...appliedFilters.value,
      ...filter.packFunction(),
    };
  });
  filtersCount.value = f.count;

  showingFilters.value = false;
  emit('updatedQuery', appliedFilters.value);
  emit('updatedFilters', filters.value);
}
</script>
