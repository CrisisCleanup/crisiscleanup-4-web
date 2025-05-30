<template>
  <template v-if="mq.mdMinus">
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
        <Accordion>
          <AccordionItem
            :name="$t('locationTypes.boundary_political_home_primary_division')"
          >
            <div v-for="state in usStates" :key="`${state.id}`">
              <base-checkbox
                :model-value="appliedLocations.has(state.id)"
                :ccu-event="
                  appliedLocations.has(state.id)
                    ? 'user_ui-turn-off_layer'
                    : 'user_ui-turn-on_layer'
                "
                data-testid="testBoundaryPoliticalUsStateCheckbox"
                @update:model-value="
                  (value) => {
                    applyLocation(state.id, value);
                  }
                "
                >{{ state.name }}
              </base-checkbox>
            </div>
          </AccordionItem>
          <AccordionItem
            :name="
              $t('locationTypes.boundary_political_home_electoral_district')
            "
          >
            <div v-for="district in districts" :key="`${district.id}`">
              <base-checkbox
                :model-value="appliedLocations.has(district.id)"
                :ccu-event="
                  appliedLocations.has(district.id)
                    ? 'user_ui-turn-off_layer'
                    : 'user_ui-turn-on_layer'
                "
                data-testid="testBoundaryPoliticalUsCongressCheckbox"
                @update:model-value="
                  (value) => {
                    applyLocation(district.id, value);
                  }
                "
                >{{ district.name }}
              </base-checkbox>
            </div>
          </AccordionItem>
          <AccordionItem
            :name="$t('locationTypes.boundary_political_home_local_division')"
          >
            <div v-for="county in counties" :key="`${county.id}`">
              <base-checkbox
                :model-value="appliedLocations.has(county.id)"
                :ccu-event="
                  appliedLocations.has(county.id)
                    ? 'user_ui-turn-off_layer'
                    : 'user_ui-turn-on_layer'
                "
                data-testid="testBoundaryPoliticalUsCountyCheckbox"
                @update:model-value="
                  (value) => {
                    applyLocation(county.id, value);
                  }
                "
                >{{ county.name }}
              </base-checkbox>
            </div>
          </AccordionItem>
          <AccordionItem :name="$t('casesVue.incident')">
            <div
              v-for="location in currentIncident.locationModels"
              :key="location.id"
            >
              <base-checkbox
                :model-value="appliedLocations.has(location.id)"
                :ccu-event="
                  appliedLocations.has(location.id)
                    ? 'user_ui-turn-off_layer'
                    : 'user_ui-turn-on_layer'
                "
                data-testid="testIncidentCheckbox"
                @update:model-value="
                  (value) => {
                    applyLocation(location.id, value);
                  }
                "
                >{{ location.name }}
              </base-checkbox>
            </div>
            <div
              v-if="currentOrganization && currentOrganization.primary_location"
            >
              <base-checkbox
                :model-value="
                  appliedLocations.has(currentOrganization.primary_location)
                "
                :ccu-event="
                  appliedLocations.has(currentOrganization.primary_location)
                    ? 'user_ui-turn-off_layer'
                    : 'user_ui-turn-on_layer'
                "
                data-testid="testPrimaryResponseAreaCheckbox"
                @update:model-value="
                  (value) => {
                    applyLocation(currentOrganization.primary_location, value);
                  }
                "
                >{{ $t('casesVue.primary_response_area') }}
              </base-checkbox>
            </div>
            <div
              v-if="
                currentOrganization && currentOrganization.secondary_location
              "
            >
              <base-checkbox
                :model-value="
                  appliedLocations.has(currentOrganization.secondary_location)
                "
                :ccu-event="
                  appliedLocations.has(currentOrganization.secondary_location)
                    ? 'user_ui-turn-off_layer'
                    : 'user_ui-turn-on_layer'
                "
                data-testid="testSecondaryResponseAreaCheckbox"
                @update:model-value="
                  (value) => {
                    applyLocation(
                      currentOrganization.secondary_location,
                      value,
                    );
                  }
                "
                >{{ $t('casesVue.secondary_response_area') }}
              </base-checkbox>
            </div>
          </AccordionItem>
          <AccordionItem :name="$t('casesVue.my_layers')">
            <div
              v-for="location in organizationLocations"
              :key="`${location.id}`"
            >
              <base-checkbox
                :model-value="appliedLocations.has(location.id)"
                :ccu-event="
                  appliedLocations.has(location.id)
                    ? 'user_ui-turn-off_layer'
                    : 'user_ui-turn-on_layer'
                "
                data-testid="testFiltersButton"
                @update:model-value="
                  (value) => {
                    applyLocation(location.id, value);
                  }
                "
                >{{ location.name }}
              </base-checkbox>
            </div>
          </AccordionItem>
        </Accordion>
      </div>
    </modal>
  </template>
  <template v-else>
    <div class="flex items-center worksite-actions" style="color: #4c4c4d">
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

          <v-menu placement="right-start" trigger="hover" instant-move>
            <div
              class="menu-item"
              data-testid="testBoundaryPoliticalUsStateDiv"
            >
              {{ $t('locationTypes.boundary_political_home_primary_division') }}
            </div>

            <template #popper>
              <v-menu placement="right-start" trigger="hover" instant-move>
                <div class="locations-popover">
                  <div v-for="state in usStates" :key="`${state.id}`">
                    <base-checkbox
                      :model-value="appliedLocations.has(state.id)"
                      :ccu-event="
                        appliedLocations.has(state.id)
                          ? 'user_ui-turn-off_layer'
                          : 'user_ui-turn-on_layer'
                      "
                      data-testid="testBoundaryPoliticalUsStateCheckbox"
                      @update:model-value="
                        (value) => {
                          applyLocation(state.id, value);
                        }
                      "
                      >{{ state.name }}</base-checkbox
                    >
                  </div>
                </div>
              </v-menu>
            </template>
          </v-menu>
          <v-menu placement="right-start" trigger="hover" instant-move>
            <div
              class="menu-item"
              data-testid="testBoundaryPoliticalUsCongressDiv"
            >
              {{
                $t('locationTypes.boundary_political_home_electoral_district')
              }}
            </div>

            <template #popper>
              <v-menu placement="right-start" trigger="hover" instant-move>
                <div class="locations-popover">
                  <div v-for="district in districts" :key="`${district.id}`">
                    <base-checkbox
                      :model-value="appliedLocations.has(district.id)"
                      :ccu-event="
                        appliedLocations.has(district.id)
                          ? 'user_ui-turn-off_layer'
                          : 'user_ui-turn-on_layer'
                      "
                      data-testid="testBoundaryPoliticalUsCongressCheckbox"
                      @update:model-value="
                        (value) => {
                          applyLocation(district.id, value);
                        }
                      "
                      >{{ district.name }}</base-checkbox
                    >
                  </div>
                </div>
              </v-menu>
            </template>
          </v-menu>
          <v-menu placement="right-start" trigger="hover" instant-move>
            <div
              class="menu-item"
              data-testid="testBoundaryPoliticalUsCountyDiv"
            >
              {{ $t('locationTypes.boundary_political_home_local_division') }}
            </div>

            <template #popper>
              <v-menu placement="right-start" trigger="hover" instant-move>
                <div class="locations-popover">
                  <div v-for="county in counties" :key="`${county.id}`">
                    <base-checkbox
                      :model-value="appliedLocations.has(county.id)"
                      :ccu-event="
                        appliedLocations.has(county.id)
                          ? 'user_ui-turn-off_layer'
                          : 'user_ui-turn-on_layer'
                      "
                      data-testid="testBoundaryPoliticalUsCountyCheckbox"
                      @update:model-value="
                        (value) => {
                          applyLocation(county.id, value);
                        }
                      "
                      >{{ county.name }}</base-checkbox
                    >
                  </div>
                </div>
              </v-menu>
            </template>
          </v-menu>
          <v-menu placement="right-start" trigger="hover" instant-move>
            <div class="menu-item" data-testid="testIncidentDiv">
              {{ $t('casesVue.incident') }}
            </div>

            <template #popper>
              <v-menu placement="right-start" trigger="hover" instant-move>
                <div class="locations-popover">
                  <div
                    v-for="location in currentIncident.locationModels"
                    :key="location.id"
                  >
                    <base-checkbox
                      :model-value="appliedLocations.has(location.id)"
                      :ccu-event="
                        appliedLocations.has(location.id)
                          ? 'user_ui-turn-off_layer'
                          : 'user_ui-turn-on_layer'
                      "
                      data-testid="testIncidentCheckbox"
                      @update:model-value="
                        (value) => {
                          applyLocation(location.id, value);
                        }
                      "
                      >{{ location.name }}</base-checkbox
                    >
                  </div>
                  <div
                    v-if="
                      currentOrganization &&
                      currentOrganization.primary_location
                    "
                  >
                    <base-checkbox
                      :model-value="
                        appliedLocations.has(
                          currentOrganization.primary_location,
                        )
                      "
                      :ccu-event="
                        appliedLocations.has(
                          currentOrganization.primary_location,
                        )
                          ? 'user_ui-turn-off_layer'
                          : 'user_ui-turn-on_layer'
                      "
                      data-testid="testPrimaryResponseAreaCheckbox"
                      @update:model-value="
                        (value) => {
                          applyLocation(
                            currentOrganization.primary_location,
                            value,
                          );
                        }
                      "
                      >{{ $t('casesVue.primary_response_area') }}</base-checkbox
                    >
                  </div>
                  <div
                    v-if="
                      currentOrganization &&
                      currentOrganization.secondary_location
                    "
                  >
                    <base-checkbox
                      :model-value="
                        appliedLocations.has(
                          currentOrganization.secondary_location,
                        )
                      "
                      :ccu-event="
                        appliedLocations.has(
                          currentOrganization.secondary_location,
                        )
                          ? 'user_ui-turn-off_layer'
                          : 'user_ui-turn-on_layer'
                      "
                      data-testid="testSecondaryResponseAreaCheckbox"
                      @update:model-value="
                        (value) => {
                          applyLocation(
                            currentOrganization.secondary_location,
                            value,
                          );
                        }
                      "
                      >{{
                        $t('casesVue.secondary_response_area')
                      }}</base-checkbox
                    >
                  </div>
                </div>
              </v-menu>
            </template>
          </v-menu>
          <v-menu placement="right-start" trigger="hover" instant-move>
            <div class="menu-item">
              {{ $t('casesVue.my_layers') }}
            </div>

            <template #popper>
              <v-menu placement="right-start" trigger="hover" instant-move>
                <div class="locations-popover">
                  <div
                    v-for="location in organizationLocations"
                    :key="`${location.id}`"
                  >
                    <base-checkbox
                      :model-value="appliedLocations.has(location.id)"
                      :ccu-event="
                        appliedLocations.has(location.id)
                          ? 'user_ui-turn-off_layer'
                          : 'user_ui-turn-on_layer'
                      "
                      data-testid="testFiltersButton"
                      @update:model-value="
                        (value) => {
                          applyLocation(location.id, value);
                        }
                      "
                      >{{ location.name }}</base-checkbox
                    >
                  </div>
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
import { useMq } from 'vue3-mq';
import LocationType from '../../models/LocationType';
import Team from '../../models/Team';
import Incident from '../../models/Incident';
import { getQueryString } from '../../utils/urls';
import User from '../../models/User';
import Organization from '../../models/Organization';
import WorksiteFilters from './WorksiteFilters.vue';
import Accordion from '@/components/accordion/Accordion.vue';
import AccordionItem from '@/components/accordion/AccordionItem.vue';
import useDialogs from '@/hooks/useDialogs';
import { useCurrentUser } from '@/hooks';
import Location from '@/models/Location';
import { Menu as VMenu } from 'floating-vue';
import BaseCheckbox from '@/components/BaseCheckbox.vue';

export default defineComponent({
  name: 'WorksiteActions',
  components: {
    BaseCheckbox,
    VMenu,
    AccordionItem,
    Accordion,
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
    const mq = useMq();
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
      mq,
      toggleUserLocations,
      showingUserLocations,
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
