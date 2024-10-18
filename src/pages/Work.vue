<template>
  <template v-if="mq.mdMinus">
    <div v-if="!isViewing && !isEditing">
      <SimpleMap
        v-if="showingMap"
        :key="currentIncidentId"
        :map-loading="mapLoading"
        data-testid="testSimpleMapdiv"
        show-zoom-buttons
        show-map-layer-toggle
        :available-work-types="availableWorkTypes"
        class="mb-16"
        zoom-buttons-class="mt-20"
        @on-zoom-in="zoomIn"
        @on-zoom-out="zoomOut"
        @on-zoom-incident-center="goToIncidentCenter"
        @on-zoom-interactive="goToInteractive"
        @on-toggle-map-type="toggleMapType"
      />
      <WorksitePhotoMap
        v-else-if="showingPhotoMap && caseImages.length > 0"
        :key="caseImages.length"
        ref="photoMap"
        :case-images="caseImages"
        class="mb-16"
        @load-case="loadCase"
      />
      <WorksiteFeed
        v-else-if="showingFeed"
        class="h-[calc(100vh-8rem)] mt-16"
        :current-user-location="currentUserLocation"
        @load-case="loadCase"
      />
      <div v-else-if="showingTable" class="mt-20 p-2 border">
        <div class="text-base p-2 mb-1 text-center w-full">
          Cases for {{ incidentName }}
        </div>
        <WorksiteTable
          :worksite-query="worksiteQuery"
          @row-click="loadCase"
          @selection-changed="onSelectionChanged"
        />
      </div>
      <span
        v-if="allWorksiteCount && !showingFeed"
        class="font-thin w-screen absolute flex items-center justify-center mt-4 mr-6 z-toolbar"
      >
        <span class="bg-black rounded p-2 text-white">
          <span
            v-if="allWorksiteCount === filteredWorksiteCount"
            data-testid="testCaseCountContent"
          >
            {{ numeral(allWorksiteCount) }}
            {{ $t('casesVue.cases') }}
          </span>
          <span v-else data-testid="testCaseCountFilteredContent">
            {{ numeral(filteredWorksiteCount) }} of
            {{ numeral(allWorksiteCount) }}
            {{ $t('casesVue.cases') }}
          </span>
        </span>
      </span>
      <div class="absolute top-4 right-4 flex items-center z-toolbar">
        <WorksiteActions
          v-if="currentIncidentId"
          :key="currentIncidentId"
          class="py-1"
          :current-incident-id="String(currentIncidentId)"
          :show-layers="!showingTable"
          :inital-filters="filters"
          @updated-query="onUpdateQuery"
          @updated-filters="onUpdateFilters"
          @apply-location="applyLocation"
          @apply-team-geo-json="applyTeamGeoJson"
          @download-csv="downloadWorksites"
          @toggle-heat-map="toggleHeatMap"
          @selected-existing="handleSelectedExisting"
          @toggle-search="showingSearchModal = !showingSearchModal"
          @toggle-user-locations="toggleUserLocations"
        />
      </div>
      <div class="absolute top-20 left-12 mt-2 z-toolbar">
        <WorksiteSearchInput
          v-if="showingSearchModal"
          :value="mobileSearch"
          data-testid="testWorksiteSearch"
          size="large"
          display-property="name"
          :placeholder="$t('actions.search')"
          skip-validation
          use-recents
          class="mx-4 py-1 inset-1"
          @selected-existing="handleSelectedExisting"
          @input="
            (value: string) => {
              mobileSearch = value;
            }
          "
        />
      </div>
      <div class="fixed bottom-20 gap-2 right-4 flex flex-col z-toolbar">
        <base-button
          data-testid="testAddCaseButton"
          icon="plus"
          icon-size="sm"
          :title="$t('actions.add_case')"
          :alt="$t('actions.add_case')"
          :action="
            () => {
              isEditing = true;
            }
          "
          class="w-12 h-12 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
        />
        <base-button
          v-if="showingMap"
          data-testid="testShowTableButton"
          ccu-icon="table"
          icon-size="sm"
          :title="$t('actions.table_view_alt')"
          :alt="$t('actions.table_view_alt')"
          :action="showTable"
          class="w-12 h-12 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
        />
        <base-button
          v-if="showingTable"
          data-testid="testShowMapButton"
          icon="image"
          icon-size="sm"
          :title="$t('casesVue.photo_map_view')"
          :alt="$t('casesVue.photo_map_view')"
          :action="showPhotoMap"
          class="w-12 h-12 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
        />
        <base-button
          v-if="showingPhotoMap"
          :icon="can('beta_feature.enable_feed') ? 'scroll' : 'map'"
          icon-size="sm"
          :title="
            can('beta_feature.enable_feed')
              ? $t('casesVue.feed_view')
              : $t('casesVue.map_view')
          "
          :alt="
            can('beta_feature.enable_feed')
              ? $t('casesVue.feed_view')
              : $t('casesVue.map_view')
          "
          data-testid="testPhotoMapViewIcon"
          :action="can('beta_feature.enable_feed') ? showFeed : showMap"
          class="w-12 h-12 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
        />
        <base-button
          v-if="showingFeed"
          icon="map"
          icon-size="sm"
          :title="$t('casesVue.map_view')"
          :alt="$t('casesVue.map_view')"
          data-testid="testMapViewIcon"
          :action="showMap"
          class="w-12 h-12 border-crisiscleanup-dark-100 border-t border-l border-r bg-white shadow-xl text-xl text-crisiscleanup-dark-400"
        />
      </div>
    </div>
    <div
      v-else
      class=""
      :style="{
        height: worksite ? 'calc(100vh - 10rem)' : 'calc(100vh - 8rem)',
      }"
    >
      <CaseHeader
        v-if="worksite"
        :worksite="worksite"
        class="border-l border-r"
        can-edit
        show-case-tabs
        :is-viewing-worksite="isViewing"
        @close-worksite="clearCase"
        @on-jump-to-case="jumpToCase"
        @reload-map="reloadMap"
        @on-share-worksite="() => shareWorksite(worksite?.id)"
        @on-download-worksite="
          () => {
            downloadWorksites([worksite?.id]);
          }
        "
        @on-print-worksite="() => printWorksite(worksite?.id)"
        @on-flag-case="
          () => {
            showFlags = true;
            showHistory = false;
          }
        "
        @on-edit-case="
          () => {
            isViewing = false;
            isEditing = true;
            router.push(
              `/incident/${currentIncidentId}/work/${worksite?.id}/edit`,
            );
          }
        "
        @on-show-history="
          () => {
            showFlags = false;
            showHistory = true;
          }
        "
      />
      <div v-else class="work-page__form-header">
        <div
          class="flex h-full items-center cursor-pointer border-b-2 border-primary-light p-3"
          @click="() => clearCase()"
        >
          <ccu-icon
            :alt="$t('casesVue.new_case')"
            type="active"
            size="small"
            data-testid="testNewCaseIcon"
          />
          <span class="px-1 mt-0.5">{{ $t('casesVue.new_case') }}</span>
        </div>
        <div
          v-if="mostRecentlySavedWorksite && mostRecentlySavedWorksite.id"
          class="h-full p-3 flex items-center justify-center"
          @click="() => loadCase(mostRecentlySavedWorksite)"
        >
          Case
          {{
            mostRecentlySavedWorksite && mostRecentlySavedWorksite.case_number
          }}
          <ccu-icon
            :alt="$t('actions.cancel')"
            data-testid="testCancelButton"
            size="xs"
            type="cancel"
            class="ml-2"
            :action="
              () => {
                mostRecentlySavedWorksite = null;
              }
            "
          />
        </div>
      </div>
      <div v-if="showingDetails" class="work-page__form-toggler">
        <base-button
          icon="arrow-left"
          data-testid="testHistoryButton"
          icon-size="medium"
          :action="
            () => {
              showHistory = false;
              showFlags = false;
            }
          "
          :alt="$t('actions.history')"
        />
        <span v-if="showHistory" class="text-base">{{
          $t('actions.history')
        }}</span>
        <span v-if="showFlags" class="text-base">{{ $t('actions.flag') }}</span>
        <div></div>
      </div>
      <div class="h-full min-h-0">
        <CaseHistory
          v-if="showHistory"
          data-testid="testShowHistoryDiv"
          :incident-id="Number(currentIncidentId)"
          :worksite-id="worksiteId"
        ></CaseHistory>
        <CaseFlag
          v-else-if="showFlags"
          data-testid="testShowFlagsDiv"
          :incident-id="String(currentIncidentId)"
          :worksite-id="worksiteId"
          @reload-case="
            () => {
              reloadCase();
              showFlags = false;
            }
          "
          @reload-map="
            () => {
              reloadMap();
              showFlags = false;
            }
          "
          @clear-case="clearCase"
        ></CaseFlag>
        <WorksiteView
          v-else-if="isViewing"
          :key="worksiteId"
          data-testid="testWorksiteFormDiv"
          :worksite-id="worksiteId"
          :incident-id="String(currentIncidentId)"
          :top-height="300"
          @reload-case="reloadMap"
          @close-worksite="clearCase"
          @on-reset-form="clearCase"
          @case-loaded="
            () => {
              if (route && route.query.showOnMap) {
                jumpToCase();
              }
            }
          "
        />
        <WorksiteForm
          v-else
          ref="worksiteForm"
          :key="worksiteId"
          :incident-id="String(currentIncidentId)"
          :worksite-id="worksiteId"
          :is-editing="isEditing"
          class="border shadow"
          @jump-to-case="jumpToCase"
          @saved-worksite="handleWorksiteSave"
          @close-worksite="clearCase"
          @navigate-to-worksite="handleWorksiteNavigation"
          @geocoded="addMarkerToMap"
        />
      </div>
    </div>
  </template>
  <template v-else>
    <div class="work-page h-full" :class="{ collapsedForm }">
      <div :key="currentIncidentId" class="work-page__main">
        <div class="relative">
          <div class="flex items-center">
            <div
              v-if="!collapsedUtilityBar"
              :key="currentIncidentId"
              class="flex items-center flex-wrap w-full p-3"
            >
              <ccu-icon
                :alt="$t('casesVue.map_view')"
                data-testid="testMapViewIcon"
                size="medium"
                class="mr-4 cursor-pointer"
                :class="showingMap ? 'filter-yellow' : 'filter-gray'"
                type="map"
                ccu-event="user_ui-view-map"
                @click="() => showMap(true)"
              />
              <ccu-icon
                :alt="$t('casesVue.table_view')"
                data-testid="testTableViewIcon"
                size="medium"
                class="mr-4 cursor-pointer"
                :class="showingTable ? 'filter-yellow' : 'filter-gray'"
                type="table"
                ccu-event="user_ui-view-table"
                @click="showTable"
              />
              <ccu-icon
                v-if="caseImages.length > 0"
                :alt="$t('casesVue.photo_map_view')"
                data-testid="testPhotoMapViewIcon"
                size="medium"
                class="mr-4 cursor-pointer"
                :class="
                  showingPhotoMap
                    ? 'text-primary-light'
                    : 'text-crisiscleanup-dark-100'
                "
                ccu-event="user_ui-view-photo-map"
                type="image"
                :fa="true"
                @click="showPhotoMap"
              />
              <ccu-icon
                v-if="can('beta_feature.enable_feed')"
                :alt="$t('casesVue.photo_map_view')"
                data-testid="testPhotoMapViewIcon"
                size="medium"
                class="mr-4 cursor-pointer"
                :class="
                  showingFeed
                    ? 'text-primary-light'
                    : 'text-crisiscleanup-dark-100'
                "
                ccu-event="user_ui-view-photo-map"
                type="scroll"
                :fa="true"
                @click="showFeed"
              />
              <span v-if="allWorksiteCount" class="font-thin">
                <span
                  v-if="allWorksiteCount === filteredWorksiteCount"
                  data-testid="testCaseCountContent"
                >
                  {{ $t('casesVue.cases') }}
                  {{ numeral(allWorksiteCount) }}
                </span>
                <span v-else data-testid="testCaseCountFilteredContent">
                  {{ $t('casesVue.cases') }}
                  {{ numeral(filteredWorksiteCount) }} of
                  {{ numeral(allWorksiteCount) }}
                </span>
              </span>
              <WorksiteSearchAndFilters
                :key="currentIncidentId"
                :current-incident="currentIncident"
                :initial-filters="filters"
                @selected-existing="handleSelectedExisting"
                @updated-query="onUpdateQuery"
                @updated-filters="onUpdateFilters"
                @updated-filter-labels="updateFilterLabels"
              />
              <WorksiteActions
                v-if="currentIncidentId"
                :key="currentIncidentId"
                class="py-1"
                :current-incident-id="String(currentIncidentId)"
                :show-layers="!showingTable"
                :inital-filters="filters"
                @updated-query="onUpdateQuery"
                @updated-filters="onUpdateFilters"
                @apply-location="applyLocation"
                @apply-team-geo-json="applyTeamGeoJson"
                @download-csv="downloadWorksites"
                @toggle-heat-map="toggleHeatMap"
                @toggle-user-locations="toggleUserLocations"
              />
            </div>
            <div
              :class="collapsedUtilityBar ? 'w-full' : ''"
              class="flex justify-end items-center justify-self-end"
            >
              <font-awesome-icon
                :icon="collapsedUtilityBar ? 'chevron-down' : 'chevron-up'"
                :alt="
                  collapsedUtilityBar
                    ? $t('actions.show_options')
                    : $t('actions.hide_options')
                "
                data-testid="testCollapseUtilityBarIcon"
                class="rounded-full border p-1 mx-1 mb-1 cursor-pointer justify-end"
                size="xl"
                @click="collapsedUtilityBar = !collapsedUtilityBar"
              />
            </div>
          </div>
          <tag
            v-if="overDueFilterLabel"
            data-testid="testOverDueFilterLabelDiv"
            closeable
            class="p-1.5 my-1 w-max mx-2"
            :style="{
              fontSize: '0.85rem',
            }"
            @closed="clearQuery"
            >{{ overDueFilterLabel }}</tag
          >
          <tag
            v-if="queryFilterLabel"
            data-testid="testQueryFilterLabelDiv"
            closeable
            class="p-1.5 my-1 w-max mx-2"
            :style="{
              fontSize: '0.85rem',
            }"
            @closed="clearQuery"
            >{{ queryFilterLabel }}</tag
          >
          <div v-if="filterLabels.length > 0" class="mx-4">
            <div class="flex gap-3">
              <span class="font-bold">{{
                $t('casesVue.current_filters')
              }}</span>
              <base-button
                class="underline"
                type="link"
                :action="() => (filters = {})"
                :alt="$t('actions.clear_all')"
              >
                {{ $t('actions.clear_all') }}
              </base-button>
            </div>
            <div class="applied-filters flex flex-wrap justify-start gap-2">
              <template v-for="(filter, key) in filterLabels">
                <template
                  v-for="(label, identifier) in filter.labels"
                  :key="key + identifier"
                >
                  <tag
                    :data-testid="`testFilters${label}Label`"
                    class="p-1.5 my-1"
                    :style="{
                      fontSize: '0.85rem',
                    }"
                  >
                    {{ label }}
                  </tag>
                </template>
              </template>
            </div>
          </div>
          <div
            v-if="
              !collapsedUtilityBar &&
              !showingTable &&
              !showingPhotoMap &&
              !showingFeed
            "
            class="flex justify-center items-center"
          >
            <Slider
              v-if="allWorksiteCount >= 100 && !portal.attr.hide_svi_slider"
              primary-color="#dadada"
              data-testid="testSviSliderInput"
              secondary-color="white"
              :value="sviSliderValue"
              :from="$t('svi.most_vulnerable')"
              :to="$t('svi.everyone')"
              :from-tooltip="$t(`svi.svi_more_info_link`)"
              handle-size="12px"
              track-size="8px"
              class="pt-1 ml-4"
              slider-class="w-64"
              @input="filterSvi"
            />
            <Slider
              v-if="allWorksiteCount >= 100"
              track-size="8px"
              data-testid="testUpdatedSliderInput"
              handle-size="12px"
              primary-color="#dadada"
              secondary-color="white"
              class="pt-1 ml-4"
              slider-class="w-84"
              :title="$t('casesVue.updated')"
              :value="dateSliderValue"
              :min="0"
              :max="100"
              :from="dateSliderFrom"
              :to="dateSliderTo"
              @input="filterDates"
            ></Slider>
          </div>
        </div>
        <div class="work-page__main-content">
          <div
            v-if="showingMap || showingPhotoMap"
            class="work-page__main-content--map"
          >
            <SimpleMap
              v-if="showingMap"
              :map-loading="mapLoading"
              data-testid="testSimpleMapdiv"
              show-zoom-buttons
              show-map-layer-toggle
              :available-work-types="availableWorkTypes"
              @on-zoom-in="zoomIn"
              @on-zoom-out="zoomOut"
              @on-zoom-incident-center="goToIncidentCenter"
              @on-zoom-interactive="goToInteractive"
              @on-toggle-map-type="toggleMapType"
            />
            <WorksitePhotoMap
              v-else-if="showingPhotoMap && caseImages.length > 0"
              :key="caseImages.length"
              ref="photoMap"
              :case-images="caseImages"
              @load-case="loadCase"
            />
            <div ref="phoneButtons" class="work-page__actions">
              <div
                class="w-full h-full flex items-center justify-center relative p-0.5 mt-1 bg-white cursor-pointer"
              >
                <font-awesome-icon
                  :icon="collapsedForm ? 'chevron-left' : 'chevron-right'"
                  :alt="
                    collapsedForm
                      ? $t('actions.show_options')
                      : $t('actions.hide_options')
                  "
                  data-testid="testCollapsedFormIcon"
                  class="px-0.5 py-2 ml-1.5"
                  size="large"
                  @click="collapsedForm = !collapsedForm"
                />
              </div>
              <PhoneComponentButton
                name="chat"
                data-testid="testPhoneComponentChatButton"
                class="work-page__action"
                component-class="work-page__action-content work-page__action-content--chat"
                @open="
                  () => {
                    updateUserState({
                      [`chat_${selectedChat.id}_last_seen`]:
                        moment().toISOString(),
                    });
                    unreadChatCount = 0;
                    unreadUrgentChatCount = 0;
                  }
                "
              >
                <template #button>
                  <div
                    class="w-full h-full flex items-center justify-center relative"
                  >
                    <div
                      v-if="unreadChatCount"
                      class="absolute top-0 left-0 m-1"
                      data-testid="testUnreadChatCountDiv"
                    >
                      <span
                        class="inline-flex items-center justify-center px-1 py-0.5 mr-2 text-xs font-bold leading-none text-black bg-primary-light rounded-full"
                        >{{ unreadChatCount }}</span
                      >
                    </div>
                    <div
                      v-if="unreadUrgentChatCount"
                      class="absolute top-0 right-0 my-1 -mx-1"
                    >
                      <span
                        class="inline-flex items-center justify-center px-1 py-0.5 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full"
                        >{{ unreadUrgentChatCount }}</span
                      >
                    </div>
                    <ccu-icon
                      type="chat"
                      class="p-1 ml-1.5"
                      size="large"
                      :alt="$t('chat.chat')"
                    />
                  </div>
                </template>
                <template #component>
                  <Chat
                    v-if="selectedChat"
                    data-testid="testChatDiv"
                    :chat="selectedChat"
                    :state-key="`chat_${selectedChat.id}_last_seen`"
                    @unread-count="unreadChatCount = $event"
                    @unread-urgent-count="unreadUrgentChatCount = $event"
                    @on-new-message="unreadChatCount += 1"
                    @on-new-urgent-message="unreadUrgentChatCount += 1"
                    @focus-news-tab="focusNewsTab"
                  />
                </template>
              </PhoneComponentButton>
              <PhoneComponentButton
                name="news"
                data-testid="testPhoneComponentNewsDiv"
                class="work-page__action"
                component-class="work-page__action-content work-page__action-content--news"
                @open="
                  () => {
                    updateUserState({
                      work_news_last_seen: moment().toISOString(),
                    });
                    unreadNewsCount = 0;
                  }
                "
              >
                <template #button>
                  <div
                    class="w-full h-full flex items-center justify-center relative"
                  >
                    <div
                      v-if="unreadNewsCount"
                      class="absolute top-0 left-0 m-1"
                      data-testid="testUnreadNewsCountDiv"
                    >
                      <span
                        class="inline-flex items-center justify-center px-1 py-0.5 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full"
                        >{{ unreadNewsCount }}</span
                      >
                    </div>
                    <ccu-icon
                      type="news"
                      class="p-1 ml-1.5"
                      size="large"
                      :alt="$t('phoneDashboard.news')"
                    />
                  </div>
                </template>
                <template #component>
                  <PhoneNews
                    :cms-tag="'work-news'"
                    state-key="work_news_last_seen"
                    @unread-count="unreadNewsCount = $event"
                  />
                </template>
              </PhoneComponentButton>
            </div>
          </div>
          <div
            v-else-if="showingFeed"
            class="work-page__main-content--feed relative"
          >
            <WorksiteFeed
              :key="currentIncidentId"
              class="h-[calc(100vh-11rem)]"
              :current-user-location="currentUserLocation"
              @load-case="loadCase"
            />
          </div>
          <div v-if="showingTable" class="work-page__main-content--table">
            <div class="items-center justify-start hidden md:flex">
              <ListDropdown
                :selected-table-items="selectedTableItems"
                model-type="worksite_worksites"
                :title="$t('list.worksite_lists')"
                :alt="$t('list.worksite_lists')"
                :incident="currentIncidentId"
              />
              <base-button
                class="ml-3 my-3 border p-1 px-4 bg-white"
                data-testid="testPrintClaimedButton"
                :class="
                  selectedTableItems && selectedTableItems.size === 0
                    ? 'text-crisiscleanup-grey-700'
                    : ''
                "
                :disabled="selectedTableItems && selectedTableItems.size === 0"
                :text="$t('actions.print_claimed')"
                :alt="$t('actions.print_claimed')"
                :action="printSelectedWorksites"
              />
              <base-button
                class="ml-3 my-3 border p-1 px-4 bg-white"
                data-testid="testDownloadButton"
                :class="
                  selectedTableItems && selectedTableItems.size === 0
                    ? 'text-crisiscleanup-grey-700'
                    : ''
                "
                :disabled="selectedTableItems && selectedTableItems.size === 0"
                :text="$t('actions.download')"
                :alt="$t('actions.download')"
                :action="
                  () => {
                    downloadWorksites(Array.from(selectedTableItems));
                  }
                "
              />
              <base-button
                class="ml-3 my-3 border p-1 px-4 bg-white"
                data-testid="testUnclaimButton"
                :class="
                  selectedTableItems && selectedTableItems.size === 0
                    ? 'text-crisiscleanup-grey-700'
                    : ''
                "
                :disabled="selectedTableItems && selectedTableItems.size === 0"
                :action="showUnclaimModal"
                :text="$t('actions.unclaim')"
                :alt="$t('actions.unclaim')"
              >
              </base-button>
              <base-button
                data-testid="testUpdateStatusButton"
                class="ml-3 my-3 border p-1 px-4 bg-white"
                :class="
                  selectedTableItems && selectedTableItems.size === 0
                    ? 'text-crisiscleanup-grey-700'
                    : ''
                "
                :disabled="selectedTableItems && selectedTableItems.size === 0"
                :text="$t('actions.update_status')"
                :alt="$t('actions.update_status')"
                :action="showUpdateStatusModal"
              />
            </div>
            <WorksiteTable
              :worksite-query="worksiteQuery"
              class=""
              :body-style="{ height: 'calc(100vh - 22rem)' }"
              @row-click="loadCase"
              @selection-changed="onSelectionChanged"
            />
          </div>
        </div>
      </div>
      <div class="work-page__form h-full min-h-0">
        <CaseHeader
          v-if="worksite"
          :worksite="worksite"
          class="border-l border-r"
          can-edit
          show-case-tabs
          :is-viewing-worksite="isViewing"
          @close-worksite="clearCase"
          @on-jump-to-case="jumpToCase"
          @reload-map="reloadMap"
          @on-share-worksite="() => shareWorksite(worksite?.id)"
          @on-download-worksite="
            () => {
              downloadWorksites([worksite?.id]);
            }
          "
          @on-print-worksite="() => printWorksite(worksite?.id)"
          @on-flag-case="
            () => {
              showFlags = true;
              showHistory = false;
            }
          "
          @on-edit-case="
            () => {
              isViewing = false;
              isEditing = true;
              router.push(
                `/incident/${currentIncidentId}/work/${worksite?.id}/edit`,
              );
            }
          "
          @on-exit-edit-case="
            () => {
              isViewing = true;
              isEditing = false;
              router.push(
                `/incident/${currentIncidentId}/work/${worksite?.id}`,
              );
            }
          "
          @on-show-history="
            () => {
              showFlags = false;
              showHistory = true;
            }
          "
        />
        <div v-else class="work-page__form-header">
          <div
            class="flex h-full items-center cursor-pointer border-b-2 border-primary-light p-3"
            @click="() => clearCase()"
          >
            <ccu-icon
              :alt="$t('casesVue.new_case')"
              type="active"
              size="small"
              data-testid="testNewCaseIcon"
            />
            <span class="px-1 mt-0.5">{{ $t('casesVue.new_case') }}</span>
          </div>
          <div
            v-if="mostRecentlySavedWorksite && mostRecentlySavedWorksite.id"
            class="h-full p-3 flex items-center justify-center"
            @click="() => loadCase(mostRecentlySavedWorksite)"
          >
            Case
            {{
              mostRecentlySavedWorksite && mostRecentlySavedWorksite.case_number
            }}
            <ccu-icon
              :alt="$t('actions.cancel')"
              data-testid="testCancelButton"
              size="xs"
              type="cancel"
              class="ml-2"
              :action="
                () => {
                  mostRecentlySavedWorksite = null;
                }
              "
            />
          </div>
          <base-button
            v-if="$mq === 'sm'"
            data-testid="testShowMapButton"
            type="bare"
            icon="map"
            class="text-gray-700 pt-2"
            :action="
              () => {
                showMobileMap = true;
              }
            "
            :text="$t('casesVue.show_map')"
            :alt="$t('casesVue.show_map')"
          />
        </div>
        <div v-if="showingDetails" class="work-page__form-toggler">
          <base-button
            icon="arrow-left"
            data-testid="testHistoryButton"
            icon-size="medium"
            :action="
              () => {
                showHistory = false;
                showFlags = false;
              }
            "
            :alt="$t('actions.history')"
          />
          <span v-if="showHistory" class="text-base">{{
            $t('actions.history')
          }}</span>
          <span v-if="showFlags" class="text-base">{{
            $t('actions.flag')
          }}</span>
          <div></div>
        </div>
        <div class="h-auto min-h-0">
          <CaseHistory
            v-if="showHistory"
            data-testid="testShowHistoryDiv"
            :incident-id="Number(currentIncidentId)"
            :worksite-id="worksiteId"
          ></CaseHistory>
          <CaseFlag
            v-else-if="showFlags"
            data-testid="testShowFlagsDiv"
            :incident-id="String(currentIncidentId)"
            :worksite-id="worksiteId"
            @reload-case="
              () => {
                reloadCase();
                showFlags = false;
              }
            "
            @reload-map="
              () => {
                reloadMap();
                showFlags = false;
              }
            "
            @clear-case="clearCase"
          ></CaseFlag>
          <WorksiteView
            v-else-if="isViewing"
            :key="worksiteId"
            data-testid="testWorksiteFormDiv"
            :worksite-id="worksiteId"
            :incident-id="String(currentIncidentId)"
            :top-height="300"
            @reload-case="reloadMap"
            @close-worksite="clearCase"
            @on-reset-form="clearCase"
            @case-loaded="
              () => {
                if (route && route.query.showOnMap) {
                  jumpToCase();
                }
              }
            "
          />
          <WorksiteForm
            v-else
            ref="worksiteForm"
            :key="worksiteId"
            :incident-id="String(currentIncidentId)"
            :worksite-id="worksiteId"
            :is-editing="isEditing"
            class="border shadow"
            @jump-to-case="jumpToCase"
            @saved-worksite="handleWorksiteSave"
            @close-worksite="clearCase"
            @navigate-to-worksite="handleWorksiteNavigation"
            @geocoded="addMarkerToMap"
          />
        </div>
      </div>
    </div>
  </template>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import axios from 'axios';
import type { Sprite } from 'pixi.js';
import moment from 'moment';
import type { LatLng } from 'leaflet';
import * as L from 'leaflet';
import { useMq } from 'vue3-mq';
import WorksiteSearchInput from '../components/work/WorksiteSearchInput.vue';
import PhoneComponentButton from '../components/phone/PhoneComponentButton.vue';
import SimpleMap from '../components/SimpleMap.vue';
import Chat from '../components/chat/Chat.vue';
import WorksiteTable from '../components/work/WorksiteTable.vue';
import CaseHeader from '../components/work/CaseHeader.vue';
import Worksite from '../models/Worksite';
import CaseHistory from '../components/work/CaseHistory.vue';
import {
  loadCaseImagesCached,
  loadCasesCached,
  loadUserLocations,
} from '../utils/worksite';
import { averageGeolocation, getUserLocationLayer } from '../utils/map';
import WorksiteActions from '../components/work/WorksiteActions.vue';
import { forceFileDownload } from '../utils/downloads';
import { getErrorMessage } from '../utils/errors';
import Incident from '../models/Incident';
import CaseFlag from '../components/work/CaseFlag.vue';
import PhoneNews from '../components/phone/PhoneNews.vue';
import Slider from '../components/Slider.vue';
import WorksiteForm from '../components/work/WorksiteForm.vue';
import WorksiteView from '../components/work/WorksiteView.vue';
import useDialogs from '../hooks/useDialogs';
import type { MapUtils } from '../hooks/worksite/useWorksiteMap';
import useWorksiteMap from '../hooks/worksite/useWorksiteMap';
import { numeral } from '@/utils/helpers';
import type Location from '@/models/Location';
import UpdateCaseStatus from '@/components/UpdateCaseStatus.vue';
import useWorksiteTableActions from '@/hooks/worksite/useWorksiteTableActions';
import ShareWorksite from '@/components/modals/ShareWorksite.vue';
import useEmitter from '@/hooks/useEmitter';
import Organization from '@/models/Organization';
import WorksitePhotoMap from '@/components/WorksitePhotoMap.vue';

const INTERACTIVE_ZOOM_LEVEL = 12;
import { useCurrentIncident, useCurrentUser } from '@/hooks';
import type { Portal, UserLocation } from '@/models/types';
import WorksiteFeed from '@/components/WorksiteFeed.vue';
import { useRecentWorksites } from '@/hooks/useRecentWorksites';
import useAcl from '@/hooks/useAcl';
import ListDropdown from '@/pages/lists/ListDropdown.vue';
import WorksiteSearchAndFilters from '@/components/work/WorksiteSearchAndFilters.vue';
import BaseButton from '@/components/BaseButton.vue';
import AjaxTable from '@/components/AjaxTable.vue';
import { momentFromNow } from '@/filters';
import User from '@/models/User';

export default defineComponent({
  name: 'Work',
  components: {
    AjaxTable,
    BaseButton,
    WorksiteSearchAndFilters,
    ListDropdown,
    WorksiteFeed,
    WorksiteView,
    WorksiteForm,
    Slider,
    PhoneNews,
    CaseFlag,
    WorksiteActions,
    CaseHistory,
    CaseHeader,
    WorksiteTable,
    Chat,
    SimpleMap,
    PhoneComponentButton,
    WorksiteSearchInput,
    WorksitePhotoMap,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const $toasted = useToast();
    const { prompt, component, confirm } = useDialogs();
    const { t } = useI18n();
    const store = useStore();
    const { emitter } = useEmitter();
    const mq = useMq();
    const { $can } = useAcl();

    const { currentIncidentId, currentIncident } = useCurrentIncident();
    const portal = store.getters['enums/portal'] as Portal;

    const incidentName = computed(() => currentIncident.name);

    const { currentUser, updateUserStates } = useCurrentUser();
    const { recentWorksites } = useRecentWorksites();

    const currentUserLocation = computed(() => {
      if (currentUser.value?.states?.mapViewPort) {
        const { _northEast, _southWest } = currentUser.value.states.mapViewPort;

        const centerLat = (_northEast.lat + _southWest.lat) / 2;
        const centerLng = (_northEast.lng + _southWest.lng) / 2;

        return L.latLng(centerLat, centerLng);
      }

      if (recentWorksites.value.length > 0) {
        const worksite = recentWorksites.value[0];
        return L.latLng(
          worksite.location.coordinates[1],
          worksite.location.coordinates[0],
        );
      }

      if (mostRecentlySavedWorksite.value) {
        return L.latLng(
          mostRecentlySavedWorksite.value.location.coordinates[1],
          mostRecentlySavedWorksite.value.location.coordinates[0],
        );
      }

      return getIncidentCenter();
    });

    const showingMap = ref<boolean>(true);
    const showingTable = ref<boolean>(false);
    const showingPhotoMap = ref<boolean>(false);
    const showingFeed = ref<boolean>(false);
    const showHistory = ref<boolean>(false);
    const showFlags = ref<boolean>(false);
    const showMobileMap = ref<boolean>(false);
    const isEditing = ref<boolean>(false);
    const isViewing = ref<boolean>(false);
    const caseImages = ref<Record<string, any>[]>([]);
    const userLocations = ref<Record<string, any>[]>([]);
    const mapLoading = ref<boolean>(false);
    const collapsedForm = ref<boolean>(false);
    const collapsedUtilityBar = ref<boolean>(false);
    const loading = ref<boolean>(false);
    const allWorksiteCount = ref<number>(0);
    const filteredWorksiteCount = ref<number>(0);
    const searchWorksites = ref<any[]>([]);
    const currentSearch = ref<string>('');
    const mobileSearch = ref<string>('');
    const worksiteId = ref<any>(null);
    const selectedChat = ref<any>({ id: 2 });
    const filterQuery = ref<any>({});
    const filters = ref<any>({});
    const filterLabels = ref<any>([]);
    const mostRecentlySavedWorksite = ref<any>(null);
    const selectedTableItems = ref<Set<number>>(new Set());
    const availableWorkTypes = ref({});
    const sviSliderValue = ref(100);
    const dateSliderValue = ref(100);
    let mapUtils: MapUtils | null;
    const unreadChatCount = ref(0);
    const unreadUrgentChatCount = ref(0);
    const unreadNewsCount = ref(0);
    const photoMap = ref(null);
    const { showUnclaimModal } = useWorksiteTableActions(
      selectedTableItems,
      () => {
        loading.value = false;
        reloadTable();
      },
    );
    const showingSearchModal = ref(false);

    function loadStatesForUser() {
      const states = currentUser?.value?.getStatesForIncident(
        currentIncidentId.value,
        true,
      );
      if (states) {
        if (states.showingMap) {
          showMap();
        }

        if (states.showingTable) {
          showTable();
        }

        if (states.showingFeed) {
          showFeed();
        }

        if (states.showingPhotoMap) {
          showPhotoMap();
        }

        if (states.appliedFilters) {
          filterQuery.value = states.appliedFilters;
        }

        if (states.sviLevel) {
          sviSliderValue.value = states.sviLevel;
        }

        if (states.dateLevel) {
          dateSliderValue.value = states.dateLevel;
        }

        if (states.filters) {
          filters.value = {
            ...states.filters,
          };
        }
      }
    }

    function updateUserState(incomingData: Record<string, any>) {
      let data = incomingData;
      if (!data) {
        data = {};
      }

      const newStates = {
        showingMap: showingMap.value,
        showingTable: showingTable.value,
        showingFeed: showingFeed.value,
        showingPhotoMap: showingPhotoMap.value,
        sviLevel: sviSliderValue.value,
        dateLevel: dateSliderValue.value,
        ...data,
      };
      updateUserStates({ incident: currentIncidentId.value }, newStates).catch(
        getErrorMessage,
      );
    }

    const hasOverdueFilter = computed(() => {
      return (
        'work_type__claimed_by' in route.query &&
        'work_type__status__in' in route.query &&
        'created_at__lte' in route.query
      );
    });

    const hasQueryFilter = computed(() => {
      return (
        'work_type__claimed_by' in route.query ||
        'work_type__claimed_by__isnull' in route.query ||
        'work_type__status__primary_state' in route.query
      );
    });

    const queryFilterLabel = computed(() => {
      if (hasQueryFilter.value) {
        if ('work_type__claimed_by' in route.query) {
          return `${getOrganizationName(
            route.query.work_type__claimed_by as string,
          )} ${t('casesVue.claimed_cases')}`;
        } else if ('work_type__claimed_by__isnull' in route.query) {
          return t('casesVue.unclaimed_cases');
        } else if ('work_type__status__primary_state' in route.query) {
          return t(
            `casesVue.${route.query.work_type__status__primary_state}_cases`,
          );
        }
      }

      return '';
    });

    const overDueFilterLabel = computed(() => {
      if (hasOverdueFilter.value) {
        return `${getOrganizationName(
          route.query.work_type__claimed_by as string,
        )} ${t('casesVue.overdue_cases')}`;
      }

      return '';
    });

    const worksiteQuery = computed<Record<any, any>>(() => {
      const query = {
        incident: currentIncidentId.value,
        ...filterQuery.value,
        ...route.query,
      };
      if (currentSearch.value) {
        query.search = currentSearch.value;
      }

      return query;
    });

    async function getWorksites() {
      mapLoading.value = true;
      const response = await loadCasesCached({
        ...worksiteQuery.value,
      });
      mapLoading.value = false;
      filteredWorksiteCount.value = response.results.length;

      if ($can('beta_feature.enable_feed')) {
        loadCaseImagesCached({
          ...worksiteQuery.value,
        }).then((response) => {
          caseImages.value = response.results;
        });
      }
      return response.results;
    }

    async function getAllWorksites() {
      mapLoading.value = true;
      const response = await loadCasesCached({
        incident: currentIncidentId.value,
      });
      mapLoading.value = false;
      allWorksiteCount.value = response.results.length;
      return response.results;
    }

    async function reloadMap() {
      if (mapUtils) {
        mapUtils?.removeLayer('temp_markers');
      }

      const allWorksites = await getAllWorksites();
      const markers = await getWorksites();
      mapUtils?.reloadMap(
        allWorksites,
        markers.map((m: Worksite) => m.id),
      );
    }

    const showTable = () => {
      showingTable.value = true;
      showingMap.value = false;
      showingPhotoMap.value = false;
      showingFeed.value = false;
      updateUserState({});
    };

    const showMap = (reload = false) => {
      showingTable.value = false;
      showingMap.value = true;
      showingPhotoMap.value = false;
      showingFeed.value = false;
      if (reload) {
        reloadMap().then(() => {
          updateUserState({});
        });
      }

      nextTick(() => {
        init();
      });
      updateUserState({});
    };

    const showPhotoMap = () => {
      showingTable.value = false;
      showingMap.value = false;
      showingPhotoMap.value = true;
      showingFeed.value = false;
      updateUserState({});
    };

    const showFeed = () => {
      showingTable.value = false;
      showingMap.value = false;
      showingPhotoMap.value = false;
      showingFeed.value = true;
      updateUserState({});
    };

    const showingDetails = computed<boolean>(() => {
      return showHistory.value || showFlags.value;
    });

    const worksite = computed<Worksite | null>(() => {
      if (worksiteId.value) {
        return Worksite.find(worksiteId.value);
      }

      return null;
    });

    const workTypesClaimedByOrganization = computed<any>(() => {
      if (worksite.value) {
        return worksite.value.work_types.filter((type) =>
          currentUser?.value?.organization.affiliates.includes(type.claimed_by),
        );
      }

      return [];
    });

    const jumpToCase = async (showPopup = true) => {
      if (showingPhotoMap.value) {
        photoMap?.value?.jumpToLocation(
          worksite.value.latitude,
          worksite.value.longitude,
        );
      } else {
        showMap();
        mapUtils?.jumpToCase(worksite.value, showPopup);
      }
    };

    function reloadTable() {
      filterQuery.value = { ...filterQuery.value };
      updateUserState({});
    }

    async function showUpdateStatusModal() {
      let status;
      const response = await component({
        title: t('actions.update_status'),
        component: UpdateCaseStatus,
        classes: 'w-full h-24 overflow-auto p-3',
        modalClasses: 'bg-white max-w-3xl shadow',
        listeners: {
          updatedStatus(payload: string) {
            status = payload;
          },
        },
      });

      if (response === 'ok' && status) {
        loading.value = true;
        const promises = [] as any;
        const ids = [...selectedTableItems.value];

        const hasClaimedWorkType = (w: Worksite) => {
          return w.work_types.some((type) =>
            currentUser?.value?.organization.affiliates.includes(
              type.claimed_by,
            ),
          );
        };

        await Worksite.api().get(`/worksites?id__in=${ids.join(',')}`, {
          dataKey: 'results',
        });

        const worksitesChangeStatus = Worksite.query()
          .whereIdIn(ids.map(String))
          .get();

        if (!worksitesChangeStatus.every((w) => hasClaimedWorkType(w))) {
          await confirm({
            title: t('casesVue.cannot_share_cases'),
            content: t('casesVue.bulk_status_update_for_claimed_only'),
          });
        }

        for (const worksite of worksitesChangeStatus) {
          if (hasClaimedWorkType(worksite)) {
            for (const workType of worksite.work_types) {
              promises.push(
                Worksite.api().updateWorkTypeStatus(workType.id, status),
              );
            }
          }
        }

        await Promise.allSettled(promises);
      }

      loading.value = false;
      reloadTable();
    }

    function toggleHeatMap(points: LatLng[]) {
      if (points) {
        mapUtils?.addHeatMap(points);
      } else {
        mapUtils?.removeHeatMap();
      }
    }

    function toggleUserLocations(value: boolean) {
      if (value) {
        const locationLayer = getUserLocationLayer(
          userLocations.value,
          (location: UserLocation) => {
            const user = User.find(location.user_id);
            if (user) {
              const emailSection = user.email
                ? `<div class="text-sm"><a href="mailto:${user.email}" class="ml-1">${user.email}</a></div>`
                : '';
              const mobileSection = user.mobile
                ? `<div class="text-sm"><a href="tel:${user.mobile}" class="ml-1">${user.mobile}</a></div>`
                : '';

              const popup = L.popup({
                closeButton: true,
                closeOnClick: true,
                autoClose: false,
                closeOnEscapeKey: true,
              }).setContent(
                `<div class="flex flex-col items-center">
          <div class="text-sm font-bold">${user.full_name}</div>
          ${emailSection}
          ${mobileSection}
          <div class="text-sm">${user.organization.name}</div>
          <div class="text-xs italic">${t('casesVue.last_seen')} ${momentFromNow(location.timestamp)}</div>
        </div>`,
              );

              popup.setLatLng([location.location[1], location.location[0]]);
              popup.openOn(mapUtils?.getMap());
            }
          },
        );

        locationLayer.addTo(mapUtils?.getMap());
      } else {
        mapUtils?.removeLayer('user_location_layer');
      }
    }

    const getSviList = useMemoize((_) => {
      const layer = mapUtils?.getCurrentMarkerLayer();
      const container = layer?._pixiContainer;
      const list = container?.children.map((marker: any) => {
        return {
          id: marker.id,
          svi: marker.svi,
        };
      });
      if (list && container) {
        list.sort((a, b) => {
          return (b.svi || 1) - (a.svi || 1);
        });
      }

      return list;
    });

    function filterSvi(value: number) {
      const layer = mapUtils?.getCurrentMarkerLayer();
      const container = layer?._pixiContainer;
      if (container?.children?.length < 100) return;

      if (sviSliderValue.value !== 100 && dateSliderValue.value !== 100) {
        dateSliderValue.value = 100;
      }
      sviSliderValue.value = Number(value);
      const sviList = getSviList(container?.children?.length);
      if (sviList && container) {
        const count = Math.floor((sviList.length * Number(value)) / 100);
        const filteredSvi = sviList.slice(0, count);
        const minSvi = filteredSvi.at(-1)?.svi || 0.999;
        for (const markerSprite of container.children) {
          markerSprite.visible = markerSprite.svi > minSvi;
        }

        layer._renderer.render(container);
        layer.redraw();
      }

      updateUserState({});
    }

    const getDatesList = useMemoize((_) => {
      const layer = mapUtils?.getCurrentMarkerLayer();
      const container = layer?._pixiContainer;
      const list = container?.children.map((marker: any) => {
        return {
          id: marker.id,
          updated_at: marker.updated_at_moment,
        };
      });
      if (list && container) {
        list.sort((a, b) => {
          return b.updated_at - a.updated_at;
        });
      }

      return list;
    });

    const dateSliderFrom = ref<string>('');
    const dateSliderTo = ref<string>('');

    const getDateSliderFrom = useMemoize((_) => {
      const layer = mapUtils?.getCurrentMarkerLayer();
      const container = layer?._pixiContainer;
      const list = getDatesList(container?.children?.length);
      if (list) {
        return `${moment({ hours: 0 }).diff(
          list[0]?.updated_at,
          'days',
        )} days ago`;
      }

      return '';
    });

    const getDateSliderTo = useMemoize((_) => {
      const layer = mapUtils?.getCurrentMarkerLayer();
      const container = layer?._pixiContainer;
      const list = getDatesList(container?.children?.length);
      if (list) {
        return `${moment({ hours: 0 }).diff(
          list.at(-1).updated_at,
          'days',
        )} days ago`;
      }

      return '';
    });

    function filterDates(value: number) {
      const layer = mapUtils?.getCurrentMarkerLayer();
      const container = layer?._pixiContainer;
      if (container?.children?.length < 100) return;
      if (sviSliderValue.value !== 100 && dateSliderValue.value !== 100) {
        filterSvi(100);
      }
      const dl = getDatesList(container?.children?.length);
      dateSliderFrom.value = getDateSliderFrom(container?.children?.length);
      dateSliderTo.value = getDateSliderTo(container?.children?.length);
      if (value === 0) return;
      dateSliderValue.value = Number(value);

      if (dl) {
        const count = Math.floor((dl.length * Number(value)) / 100);
        const filteredDates = dl.slice(0, count);
        const minDate = filteredDates.at(-1)?.updated_at;
        for (const markerSprite of container?.children || []) {
          markerSprite.visible = markerSprite.updated_at_moment > minDate;
        }

        layer?._renderer.render(container);
        layer?.redraw();
      }

      updateUserState({});
    }

    function zoomIn() {
      mapUtils?.getMap().zoomIn();
    }

    function zoomOut() {
      mapUtils?.getMap().zoomOut();
    }

    function applyTeamGeoJson(data: {
      teamId: string;
      value: boolean;
      geom: any;
    }) {
      mapUtils?.applyTeamGeoJson(data.teamId, data.value, data.geom);
    }

    function applyLocation(data: { locationId: string; value: boolean }) {
      mapUtils?.applyLocation(data.locationId, data.value);
    }

    async function reloadCase() {
      return Worksite.api().fetch(
        worksite?.value?.id,
        currentIncidentId.value.id,
      );
    }

    function fitLocation(location: Location) {
      mapUtils?.fitLocation(location);
    }

    function goToIncidentCenter() {
      mapUtils?.getMap().setView(getIncidentCenter(), 6);
    }

    function getIncidentCenter() {
      const { incident_center } = Incident.find(
        currentIncidentId.value,
      ) as Incident;
      if (incident_center) {
        return [incident_center.coordinates[1], incident_center.coordinates[0]];
      }
      return [35.746_512_259_918_5, -96.411_509_631_256_56];
    }

    function goToInteractive() {
      mapUtils?.getMap().setView(getIncidentCenter(), INTERACTIVE_ZOOM_LEVEL);
    }

    function toggleMapType() {
      mapUtils?.switchTileLayer();
    }

    function onSelectionChanged(selectedItems: Set<number>) {
      selectedTableItems.value = selectedItems;
    }

    async function shareWorksite(id: number) {
      loading.value = true;
      let noClaimText = '';
      const worksiteToShare = await Worksite.find(id);
      const hasClaimedWorkType = worksiteToShare?.work_types.some((type) =>
        currentUser?.value?.organization.affiliates.includes(type.claimed_by),
      );
      if (hasClaimedWorkType) {
        noClaimText = '';
      } else {
        const result = await prompt({
          title: t('casesVue.share_case'),
          content: t('casesVue.please_claim_if_share'),
          actions: {
            cancel: {
              text: t('actions.cancel'),
              type: 'outline',
              buttonClass: 'border border-black',
            },
            shareNoClaim: {
              text: t('actions.share_no_claim'),
              type: 'outline',
              buttonClass: 'border border-black',
            },
            claimAndShare: {
              text: t('actions.claim_and_share'),
              type: 'solid',
              buttonClass:
                'border text-base p-2 px-4 mx-2 text-black border-primary-light',
            },
          },
        });

        if (result.key === 'cancel' || !result) {
          return;
        }

        if (result.key === 'claimAndShare') {
          noClaimText = '';
        }

        if (result.key === 'shareNoClaim') {
          if (!result.response) {
            $toasted.error(t('casesVue.please_explain_why_no_claim'));
            return shareWorksite(id);
          }

          noClaimText = result.response;
        }
      }

      let emails: string[] = [];
      let phoneNumbers: string[] = [];
      let shareMessage = '';

      const result = await component({
        title: t('actions.share'),
        component: ShareWorksite,
        classes: 'w-full h-144',
        actionText: t('actions.share'),
        props: {
          worksite: id,
        },
        listeners: {
          phoneNumbersUpdated(value: string[]) {
            phoneNumbers = value.map((number) =>
              String(number).replaceAll(/\D/g, ''),
            );
          },
          emailsUpdated(value: string[]) {
            emails = value;
          },
          shareMessageUpdated(value: string) {
            shareMessage = value;
          },
        },
      });
      if (result === 'no' || result === 'cancel') {
        return;
      }

      await Worksite.api().shareWorksite(
        id,
        emails,
        phoneNumbers,
        shareMessage,
        noClaimText,
      );
      await reloadCase();
      $toasted.success(t('casesVue.sucessfully_shared_case'));
    }

    async function printWorksite(id: number) {
      loading.value = true;
      let file;
      const worksiteToPrint = await Worksite.find(id);
      const hasClaimedWorkType = worksiteToPrint?.work_types.some((type) =>
        currentUser?.value?.organization.affiliates.includes(type.claimed_by),
      );
      if (hasClaimedWorkType) {
        file = await Worksite.api().printWorksite(id, '');
      } else {
        const result = await prompt({
          title: t('actions.print_case'),
          content: t('casesVue.please_claim_if_print'),
          actions: {
            cancel: {
              text: t('actions.cancel'),
              type: 'outline',
              buttonClass: 'border border-black',
            },
            printNoClaim: {
              text: t('actions.print_without_claiming'),
              type: 'solid',
              buttonClass:
                'border text-base p-2 px-4 mx-2 text-black border-primary-light',
            },
            claimAndPrint: {
              text: t('actions.claim_and_print'),
              type: 'solid',
              buttonClass:
                'border text-base p-2 px-4 mx-2 text-black border-primary-light',
            },
          },
        });

        if (result.key === 'claimAndPrint') {
          file = await Worksite.api().printWorksite(id, '');
        }

        if (result.key === 'printNoClaim') {
          if (result.response) {
            file = await Worksite.api().printWorksite(id, result.response);
          } else {
            $toasted.error(t('casesVue.please_explain_why_no_claim'));
          }
        }
      }

      if (file) {
        forceFileDownload(file.response);
      }

      loading.value = false;
      await reloadCase();
    }

    async function printSelectedWorksites() {
      const ids = [...selectedTableItems.value];
      if (ids.length === 1) {
        return printWorksite(ids[0]);
      }

      const hasClaimedWorkType = (w: Worksite) => {
        return w.work_types.some((type) =>
          currentUser?.value?.organization.affiliates.includes(type.claimed_by),
        );
      };

      await Worksite.api().get(`/worksites?id__in=${ids.join(',')}`, {
        dataKey: 'results',
      });

      const worksitesToPrint = Worksite.query()
        .whereIdIn(ids.map(String))
        .get();

      if (!worksitesToPrint.every((w) => hasClaimedWorkType(w))) {
        await confirm({
          title: t('info.cannot_claim_cases'),
          content: t('info.cannot_claim_cases_d'),
        });
      }

      const ids_to_print = worksitesToPrint
        .filter((w) => hasClaimedWorkType(w))
        .map((w) => w.id);

      if (ids_to_print.length > 0) {
        const file = await Worksite.api().downloadWorksite(
          ids_to_print,
          'application/pdf',
        );
        forceFileDownload(file.response);
      }
    }

    async function downloadWorksites(ids: any[], skipSizeCheck = false) {
      loading.value = true;
      try {
        let params;

        params = ids
          ? {
              id__in: ids.join(','),
            }
          : {
              ...worksiteQuery.value,
            };

        if (skipSizeCheck) {
          params.skip_size_warning = true;
        }

        const response = await axios.get(
          `${
            import.meta.env.VITE_APP_API_BASE_URL
          }/worksites_download/download_csv`,
          {
            params,
            headers: { Accept: 'text/csv' },
            responseType: 'blob',
          },
        );
        if (response.status === 202) {
          await confirm({
            title: t('info.processing_download'),
            content: t('info.processing_download_d'),
          });
        } else if (response.includes('400')) {
          const result = await confirm({
            title: t('~~Large Data Download'),
            content: t(
              '~~The size of the data you are trying to download is too large. You can use the filters to reduce the size of the data to under 5000 records for faster downloads. Do you want to continue?',
            ),
            actions: {
              yes: {
                text: t('~~Yes'),
                type: 'solid',
              },
              no: {
                text: t('No'),
                type: 'outline',
              },
            },
          });
          if (result === 'yes') {
            return downloadWorksites(ids, true);
          }
        } else {
          forceFileDownload(response);
        }
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      } finally {
        loading.value = false;
      }
    }

    function selectCase(c: { incident: any; id: any }) {
      if (c) {
        store.commit('incident/setCurrentIncidentId', c.incident);
        worksiteId.value = c.id;
      } else {
        worksiteId.value = null;
      }
    }

    function clearCase() {
      worksiteId.value = null;
      isEditing.value = false;
      isViewing.value = false;
      showHistory.value = false;
      showFlags.value = false;
      router.push(`/incident/${currentIncidentId.value}/work`);
      if (mq.mdMinus) {
        showMap(true);
      }
    }

    async function addMarkerToMap(location: LatLng) {
      mapUtils?.addMarkerToMap(location);
      showMap();
    }

    function loadCase(data: Sprite & Worksite) {
      isViewing.value = true;
      worksiteId.value = data.id;
      showHistory.value = false;
      showFlags.value = false;
      router.push(`/incident/${currentIncidentId.value}/work/${data.id}`);
    }

    function onUpdateQuery(query: any) {
      filterQuery.value = query;
      updateUserState({
        appliedFilters: filterQuery.value,
        filters: filters.value,
      });
    }

    function onUpdateFilters(f: any) {
      filters.value = f;
      updateUserState({
        appliedFilters: filterQuery.value,
        filters: filters.value,
      });
    }

    function updateFilterLabels(labels: any) {
      filterLabels.value = labels;
    }

    watch(
      () => worksiteQuery.value,
      (value, previousValue) => {
        if (JSON.stringify(value) !== JSON.stringify(previousValue)) {
          reloadMap();
        }
      },
    );

    watch(
      () => currentIncidentId.value,
      (value) => {
        if (value) {
          worksiteId.value = null;
          isEditing.value = false;
          isViewing.value = false;
          router.push(`/incident/${currentIncidentId.value}/work`);
          init();
        }
      },
    );

    async function init() {
      const [allWorksites, markers] = await Promise.all([
        getAllWorksites(),
        getWorksites(),
      ]);

      if (route.query.work_type__claimed_by) {
        Organization.api().get(
          `/organizations/${route.query.work_type__claimed_by}`,
        );
      }

      const states = currentUser?.value?.getStatesForIncident(
        currentIncidentId.value,
        true,
      );
      let bounds;
      if (states.mapViewPort) {
        const { _northEast, _southWest } = states.mapViewPort;
        bounds = [
          [_northEast.lat, _northEast.lng],
          [_southWest.lat, _southWest.lng],
        ];
      }

      try {
        mapUtils = useWorksiteMap(
          allWorksites,
          markers.map((m: { id: any }) => m.id),
          (m) => {
            loadCase(m);
          },
          ({ workTypes }) => {
            availableWorkTypes.value = workTypes;

            const states = currentUser?.value?.getStatesForIncident(
              currentIncidentId.value,
              true,
            );
            if (states.mapViewPort) {
              const { _northEast, _southWest } = states.mapViewPort;
              mapUtils?.getMap().fitBounds([
                [_northEast.lat, _northEast.lng],
                [_southWest.lat, _southWest.lng],
              ]);
            }

            loadUserLocations({}).then((response) => {
              userLocations.value = response;
            });

            filterSvi(sviSliderValue.value);
            nextTick(() => {
              // Used to trigger calculation of labels ofr updated slider
              filterDates(0);
            });
            updateUserState({ mapViewPort: states.mapViewPort });
            loadStatesForUser();
          },
          false,
          bounds,
        );
      } catch (error) {
        console.error('Error setting mapUtils', error);
      }

      nextTick(() => {
        mapUtils?.getMap().on(
          'moveend',
          L.Util.throttle(
            () => {
              updateUserState({ mapViewPort: mapUtils?.getMap().getBounds() });
            },
            1000,
            {},
          ),
        );
      });
    }

    function handleSelectedExisting(w: Worksite) {
      worksiteId.value = w.id;
      isViewing.value = true;
      if (showingMap.value) {
        router.push({
          path: `/incident/${currentIncidentId.value}/work/${worksiteId.value}`,
          query: { showOnMap: true },
        });
      }
    }

    function handleWorksiteSave(w: Worksite) {
      if (isEditing.value) {
        isEditing.value = true;
        router.push(
          `/incident/${currentIncidentId.value}/work/${worksite.value?.id}/edit`,
        );
      } else {
        worksiteId.value = w.id;
        mostRecentlySavedWorksite.value = w;
        nextTick(() => {
          clearCase();
        });
      }

      reloadMap();
    }

    function handleWorksiteNavigation(w: Worksite) {
      worksiteId.value = w.id;
      isEditing.value = true;
      router.push({
        path: `/incident/${currentIncidentId.value}/work/${w.id}/edit`,
        query: { showOnMap: true },
      });
    }

    onMounted(async () => {
      if (route.params.incident_id) {
        store.commit('incident/setCurrentIncidentId', route.params.incident_id);
      }

      if (route.params.id) {
        worksiteId.value = route.params.id;
        if (route?.meta?.id === 'work_case_edit') {
          isEditing.value = true;
        } else {
          isViewing.value = true;
        }
      }

      loadStatesForUser();
      if (route.query.showTable) {
        showingTable.value = true;
        showingMap.value = false;
        showingPhotoMap.value = false;
        showingFeed.value = false;
      }

      await init();
    });
    function focusNewsTab() {
      emitter.emit('phone_component:close');
      // open the active call PhoneComponentButton
      emitter.emit('phone_component:open', 'news');
    }

    function getOrganizationName(id: string | number | (string | number)[]) {
      const organization = Organization.find(id);
      if (organization) {
        return organization.name;
      }

      return '';
    }

    function clearQuery() {
      router.replace({ query: undefined });
    }

    return {
      addMarkerToMap,
      clearCase,
      currentIncidentId,
      incidentName,
      allWorksiteCount,
      filteredWorksiteCount,
      isEditing,
      isViewing,
      searchWorksites,
      showingTable,
      showPhotoMap,
      showingPhotoMap,
      showFeed,
      showingFeed,
      selectedChat,
      showingMap,
      mapLoading,
      showMap,
      showTable,
      route,
      router,
      worksite,
      worksiteId,
      worksiteQuery,
      jumpToCase,
      showHistory,
      showFlags,
      selectCase,
      showingDetails,
      showMobileMap,
      onUpdateQuery,
      onUpdateFilters,
      loadCase,
      workTypesClaimedByOrganization,
      printWorksite,
      shareWorksite,
      printSelectedWorksites,
      downloadWorksites,
      onSelectionChanged,
      selectedTableItems,
      loading,
      collapsedForm,
      collapsedUtilityBar,
      goToIncidentCenter,
      goToInteractive,
      toggleMapType,
      reloadCase,
      availableWorkTypes,
      applyLocation,
      applyTeamGeoJson,
      zoomIn,
      zoomOut,
      filterSvi,
      filterDates,
      sviSliderValue,
      dateSliderValue,
      toggleHeatMap,
      showUpdateStatusModal,
      showUnclaimModal,
      reloadTable,
      filters,
      filterQuery,
      mostRecentlySavedWorksite,
      reloadMap,
      updateUserState,
      unreadChatCount,
      unreadUrgentChatCount,
      unreadNewsCount,
      currentSearch,
      mobileSearch,
      numeral,
      moment,
      dateSliderFrom,
      dateSliderTo,
      focusNewsTab,
      handleSelectedExisting,
      handleWorksiteSave,
      handleWorksiteNavigation,
      overDueFilterLabel,
      queryFilterLabel,
      getOrganizationName,
      clearQuery,
      mq,
      showingSearchModal,
      caseImages,
      photoMap,
      portal,
      currentUserLocation,
      can: $can,
      updateFilterLabels,
      filterLabels,
      currentIncident,
      userLocations,
      toggleUserLocations,
    };
  },
});
</script>

<style lang="postcss">
.work-page {
  &__action {
    &-content {
      @apply right-20 sm:right-12 h-auto;
      width: 35vw;

      &--caller {
        @apply h-full;
      }
      &--dialer {
        @apply h-full;
      }
      &--chat {
      }
      &--news {
        height: 60vh;
        width: 50vw;
      }
      &--history {
        @apply h-full;
        width: 50vw;
      }
      &--stats {
      }
      &--leaderboard {
        height: 60vh;
        width: 50vw;
      }
      &--reset {
        @apply h-full;
      }
    }
  }
}

@media screen and (max-width: theme('screens.sm')) {
  .work-page {
    &__action {
      &-content {
        width: 80vw;

        &--caller {
        }
        &--dialer {
        }
        &--chat {
        }
        &--news {
        }
        &--history {
        }
        &--stats {
        }
        &--leaderboard {
        }
        &--reset {
        }
      }
    }
  }
}
</style>
<style lang="postcss" scoped>
.collapsedForm.work-page {
  grid-template-columns: minmax(0, auto);
}

.collapsedForm.work-page .work-page__form {
  display: none;
}
.work-page {
  @apply grid flex-grow h-full;
  grid-template-columns: minmax(0, auto) minmax(auto, 400px);

  &__actions {
    @apply absolute top-0 right-0 flex flex-col select-text z-toolbar;
  }

  &__action {
    @apply shadow
   w-20
   h-20
   sm:w-12
   sm:h-12
   my-2
   sm:my-1
   bg-white
   cursor-pointer
   z-50;
  }

  /* Container for map */
  &__main {
    @apply flex flex-col;

    &-header {
      @apply flex items-center;
    }

    &-content {
      @apply flex-grow;

      &--map {
        @apply relative h-full select-none;
      }

      &--table {
        @apply p-2 h-full shadow;
      }
    }
  }

  /* Container for case form */
  &__form {
    @apply flex flex-col;

    &-header {
      @apply h-12 border flex items-center justify-start;
    }

    &-toggler {
      @apply flex items-center justify-between px-2;
    }

    &-body {
      @apply flex-grow relative h-full flex flex-col md:flex-row;
    }
  }
}

/* Mobile styles */
@media screen and (max-width: theme('screens.sm')) {
  .work-page {
    @apply flex flex-col;

    &__main {
      @apply h-1/2;
    }

    &__form {
      @apply h-1/2;

      &-header {
        @apply h-16 border flex items-center justify-start;
      }
    }
  }
}
</style>
