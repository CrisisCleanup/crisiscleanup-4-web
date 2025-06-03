<template>
  <div class="flex items-center justify-start autocomplete">
    <div class="relative w-full">
      <base-input
        :model-value="value"
        :size="size"
        :placeholder="placeholder"
        :required="required"
        :tooltip="tooltip"
        data-testid="testWorksiteSearchInputSearch"
        :input-style="{
          'border-right': icon || tooltip ? '0' : '1px solid #dadada',
        }"
        icon="search"
        @update:model-value="debouncedSearch"
        @input.stop=""
        @focus="onFocus"
        @blur="onBlur"
      >
      </base-input>

      <div
        v-if="results.length > 0 && isFocused"
        class="absolute bg-white z-50 h-auto max-h-84 overflow-auto min-w-84"
        data-testid="testWorsiteSearchResultsDiv"
      >
        <div v-for="result in results" :key="result.label">
          <template v-if="result.options.length > 0">
            <h4 class="p-0.5 text-sm font-bold bg-gray-200">
              {{ result.label }}
            </h4>
            <div v-for="option in result.options" :key="option.id">
              <div
                v-if="result.label === searchSections.GEOCODER"
                class="flex flex-col sm:text-lg text-base p-1 cursor-pointer hover:bg-crisiscleanup-light-grey border-b"
                @click="() => onSelectGeocode(option)"
              >
                <div>{{ option.description }}</div>
              </div>

              <div
                v-else
                class="flex items-center p-1 cursor-pointer hover:bg-crisiscleanup-light-grey border-b"
                @click="() => onSelectExisting(option)"
              >
                <div
                  class="mr-1 case-svg-container"
                  v-html="getWorkImage(option.work_types)"
                ></div>
                <div
                  class="flex flex-col text-sm"
                  :style="{ width: width || 'auto' }"
                >
                  {{ option.name }}, {{ option.case_number }}
                  <br />
                  {{ option.address }}, {{ option.city }}, {{ option.state }}
                </div>
                <!-- Only show clear on recent worksite entry -->
                <font-awesome-icon
                  v-if="result.label === searchSections.RECENTS"
                  icon="times"
                  :alt="$t('actions.clear')"
                  :data-testid="`testWorksiteSearchRecentWorksiteClearBtn_${option.id}`"
                  class="p-1 w-4 ml-auto cursor-pointer"
                  size="medium"
                  @click="(e) => deleteRecent(e, option.id)"
                />
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
    <!--    <div-->
    <!--      v-if="icon || tooltip"-->
    <!--      class="icon-container flex items-center justify-center relative"-->
    <!--    >-->
    <!--      <ccu-icon-->
    <!--        :alt="$t('worksiteSearchInput.search_help')"-->
    <!--        :type="tooltip ? 'info' : icon"-->
    <!--        size="small"-->
    <!--        :action="() => $emit('iconClicked')"-->
    <!--      />-->
    <!--      <badge-->
    <!--        v-if="iconBadge > 0"-->
    <!--        width="12px"-->
    <!--        height="12px"-->
    <!--        class="ml-2 text-black bg-primary-light absolute top-1 right-1 text-xs"-->
    <!--        >{{ iconBadge }}</badge-->
    <!--      >-->
    <!--    </div>-->
  </div>
</template>

<script lang="ts">
import { computed, ref } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex';
import { debounce } from 'lodash';
import { useFuse, type UseFuseOptions } from '@vueuse/integrations/useFuse';
import useCurrentUser from '../../hooks/useCurrentUser';
import GeocoderService from '../../services/geocoder.service';
import BaseInput from '../BaseInput.vue';
import Worksite from '@/models/Worksite';
import { getWorkTypeImage } from '@/filters/index';
import { useRecentWorksites } from '@/hooks/useRecentWorksites';
import type WorkType from '@/models/WorkType';
import Badge from '@/components/Badge.vue';

type GeocoderResult = Awaited<
  ReturnType<typeof GeocoderService.getMatchingAddresses>
>[0];

interface WorksiteSearchResult {
  label: string;
  options: Worksite[] | GeocoderResult[];
}

export default defineComponent({
  name: 'WorksiteSearchInput',
  components: { Badge, BaseInput },
  props: {
    value: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    required: Boolean,
    size: {
      type: String,
      default: '',
    },
    tooltip: {
      type: String,
      default: '',
    },
    full: Boolean,
    width: {
      type: String,
      default: '',
    },
    selector: {
      type: String,
      default: '',
    },
    skipValidation: {
      type: Boolean,
    },
    useGeocoder: {
      type: Boolean,
    },
    useWorksites: {
      type: Boolean,
      default: true,
    },
    useRecents: {
      type: Boolean,
      default: false,
    },
    iconBadge: {
      type: Number,
      default: 0,
    },
    query: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: [
    'input',
    'focus',
    'blur',
    'selectedGeocode',
    'selectedExisting',
    'clearSuggestions',
    'iconClicked',
    'onWorksiteSearch',
  ],
  setup(props, { emit }) {
    const { currentUser } = useCurrentUser();
    const store = useStore();
    const currentIncidentId = computed(
      () => store.getters['incident/currentIncidentId'],
    );

    const isFocused = ref(false);
    const searchSections = {
      SEARCH: 'Search',
      GEOCODER: 'Geocoder',
      RECENTS: 'Recents',
    } as const;
    const iconClasses = ref({
      large: props.size === 'large',
      base: props.size !== 'large',
      'has-tooltip': Boolean(props.tooltip),
    });
    const worksites = ref<Worksite[]>([]);
    const geocoderResults = ref<GeocoderResult[]>([]);
    const { recentWorksites, addRecentWorksite, deleteRecentWorksite } =
      useRecentWorksites();

    const searchQuery = computed(() => props.value);
    const fuseOptions = computed<UseFuseOptions<Worksite>>(() => {
      const recentWorksiteSearchKeys = [
        'id',
        'name',
        'case_number',
        'address',
        'city',
        'state',
      ];
      return {
        fuseOptions: {
          keys: recentWorksiteSearchKeys,
          isCaseSensitive: false,
          threshold: 0.1,
        },
        matchAllWhenSearchEmpty: true,
      };
    });
    const { results: _filteredRecentWorksites } = useFuse(
      searchQuery,
      recentWorksites,
      fuseOptions,
    );
    const filteredRecentWorksites = computed(() => {
      if (!props.useRecents) {
        return [];
      }

      return _filteredRecentWorksites.value
        .filter((rw) => rw.item.incident === currentIncidentId.value)
        .map((r) => r.item);
    });
    const filteredWorksites = computed(() => {
      if (!props.useRecents) {
        return worksites.value;
      }

      return worksites.value.filter(
        (w) => !recentWorksites.value.some((rw) => rw.id === w.id),
      );
    });
    const results = computed(() => {
      const _results: WorksiteSearchResult[] = [];
      if (props.useRecents) {
        _results.push({
          label: searchSections.RECENTS,
          options: filteredRecentWorksites.value,
        });
      }

      _results.push(
        {
          label: searchSections.SEARCH,
          options: filteredWorksites.value,
        },
        {
          label: searchSections.GEOCODER,
          options: geocoderResults.value,
        },
      );
      return _results;
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Tab') {
        emit('clearSuggestions');
      }
    });

    async function worksitesSearch(value: string) {
      emit('input', value);
      if (props.useWorksites) {
        const sites = await searchWorksites(value, currentIncidentId.value);
        worksites.value = sites.data.results;
        emit('onWorksiteSearch', worksites.value);
      }

      if (props.useGeocoder) {
        geocoderResults.value = await geocoderSearch(value);
      }
    }

    function searchWorksites(search: string, incidentId: number) {
      return axios.get(
        `/worksites?fields=id,name,address,case_number,postal_code,city,state,incident,work_types`,
        {
          params: {
            limit: 3,
            search,
            incident: incidentId,
            ...props.query,
          },
        },
      );
    }

    async function geocoderSearch(value: string) {
      return GeocoderService.getMatchingAddresses(value, 'USA');
    }

    function getWorkImage(workTypes: WorkType[]) {
      const workType = Worksite.getWorkType(
        workTypes,
        null,
        currentUser.organization,
      );

      if (!workType) {
        return '';
      }

      return getWorkTypeImage(workType);
    }

    function onBlur() {
      setTimeout(() => {
        emit('blur');
        isFocused.value = false;
      }, 200);
    }

    function onFocus() {
      emit('focus');
      isFocused.value = true;
    }

    function onSelectGeocode(option: GeocoderResult) {
      console.info('onSelectGeocode', option);
      emit('selectedGeocode', option);
    }

    function onSelectExisting(option: Worksite) {
      console.info('onSelectExisting', option);
      emit('selectedExisting', option);
      addRecentWorksite(option);
    }

    function deleteRecent(e: Event, worksiteId: number) {
      e.stopPropagation();
      deleteRecentWorksite(worksiteId);
    }

    return {
      currentUser,
      iconClasses,
      worksitesSearch,
      debouncedSearch: debounce(worksitesSearch, 300),
      results,
      getWorkImage,
      isFocused,
      searchSections,
      deleteRecent,
      onFocus,
      onBlur,
      onSelectGeocode,
      onSelectExisting,
    };
  },
});
</script>

<style>
.autocomplete {
  @apply z-search-dropdown;
}

.case-svg-container svg {
  width: 30px;
  height: 30px;
}

#autosuggest__input {
  outline: none;
  width: 100%;
  height: 32px;
  border-radius: 0;
  border: solid 1px #dadada;
  padding: 10px;
  position: relative;
  @apply text-sm;
}

.invalid #autosuggest__input[required] {
  @apply border-crisiscleanup-red-100;
}

.large #autosuggest__input {
  height: 50px;
  @apply text-base;
}

.has-icon #autosuggest__input {
  width: 100%;
  border-right: 0;
}

.has-tooltip #autosuggest__input {
  width: 100%;
}

#autosuggest__input::placeholder {
  @apply text-crisiscleanup-dark-200;
}

#autosuggest__input {
  -webkit-appearance: none;
}

.autosuggest__results {
  font-weight: 200;
  min-width: 10vw;
  max-width: 100vw;
  position: absolute;
  @apply z-search-dropdown;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  background: white;
  padding: 0;
  overflow: auto;
  max-height: 400px;
}

.full .autosuggest__results {
  width: max-content;
}

.autocomplete .icon-container {
  width: 40px;
  height: 40px;
  border: solid 1px #dadada;
  border-left: 0;
}

.autocomplete .has-tooltip.icon-container {
  background-color: #f7f7f7;
}

.autocomplete .large.icon-container {
  width: 50px;
  height: 50px;
}

.autosuggest__results-before {
  @apply text-gray-400 text-sm font-bold px-1;
}

@media screen and (max-width: 640px) {
  .autosuggest__results {
    min-width: 97vw;
  }
}
</style>
