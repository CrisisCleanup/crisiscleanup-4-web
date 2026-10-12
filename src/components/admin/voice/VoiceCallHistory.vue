<template>
  <div class="voice-list text-sm" data-testid="testVoiceCallHistory">
    <VoiceHistoryStrip ref="strip" :include-test="includeTest" />
    <div class="mb-3 grid grid-cols-2 items-end gap-3 md:flex md:flex-wrap">
      <label
        class="col-span-2 flex min-w-[10rem] flex-1 flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
      >
        {{ t('~~Search') }}
        <input
          v-model="search"
          type="search"
          class="mt-1 min-h-[40px] rounded border p-1.5 text-sm normal-case text-black"
          :placeholder="t('~~Call, case or incident')"
          data-testid="testVoiceHistorySearch"
        />
      </label>
      <label
        class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
      >
        {{ t('~~Outcome') }}
        <select
          v-model="status"
          class="mt-1 min-h-[40px] rounded border p-1.5 text-sm normal-case text-black"
          data-testid="testVoiceHistoryStatus"
        >
          <option value="">{{ t('~~Any outcome') }}</option>
          <option
            v-for="(label, key) in SESSION_STATUSES"
            :key="key"
            :value="key"
          >
            {{ t(label) }}
          </option>
        </select>
      </label>
      <label
        class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
      >
        {{ t('~~Case') }}
        <select
          v-model="hasCase"
          class="mt-1 min-h-[40px] rounded border p-1.5 text-sm normal-case text-black"
          data-testid="testVoiceHistoryHasCase"
        >
          <option value="">{{ t('~~With or without') }}</option>
          <option value="true">{{ t('~~With a case') }}</option>
          <option value="false">{{ t('~~Without a case') }}</option>
        </select>
      </label>
      <label
        class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
      >
        {{ t('~~Flag') }}
        <select
          v-model="flag"
          class="mt-1 min-h-[40px] rounded border p-1.5 text-sm normal-case text-black"
          data-testid="testVoiceHistoryFlag"
        >
          <option value="">{{ t('~~Any flag') }}</option>
          <option v-for="(item, key) in FLAGS" :key="key" :value="key">
            {{ t(item.label) }}
          </option>
        </select>
      </label>
      <label
        class="col-span-2 flex min-h-[40px] items-center gap-2 md:col-span-1"
      >
        <input
          v-model="includeTest"
          type="checkbox"
          data-testid="testVoiceHistoryIncludeTest"
        />
        {{ t('~~Include test calls') }}
      </label>
      <BaseButton
        variant="outline"
        size="small"
        class="col-span-2 max-md:!min-h-[40px] md:col-span-1"
        :action="refresh"
        :text="t('actions.refresh', 'Refresh')"
        :alt="t('actions.refresh', 'Refresh')"
      />
    </div>
    <p
      class="mb-2 text-crisiscleanup-dark-300"
      data-testid="testVoiceHistoryCount"
      :data-count="total"
    >
      {{ t('~~{n} calls', { n: total }) }}
    </p>
    <!-- A new key per filter: back to page 1 and one request. -->
    <AjaxTable
      :key="JSON.stringify(query)"
      :url="sessionsUrl()"
      :query="query"
      :columns="columns"
      :page-size="100"
      :body-style="{ maxHeight: '60vh', minHeight: '8rem' }"
      class="voice-table"
      table-id="voiceHistory"
      data-testid="testVoiceHistoryTable"
      @data-fetched="(count: number) => (total = count)"
      @row-click="
        (row: SessionRow) => router.push(callRoute(row.id, undefined, 'calls'))
      "
    >
      <template #created_at="{ item }">
        <span class="flex flex-wrap items-center gap-x-2">
          <span class="font-semibold md:font-normal">{{
            formatWhen(item.created_at)
          }}</span>
          <span v-if="item.is_test" class="text-xs text-crisiscleanup-dark-300">
            {{ t('voiceConsole.test', 'test') }}
          </span>
        </span>
      </template>
      <template #status="{ item }">
        <span :class="outcomeClass(item.status)">{{
          outcomeLabel(item, t)
        }}</span>
      </template>
      <template #cases="{ item }">
        <span v-if="mq.mdMinus" class="mr-2 font-semibold"
          >{{ t('~~Case') }}:</span
        >
        <VoiceCaseLinks :session="item" />
      </template>
      <template #flags="{ item }">
        <VoiceFlagPills :flags="item.flags ?? []" />
      </template>
      <template #open_issues="{ item }">
        <span v-if="mq.mdMinus" class="mr-2 font-semibold"
          >{{ t('~~Open issues') }}:</span
        >
        <router-link
          v-if="item.review_id && item.open_issues > 0"
          :to="callRoute(item.id, 'review', 'calls')"
          class="rounded bg-crisiscleanup-yellow-100 px-1.5 text-xs underline max-md:inline-flex max-md:min-h-[40px] max-md:items-center"
          data-testid="testVoiceHistoryIssues"
          @click.stop
        >
          {{ t('~~{n} open', { n: item.open_issues }) }}
        </router-link>
        <span v-else-if="item.review_id" class="text-crisiscleanup-dark-300">
          {{ t('~~None') }}
        </span>
        <span v-else class="text-crisiscleanup-dark-300">—</span>
      </template>
      <template #duration_seconds="{ item }">
        <span v-if="mq.mdMinus" class="mr-2 font-semibold"
          >{{ t('~~Length') }}:</span
        >
        <span class="tabular-nums">
          {{
            item.duration_seconds === null
              ? '—'
              : formatClock(item.duration_seconds)
          }}
        </span>
      </template>
      <template #estimated_cost_usd="{ item }">
        <span v-if="mq.mdMinus" class="mr-2 font-semibold"
          >{{ t('~~Est. model cost') }}:</span
        >
        <span class="tabular-nums">
          {{ costLabel(item, t) }}
        </span>
      </template>
    </AjaxTable>
  </div>
</template>

<script setup lang="ts">
import { useMq } from 'vue3-mq';
import AjaxTable from '@/components/AjaxTable.vue';
import { makeTableColumns } from '@/utils/table';
import { formatClock } from '@/hooks/voice/voiceConsoleState';
import {
  FLAGS,
  SESSION_STATUSES,
  callRoute,
  costLabel,
  formatWhen,
  outcomeClass,
  outcomeLabel,
  sessionsUrl,
  type SessionRow,
} from '@/hooks/voice/voiceSessions';
import useEmitter from '@/hooks/useEmitter';
import VoiceCaseLinks from './VoiceCaseLinks.vue';
import VoiceFlagPills from './VoiceFlagPills.vue';
import VoiceHistoryStrip from './VoiceHistoryStrip.vue';

const { t } = useI18n();
const mq = useMq();
const router = useRouter();
const { emitter } = useEmitter();

const total = ref(0);

const search = ref('');
const status = ref('');
const hasCase = ref('');
const flag = ref('');
// Test calls are off, like the metrics, so the list adds up to the numbers.
const includeTest = ref(false);
const searchText = refDebounced(search, 400);

// AjaxTable adds offset and limit.
const query = computed(() => ({
  ...(searchText.value.trim() ? { search: searchText.value.trim() } : {}),
  ...(status.value ? { status: status.value } : {}),
  ...(hasCase.value ? { has_case: hasCase.value } : {}),
  ...(flag.value ? { flag: flag.value } : {}),
  include_test: String(includeTest.value),
}));

const columns = makeTableColumns([
  ['created_at', '9.5rem', t('voiceConsole.when', 'When')],
  ['status', '8rem', t('voiceConsole.outcome', 'Outcome')],
  ['cases', '9rem', t('voiceConsole.case', 'Case')],
  ['flags', '1fr', t('~~Flags')],
  ['open_issues', '6rem', t('~~Open issues')],
  ['duration_seconds', '5rem', t('voiceConsole.length', 'Length')],
  ['estimated_cost_usd', '6.5rem', t('~~Est. model cost')],
]);

const strip = ref<InstanceType<typeof VoiceHistoryStrip>>();

function refresh() {
  emitter.emit('refreshTable-voiceHistory');
  void strip.value?.load();
}

// Back from a call page, where issues may have been fixed: load the list again.
let shownBefore = false;
onActivated(() => {
  if (shownBefore) refresh();
  shownBefore = true;
});
</script>
