<template>
  <modal
    v-if="show"
    modal-classes="bg-white max-w-5xl shadow min-h-2/3"
    data-testid="testFiltersModal"
  >
    <div class="flex flex-col h-full">
      <div class="p-3">
        {{ $t('worksiteFilters.filters') }}
        <span
          v-if="filtersCount > 0"
          class="rounded-full px-1 bg-yellow-500 text-xs"
          >{{ filtersCount }}</span
        >
      </div>
      <div
        v-if="filtersCount > 0"
        class="flex items-center justify-between bg-crisiscleanup-light-grey p-1 px-2"
      >
        <div
          class="applied-filters flex flex-wrap justify-start bg-crisiscleanup-light-grey"
        >
          <template v-for="(filter, key) in filters">
            <template
              v-for="(label, identifier) in filter.getFilterLabels()"
              :key="key + identifier"
            >
              <tag
                :data-testid="`testFilters${label}Label`"
                closeable
                class="m-1"
                @closed="
                  () => {
                    filter.removeField(identifier);
                  }
                "
              >
                {{ label }}
              </tag>
            </template>
          </template>
        </div>
        <div>
          <base-button
            type="bare"
            data-testid="testClearFiltersButton"
            :text="$t('actions.clear_filters')"
            :alt="$t('actions.clear_filters')"
            class="text-yellow-500 text-underline w-32"
            :action="clearAllFilters"
          />
        </div>
      </div>

      <div class="flex flex-grow h-full">
        <div class="w-1/4 border-r">
          <div
            class="p-3 px-4 border-b cursor-pointer"
            data-testid="testGeneralSectionDiv"
            :class="{
              'border-l-4 border-l-black': currentSection === 'general',
            }"
            @click="currentSection = 'general'"
          >
            {{ $t('worksiteFilters.general') }}
            <span
              v-if="statusCount + statusGroupCount > 0"
              class="rounded-full px-1 bg-black text-white text-xs"
              >{{ statusCount + statusGroupCount }}</span
            >
          </div>
          <div
            class="p-3 px-4 border-b cursor-pointer"
            data-testid="testPersonalSectionDiv"
            :class="{
              'border-l-4 border-l-black': currentSection === 'personal',
            }"
            @click="currentSection = 'personal'"
          >
            {{ $t('worksiteFilters.personal_info') }}
            <span
              v-if="formDataCount + survivorCount > 0"
              class="rounded-full px-1 bg-black text-white text-xs"
              >{{ formDataCount + survivorCount }}</span
            >
          </div>
          <div
            class="p-3 px-4 border-b cursor-pointer"
            data-testid="testFlagsSectionDiv"
            :class="{
              'border-l-4 border-l-black': currentSection === 'flags',
            }"
            @click="currentSection = 'flags'"
          >
            {{ $t('worksiteFilters.flags') }}
            <span
              v-if="flagsCount > 0"
              class="rounded-full px-1 bg-black text-white text-xs"
              >{{ flagsCount }}</span
            >
          </div>
          <div
            class="p-3 px-4 border-b cursor-pointer"
            data-testid="testWorkSectionDiv"
            :class="{ 'border-l-4 border-l-black': currentSection === 'work' }"
            @click="currentSection = 'work'"
          >
            {{ $t('worksiteFilters.work') }}
            <span
              v-if="fieldsCount + missingWorkTypeCount > 0"
              class="rounded-full px-1 bg-black text-white text-xs"
              >{{ fieldsCount + missingWorkTypeCount }}</span
            >
          </div>
          <div
            v-if="teams.length > 0"
            data-testid="testTeamsSectionDiv"
            class="p-3 px-4 border-b cursor-pointer"
            :class="{ 'border-l-4 border-l-black': currentSection === 'teams' }"
            @click="currentSection = 'teams'"
          >
            {{ $t('worksiteFilters.teams') }}
            <span
              v-if="teamsCount > 0"
              class="rounded-full px-1 bg-black text-white text-xs"
              >{{ teamsCount }}</span
            >
          </div>
          <div
            class="p-3 px-4 border-b cursor-pointer"
            data-testid="testLocationsSectionDiv"
            :class="{
              'border-l-4 border-l-black': currentSection === 'locations',
            }"
            @click="currentSection = 'locations'"
          >
            {{ $t('worksiteFilters.locations') }}
            <span
              v-if="locationsCount > 0"
              class="rounded-full px-1 bg-black text-white text-xs"
              >{{ locationsCount }}</span
            >
          </div>
          <div
            class="p-3 px-4 border-b cursor-pointer"
            data-testid="testDateSectionDiv"
            :class="{
              'border-l-4 border-l-black': currentSection === 'dates',
            }"
            @click="currentSection = 'dates'"
          >
            {{ $t('worksiteFilters.dates') }}
            <span
              v-if="datesCount > 0"
              class="rounded-full px-1 bg-black text-white text-xs"
              >{{ datesCount }}</span
            >
          </div>
          <div
            class="p-3 px-4 border-b cursor-pointer"
            data-testid="testDateSectionDiv"
            :class="{
              'border-l-4 border-l-black': currentSection === 'lists',
            }"
            @click="currentSection = 'lists'"
          >
            {{ $t('list.lists') }}
            <span
              v-if="listsCount > 0"
              class="rounded-full px-1 bg-black text-white text-xs"
              >{{ listsCount }}</span
            >
          </div>
        </div>
        <div class="w-3/4 ml-4 mt-2 flex-grow modal-item">
          <div v-if="currentSection === 'general'" class="flex flex-col">
            <div class="claim-status mb-2">
              <div class="my-1 text-base">
                {{ $t('worksiteFilters.location') }}
              </div>
              <base-checkbox
                v-model="
                  filters.locations.data['organization_primary_location']
                "
                data-testid="testOrganizationPrimaryLocationCheckbox"
                class="block my-1"
              >
                {{ $t('worksiteFilters.in_primary_response_area') }}
              </base-checkbox>
              <base-checkbox
                v-model="
                  filters.locations.data['organization_secondary_location']
                "
                data-testid="testOrganizationSecondaryLocationCheckbox"
                class="block my-1"
              >
                {{ $t('worksiteFilters.in_secondary_response_area') }}
              </base-checkbox>
            </div>
            <div class="claim-status mb-2">
              <div class="my-1 text-base">
                {{ $t('worksiteFilters.team') }}
              </div>
              <base-checkbox
                v-model="filters.my_team.data.my_team"
                class="block my-1"
                data-testid="testMyTeamCheckbox"
              >
                {{ $t('worksiteFilters.assigned_to_my_team') }}
              </base-checkbox>
            </div>
            <div class="claim-status mb-2">
              <div class="my-1 text-base">
                {{ $t('worksiteFilters.claim_reported_by') }}
              </div>
              <base-checkbox
                v-model="filters.statusGroups.data['unclaimed']"
                data-testid="testUnclaimedCheckbox"
                class="block my-1"
                >{{ $t('worksiteFilters.unclaimed') }}
              </base-checkbox>
              <base-checkbox
                v-model="filters.statusGroups.data['claimed_by_org']"
                data-testid="testClaimedByOrgCheckbox"
                class="block my-1"
                >{{ $t('worksiteFilters.claimed_by_my_org') }}
              </base-checkbox>
              <base-checkbox
                v-model="filters.statusGroups.data['reported_by_org']"
                data-testid="testReportedByOrgCheckbox"
                class="block my-1"
                >{{ $t('worksiteFilters.reported_by_my_org') }}
              </base-checkbox>
            </div>
            <div class="status-group mb-2">
              <div class="my-1 text-base">
                {{ $t('worksiteFilters.over_all_status') }}
              </div>
              <base-checkbox
                class="block my-1"
                data-testid="testOpenCheckbox"
                :model-value="filters.statusGroups.data['open']"
                @update:model-value="
                  (value) => {
                    setOpenClosed(value, 'open');
                  }
                "
                >{{ $t('worksiteFilters.open') }}
              </base-checkbox>
              <base-checkbox
                class="block my-1"
                data-testid="testClosedCheckbox"
                :model-value="filters.statusGroups.data['closed']"
                @update:model-value="
                  (value) => {
                    setOpenClosed(value, 'closed');
                  }
                "
                >{{ $t('worksiteFilters.closed') }}
              </base-checkbox>
            </div>

            <div class="statuses mb-2">
              <div class="my-1 text-base">
                {{ $t('worksiteFilters.detailed_status') }}
              </div>
              <div
                v-for="status in allStatuses"
                :key="`${status.id}`"
                :value="status.status"
              >
                <base-checkbox
                  class="block my-1"
                  :data-testid="`testStatus${status.status}Checkbox`"
                  :model-value="filters.statuses.data[status.status]"
                  @update:model-value="
                    (value) => {
                      filters.statuses.data[status.status] = value;
                      filters.statuses.data = {
                        ...filters.statuses.data,
                      };
                    }
                  "
                  >{{ getStatusName(status.status) }}
                </base-checkbox>
              </div>
            </div>
          </div>
          <div v-if="currentSection === 'flags'" class="flex flex-col">
            <div class="status-group mb-2">
              <div class="my-1 text-base">
                {{ $t('worksiteFilters.flags') }}
              </div>
              <base-checkbox
                v-for="flag in flagTypes"
                :key="flag"
                :data-testid="`testFlag${flag}Checkbox`"
                class="block my-1"
                :model-value="filters.flags.data[flag]"
                @update:model-value="
                  (value) => {
                    filters.flags.data[flag] = value;
                    filters.flags.data = { ...filters.flags.data };
                  }
                "
                >{{ $t(flag) }}
              </base-checkbox>
            </div>
          </div>
          <div v-if="currentSection === 'personal'" class="flex flex-col">
            <div class="survivors mb-2">
              <div class="my-1 text-base">
                {{ $t('worksiteFilters.my_organization') }}
              </div>
              <base-checkbox
                v-model="filters.survivors.data.member_of_my_organization"
                data-testid="testMemberOfMyOrganizationCheckbox"
                class="block my-1"
              >
                {{ $t('worksiteFilters.member_of_my_org') }}
              </base-checkbox>
            </div>
            <div class="status-group mb-2">
              <div class="my-1 text-base">
                {{ $t('worksiteFilters.personal_info') }}
              </div>
              <base-checkbox
                v-for="data in [
                  'older_than_60',
                  'children_in_home',
                  'first_responder',
                  'veteran',
                ]"
                :key="data"
                :data-testid="`testPersonal${data}Checkbox`"
                class="block my-1"
                :model-value="filters.form_data.data[data]"
                @update:model-value="
                  (value) => {
                    filters.form_data.data[data] = value;
                    filters.form_data.data = { ...filters.form_data.data };
                  }
                "
                >{{ $t(`formLabels.${data}`) }}
              </base-checkbox>
            </div>
          </div>
          <template v-if="currentSection === 'work'">
            <div
              v-for="f in incidentTypes"
              :key="f.key"
              :header="f.name_t"
              class="p-2 px-4 mb-2 bg-crisiscleanup-light-grey"
            >
              <div class="flex items-center justify-between">
                <base-checkbox
                  v-model="filters.fields.data[f.key]"
                  :data-testid="`testWorkType${f.key}Checkbox`"
                >
                  {{ $t(f.name_t) }}
                </base-checkbox>
                <font-awesome-icon
                  v-if="filters.fields.data[f.key]"
                  :data-testid="`testWorkType${f.key}Icon`"
                  class="cursor-pointer"
                  size="md"
                  :alt="
                    expanded[f.key]
                      ? $t('actions.hide_options')
                      : $t('actions.show_options')
                  "
                  :icon="expanded[f.key] ? 'caret-up' : 'caret-down'"
                  @click="expandSection(f.key)"
                />
              </div>
              <div v-if="expanded[f.key]">
                <template
                  v-for="field in getFieldsForType(f.key)"
                  :key="field.field_key"
                >
                  <div class="py-1">
                    <template v-if="field.html_type === 'select'">
                      <div class="font-bold">
                        {{ $t(field.label_t) }}
                      </div>
                      <div>
                        <div>
                          <div
                            v-for="option in field.values.filter((option) =>
                              Boolean(option.value),
                            )"
                            :key="option.value"
                            :span="8"
                          >
                            <base-checkbox
                              :model-value="
                                filters.form_data.data[field.field_key] &&
                                filters.form_data.data[
                                  field.field_key
                                ].includes(option.value)
                              "
                              @update:model-value="
                                (value) => {
                                  filters.form_data.data[field.field_key] =
                                    value
                                      ? [
                                          ...(filters.form_data.data[
                                            field.field_key
                                          ] || []),
                                          option.value,
                                        ]
                                      : filters.form_data.data[
                                          field.field_key
                                        ].filter(
                                          (item) => item !== option.value,
                                        );
                                  filters.form_data.data = {
                                    ...filters.form_data.data,
                                  };
                                }
                              "
                            >
                              {{ $t(option.name_t) }}
                            </base-checkbox>
                          </div>
                        </div>
                      </div>
                    </template>
                    <template v-if="field.html_type === 'checkbox'">
                      <div class="flex">
                        <div>
                          <base-checkbox
                            :model-value="
                              filters.form_data.data[field.field_key]
                            "
                            @update:model-value="
                              (value: Boolean) => {
                                if (value) {
                                  filters.form_data.data[field.field_key] =
                                    true;
                                } else {
                                  delete filters.form_data.data[
                                    field.field_key
                                  ];
                                }
                              }
                            "
                          >
                            {{ $t(field.label_t) }}
                          </base-checkbox>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </div>
            <div class="status-group mb-2">
              <div
                class="my-1 text-base"
                data-testid="testMissingWorkTypeCheckbox"
              >
                {{ $t('worksiteFilters.missing_information') }}
              </div>
              <base-checkbox
                v-model="filters.missingWorkType.data['missing_work_type']"
                class="block my-1"
              >
                {{ $t('worksiteFilters.no_work_type') }}
              </base-checkbox>
            </div>
          </template>
          <div v-if="currentSection === 'teams'" class="flex flex-col">
            <div class="status-group mb-2">
              <div class="my-1 text-base">
                {{ $t('worksiteFilters.teams') }}
              </div>
              <base-checkbox
                v-for="team in teams"
                :key="`${team.id}`"
                :data-testid="`testTeam${team.id}Checkbox`"
                class="block my-1"
                :model-value="filters.teams.data[team.id]"
                @update:model-value="
                  (value) => {
                    filters.teams.data[team.id] = value;
                    filters.teams.data = { ...filters.teams.data };
                  }
                "
                >{{ team.name }}
              </base-checkbox>
            </div>
          </div>
          <div v-if="currentSection === 'locations'" class="flex flex-col">
            <div class="mb-2">
              <div v-if="filters.locations" class="claim-status mb-2">
                <div class="my-1 text-base">
                  {{ $t('worksiteFilters.response_areas') }}
                </div>
                <base-checkbox
                  v-model="
                    filters.locations.data['organization_primary_location']
                  "
                  data-testid="testOrganizationPrimaryLocation2Checkbox"
                  class="block my-1"
                >
                  {{ $t('worksiteFilters.in_primary_response_area') }}
                </base-checkbox>
                <base-checkbox
                  v-model="
                    filters.locations.data['organization_secondary_location']
                  "
                  data-testid="testOrganizationSecondaryLocation2Checkbox"
                  class="block my-1"
                >
                  {{ $t('worksiteFilters.in_secondary_response_area') }}
                </base-checkbox>
              </div>
              <div>
                <div class="my-1 text-base">
                  {{ $t('worksiteFilters.search_locations') }}
                </div>
                <div class="grid grid-cols-12 gap-2 pr-2">
                  <base-select
                    class="col-span-6"
                    :placeholder="$t('worksiteFilters.select_location')"
                    data-testid="testLocationSelect"
                    searchable
                    multiple
                    :v-model="filters.locations.data.search_locations"
                    item-key="id"
                    label="name"
                    :options="onLocationSearch"
                    @update:model-value="
                      (value) => {
                        filters.locations.data = {
                          ...filters.locations.data,
                          search_locations: value,
                        };
                      }
                    "
                  >
                    <template #option="{ option }">
                      <div
                        class="flex justify-between text-sm p-2 cursor-pointer w-full"
                      >
                        <span class="mr-1">{{ option.name }}</span>
                        <span class="text-crisiscleanup-grey-700">{{
                          option.location_type &&
                          $t(option.location_type.name_t)
                        }}</span>
                      </div>
                    </template>
                  </base-select>
                  <base-select
                    :model-value="currentLocationType"
                    class="col-span-5"
                    :options="
                      locationTypes.map((l) => {
                        return { ...l, name_t: $t(l.name_t) };
                      })
                    "
                    data-testid="testLocationTypesSelect"
                    item-key="id"
                    label="name_t"
                    searchable
                    :placeholder="$t('worksiteFilters.search_by_location_type')"
                    @update:model-value="
                      (type: string) => {
                        currentLocationType = type;
                      }
                    "
                  />
                  <base-button
                    :action="createNewLocation"
                    class="col-span-1"
                    icon="draw-polygon"
                    variant="solid"
                    data-testid="testCreateLocationButton"
                    :title="$t('worksiteFilters.draw_location_on_map')"
                    :alt="$t('worksiteFilters.draw_location_on_map')"
                  >
                  </base-button>
                </div>
              </div>
              <div class="mb-2">
                <div class="my-1 text-base" data-testid="testMyLocationsDiv">
                  {{ $t('worksiteFilters.my_locations') }}
                </div>
                <div v-for="location in locations" :key="`${location.id}`">
                  <base-checkbox
                    class="block my-1"
                    :data-testid="`testMyLocations${location.id}Checkbox`"
                    :model-value="filters.locations.data[location.id]"
                    @update:model-value="
                      (value) => {
                        filters.locations.data[location.id] = value;
                        filters.locations.data = {
                          ...filters.locations.data,
                        };
                      }
                    "
                    >{{ location.name }}
                  </base-checkbox>
                </div>
              </div>
            </div>
          </div>
          <div v-if="currentSection === 'dates'" class="flex flex-col">
            <div class="mb-2">
              <div class="mb-2">
                <div class="my-1 text-base">
                  {{ $t('worksiteFilters.created') }}
                </div>
                <datepicker
                  v-model="filters.dates.data.created"
                  data-testid="testCreatedDatePickerInput"
                  class="h-12 mr-2"
                  range
                  v-bind="datePickerDefaultProps"
                  :placeholder="$t('worksiteFilters.start_date')"
                ></datepicker>
                <div class="my-1 text-base">
                  {{ $t('worksiteFilters.updated') }}
                </div>
                <datepicker
                  v-model="filters.dates.data.updated"
                  data-testid="testUpdatedDatePickerInput"
                  class="h-12 mr-2"
                  range
                  v-bind="datePickerDefaultProps"
                  :placeholder="$t('worksiteFilters.update_date')"
                ></datepicker>
              </div>
            </div>
          </div>
          <div v-if="currentSection === 'lists'" class="flex flex-col">
            <div class="status-group mb-2">
              <div class="my-1 text-base">
                {{ $t('list.lists') }}
              </div>
              <div class="grid grid-cols-3 grid-col-flow gap-3 p-3">
                <template v-for="list in lists" :key="list.id">
                  {{ list.name }}
                  <base-button
                    :class="[
                      !filters.lists.data.exclude_lists.some(
                        (excludedItem) => excludedItem.id === list.id,
                      )
                        ? 'bg-crisiscleanup-dark-100'
                        : 'bg-crisiscleanup-red-100 bg-opacity-100',
                    ]"
                    :action="
                      () => {
                        const isExcluded =
                          filters.lists.data.exclude_lists.some(
                            (excludedItem) => excludedItem.id === list.id,
                          );
                        if (isExcluded) {
                          filters.lists.data.exclude_lists =
                            filters.lists.data.exclude_lists.filter(
                              (item) => item.id !== list.id,
                            );
                        } else {
                          filters.lists.data.exclude_lists.push(list);
                          // Remove from include list if it exists
                          filters.lists.data.include_lists =
                            filters.lists.data.include_lists.filter(
                              (item) => item.id !== list.id,
                            );
                        }
                      }
                    "
                    :text="$t('actions.subtract')"
                    :alt="$t('actions.subtract')"
                  />
                  <base-button
                    :class="[
                      !filters.lists.data.include_lists.some(
                        (includedItem) => includedItem.id === list.id,
                      )
                        ? 'bg-crisiscleanup-dark-100'
                        : 'bg-crisiscleanup-green-100 bg-opacity-100',
                    ]"
                    :action="
                      () => {
                        const isIncluded =
                          filters.lists.data.include_lists.some(
                            (includedItem) => includedItem.id === list.id,
                          );
                        if (isIncluded) {
                          filters.lists.data.include_lists =
                            filters.lists.data.include_lists.filter(
                              (item) => item.id !== list.id,
                            );
                        } else {
                          filters.lists.data.include_lists.push(list);
                          // Remove from exclude list if it exists
                          filters.lists.data.exclude_lists =
                            filters.lists.data.exclude_lists.filter(
                              (item) => item.id !== list.id,
                            );
                        }
                      }
                    "
                    :text="$t('actions.add')"
                    :alt="$t('actions.add')"
                  />
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex items-center justify-center p-2 bg-white border-t">
        <base-button
          :text="$t('actions.cancel')"
          :alt="$t('actions.cancel')"
          data-testid="testCancelButton"
          size="medium"
          class="m-1 border-2 border-black px-6 py-2"
          :action="
            () => {
              $emit('closedFilters');
            }
          "
        />
        <base-button
          :text="$t('actions.apply_filters')"
          :alt="$t('actions.apply_filters')"
          data-testid="testApplyFiltersButton"
          ccu-event="user_ui-turn-on_filter"
          size="medium"
          class="m-1 p-3 px-6"
          variant="solid"
          :action="updateFilters"
        />
      </div>
    </template>
  </modal>
</template>

<script lang="ts">
import { useStore } from 'vuex';
import { computed, onMounted, ref, watch } from 'vue';
import Team from '@/models/Team';
import Location from '@/models/Location';
import WorksiteFieldsFilter from '@/utils/data_filters/WorksiteFieldsFilter';
import WorksiteFlagsFilter from '@/utils/data_filters/WorksiteFlagsFilter';
import FormDataFilter from '@/utils/data_filters/FormDataFilter';
import WorksiteStatusGroupFilter from '@/utils/data_filters/WorksiteStatusGroupFilter';
import WorksiteStatusFilter from '@/utils/data_filters/WorksiteStatusFilter';
import WorksiteLocationsFilter from '@/utils/data_filters/WorksiteLocationsFilter';
import WorksiteMissingWorkTypeFilter from '@/utils/data_filters/WorksiteMissingWorkTypeFilter';
import WorksiteMyTeamFilter from '@/utils/data_filters/WorksiteMyTeamFilter';
import SurvivorFilter from '@/utils/data_filters/SurvivorFilter';
import WorksiteTeamsFilter from '@/utils/data_filters/WorksiteTeamsFilter';
import WorksiteListsFilter from '@/utils/data_filters/WorksiteListsFilter';
import WorksiteDatesFilter from '@/utils/data_filters/WorksiteDatesFilter';
import { getStatusName } from '@/filters/index';
import axios from 'axios';
import BaseButton from '@/components/BaseButton.vue';
import moment from 'moment';
import { getQueryString } from '@/utils/urls';
import LocationTool from '@/components/locations/LocationTool.vue';
import useDialogs from '@/hooks/useDialogs';
import LocationType from '@/models/LocationType';
import Organization from '@/models/Organization';
import { useCurrentUser } from '@/hooks';

export default defineComponent({
  name: 'WorksiteFilters',
  components: { BaseButton },
  props: {
    incident: {
      type: Object,
      default() {
        return {};
      },
    },
    currentFilters: {
      type: Object,
      default() {
        return {};
      },
    },
    locations: {
      type: Array,
      default() {
        return [];
      },
    },
    show: {
      type: Boolean,
    },
  },
  emits: ['updatedFilterLabels', 'updateFiltersCount', 'updatedFilters'],

  setup(props, { emit }) {
    const store = useStore();
    const { currentUser } = useCurrentUser();
    const { t } = useI18n();
    const filters = ref({
      fields: new WorksiteFieldsFilter('fields', {}),
      statusGroups: new WorksiteStatusGroupFilter('statusGroups', {}),
      flags: new WorksiteFlagsFilter('flags', {}),
      form_data: new FormDataFilter('form_data', {}),
      statuses: new WorksiteStatusFilter('statuses', {}),
      locations: new WorksiteLocationsFilter('locations', {}),
      teams: new WorksiteTeamsFilter('teams', {}),
      lists: new WorksiteListsFilter('lists', {
        include_lists: [],
        exclude_lists: [],
      }),
      my_team: new WorksiteMyTeamFilter('my_team', {}),
      dates: new WorksiteDatesFilter('dates', {}),
      survivors: new SurvivorFilter('survivors', {}),
      missingWorkType: new WorksiteMissingWorkTypeFilter('missingWorkType', {}),
    });
    const datePickerDefaultProps = reactive({
      format: 'yyyy-MM-dd',
      autoApply: true,
      weekStart: 0,
    });
    const currentSection = ref('general');
    const expanded = ref({});
    const flagTypes = [
      'flag.worksite_high_priority',
      'flag.worksite_upset_client',
      'flag.worksite_mark_for_deletion',
      'flag.worksite_abuse',
      'flag.duplicate',
      'flag.worksite_wrong_location',
      'flag.worksite_wrong_incident',
    ];
    const locationTypes = computed(() => store.getters['enums/locationTypes']);
    const lists = ref([]);
    const currentLocationType = ref(null);

    const incidentTypes = computed(() => {
      if (props.incident && props.incident.form_fields) {
        const fieldsWithTypes = props.incident.form_fields.filter((field) => {
          return Boolean(field.if_selected_then_work_type);
        });

        const types = new Set(
          fieldsWithTypes.map((t) => t.if_selected_then_work_type),
        );

        return [...types].map((workType) => {
          return store.getters['enums/workTypes'].find(
            (type) => type.key === workType,
          );
        });
      }

      return [];
    });
    const fieldsCount = computed(() => {
      return filters.value.fields.getCount() || 0;
    });
    const statusCount = computed(() => {
      return filters.value.statuses.getCount() || 0;
    });
    const statusGroupCount = computed(() => {
      return filters.value.statusGroups.getCount() || 0;
    });
    const flagsCount = computed(() => {
      return filters.value.flags.getCount() || 0;
    });
    const formDataCount = computed(() => {
      return filters.value.form_data.getCount() || 0;
    });
    const locationsCount = computed(() => {
      return filters.value.locations.getCount() || 0;
    });
    const missingWorkTypeCount = computed(() => {
      return filters.value.missingWorkType.getCount() || 0;
    });
    const teamsCount = computed(() => {
      return filters.value.teams.getCount() || 0;
    });
    const myTeamCount = computed(() => {
      return filters.value.my_team.getCount() || 0;
    });
    const datesCount = computed(() => {
      return filters.value.dates.getCount() || 0;
    });
    const listsCount = computed(() => {
      return filters.value.lists.getCount() || 0;
    });
    const survivorCount = computed(() => {
      return filters.value.survivors.getCount() || 0;
    });
    const teams = computed(() => {
      return Team.all();
    });

    const filtersCount = computed(() => {
      return (
        fieldsCount.value +
        statusCount.value +
        statusGroupCount.value +
        locationsCount.value +
        flagsCount.value +
        formDataCount.value +
        missingWorkTypeCount.value +
        teamsCount.value +
        survivorCount.value +
        datesCount.value +
        myTeamCount.value +
        listsCount.value
      );
    });
    const allStatuses = computed(() => {
      return store.getters['enums/statuses'].map((status, index) => {
        return {
          ...status,
          selectionKey: index + 1,
        };
      });
    });

    const filterLabels = ref([]);

    watch(
      () => props.currentFilters,
      () => {
        filters.value = {
          fields: new WorksiteFieldsFilter(
            'fields',
            (props.currentFilters.fields && props.currentFilters.fields.data) ||
              {},
          ),
          statusGroups: new WorksiteStatusGroupFilter(
            'statusGroups',
            (props.currentFilters.statusGroups &&
              props.currentFilters.statusGroups.data) ||
              {},
          ),
          flags: new WorksiteFlagsFilter(
            'flags',
            (props.currentFilters.flags && props.currentFilters.flags.data) ||
              {},
          ),
          form_data: new FormDataFilter(
            'flags',
            (props.currentFilters.form_data &&
              props.currentFilters.form_data.data) ||
              {},
          ),
          locations: new WorksiteLocationsFilter(
            'locations',
            (props.currentFilters.locations &&
              props.currentFilters.locations.data) ||
              {},
          ),
          statuses: new WorksiteStatusFilter(
            'statuses',
            (props.currentFilters.statuses &&
              props.currentFilters.statuses.data) ||
              {},
          ),
          my_team: new WorksiteMyTeamFilter(
            'my_team',
            (props.currentFilters.my_team &&
              props.currentFilters.my_team.data) ||
              {},
          ),
          dates: new WorksiteDatesFilter(
            'dates',
            (props.currentFilters.dates && props.currentFilters.dates.data) ||
              {},
          ),
          survivors: new SurvivorFilter(
            'survivors',
            (props.currentFilters.survivors &&
              props.currentFilters.survivors.data) ||
              {},
          ),
          teams: new WorksiteTeamsFilter(
            'teams',
            (props.currentFilters.teams && props.currentFilters.teams.data) ||
              {},
          ),
          lists: new WorksiteListsFilter(
            'lists',
            (props.currentFilters.lists && props.currentFilters.lists.data) || {
              include_lists: [],
              exclude_lists: [],
            },
          ),
          missingWorkType: new WorksiteMissingWorkTypeFilter(
            'missingWorkType',
            (props.currentFilters.missingWorkType &&
              props.currentFilters.missingWorkType.data) ||
              {},
          ),
        };
        filterLabels.value = Object.values(filters.value)
          .map((filter) => {
            return {
              labels: filter.getFilterLabels(),
              removeField: filter.removeField,
            };
          })
          .filter((filter) => Object.keys(filter.labels).length > 0);
        emit('updateFiltersCount', filtersCount.value);
        emit('updatedFilterLabels', filterLabels.value);
        if (
          props.currentFilters &&
          Object.keys(props.currentFilters).length === 0
        ) {
          updateFilters();
        }
      },
    );

    function updateFilters() {
      try {
        // Handle date filters so they get stored in user states correctly instead of {}
        const datesFilter = filters.value?.dates?.data;
        const [createdStart = null, createdEnd = null] =
          datesFilter?.created ?? [];
        const [updatedStart = null, updatedEnd = null] =
          datesFilter?.updated ?? [];
        const hasValidCreatedRange = createdStart && createdEnd;
        const hasValidUpdatedRange = updatedStart && updatedEnd;
        if (hasValidCreatedRange) {
          filters.value.dates.data.created = [
            moment(createdStart).toISOString(),
            moment(createdEnd).toISOString(),
          ];
        }
        if (hasValidUpdatedRange) {
          filters.value.dates.data.updated = [
            moment(updatedStart).toISOString(),
            moment(updatedEnd).toISOString(),
          ];
        }
        emit('updatedFilters', {
          filters: {
            ...filters.value,
          },
          count: filtersCount.value,
        });
        console.debug('Updating filters', filters.value);

        for (const [key, value] of Object.entries(filters.value.fields.data)) {
          if (!value) {
            expanded.value[key] = false;
          }
        }
      } catch (error) {
        console.error('Error updating filters', error);
      }
    }

    function setOpenClosed(value, status) {
      filters.value.statusGroups.data.open = false;
      filters.value.statusGroups.data.closed = false;
      if (value) {
        filters.value.statusGroups.data[status] = value;
      }

      filters.value.statusGroups.data = {
        ...filters.value.statusGroups.data,
      };
    }

    function expandSection(key) {
      expanded.value[key] = !expanded.value[key];
      expanded.value = { ...expanded.value };
    }

    function getFieldsForType(workType) {
      if (props.incident && props.incident.form_fields) {
        return props.incident.form_fields.filter((field) => {
          const parent = props.incident.form_fields.find((element) => {
            return element.field_key === field.field_parent_key;
          });

          let { if_selected_then_work_type } = field;
          if (parent) {
            if_selected_then_work_type = parent.if_selected_then_work_type;
          }

          return if_selected_then_work_type === workType;
        });
      }

      return [];
    }

    function clearAllFilters() {
      filters.value = {
        fields: new WorksiteFieldsFilter('fields', {}),
        statusGroups: new WorksiteStatusGroupFilter('statusGroups', {}),
        flags: new WorksiteFlagsFilter('flags', {}),
        form_data: new FormDataFilter('form_data', {}),
        statuses: new WorksiteStatusFilter('statuses', {}),
        locations: new WorksiteLocationsFilter('locations', {}),
        teams: new WorksiteTeamsFilter('teams', {}),
        lists: new WorksiteListsFilter('lists', {
          include_lists: [],
          exclude_lists: [],
        }),
        my_team: new WorksiteMyTeamFilter('my_team', {}),
        dates: new WorksiteDatesFilter('dates', {}),
        survivors: new SurvivorFilter('survivors', {}),
        missingWorkType: new WorksiteMissingWorkTypeFilter(
          'missingWorkType',
          {},
        ),
      };
    }

    onMounted(() => {
      if (Object.keys(props.currentFilters).length === 0) {
        clearAllFilters();
      }
      getLists().then(() => {});
    });

    async function getLists() {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/lists`,
        {
          params: {
            model: 'worksite_worksites',
          },
        },
      );
      lists.value = response.data.results.map((list) => {
        return {
          id: list.id,
          name: list.name,
        };
      });
    }
    async function onLocationSearch(value: string) {
      const parameters = {
        search: value,
        limit: 10,
        fields: 'id,name,type',
      } as Record<string, any>;
      if (currentLocationType.value) {
        parameters.type = currentLocationType.value;
      }

      const queryString = getQueryString(parameters);
      const results = await Location.api().get(`/locations?${queryString}`, {
        dataKey: 'results',
      });
      return results.entities?.locations;
    }

    async function createNewLocation() {
      const { component } = useDialogs();
      let currentPolygon = null;
      const classes = 'h-168 p-3';
      const response = await component({
        title: t('~~Select Location'),
        component: LocationTool,
        modalClasses: `max-w-5xl`,
        props: {
          class: classes,
        },
        listeners: {
          changed(payload) {
            currentPolygon = payload;
          },
        },
      });

      if (response !== 'cancel' && currentPolygon) {
        let { geometry } = currentPolygon.toGeoJSON();
        const { type, features } = currentPolygon.toGeoJSON();
        let locationTypeKey = 'org_primary_response_area';

        const locationType = LocationType.query()
          .where('key', locationTypeKey)
          .get()[0];
        const location = {
          name: `Temporary Location Filter for User: ${currentUser.value.id} ${moment().format(
            'YYYY-MM-DD HH:mm:ss',
          )}`,
          type: locationType.id,
          shared: 'hidden',
        };
        if (type === 'FeatureCollection') {
          const [feature] = features;
          geometry = feature.geometry;
        }

        switch (geometry.type) {
          case 'Point': {
            location.point = geometry;
            break;
          }

          case 'Polygon': {
            location.poly = geometry;
            break;
          }

          case 'MultiPolygon': {
            location.geom = geometry;
            break;
          }
        }

        try {
          const response = await Location.api().post('/locations', location);
          const locationId = response.response.data.id;
          filters.value.locations.data[locationId] = true;
        } catch (error) {
          console.error(error);
        }
      }
    }

    return {
      filters,
      currentSection,
      expanded,
      flagTypes,
      incidentTypes,
      fieldsCount,
      statusCount,
      statusGroupCount,
      flagsCount,
      formDataCount,
      locationsCount,
      missingWorkTypeCount,
      teamsCount,
      myTeamCount,
      datesCount,
      listsCount,
      survivorCount,
      teams,
      filtersCount,
      allStatuses,
      updateFilters,
      setOpenClosed,
      expandSection,
      getFieldsForType,
      clearAllFilters,
      getStatusName,
      filterLabels,
      datePickerDefaultProps,
      lists,
      onLocationSearch,
      currentLocationType,
      locationTypes,
      createNewLocation,
    };
  },
});
</script>

<style scoped>
.modal-item {
  height: 450px;
  overflow: auto;
}
@media only screen and (max-width: 1223px) and (orientation: landscape) {
  .modal-item {
    height: 68vh;
  }
}
</style>
