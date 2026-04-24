<template>
  <section class="m-3 flex flex-col gap-3">
    <div
      class="flex flex-col gap-3 border border-crisiscleanup-grey-100 bg-white p-3"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
        <BaseInput
          v-model="filters.search"
          class="w-full lg:w-80"
          :top-label="$t('~~Search')"
          :placeholder="$t('~~Search calls')"
          data-testid="testAdminPhoneHistorySearchInput"
        />
        <BaseInput
          v-model="filters.created_at__gte"
          class="w-full lg:w-56"
          type="date"
          :top-label="$t('~~Started after')"
          data-testid="testAdminPhoneHistoryStartDateInput"
        />
        <BaseInput
          v-model="filters.created_at__lte"
          class="w-full lg:w-56"
          type="date"
          :top-label="$t('~~Started before')"
          data-testid="testAdminPhoneHistoryEndDateInput"
        />
        <BaseButton
          class="w-full lg:w-auto"
          variant="outline"
          size="small"
          :action="refresh"
          :text="$t('actions.refresh')"
          :alt="$t('actions.refresh')"
          data-testid="testAdminPhoneHistoryRefreshButton"
        />
      </div>
    </div>

    <AjaxTable
      :key="tableKey"
      ref="tableRef"
      class="border border-crisiscleanup-grey-100 bg-white p-2"
      table-id="admin-phone-history"
      :url="tableUrl"
      :columns="columns"
      :query="tableQuery"
      :page-size="50"
      :body-style="{ height: 'max-content' }"
      @error="onTableError"
    >
      <template #created_at="{ item }">
        <span :title="item.created_at">{{ formatDate(item.created_at) }}</span>
      </template>
      <template #end_at="{ item }">
        <span :title="item.end_at">{{ formatDate(item.end_at) }}</span>
      </template>
      <template #direction="{ item }">
        <span>{{ formatDirection(item) }}</span>
      </template>
      <template #dnis="{ item }">
        <span>{{ formatPhone(item) }}</span>
      </template>
      <template #user="{ item }">
        <div class="min-w-0">
          <div>{{ formatUserName(item) }}</div>
          <a
            v-if="formatUserEmail(item)"
            class="block truncate text-[12px] text-primary-dark underline underline-offset-2"
            :href="`mailto:${formatUserEmail(item)}`"
            @click.stop
          >
            {{ formatUserEmail(item) }}
          </a>
        </div>
      </template>
      <template #incident="{ item }">
        <span>{{ formatIncident(item) }}</span>
      </template>
      <template #status="{ item }">
        <span>{{ formatStatus(item) }}</span>
      </template>
      <template #notes="{ item }">
        <span class="whitespace-pre-line">{{
          item.notes || item.status_notes
        }}</span>
      </template>
      <template #session_id="{ item }">
        <code class="break-all text-[12px]">{{ item.session_id }}</code>
      </template>
      <template #recording="{ item }">
        <div class="min-w-0">
          <BaseButton
            v-if="hasRecording(item) && !recordingUrls[item.id]"
            variant="outline"
            size="small"
            :action="() => loadRecording(item)"
            :text="
              recordingLoading[item.id]
                ? $t('~~Loading')
                : $t('~~Play recording')
            "
            :alt="$t('~~Play recording')"
            :disabled="recordingLoading[item.id]"
            :show-spinner="recordingLoading[item.id]"
            :selector="`testAdminPhoneHistoryRecordingButton_${item.id}`"
          />
          <audio
            v-if="recordingUrls[item.id]"
            controls
            preload="none"
            class="w-full min-w-48"
            :src="recordingUrls[item.id]"
            :data-testid="`testAdminPhoneHistoryRecordingAudio_${item.id}`"
            @error="onAudioError(item.id)"
          />
          <div
            v-else-if="recordingErrors[item.id]"
            class="flex items-center gap-2 text-[12px] text-crisiscleanup-red-900"
            :data-testid="`testAdminPhoneHistoryRecordingError_${item.id}`"
          >
            <span>{{ $t('~~Recording unavailable') }}</span>
            <button
              type="button"
              class="underline"
              @click.stop="loadRecording(item)"
            >
              {{ $t('actions.retry') }}
            </button>
          </div>
        </div>
      </template>
    </AjaxTable>
  </section>
</template>

<script setup lang="ts">
import axios from 'axios';
import AjaxTable from '@/components/AjaxTable.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';
import { formatNationalNumber } from '@/filters';
import { makeTableColumns } from '@/utils/table';
import moment from '@/utils/dates';

interface PhoneHistoryRecord {
  id: string | number;
  created_at?: string;
  end_at?: string;
  inbound?: unknown;
  outbound?: unknown;
  direction?: string;
  dnis?: string | number;
  phone_number?: string;
  caller_phone?: string;
  user?: string | number;
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  incident?: string | number;
  incident_name?: string;
  status?: string | number;
  status_text?: string;
  notes?: string;
  status_notes?: string;
  session_id?: string;
  has_recording?: boolean;
  recording?: boolean | string;
  recording_url?: string;
}

const tableUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/phone/history`;
const tableRef = ref<InstanceType<typeof AjaxTable> | null>(null);
const filters = reactive({
  search: '',
  created_at__gte: '',
  created_at__lte: '',
});
const recordingUrls = reactive<Record<string | number, string>>({});
const recordingLoading = reactive<Record<string | number, boolean>>({});
const recordingErrors = reactive<Record<string | number, boolean>>({});

const columns = makeTableColumns([
  ['created_at', '0.8fr', '~~Started', { sortable: true }],
  ['end_at', '0.8fr', '~~Ended', { sortable: true }],
  ['direction', '0.55fr', '~~Direction'],
  ['dnis', '0.8fr', '~~Caller phone', { sortable: true }],
  ['user', '0.85fr', '~~Agent', { sortable: true }],
  ['incident', '0.85fr', '~~Incident'],
  ['status', '0.7fr', '~~Status'],
  ['notes', '1fr', '~~Notes'],
  ['session_id', '1fr', '~~Session ID', { sortable: true }],
  ['recording', '1fr', '~~Recording'],
]);

const tableQuery = computed(() => {
  const query: Record<string, string | number> = {
    sort: '-created_at',
    limit: 50,
  };

  if (filters.search) query.search = filters.search;
  if (filters.created_at__gte) {
    query.created_at__gte = filters.created_at__gte;
  }
  if (filters.created_at__lte) {
    query.created_at__lte = filters.created_at__lte;
  }

  return query;
});

const tableKey = computed(() => JSON.stringify(tableQuery.value));

function refresh() {
  const instance = tableRef.value as unknown as {
    getData?: () => Promise<void>;
  } | null;
  instance?.getData?.();
}

function onTableError() {
  // AjaxTable owns the error event; keep the page stable if the backend rejects.
}

function formatDate(value?: string) {
  if (!value) return '';
  return moment(value).format('MMM D, YYYY h:mm A');
}

function formatDirection(item: PhoneHistoryRecord) {
  if (item.direction) return item.direction;
  if (item.inbound) return 'Inbound';
  if (item.outbound) return 'Outbound';
  return '';
}

function formatPhone(item: PhoneHistoryRecord) {
  const raw = item.phone_number || item.caller_phone || '';
  return raw ? formatNationalNumber(raw) : '';
}

function formatUserName(item: PhoneHistoryRecord) {
  return [item.user_first_name, item.user_last_name].filter(Boolean).join(' ');
}

function formatUserEmail(item: PhoneHistoryRecord) {
  return item.user_email || '';
}

function formatIncident(item: PhoneHistoryRecord) {
  return item.incident_name || '';
}

function formatStatus(item: PhoneHistoryRecord) {
  return item.status_text || '';
}

function hasRecording(item: PhoneHistoryRecord) {
  return Boolean(item.has_recording || item.recording || item.recording_url);
}

async function loadRecording(item: PhoneHistoryRecord) {
  recordingLoading[item.id] = true;
  recordingErrors[item.id] = false;
  delete recordingUrls[item.id];

  try {
    const response = await axios.get(`${tableUrl}/${item.id}`);
    const url = response.data?.recording_url;
    if (!url) {
      recordingErrors[item.id] = true;
      return;
    }
    recordingUrls[item.id] = url;
  } catch {
    recordingErrors[item.id] = true;
  } finally {
    recordingLoading[item.id] = false;
  }
}

function onAudioError(id: string | number) {
  delete recordingUrls[id];
  recordingErrors[id] = true;
}
</script>
