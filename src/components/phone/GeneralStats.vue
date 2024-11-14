<template>
  <div v-if="showingOutboundsModal" class="h-full">
    <div class="bg-white shadow p-6 rounded h-5/6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex gap-3 items-center">
          <base-button
            type="button"
            class="text-sm font-semibold text-crisiscleanup-dark-blue"
            :text="$t('actions.back')"
            :alt="$t('actions.back')"
            :icon="['fas', 'arrow-left']"
            :action="() => (showingOutboundsModal = false)"
          ></base-button>
          <h2 class="text-xl font-semibold">
            {{ $t('phoneDashboard.remaining_outbounds') }}
          </h2>
        </div>
        <base-button
          :action="() => (showingOutboundFilters = true)"
          :alt="$t('actions.filter')"
          type="button"
          ccu-icon="filters"
          icon-size="md"
        >
          {{ $t('actions.filter') }}
          <span
            v-if="filterCount > 0"
            class="rounded-full mx-1 px-1 bg-yellow-500 text-xs"
            >{{ filterCount }}</span
          >
        </base-button>
      </div>
      <AjaxTable
        :columns="columns"
        class="w-full h-full"
        :url="url"
        :query="query"
        :body-style="{ height: '100%' }"
        @row-click="handleRowClick"
      >
        <template #phone_number="slotProps">
          {{ slotProps.item.phone_number }}
          <LanguageTag
            class="tag-item mx-1"
            :language-id="slotProps.item.language"
          />
        </template>
      </AjaxTable>
    </div>
    <PhoneOutboundFilters
      v-if="showingOutboundFilters"
      :initial-filters="currentFilters"
      @close="showingOutboundFilters = false"
      @update:filters="
        (value) => {
          currentFilters = value;
        }
      "
      @update:filter-count="
        (value) => {
          filterCount = value;
        }
      "
    />
  </div>
  <div v-else class="flex flex-col items-center max-w-2xl">
    <div
      class="flex flex-col gap-3 items-center justify-center shadow border rounded w-full p-10"
    >
      {{ $t('phoneDashboard.total_people_waiting') }}

      <div class="text-center text-5xl font-light">
        {{ allUsersInQueue }}
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4 w-full mt-4">
      <div class="bg-white p-4 rounded shadow border">
        <div class="flex justify-between">
          <base-text class="text-sm font-medium"
            >{{ $t('phoneDashboard.remaining_callbacks') }}
          </base-text>
          <base-button
            type="link"
            class="underline text-sm font-semibold"
            data-testid="testShowOutboundsModalButton"
            :text="$t('actions.view_all')"
            :alt="$t('actions.view_all')"
            :action="showOutboundsModal"
          ></base-button>
        </div>
        <span class="text-lg">{{ remainingCallbacks || 0 }}</span>
      </div>
      <div class="bg-white p-4 rounded shadow border">
        <div class="flex justify-between">
          <base-text class="text-sm font-medium"
            >{{ $t('phoneDashboard.remaining_calldowns') }}
          </base-text>
          <base-button
            type="link"
            class="underline text-sm font-semibold"
            data-testid="testShowOutboundsModalButton"
            :text="$t('actions.view_all')"
            :alt="$t('actions.view_all')"
            :action="() => showOutboundsModal('calldown')"
          ></base-button>
        </div>
        <span class="text-lg">{{ remainingCalldowns || 0 }}</span>
      </div>

      <div class="flex flex-col bg-white p-4 rounded shadow border">
        <base-text class="text-sm font-medium">{{
          $t('phoneDashboard.agents_online')
        }}</base-text>
        <span class="text-2xl">{{ agentsOnline || 0 }}</span>
      </div>
      <div class="flex flex-col bg-white p-4 rounded shadow border">
        <base-text class="text-sm font-medium">{{
          $t('phoneDashboard.agents_available')
        }}</base-text>
        <span class="text-2xl">{{ agentsAvailable || 0 }}</span>
      </div>
      <!--      <div-->
      <!--        v-for="queue in statsPerQueue"-->
      <!--        :key="queue.queueId"-->
      <!--        :data-testid="`testAgentsOnlineQueue${queue.queueId}Div`"-->
      <!--        class="flex flex-col bg-white p-4 rounded shadow border"-->
      <!--      >-->
      <!--        <base-text class="text-sm font-medium"-->
      <!--          >{{ $t('phoneDashboard.total_people_waiting') }}({{-->
      <!--            $t(queue.language)-->
      <!--          }})</base-text-->
      <!--        >-->
      <!--        <span class="text-2xl">{{ queue.inQueue || 0 }}</span>-->
      <!--      </div>-->
    </div>
  </div>
</template>

<script lang="ts">
import { onBeforeMount, onMounted, ref, watch } from 'vue';
import PhoneOutbound from '@/models/PhoneOutbound';
import useEmitter from '@/hooks/useEmitter';
import useConnectFirst from '@/hooks/useConnectFirst';
import Language from '@/models/Language';
import { useWebSockets } from '@/hooks/useWebSockets';
import AjaxTable from '@/components/AjaxTable.vue';
import LanguageTag from '@/components/tags/LanguageTag.vue';
import moment from 'moment';
import { makeTableColumns } from '@/utils/table';
import Incident from '@/models/Incident';
import { formatNationalNumber } from '@/filters';
import PhoneOutboundFilters from '@/components/phone/PhoneOutboundFilters.vue';
import BaseButton from '@/components/BaseButton.vue';
import Badge from '@/components/Badge.vue';

export default defineComponent({
  name: 'GeneralStats',
  components: {
    Badge,
    BaseButton,
    PhoneOutboundFilters,
    AjaxTable,
    LanguageTag,
  },
  emits: ['onRemainingCallbacks', 'onRemainingCalldowns'],
  setup(props, context) {
    const { emitter } = useEmitter();
    const { t } = useI18n();

    const remainingCallbacks = ref(0);
    const remainingCalldowns = ref(0);
    const agentsOnline = ref(0);
    const agentsAvailable = ref(0);
    const showingOutboundsModal = ref(false);
    const showingOutboundsModalType = ref('callback');
    const showingOutboundFilters = ref(false);
    const socket = ref(null);
    const agentStats = ref(null);
    const filterCount = ref(0);

    function showOutboundsModal(type = 'callback') {
      showingOutboundsModal.value = true;
      showingOutboundsModalType.value = type;
    }

    async function updateCallbacks() {
      remainingCallbacks.value =
        await PhoneOutbound.api().getRemainingCallbackCount('');
      remainingCalldowns.value =
        await PhoneOutbound.api().getRemainingCalldownCount('');
      context.emit('onRemainingCallbacks', remainingCallbacks.value);
      context.emit('onRemainingCalldowns', remainingCalldowns.value);
    }

    onBeforeMount(() => {
      setInterval(() => {
        updateCallbacks();
      }, 60_000);

      const { socket: s } = useWebSockets(
        '/ws/phone_stats',
        'phone_stats',
        (data) => {
          agentStats.value = data;
        },
      );
      socket.value = s;
    });

    onMounted(() => {
      updateCallbacks();
    });

    const { gateStats, stats } = useConnectFirst(context);
    const availableQueues = {
      7: import.meta.env.VITE_APP_SPANISH_PHONE_GATEWAY,
      2: import.meta.env.VITE_APP_ENGLISH_PHONE_GATEWAY,
    };

    const statsPerQueue = computed(() => {
      return Object.entries(availableQueues).map(([key, value]) => {
        const statistics = gateStats.value.find(
          (element: Record<string, any>) => {
            return String(value) === String(element.queueId);
          },
        );
        if (statistics) {
          return { ...statistics, language: Language.find(key)?.name_t };
        }

        return { language: Language.find(key)?.name_t };
      });
    });

    watch(
      () => agentStats.value,
      (agents) => {
        if (agents) {
          agentsAvailable.value = agents.filter((agent) =>
            ['AVAILABLE', 'WORKING'].includes(agent.state),
          ).length;
        }
      },
    );

    watch(
      () => stats.value.active,
      () => {
        agentsOnline.value = Number(stats.value.active) || 0;
      },
    );

    const columns = ref(
      makeTableColumns([
        ['id', '0.5fr', t('phoneDashboard.id')],
        ['phone_number', '1.5fr', t('phoneDashboard.phone_number')],
        ['number_of_inbound_calls', '0.5fr', t('phoneDashboard.calls')],
        [
          'location',
          '1fr',
          t('phoneDashboard.location'),
          {
            transformer: (_: string, item: PhoneOutbound) =>
              `${item.location_name || ''} ${item.state_name}`,
          },
        ],
        [
          'incident_id',
          '1fr',
          t('phoneDashboard.incident'),
          {
            transformer(field: string[]) {
              const incident = Incident.find(field[0]);
              if (incident) {
                return `${incident.name}`;
              }

              return '';
            },
          },
        ],
        [
          'updated_at',
          '1fr',
          t('phoneDashboard.last_called_at'),
          {
            transformer(field: string) {
              return moment(field).fromNow();
            },
          },
        ],
      ]),
    );
    const currentFilters = ref({});

    const url = ref(`${import.meta.env.VITE_APP_API_BASE_URL}/phone_outbound`);
    const query = computed(() => {
      return {
        completion__lt: 1,
        filter_ani: 1,
        locked_at__isnull: true,
        call_type: showingOutboundsModalType.value,
        ...currentFilters.value,
      };
    });

    const handleRowClick = (payload: Record<string, any>) => {
      emitter.emit('phone_component:close');
      emitter.emit('phone_component:open', 'dialer');
      emitter.emit(
        'dialer:set_phone_number',
        formatNationalNumber(payload.phone_number),
      );
      emitter.emit('phone_outbound:click', payload);
      showingOutboundsModal.value = false;
    };

    const allUsersInQueue = computed(() => {
      return (
        (Number(stats.value.active) || 0) +
        (Number(stats.value.inQueue) || 0) +
        remainingCallbacks.value +
        remainingCalldowns.value
      );
    });

    return {
      allUsersInQueue,
      remainingCallbacks,
      remainingCalldowns,
      agentsOnline,
      agentsAvailable,
      showOutboundsModal,
      statsPerQueue,
      gateStats,
      stats,
      showingOutboundsModal,
      showingOutboundsModalType,
      columns,
      url,
      query,
      handleRowClick,
      showingOutboundFilters,
      currentFilters,
      filterCount,
    };
  },
});
</script>

<style scoped></style>
