<template>
  <template v-if="isMobile">
    <base-button
      text=""
      data-testid="testSearchButton"
      icon="search"
      icon-size="sm"
      :title="$t('actions.search')"
      :alt="$t('actions.search')"
      :action="() => $emit('toggleSearch')"
      class="w-10 h-10 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
    />
    <base-button
      text=""
      icon-size="sm"
      data-testid="testWorksiteFiltersButton"
      ccu-icon="filters"
      :title="$t('casesVue.filters')"
      :alt="$t('casesVue.filters')"
      :action="
        () => {
          showingFilters = true;
        }
      "
      class="w-10 h-10 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
    >
      <span
        v-if="filtersCount > 0"
        class="rounded-full mx-2 px-1 bg-yellow-500 text-xs absolute top-0 ml-8 mt-1"
        >{{ filtersCount }}</span
      >
    </base-button>
    <base-button
      v-if="showLayers"
      data-testid="testLayersButton"
      variant="text"
      :title="$t('casesVue.layers')"
      :alt="$t('casesVue.layers')"
      icon-classes="w-4"
      text=""
      ccu-icon="layers"
      icon-size="sm"
      ccu-event="user_ui-zoom-in"
      :action="
        () => {
          showingLayers = true;
        }
      "
      class="w-10 h-10 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
    />
    <WorksiteFilters
      ref="worksiteFilter"
      :show="showingFilters"
      :current-filters="initalFilters"
      :incident="currentIncident"
      :locations="organizationLocations"
      @closed-filters="showingFilters = false"
      @updated-filters="handleFilters"
      @update-filters-count="filtersCount = $event"
    />
    <modal
      v-if="showingLayers"
      data-testid="testShowingLayersModal"
      modal-classes="bg-white h-120 shadow p-3"
      closeable
      :title="$t('casesVue.standard_layers')"
      @close="showingLayers = false"
    >
      <div class="my-2 max-h-84 overflow-auto">
        <base-input
          data-testid="testLayersSearchInput"
          :model-value="search"
          icon="search"
          :placeholder="$t('actions.search')"
          @update:model-value="(value) => (search = value)"
        />
        <div v-if="search.trim()" class="my-2">
          <LayerCheckboxList
            :items="searchResultItems"
            :applied-locations="appliedLocations"
            @apply="applyLocation"
          />
          <div
            v-if="searchedLayers.length === 0"
            class="text-crisiscleanup-dark-300"
          >
            {{ $t('~~No matching layers') }}
          </div>
        </div>
        <Accordion v-else>
          <AccordionItem
            v-for="section in layerSections"
            :key="section.key"
            :name="section.title"
          >
            <LayerCheckboxList
              :items="section.items"
              :applied-locations="appliedLocations"
              @apply="applyLocation"
            />
          </AccordionItem>
        </Accordion>
      </div>
    </modal>
  </template>
  <template v-else>
    <div
      class="flex flex-wrap items-center worksite-actions"
      style="color: #4c4c4d"
    >
      <div v-if="pdas && pdas.length > 0" class="mt-2">
        <base-checkbox
          class="pb-2"
          data-testid="testPdaHeatmapCheckbox"
          :model-value="showingHeatMap"
          @update:model-value="
            showingHeatMap = $event;
            $emit('toggleHeatMap', $event ? pdas : null);
          "
        >
          <div class="flex">
            {{ $t('casesVue.show_damaged_areas') }}
            <img
              v-tooltip="{
                content: $t('casesVue.damage_assessment_help'),
                triggers: ['hover'],
                html: true,
                popperClass: 'interactive-tooltip w-72',
              }"
              data-testid="testPdaHeatmapIcon"
              class="w-5 h-5"
              src="../../assets/red-cross-logo.jpg"
            />
          </div>
        </base-checkbox>
      </div>
      <base-button
        class="text-base font-thin mx-2"
        data-testid="testWorksiteFiltersButton"
        ccu-icon="filters"
        icon-size="medium"
        icon-classes="w-4"
        :alt="$t('casesVue.filters')"
        :action="
          () => {
            showingFilters = true;
          }
        "
      >
        {{ $t('casesVue.filters') }}
        <span
          v-if="filtersCount > 0"
          class="rounded-full mx-2 px-1 bg-yellow-500 text-xs"
          >{{ filtersCount }}</span
        >
      </base-button>
      <WorksiteFilters
        ref="worksiteFilter"
        :show="showingFilters"
        :current-filters="initalFilters"
        :incident="currentIncident"
        :locations="organizationLocations"
        @closed-filters="showingFilters = false"
        @updated-filters="handleFilters"
        @update-filters-count="filtersCount = $event"
      />

      <v-popover v-if="showLayers" placement="bottom-start">
        <base-button
          data-testid="testLayersButton"
          variant="text"
          class="text-base font-thin mx-2"
          :text="$t('casesVue.layers')"
          :alt="$t('casesVue.layers')"
          ccu-icon="layers"
          icon-size="medium"
          icon-classes="w-4"
        />

        <template #popper>
          <div class="px-4 py-1 font-bold">
            {{ $t('casesVue.standard_layers') }}
          </div>
          <div class="px-4 py-1">
            <base-input
              data-testid="testLayersSearchInput"
              :model-value="search"
              icon="search"
              :placeholder="$t('actions.search')"
              @update:model-value="(value) => (search = value)"
            />
          </div>
          <div v-if="search.trim()" class="locations-popover">
            <LayerCheckboxList
              :items="searchResultItems"
              :applied-locations="appliedLocations"
              @apply="applyLocation"
            />
            <div
              v-if="searchedLayers.length === 0"
              class="text-crisiscleanup-dark-300"
            >
              {{ $t('~~No matching layers') }}
            </div>
          </div>
          <template v-else>
            <v-menu
              v-for="section in layerSections"
              :key="section.key"
              placement="right-start"
              trigger="hover"
              instant-move
            >
              <div class="menu-item" :data-testid="section.menuTestId">
                {{ section.title }}
              </div>
              <template #popper>
                <v-menu placement="right-start" trigger="hover" instant-move>
                  <div class="locations-popover">
                    <LayerCheckboxList
                      :items="section.items"
                      :applied-locations="appliedLocations"
                      @apply="applyLocation"
                    />
                  </div>
                </v-menu>
              </template>
            </v-menu>
            <v-menu placement="right-start" trigger="hover" instant-move>
              <div class="menu-item">
                <base-checkbox
                  :model-value="showingUserLocations"
                  data-testid="testShowUserLocationsCheckbox"
                  @update:model-value="toggleUserLocations"
                >
                  {{ $t('casesVue.show_user_locations') }}
                </base-checkbox>
              </div>
            </v-menu>
          </template>
        </template>
      </v-popover>

      <base-button
        class="text-base font-thin mx-2"
        data-testid="testDownloadCsvButton"
        ccu-icon="download"
        icon-size="medium"
        icon-classes="w-4"
        :alt="$t('actions.download')"
        :text="$t('actions.download')"
        :action="() => $emit('downloadCsv')"
      />
    </div>
  </template>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { useViewport } from '@/hooks/useViewport';
import LocationType from '../../models/LocationType';
import Team from '../../models/Team';
import Incident from '../../models/Incident';
import { getQueryString } from '../../utils/urls';
import User from '../../models/User';
import Organization from '../../models/Organization';
import WorksiteFilters from './WorksiteFilters.vue';
import Accordion from '@/components/accordion/Accordion.vue';
import LayerCheckboxList, {
  type LayerItem,
} from '@/components/work/LayerCheckboxList.vue';
import AccordionItem from '@/components/accordion/AccordionItem.vue';
import useDialogs from '@/hooks/useDialogs';
import { useCurrentUser } from '@/hooks';
import Location from '@/models/Location';
import { Menu as VMenu } from 'floating-vue';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import { searchLayers } from '@/utils/layers';

export default defineComponent({
  name: 'WorksiteActions',
  components: {
    BaseCheckbox,
    VMenu,
    AccordionItem,
    Accordion,
    LayerCheckboxList,
    WorksiteFilters,
  },
  props: {
    initalFilters: { type: Object, default: null, required: false },
    map: { type: Object, default: null, required: false },
    currentIncidentId: { type: String, default: null, required: false },
    showLayers: { type: Boolean, default: true, required: false },
  },
  emits: ['applyLocation', 'applyTeamGeoJson', 'toggleUserLocations'],
  setup(props, { emit }) {
    const store = useStore();
    const { t } = useI18n();
    const { isMobile } = useViewport();
    const { currentUser, currentOrganization } = useCurrentUser();
    const currentIncidentId = computed(
      () => store.getters['incident/currentIncidentId'],
    );
    const { component } = useDialogs();

    const showingFilters = ref<boolean>(false);
    const showingLayers = ref<boolean>(false);
    const filtersCount = ref<number>(0);
    const filters = ref<any>({});
    const appliedFilters = ref<any>({});

    const appliedLocations = ref<Set<string>>(new Set());
    const locations = ref<any[] | null>(null);
    const usStates = ref<any[]>([]);
    const districts = ref<any[]>([]);
    const counties = ref<any[]>([]);
    const organizationLocations = ref<any[]>([]);
    const showingUserLocations = ref<boolean>(false);

    const pdas = ref(null);
    const showingHeatMap = ref(false);
    const search = ref('');

    const teams = computed(() => {
      return Team.all();
    });
    const currentIncident = computed(() => {
      return Incident.find(props.currentIncidentId);
    });
    // All layers in one list, so a search finds a county without opening
    // the county menu.
    const searchedLayers = computed(() =>
      searchLayers(
        [
          ...usStates.value,
          ...districts.value,
          ...counties.value,
          ...(currentIncident.value?.locationModels ?? []),
          ...organizationLocations.value,
        ],
        search.value,
      ),
    );

    const toLayerItems = (
      layers: { id: string; name: string }[],
      testId: string,
    ): LayerItem[] => layers.map(({ id, name }) => ({ id, name, testId }));

    const searchResultItems = computed(() =>
      toLayerItems(searchedLayers.value, 'testLayersSearchResultCheckbox'),
    );

    // The layer groups, in the order that the menu shows them. A phone shows
    // them as an accordion, and a desktop shows them as hover menus.
    const layerSections = computed(() => {
      const organization = currentOrganization.value;
      const responseAreas: LayerItem[] = [];
      if (organization?.primary_location) {
        responseAreas.push({
          id: organization.primary_location,
          name: t('casesVue.primary_response_area'),
          testId: 'testPrimaryResponseAreaCheckbox',
        });
      }
      if (organization?.secondary_location) {
        responseAreas.push({
          id: organization.secondary_location,
          name: t('casesVue.secondary_response_area'),
          testId: 'testSecondaryResponseAreaCheckbox',
        });
      }
      return [
        {
          key: 'states',
          title: t('locationTypes.boundary_political_home_primary_division'),
          menuTestId: 'testBoundaryPoliticalUsStateDiv',
          items: toLayerItems(
            usStates.value,
            'testBoundaryPoliticalUsStateCheckbox',
          ),
        },
        {
          key: 'districts',
          title: t('locationTypes.boundary_political_home_electoral_district'),
          menuTestId: 'testBoundaryPoliticalUsCongressDiv',
          items: toLayerItems(
            districts.value,
            'testBoundaryPoliticalUsCongressCheckbox',
          ),
        },
        {
          key: 'counties',
          title: t('locationTypes.boundary_political_home_local_division'),
          menuTestId: 'testBoundaryPoliticalUsCountyDiv',
          items: toLayerItems(
            counties.value,
            'testBoundaryPoliticalUsCountyCheckbox',
          ),
        },
        {
          key: 'incident',
          title: t('casesVue.incident'),
          menuTestId: 'testIncidentDiv',
          items: [
            ...toLayerItems(
              currentIncident.value?.locationModels ?? [],
              'testIncidentCheckbox',
            ),
            ...responseAreas,
          ],
        },
        {
          key: 'myLayers',
          title: t('casesVue.my_layers'),
          menuTestId: undefined,
          items: toLayerItems(organizationLocations.value, 'testFiltersButton'),
        },
      ];
    });

    async function applyLocation(locationId, value) {
      emit('applyLocation', {
        locationId,
        value,
      });
      if (value) {
        appliedLocations.value = new Set(
          appliedLocations.value.add(locationId),
        );
      } else {
        appliedLocations.value.delete(locationId);
        appliedLocations.value = new Set(appliedLocations.value);
      }
    }

    async function applyTeamGeoJson(team, value) {
      const { response } = await Team.api().getCasesArea(
        team.id,
        props.currentIncidentId,
      );
      const locationId = team.id;

      emit('applyTeamGeoJson', {
        teamId: team.id,
        value,
        geom: response.data,
      });

      if (value) {
        appliedLocations.value = new Set(
          appliedLocations.value.add(locationId),
        );
      } else {
        appliedLocations.value.delete(locationId);
        appliedLocations.value = new Set(appliedLocations.value);
      }
    }

    function toggleUserLocations(value: boolean) {
      showingUserLocations.value = value;
      emit('toggleUserLocations', value);
    }

    async function getIncidentLocations() {
      if (currentIncident.value.locations.length > 0) {
        const locationIds = currentIncident.value.locations.map(
          (location) => location.location,
        );
        await Location.api().get(`/locations?id__in=${locationIds.join(',')}`, {
          dataKey: 'results',
        });
      }
    }

    async function getLocations() {
      const locationParams = {
        limit: 200,
        fields: 'id,name,type',
        incident_area: props.currentIncidentId,
      };
      const promiseArray: any = [];

      const locationTypesMap = {
        boundary_political_home_electoral_district: districts,
        boundary_political_home_primary_division: usStates,
        boundary_political_home_local_division: counties,
      };

      for (const type of Object.keys(locationTypesMap)) {
        const promise = axios
          .get(`${import.meta.env.VITE_APP_API_BASE_URL}/locations`, {
            params: {
              ...locationParams,
              type__key: type,
            },
          })
          .then((response) => {
            locationTypesMap[type].value = response.data.results;
          });
        promiseArray.push(promise);
      }

      return Promise.any(promiseArray);
    }

    async function getOrganizationLocations() {
      const locationParams = {
        limit: 200,
        created_by__organization: currentUser?.value?.organization.id,
        fields: 'id,name,type',
      };
      const queryString = getQueryString(locationParams);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/locations?${queryString}`,
      );
      organizationLocations.value = response.data.results;
    }

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
      // this.updateUserState();
    }

    async function getPdas() {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/pdas`,
        {
          params: { incident: currentIncidentId.value },
        },
      );
      pdas.value = response.data
        .filter((p) => Boolean(p.location))
        .map((p) => [p.location.coordinates[1], p.location.coordinates[0]]);
    }

    onMounted(async () => {
      if (props.initalFilters) {
        filters.value = props.initalFilters;
      }

      await Promise.any([
        getIncidentLocations(),
        getLocations(),
        getOrganizationLocations(),
        LocationType.api().get('/location_types', {
          dataKey: 'results',
        }),
        Team.api().get('/teams', {
          dataKey: 'results',
        }),
        getPdas(),
      ]);
    });

    return {
      handleFilters,
      filters,
      currentIncident,
      currentOrganization,
      organizationLocations,
      showingFilters,
      showingLayers,
      usStates,
      districts,
      counties,
      applyLocation,
      applyTeamGeoJson,
      appliedLocations,
      teams,
      locations,
      filtersCount,
      pdas,
      showingHeatMap,
      isMobile,
      toggleUserLocations,
      showingUserLocations,
      search,
      searchedLayers,
      searchResultItems,
      layerSections,
    };
  },
});
</script>

<style scoped>
.locations-popover {
  @apply h-64 overflow-auto p-3 w-64;
}

.menu-item {
  @apply cursor-pointer px-4 py-2 hover:bg-crisiscleanup-light-grey;
}
</style>
