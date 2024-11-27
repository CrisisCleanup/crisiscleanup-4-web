<template>
  <div class="p-10">
    <div v-if="loading">
      <spinner />
    </div>
    <div v-else>
      <!-- Toggle Button for Checkboxes -->
      <div class="mb-4">
        <base-button type="primary" size="md" @click="toggleCheckboxes">
          {{ showCheckboxes ? $t('~~Hide Columns') : $t('~~Show Columns') }}
        </base-button>
      </div>

      <!-- Collapsible Checkbox List -->
      <div
        v-if="showCheckboxes"
        class="grid grid-cols-3 gap-4 mb-4 border p-4 rounded"
      >
        <base-checkbox
          v-for="column in allColumns"
          :key="column.key"
          :model-value="selectedColumns.includes(column.key)"
          @update:model-value="
            ($event) => {
              if ($event) {
                selectedColumns.push(column.key);
              } else {
                selectedColumns.splice(selectedColumns.indexOf(column.key), 1);
              }
              selectedColumns = [...selectedColumns];
            }
          "
        >
          {{ $t(column.title) }}
        </base-checkbox>
      </div>

      <AjaxTable
        ref="table"
        :columns="columns"
        :url="tableUrl"
        :body-style="{ height: '40rem' }"
        :query="{
          incident: currentIncidentId,
        }"
        enable-search
        has-row-details
      >
        <template #rowDetails="slotProps">
          <div
            v-if="JSON.parse(slotProps.item.primary_contacts)?.primary_contacts"
            class="flex p-3"
            data-testid="testPrimaryContactsDiv"
          >
            <div class="mr-4">
              <base-text variant="h2">
                {{ $t('otherOrganizations.primary_contacts') }}
              </base-text>
              <div
                style="
                  display: grid;
                  grid-template-columns: max-content max-content max-content;
                  grid-column-gap: 10px;
                "
              >
                <template
                  v-for="contact in JSON.parse(slotProps.item.primary_contacts)
                    ?.primary_contacts"
                  :key="contact.email"
                >
                  <div class="my-1">
                    <strong class="font-bold"
                      >{{ contact.first_name }} {{ contact.last_name }}</strong
                    >
                    <div>{{ contact.title ? contact.title : '' }}</div>
                    <div>{{ contact.email }}</div>
                    <div>{{ contact.mobile }}</div>
                  </div>
                </template>
              </div>
            </div>
            <div>
              <base-text
                v-if="
                  JSON.parse(slotProps.item.primary_contacts)
                    ?.incident_primary_contacts
                "
                variant="h2"
              >
                {{ $t('otherOrganizations.incident_primary_contacts') }}
              </base-text>
              <div
                style="
                  display: grid;
                  grid-template-columns: max-content max-content max-content;
                  grid-column-gap: 10px;
                "
              >
                <template
                  v-for="contact in JSON.parse(slotProps.item.primary_contacts)
                    ?.incident_primary_contacts"
                  :key="contact.email"
                >
                  <div class="my-1">
                    <strong class="font-bold"
                      >{{ contact.first_name }} {{ contact.last_name }}</strong
                    >
                    <div>{{ contact.title ? contact.title : '' }}</div>
                    <div>{{ contact.email }}</div>
                    <div>{{ contact.mobile }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </template>

        <template #url="slotProps">
          <base-button
            class="text-primary-dark underline sm:ml-0 ml-1"
            :icon-classes="$mq === 'sm' ? 'fa-2x' : 'fa-lg'"
            icon="globe"
            :alt="$t('profileOrg.url')"
            :style="slotProps.item.url === '' ? 'opacity: .5' : ''"
            :action="
              () => {
                if (slotProps.item.url != '') {
                  open(slotProps.item.url, `_blank`);
                }
              }
            "
          />
          <a
            v-if="$mq === 'sm'"
            class="text-primary-dark underline ml-2"
            :href="slotProps.item.url"
            >{{ slotProps.item.url }}</a
          >
        </template>
        <template #facebook="slotProps">
          <img
            src="@/assets/facebook.svg"
            class="sm:ml-1 sm:w-16 w-12"
            :style="slotProps.item.facebook === '' ? 'opacity: .5' : ''"
            :alt="$t('profileOrg.facebook')"
            @click="
              () => {
                if (slotProps.item.facebook != '')
                  open(slotProps.item.facebook, `_blank`);
              }
            "
          />
          <a
            v-if="$mq === 'sm'"
            class="text-primary-dark underline ml-1"
            :href="slotProps.item.facebook"
            >{{ slotProps.item.facebook }}</a
          >
        </template>
        <template #twitter="slotProps">
          <img
            src="@/assets/twitter.svg"
            class="sm:w-6 w-10 sm:ml-0 ml-1"
            :style="slotProps.item.twitter === '' ? 'opacity: .5' : ''"
            :alt="$t('profileOrg.twitter')"
            @click="
              () => {
                if (slotProps.item.twitter != '')
                  open(slotProps.item.twitter, `_blank`);
              }
            "
          />
          <a
            v-if="$mq === 'sm'"
            class="text-primary-dark underline ml-2"
            :href="slotProps.item.twitter"
            >{{ slotProps.item.twitter }}</a
          >
        </template>
        <template #type_t="slotProps">
          <base-text>{{ $t(slotProps.item.type_t) }}</base-text>
        </template>
        <template #case_overdue_count="slotProps">
          <base-button
            class="text-primary-dark underline"
            data-testid="testOverdueCountButton"
            :alt="slotProps.item.overdue_count || 0"
            :action="
              () => {
                $router.push(
                  `/incident/${currentIncidentId}/work?showTable=true&work_type__claimed_by=${
                    slotProps.item.organization_id
                  }&work_type__status__in=${getOpenStatuses()}&created_at__lte=${getCreatedAtLteFilter()}`,
                );
              }
            "
          >
            {{ slotProps.item.case_overdue_count || 0 }}
          </base-button>
        </template>
        <template #primary_location_id="slotProps">
          <base-button
            size="small"
            icon="map"
            :action="() => showLocation(slotProps.item.primary_location_id)"
          >
          </base-button>
        </template>
      </AjaxTable>
    </div>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import AjaxTable from '@/components/AjaxTable.vue';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import BaseButton from '@/components/BaseButton.vue';
import { useCurrentIncident } from '@/hooks';
import Spinner from '@/components/Spinner.vue';
import moment from 'moment';
import enums from '../store/modules/enums';
import useDialogs from '@/hooks/useDialogs';
import DisplayLocation from '@/components/DisplayLocation.vue';

export default {
  name: 'OtherOrganizations',
  components: { Spinner, BaseCheckbox, AjaxTable, BaseButton },
  setup() {
    const COLUMN_WIDTH_DICT = {
      name: '1.5fr',
      facebook: '50px',
      twitter: '50px',
      url: '50px',
      type_t: 'minmax(200px, 1fr)',
      role_t: 'minmax(200px, 1fr)',
      incident_count: 'minmax(50px, 1fr)',
      case_reported_count: 'minmax(50px, 1fr)',
      case_claimed_count: 'minmax(50px, 1fr)',
      case_closed_count: 'minmax(50px, 1fr)',
      case_overdue_count: 'minmax(50px, 1fr)',
    };

    const SORTABLE_COLUMNS = new Set([
      'name',
      'incident_count',
      'case_reported_count',
      'case_claimed_count',
      'case_closed_count',
      'case_overdue_count',
    ]);

    const organizations = reactive({
      data: [],
      meta: {
        pagination: {
          pageSize: 50,
          page: 1,
          current: 1,
        },
      },
      search: '',
    });

    const allColumns = ref([]);
    const selectedColumns = ref([
      'name',
      'url',
      'facebook',
      'twitter',
      'type_t',
      'role_t',
      'incident_count',
      'case_reported_count',
      'case_claimed_count',
      'case_closed_count',
      'case_overdue_count',
    ]);
    const columns = ref([]);
    const loading = ref(false);
    const showCheckboxes = ref(false);
    const metadataUrl = '/other_organizations/metadata';
    const tableUrl = '/other_organizations';

    const { currentIncidentId } = useCurrentIncident();
    const { component } = useDialogs();

    const getColumnWidth = (key) => {
      return COLUMN_WIDTH_DICT[key] || 'minmax(50px, 1fr)';
    };

    const fetchMetadata = async () => {
      try {
        loading.value = true;
        const response = await axios.get(metadataUrl);
        const metadata = response.data.columns;

        allColumns.value = Object.entries(metadata).map(([key, comment]) => ({
          title: comment,
          dataIndex: key,
          key,
          width: getColumnWidth(key),
          sortable: SORTABLE_COLUMNS.has(key),
        }));

        updateColumns();
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      } finally {
        loading.value = false;
      }
    };

    const updateColumns = () => {
      columns.value = allColumns.value.filter((column) =>
        selectedColumns.value.includes(column.key),
      );
    };

    const toggleCheckboxes = () => {
      showCheckboxes.value = !showCheckboxes.value;
    };

    const showLocation = async (locationId) => {
      await component({
        title: 'Location',
        component: DisplayLocation,
        props: {
          location: locationId,
        },
        classes: 'w-full h-120 overflow-auto p-3',
        modalClasses: 'bg-white max-w-3xl shadow',
      });
    };

    const getCreatedAtLteFilter = () => moment().subtract(6, 'd').toISOString();
    function getOpenStatuses() {
      enums.state.statuses.filter((status) => status.primary_state === 'open');
      const openStatuses = enums.state.statuses.filter(
        (status) => status.primary_state === 'open',
      );
      return openStatuses.map((status) => status.status).join(',');
    }
    watch(selectedColumns, updateColumns);

    onMounted(async () => {
      await fetchMetadata();
    });

    return {
      organizations,
      columns,
      loading,
      tableUrl,
      currentIncidentId,
      selectedColumns,
      allColumns,
      updateColumns,
      showCheckboxes,
      toggleCheckboxes,
      getCreatedAtLteFilter,
      getOpenStatuses,
      showLocation,
    };
  },
};
</script>

<style lang="postcss" scoped></style>
