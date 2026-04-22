<template>
  <div class="w-5/6 mx-auto">
    <LayerUploadTool :key="locations" @added-layer="getLocations" />
    <LocationTable
      :locations="locations"
      :meta="locationsMeta"
      :loading="locationsLoading"
      :body-style="{ height: 'calc(100vh - 30rem)' }"
      data-testid="testLocationsTable"
      @change="handleTableChange"
      @delete-location="deleteLocation"
    >
      <template #toolbar>
        <base-input
          v-model="currentSearch"
          data-testid="testGetLocationsSearch"
          icon="search"
          class="flex-1"
          :placeholder="$t('actions.search')"
          @update:model-value="getLocations"
        ></base-input>
        <base-select
          v-model="locationTypeFilter"
          data-testid="testLocationTypeFilterSelect"
          :options="
            locationTypes.map((l) => {
              return { ...l, name_t: $t(l.name_t) };
            })
          "
          class="w-64 border border-crisiscleanup-dark-100"
          item-key="id"
          label="name_t"
          :placeholder="$t('locationVue.location_type')"
          select-classes="bg-white border text-xs location-select p-1"
          @update:model-value="getLocations"
        />
        <base-button
          :text="$t('actions.create_location')"
          :alt="$t('actions.create_location')"
          data-testid="testCreateLocationButton"
          variant="solid"
          size="sm"
          :action="
            () => {
              $router.push('/locations/new');
            }
          "
        />
      </template>
    </LocationTable>
  </div>
</template>

<script lang="ts">
import { useToast } from 'vue-toastification';
import { debounce } from 'lodash';
import LayerUploadTool from '@/components/locations/LayerUploadTool.vue';
import LocationTable from '@/components/LocationTable.vue';
import Location from '@/models/Location';
import LocationType from '@/models/LocationType';
import { getQueryString } from '@/utils/urls';
import { getErrorMessage } from '@/utils/errors';
import { useCurrentUser } from '@/hooks';
import Table from '@/components/Table.vue';

export default defineComponent({
  name: 'Layers',
  components: { Table, LocationTable, LayerUploadTool },
  setup() {
    const toasted = useToast();
    const { t } = useI18n();

    const { currentUser } = useCurrentUser();
    const locationTypes = computed(() => LocationType.all());
    const locationTypeFilter = ref();
    const currentSearch = ref<string>('');
    const locationsLoading = ref(false);
    const locations = ref<Array<Location>>([]);
    const locationsMeta = reactive({
      pagination: {
        pageSize: 20,
        page: 1,
        current: 1,
        total: 0,
      },
    });

    const getLocations = async () => {
      locationsLoading.value = true;
      const params: Record<string, any> = {
        created_by__organization: currentUser.value?.organization.id,
        type__isnull: false,
        fields: 'id,name,type,shared',
        offset:
          locationsMeta.pagination.pageSize *
          (locationsMeta.pagination.page - 1),
        limit: locationsMeta.pagination.pageSize,
      };
      if (currentSearch.value) {
        params.search = currentSearch.value;
      }

      if (locationTypeFilter.value) {
        params.type = locationTypeFilter.value;
      }

      const results = await Location.api().get(
        `/locations?${getQueryString(params)}`,
        {
          dataKey: 'results',
          save: false,
        },
      );
      locations.value = results.response.data.results;

      locationsMeta.pagination.total = results.response.data.count;
      locationsMeta.pagination = { ...locationsMeta.pagination };
      locationsLoading.value = false;
    };

    const handleTableChange = async ({ pagination }) => {
      locationsMeta.pagination = { ...pagination };
      await getLocations();
    };

    const deleteLocation = async (locationId: string) => {
      locationsLoading.value = true;
      try {
        await Location.api().delete(`/locations/${locationId}`, {
          delete: locationId,
        });
        await toasted.success(t('locationVue.location_deleted'));
        await getLocations();
      } catch (error) {
        await toasted.error(getErrorMessage(error));
      } finally {
        locationsLoading.value = false;
      }
    };

    onMounted(async () => await getLocations());

    return {
      currentUser,
      locationTypes,
      locations,
      locationTypeFilter,
      currentSearch,
      locationsLoading,
      locationsMeta,
      getLocations,
      handleTableChange,
      deleteLocation,
      debounce,
    };
  },
});
</script>

<style scoped lang="postcss">
.location-select .vs__selected {
  @apply text-xs bg-white !important;
}
</style>
