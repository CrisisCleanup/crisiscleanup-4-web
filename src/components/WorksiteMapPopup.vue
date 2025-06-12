<template>
  <div class="flex flex-col">
    <div class="flex items-center justify-between p-2">
      <div></div>
      <div class="flex gap-2 mr-2">
        <ccu-icon
          :alt="$t('casesVue.map_view')"
          data-testid="testMapViewIcon"
          size="medium"
          class="cursor-pointer"
          :class="showingMap ? 'filter-yellow' : 'filter-gray'"
          type="map"
          ccu-event="user_ui-view-map"
          @click="() => showMap(true)"
        />
        <ccu-icon
          :alt="$t('casesVue.table_view')"
          data-testid="testTableViewIcon"
          size="medium"
          class="cursor-pointer"
          :class="showingTable ? 'filter-yellow' : 'filter-gray'"
          type="table"
          ccu-event="user_ui-view-table"
          @click="showTable"
        />
      </div>
    </div>
    <div class="relative flex-grow border-t">
      <SimpleMap
        v-show="showingMap"
        :map-loading="false"
        data-testid="mapPopupTest"
      />
      <WorksiteTable
        v-show="showingTable"
        :worksite-query="props.query"
        :body-style="{ height: '32rem' }"
        @row-click="onSelectWorksite"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import SimpleMap from '@/components/SimpleMap.vue';
import useWorksiteMap from '@/hooks/worksite/useWorksiteMapRefactored';
import CcuIcon from '@/components/BaseIcon.vue';
import WorksiteTable from '@/components/work/WorksiteTable.vue';
import { loadCasesCached } from '@/utils/worksite';
import BaseCheckbox from '@/components/BaseCheckbox.vue';

const props = defineProps<{
  incidentId: number;
  query?: Record<string, any> | null;
}>();

const emits = defineEmits(['selectWorksite']);

let mapUtils: ReturnType<typeof useWorksiteMap> | null = null;

const showingMap = ref(true);
const showingTable = ref(false);

const showMap = (show: boolean) => {
  showingMap.value = show;
  showingTable.value = !show;
};

const showTable = () => {
  showingTable.value = true;
  showingMap.value = false;
};

const onSelectWorksite = (worksite: any) => {
  emits('selectWorksite', worksite);
};

async function getWorksites() {
  const response = await loadCasesCached(props.query);
  return response.results;
}
/**
 * Minimal example that fetches worksites for the given incident
 * and sets a default or custom center.
 */
onMounted(async () => {
  try {
    // 1. Fetch worksites by incident
    const worksites = await getWorksites(props.incidentId);

    // 2. Initialize the map composable
    mapUtils = useWorksiteMap(
      worksites,
      worksites.map((ws) => ws.id),
      (w) => {
        onSelectWorksite(w);
      },
      (_, map) => {
        // Map centering logic
        if (props.incidentCenter) {
          // incidentCenter is typically [longitude, latitude]
          map.setView([props.incidentCenter[1], props.incidentCenter[0]], 5);
        } else {
          // Fallback center if none is provided
          map.setView([35.7465, -96.4115], 5);
        }
      },
    );
  } catch (error) {
    console.error('Error fetching worksites for popup map:', error);
  }
});
</script>

<style scoped>
/* You can style your popup container here if needed */
</style>
