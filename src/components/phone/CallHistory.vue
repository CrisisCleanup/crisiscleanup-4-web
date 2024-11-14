<template>
  <TitledCard :title="$t('phoneDashboard.last_10_calls')">
    <div class="card-container overflow-auto h-full">
      <AgentStats />
      <AjaxTable
        :url="callHistoryUrl"
        :body-style="{ overflow: 'auto', ...tableBodyStyle }"
        :columns="historyCols"
        enable-search
        :query="{ sort: '-created_at', user: currentUser.id }"
        data-testid="testAgentHistoryTable"
        @row-click="
          (item) => {
            if ($mq === 'sm') $emit('rowClick', item);
          }
        "
      >
        <template #incident="{ item }">
          <div
            class="sm:justify-center flex flex-grow"
            data-testid="testIncidentdiv"
            :title="
              getIncident(item.incident) && getIncident(item.incident)?.name
            "
          >
            <DisasterIcon
              v-if="
                getIncident(item.incident) &&
                getIncident(item.incident)?.incident_type
              "
              :current-incident="getIncident(item.incident)"
            />
            <div class="block sm:hidden flex items-center ml-2 text-lg">
              {{ toStartCase(getIncident(item.incident)?.incident_type) }}
            </div>
          </div>
        </template>
        <template #phone_number="{ item }">
          <div
            class="inline-flex items-center"
            @click="$emit('rowClick', item)"
          >
            <ccu-icon
              type="phone-classic"
              size="sm"
              data-testid="testPhoneClassicicon"
              :alt="$t('phoneDashboard.last_10_calls')"
            />
            <base-text class="pl-1">
              {{ formatNationalNumber(item.phone_number) }}
            </base-text>
          </div>
        </template>
        <template #created_at="slotProps">
          <div
            :title="slotProps.item.created_at"
            class="flex items-center gap-2"
          >
            {{ momentFromNow(slotProps.item.created_at) }}
            <BasilPhoneInOutline v-if="Boolean(slotProps.item.inbound)" />
            <BasilPhoneOutOutline v-else />
          </div>
        </template>
        <template #status_text="slotProps">
          <span v-if="slotProps.item.status_text">{{
            $t(`phoneStatus.${slotProps.item.status_text}`)
          }}</span>
        </template>
      </AjaxTable>
    </div>
  </TitledCard>
</template>

<script lang="ts">
// import Color from 'color';
import TitledCard from '../cards/TitledCard.vue';
import DisasterIcon from '../DisasterIcon.vue';
import { formatNationalNumber, momentFromNow } from '../../filters/index';
import Table from '../Table.vue';
import AgentStats from './AgentStats.vue';
import AjaxTable from '@/components/AjaxTable.vue';
import Incident from '@/models/Incident';
import BasilPhoneOutOutline from '~icons/basil/phone-out-outline';
import BasilPhoneInOutline from '~icons/basil/phone-in-outline';
import { useCurrentUser } from '@/hooks';
export default defineComponent({
  name: 'CallHistory',
  components: {
    AjaxTable,
    Table,
    AgentStats,
    TitledCard,
    DisasterIcon,
    BasilPhoneOutOutline,
    BasilPhoneInOutline,
  },
  props: {
    calls: {
      type: Array,
      default: null,
    },
    tableBodyStyle: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  setup() {
    const { t } = useI18n();
    const { currentUser } = useCurrentUser();
    const callHistoryUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/phone/history`;
    const historyCols = [
      {
        title: 'phoneDashboard.incident',
        dataIndex: 'incident',
        key: 'incident',
        width: '.4fr',
        headerClass: 'justify-center',
      },
      {
        title: 'phoneDashboard.phone_number',
        dataIndex: 'phone_number',
        key: 'phone_number',
        width: '1fr',
      },
      {
        title: 'phoneDashboard.call_status',
        dataIndex: 'status_text',
        key: 'status_text',
        width: '1fr',
      },
      {
        title: 'phoneDashboard.notes',
        dataIndex: 'status_notes',
        key: 'status_notes',
        width: '1fr',
      },
      {
        title: 'phoneDashboard.started',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '.75fr',
        sortable: true,
      },
    ];

    const getIncident = (incident) => {
      return Incident.find(incident);
    };

    const toStartCase = (str) => {
      if (!str) return '';
      return str
        .replaceAll('_', ' ')
        .replaceAll(/\b\w/g, (c) => c.toUpperCase());
    };

    return {
      historyCols,
      momentFromNow,
      formatNationalNumber,
      callHistoryUrl,
      getIncident,
      toStartCase,
      currentUser,
    };
  },
});
</script>

<style lang="postcss" scoped>
.cell {
  @apply text-crisiscleanup-dark-300;
}

.svg-container svg {
  width: 26px !important;
  height: 26px !important;
}
</style>
