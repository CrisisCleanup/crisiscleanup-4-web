<template>
  <div>
    <tabs>
      <tab :name="urls.callHistory.name">
        <div>
          <AjaxTable
            :url="urls.callHistory.url"
            :columns="urls.callHistory.columns"
            :body-style="{ height: '16rem' }"
            :enable-pagination="false"
            @row-click="onRowClick"
          />
        </div>
      </tab>
      <tab :name="urls.inboundHistory.name">
        <div>
          <AjaxTable
            :url="urls.inboundHistory.url"
            :columns="urls.inboundHistory.columns"
            :body-style="{ height: '16rem' }"
            :enable-pagination="false"
            @row-click="onRowClick"
          />
        </div>
      </tab>
      <tab :name="urls.outboundHistory.name">
        <div>
          <AjaxTable
            :url="urls.outboundHistory.url"
            :columns="urls.outboundHistory.columns"
            :body-style="{ height: '16rem' }"
            :enable-pagination="false"
            @row-click="onRowClick"
          />
        </div>
      </tab>
      <tab :name="urls.ringCentralHistory.name">
        <div>
          <AjaxTable
            :url="urls.ringCentralHistory.url"
            :columns="urls.ringCentralHistory.columns"
            :body-style="{ height: '16rem' }"
            :enable-pagination="false"
            @row-click="onRowClick"
          />
        </div>
      </tab>
    </tabs>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import { get } from 'lodash';
import type PhoneOutbound from '@/models/PhoneOutbound';
import { hash } from '@/utils/promise';
import AjaxTable from '@/components/AjaxTable.vue';
import JsonWrapper from '@/components/JsonWrapper.vue';
import useDialogs from '@/hooks/useDialogs';
import { makeTableColumns } from '@/utils/table';
import PhoneStatus from '@/models/PhoneStatus';

export default {
  name: 'AgentHistory',
  components: { AjaxTable },
  props: {
    agentId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { component } = useDialogs();

    const urls = {
      callHistory: {
        name: t('agentHistory.status_history'),
        url: `${import.meta.env.VITE_APP_API_BASE_URL}/phone_agents/${
          props.agentId
        }/status_history`,
        columns: makeTableColumns([
          ['phone_number', '1fr', t('agentHistory.phone_number')],
          [
            'status',
            '1fr',
            t('agentHistory.status'),
            {
              transformer: (_: string, item) =>
                get(
                  PhoneStatus.find(item.status),
                  'substatus_name_t',
                  'Unknown',
                ),
            },
          ],
          ['notes', '2fr', t('agentHistory.notes')],
          ['created_at', '1fr', t('agentHistory.created_at')],
        ]),
      },
      inboundHistory: {
        name: t('agentHistory.inbound_history'),
        url: `${import.meta.env.VITE_APP_API_BASE_URL}/phone_agents/${
          props.agentId
        }/inbound_history`,
        columns: makeTableColumns([
          ['ani', '1fr', t('agentHistory.ani')],
          ['dnis', '1fr', t('agentHistory.dnis')],
          ['call_at', '1fr', t('agentHistory.call_at')],
        ]),
      },
      outboundHistory: {
        name: 'Outbound History',
        url: `${import.meta.env.VITE_APP_API_BASE_URL}/phone_agents/${
          props.agentId
        }/outbound_history`,
        columns: makeTableColumns([
          ['phone_number', '1fr', t('agentHistory.phone_number')],
          [
            'latest_status',
            '1fr',
            t('agentHistory.latest_status'),
            {
              transformer: (_: string, item: PhoneOutbound) =>
                get(
                  PhoneStatus.find(item.latest_status),
                  'substatus_name_t',
                  'Unknown',
                ),
            },
          ],
          ['completion', '1fr', t('agentHistory.completion')],
          ['updated_at', '1fr', t('agentHistory.updated_at')],
        ]),
      },
      ringCentralHistory: {
        name: 'RingCentral History',
        url: `${import.meta.env.VITE_APP_API_BASE_URL}/phone_agents/${
          props.agentId
        }/ringcentral_history`,
        columns: makeTableColumns([
          ['agent_id', '1fr', t('agentHistory.agent_id')],
          ['username', '1fr', t('agentHistory.username')],
          ['agent_phone', '1fr', t('agentHistory.agent_phone')],
          ['event_type', '1fr', t('agentHistory.event_type')],
          ['prev_state', '1fr', t('agentHistory.prev_state')],
          ['call_state', '1fr', t('agentHistory.call_state')],
          ['created_at', '1fr', t('agentHistory.created_at')],
        ]),
      },
    };

    const onRowClick = async (item) => {
      await component({
        title: t('agentHistory.item_detail'),
        component: JsonWrapper,
        classes: 'w-full h-96',
        props: {
          jsonData: item,
        } as any,
      });
    };

    return {
      urls,
      onRowClick,
    };
  },
};
</script>
