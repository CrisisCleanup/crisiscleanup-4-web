<template>
  <div
    class="flex flex-col gap-4 bg-crisiscleanup-smoke p-3"
    data-testid="testAdminVoiceReviews"
  >
    <section
      class="rounded-lg border border-crisiscleanup-grey-100 bg-white p-4"
    >
      <VoiceReviewDetail
        v-if="selectedId"
        :review-id="selectedId"
        @back="closeReview"
      />

      <div v-else class="text-sm">
        <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
          <label
            class="flex flex-col text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
          >
            {{ t('~~Show') }}
            <select
              v-model="view"
              class="mt-1 rounded border p-1.5 text-sm normal-case text-black"
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
              class="mt-1 rounded border p-1.5 text-sm normal-case text-black"
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
                class="mt-1 rounded border p-1 text-sm normal-case text-black"
                data-testid="testVoiceReviewSince"
                @change="pendingCount = undefined"
              />
            </label>
            <BaseButton
              variant="outline"
              size="small"
              data-testid="testVoiceReviewCheck"
              :action="() => backfill(true)"
              :text="t('~~Count calls')"
              :alt="t('~~Count calls')"
            />
            <BaseButton
              v-if="pendingCount"
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
              variant="outline"
              size="small"
              :action="load"
              :text="t('actions.refresh', 'Refresh')"
              :alt="t('actions.refresh', 'Refresh')"
            />
          </form>
        </div>

        <Spinner v-if="loading" />
        <PaneEmpty
          v-else-if="reviews.length === 0"
          :title="t('~~Nothing to review')"
          :description="t('~~Calls show here after the reviewer checks them.')"
        />
        <table v-else class="w-full">
          <thead
            class="text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-crisiscleanup-grey-900"
          >
            <tr>
              <th class="py-1">{{ t('~~When') }}</th>
              <th>{{ t('~~Case') }}</th>
              <th>{{ t('~~Open issues') }}</th>
              <th>{{ t('~~Summary') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="review in reviews"
              :key="review.id"
              class="cursor-pointer border-b border-crisiscleanup-grey-100 align-top hover:bg-crisiscleanup-grey-100/40"
              data-testid="testVoiceReviewRow"
              @click="selectedId = review.id"
            >
              <td class="whitespace-nowrap py-1.5 pr-3">
                {{ formatWhen(review.session.ended_at ?? review.reviewed_at) }}
              </td>
              <td class="pr-3">
                {{ review.worksite?.case_number ?? t('~~No case') }}
              </td>
              <td class="pr-3">
                <span
                  v-for="kind in openKinds(review)"
                  :key="kind"
                  class="mb-1 mr-1 inline-block rounded bg-crisiscleanup-yellow-100 px-1.5 text-xs"
                >
                  {{ t(KIND_LABELS[kind] ?? kind) }}
                </span>
                <span v-if="review.status === 'failed'" class="text-xs">
                  {{ t('~~Review failed') }}
                </span>
              </td>
              <td class="text-crisiscleanup-dark-300">
                {{ review.summary || review.error }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { useToast } from 'vue-toastification';
import PaneEmpty from '@/components/phone/foundation/PaneEmpty.vue';
import VoiceReviewDetail from '@/components/admin/voice/VoiceReviewDetail.vue';
import {
  KIND_LABELS,
  voiceReviewUrl,
  type VoiceReview,
} from '@/hooks/voice/voiceReviews';
import { getErrorMessage } from '@/utils/errors';
import moment from '@/utils/dates';

const { t } = useI18n();
const $toasted = useToast();

const reviews = ref<VoiceReview[]>([]);
const loading = ref(false);
type View = 'open' | 'all' | 'failed';
const view = ref<View>('open');
// An issue kind (see KIND_LABELS), or '' for every kind.
const kindFilter = ref('');
const selectedId = ref<number>();
const since = ref(moment().subtract(7, 'day').format('YYYY-MM-DD'));
const pendingCount = ref<number>();

// The API lists open issues by default; an empty correction_status asks
// for fixed and dismissed issues too.
const FILTER_PARAMS: Record<View, Record<string, string>> = {
  open: { correction_status: 'open' },
  all: { correction_status: '' },
  failed: { status: 'failed', correction_status: '' },
};

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

async function load() {
  loading.value = true;
  try {
    const { data } = await axios.get<{ reviews: VoiceReview[] }>(
      voiceReviewUrl(),
      {
        params: {
          ...FILTER_PARAMS[view.value as View],
          ...(kindFilter.value ? { kind: kindFilter.value } : {}),
        },
      },
    );
    reviews.value = data.reviews;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    loading.value = false;
  }
}

async function backfill(dryRun: boolean) {
  try {
    const { data } = await axios.post<{ count: number }>(
      voiceReviewUrl('backfill'),
      { since: since.value, dry_run: dryRun },
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

async function closeReview() {
  selectedId.value = undefined;
  await load();
}

onMounted(load);
// One request per filter change, whatever events the select fires.
watch([view, kindFilter], load);
</script>
