<template>
  <div
    class="flex flex-col gap-4 bg-crisiscleanup-smoke p-3"
    data-testid="testAdminVoiceReviews"
  >
    <section
      class="rounded-lg border border-crisiscleanup-grey-100 bg-white p-4"
    >
      <!-- An old link with a review id: find its call, then go there. -->
      <Spinner v-if="selectedId" />

      <div v-else class="text-sm">
        <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
          <label
            class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
          >
            {{ t('~~Show') }}
            <select
              v-model="view"
              class="mt-1 rounded border p-1.5 max-md:min-h-[40px] text-sm normal-case text-black"
              data-testid="testVoiceReviewFilter"
            >
              <option value="open">{{ t('~~Calls with open issues') }}</option>
              <option value="all">{{ t('~~All reviewed calls') }}</option>
              <option value="failed">{{ t('~~Failed reviews') }}</option>
            </select>
          </label>
          <label
            class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
          >
            {{ t('~~Issue type') }}
            <select
              v-model="kindFilter"
              class="mt-1 rounded border p-1.5 max-md:min-h-[40px] text-sm normal-case text-black"
              data-testid="testVoiceReviewKindFilter"
            >
              <option value="">{{ t('~~All issue types') }}</option>
              <option
                v-for="(label, key) in KIND_LABELS"
                :key="key"
                :value="key"
              >
                {{ t(label) }}
              </option>
            </select>
          </label>

          <router-link
            :to="{ name: 'nav.voice_console', query: { view: 'metrics' } }"
            class="inline-flex min-h-[40px] items-center font-semibold underline"
            data-testid="testVoiceReviewMetricsLink"
          >
            {{ t('~~Overall metrics') }} →
          </router-link>

          <VoiceAutoFix @done="refresh" />

          <form
            class="flex flex-wrap items-end gap-2"
            data-testid="testVoiceReviewBackfill"
            @submit.prevent
          >
            <label
              class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
            >
              {{ t('~~Review earlier calls since') }}
              <input
                v-model="since"
                type="date"
                class="mt-1 rounded border p-1 max-md:min-h-[40px] text-sm normal-case text-black"
                data-testid="testVoiceReviewSince"
                @change="pendingCount = undefined"
              />
            </label>
            <label class="flex items-center gap-1 pb-1">
              <input
                v-model="includeReviewed"
                type="checkbox"
                data-testid="testVoiceReviewForce"
                @change="pendingCount = undefined"
              />
              {{ t('~~Include calls already reviewed') }}
            </label>
            <BaseButton
              class="max-md:!min-h-[40px]"
              variant="outline"
              size="small"
              data-testid="testVoiceReviewCheck"
              :action="() => backfill(true)"
              :text="t('~~Count calls')"
              :alt="t('~~Count calls')"
            />
            <BaseButton
              v-if="pendingCount"
              class="max-md:!min-h-[40px]"
              variant="solid"
              size="small"
              data-testid="testVoiceReviewQueue"
              :action="() => backfill(false)"
              :text="t('~~Review {n} calls', { n: pendingCount })"
              :alt="t('~~Review {n} calls', { n: pendingCount })"
            />
            <span
              v-else-if="pendingCount === 0"
              data-testid="testVoiceReviewNothing"
            >
              {{ t('~~No calls need a review.') }}
            </span>
            <BaseButton
              class="max-md:!min-h-[40px]"
              variant="outline"
              size="small"
              :action="refresh"
              :text="t('actions.refresh', 'Refresh')"
              :alt="t('actions.refresh', 'Refresh')"
            />
          </form>
        </div>

        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p
            class="text-crisiscleanup-dark-300"
            data-testid="testVoiceReviewCount"
            :data-count="total"
          >
            {{ t('~~{n} calls', { n: total }) }}
          </p>
          <BaseButton
            v-if="bulkIds.length > 0"
            class="max-md:!min-h-[40px]"
            variant="solid"
            size="small"
            data-testid="testVoiceReviewBulkCreate"
            :action="createMissedCases"
            :text="t('~~Create {n} cases', { n: bulkIds.length })"
            :alt="t('~~Create {n} cases', { n: bulkIds.length })"
          />
        </div>
        <div
          v-if="bulkResults.length > 0"
          class="mb-3 rounded border border-crisiscleanup-grey-100 p-3"
          data-testid="testVoiceReviewBulkResults"
        >
          <div
            v-for="result in bulkResults"
            :key="result.id"
            class="mb-1"
            :data-status="result.status"
          >
            <template v-if="result.status === 'created'">
              {{ t('~~Created case') }}
              <a
                :href="
                  router.resolve(
                    `/incident/${result.incident_id}/work/${result.worksite_id}/edit`,
                  ).href
                "
                target="_blank"
                rel="noopener"
                class="underline"
              >
                {{ result.case_number }} ↗
              </a>
            </template>
            <template v-else-if="result.status === 'duplicate'">
              {{ t('~~Not created: possible duplicate of') }}
              <a
                v-for="match in result.duplicates"
                :key="match.id"
                :href="router.resolve(duplicateUrl(match)).href"
                target="_blank"
                rel="noopener"
                class="mr-2 underline"
              >
                {{ match.case_number }} ({{ match.name }}) ↗
              </a>
            </template>
            <template v-else>
              {{ t('~~Not created:') }} {{ result.error }}
            </template>
          </div>
        </div>
        <!-- A new key per filter: back to page 1 and one request. -->
        <AjaxTable
          :key="`${JSON.stringify(query)}-${tableVersion}`"
          :url="voiceReviewUrl()"
          :query="query"
          :columns="columns"
          :page-size="50"
          :body-style="{ height: '60vh' }"
          table-id="voiceReviews"
          data-testid="testVoiceReviewTable"
          enable-selection
          @data-fetched="(count: number) => (total = count)"
          @update:items="(items: VoiceReview[]) => (pageItems = items)"
          @selection-changed="(ids: Set<number>) => (selectedIds = ids)"
          @row-click="openReview"
        >
          <template #when="{ item }">
            {{ formatWhen(item.session.ended_at ?? item.reviewed_at) }}
          </template>
          <template #case="{ item }">
            {{ caseNumbers(item) || t('~~No case') }}
          </template>
          <template #issues="{ item }">
            <span
              v-for="issueKind in openKinds(item)"
              :key="issueKind"
              class="mb-1 mr-1 inline-block rounded bg-crisiscleanup-yellow-100 px-1.5 text-xs"
            >
              {{ t(KIND_LABELS[issueKind] ?? issueKind) }}
            </span>
            <span
              v-if="hasPossibleDuplicate(item)"
              class="mb-1 mr-1 inline-block rounded bg-crisiscleanup-chat-blue px-1.5 text-xs text-crisiscleanup-dashboard-blue"
              data-testid="testVoiceReviewDuplicatePill"
            >
              {{ t('~~Possible duplicate') }}
            </span>
            <span v-if="item.status === 'failed'" class="text-xs">
              {{ t('~~Review failed') }}
            </span>
          </template>
          <template #summary="{ item }">
            <span class="text-crisiscleanup-dark-300">
              {{ item.summary || item.error }}
            </span>
          </template>
        </AjaxTable>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { useToast } from 'vue-toastification';
import AjaxTable from '@/components/AjaxTable.vue';
import useEmitter from '@/hooks/useEmitter';
import { makeTableColumns } from '@/utils/table';
import VoiceAutoFix from '@/components/admin/voice/VoiceAutoFix.vue';
import { callRoute } from '@/hooks/voice/voiceSessions';
import {
  KIND_LABELS,
  duplicateUrl,
  openMissedCase,
  possibleDuplicates,
  reviewCases,
  voiceReviewUrl,
  type MissedCaseResult,
  type VoiceReview,
} from '@/hooks/voice/voiceReviews';
import useDialogs from '@/hooks/useDialogs';
import { getErrorMessage } from '@/utils/errors';
import moment from '@/utils/dates';

const { t } = useI18n();
const $toasted = useToast();

const { emitter } = useEmitter();
const { confirm: confirmDialog } = useDialogs();
const route = useRoute();
const router = useRouter();
// The page's rows and the checked rows, for bulk case creation.
const pageItems = ref<VoiceReview[]>([]);
const selectedIds = ref(new Set<number>());
const bulkResults = ref<(MissedCaseResult & { id: number })[]>([]);
// A new value remounts the table: reload, page one, no checked rows.
const tableVersion = ref(0);
const total = ref(0);
type View = 'open' | 'all' | 'failed';
const view = ref<View>('open');
// An issue kind (see KIND_LABELS), or '' for every kind.
const kindFilter = ref('');
// A review id in the URL (/admin/voice_reviews/<id>) is an old link.
const selectedId = computed(() => Number(route.params.reviewId) || undefined);
const since = ref(moment().subtract(7, 'day').format('YYYY-MM-DD'));
const pendingCount = ref<number>();
// Review again calls that have a review (the API's force option). Open
// issues are replaced; fixed and dismissed ones stay.
const includeReviewed = ref(false);

// The API lists open issues by default; an empty correction_status asks
// for fixed and dismissed issues too.
const FILTER_PARAMS: Record<View, Record<string, string>> = {
  open: { correction_status: 'open' },
  all: { correction_status: '' },
  failed: { status: 'failed', correction_status: '' },
};

// AjaxTable adds offset and limit, and loads again when this changes.
const query = computed(() => ({
  ...FILTER_PARAMS[view.value as View],
  ...(kindFilter.value ? { kind: kindFilter.value } : {}),
}));

const columns = makeTableColumns([
  ['when', '10rem', t('~~When')],
  ['case', '8rem', t('~~Case')],
  ['issues', '1fr', t('~~Open issues')],
  ['summary', '2fr', t('~~Summary')],
]);

function refresh() {
  emitter.emit('refreshTable-voiceReviews');
}

// Back from a call page, where issues may have been fixed: load the list again.
let shownBefore = false;
onActivated(() => {
  if (shownBefore) refresh();
  shownBefore = true;
});

function openReview(review: VoiceReview) {
  void router.push(callRoute(review.session.id, 'review'));
}

// The call page replaces the old review page; an old link goes on to it.
watch(
  selectedId,
  async (id?: number) => {
    if (!id) return;
    try {
      const { data } = await axios.get<VoiceReview>(voiceReviewUrl(String(id)));
      await router.replace(callRoute(data.session.id, 'review'));
    } catch (error) {
      $toasted.error(getErrorMessage(error));
      await router.replace({ name: 'nav.voice_reviews' });
    }
  },
  { immediate: true },
);

function caseNumbers(review: VoiceReview) {
  return reviewCases(review)
    .map((item) => item.case_number)
    .join(', ');
}

function hasPossibleDuplicate(review: VoiceReview) {
  const missed = openMissedCase(review);
  return Boolean(missed && possibleDuplicates(missed).length > 0);
}

// The open missed-case issues of the checked calls that have no case.
const bulkIds = computed(() =>
  pageItems.value
    .filter((review: VoiceReview) => selectedIds.value.has(review.id))
    .map((review: VoiceReview) => openMissedCase(review)?.id)
    .filter((id: number | undefined): id is number => typeof id === 'number'),
);

async function createMissedCases() {
  const ids = bulkIds.value;
  const answer = await confirmDialog({
    title: t('~~Create cases'),
    content: t(
      '~~Create {n} cases from these calls? Each survivor gets the usual text message. Possible duplicates are not created.',
      { n: ids.length },
    ),
    actions: {
      no: { text: t('actions.cancel'), type: 'outline' },
      yes: { text: t('~~Create cases'), type: 'solid' },
    },
  });
  if (answer !== 'yes') return;
  try {
    const { data } = await axios.post<{
      results: Record<string, MissedCaseResult>;
    }>(voiceReviewUrl('create_missed_cases'), { correction_ids: ids });
    bulkResults.value = Object.entries(data.results).map(([id, result]) => ({
      id: Number(id),
      ...result,
    }));
    tableVersion.value += 1;
    selectedIds.value = new Set();
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

function openKinds(review: VoiceReview) {
  return [
    ...new Set(
      review.corrections.filter((c) => c.status === 'open').map((c) => c.kind),
    ),
  ];
}

function formatWhen(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
}

async function backfill(dryRun: boolean) {
  try {
    const { data } = await axios.post<{ count: number }>(
      voiceReviewUrl('backfill'),
      { since: since.value, dry_run: dryRun, force: includeReviewed.value },
    );
    if (dryRun) {
      pendingCount.value = data.count;
      return;
    }
    pendingCount.value = undefined;
    $toasted.success(
      t('~~Queued {n} calls. Reviews show here when they finish.', {
        n: data.count,
      }),
    );
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}
</script>
