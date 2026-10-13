<template>
  <section
    class="flex min-h-full flex-col gap-4 bg-[#f4f4f2] p-4 text-crisiscleanup-dark-500"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-crisiscleanup-grey-700">
        {{
          $t(
            '~~Worksites created in the last 90 days that sit inside a different incident area.',
          )
        }}
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <template v-if="selected">
          <BaseButton
            variant="text"
            size="small"
            icon="chevron-left"
            :action="() => step(-1)"
            :disabled="busy || index === 0"
            :alt="$t('actions.previous')"
            data-testid="testMisplacedPreviousButton"
          />
          <span class="text-sm" data-testid="testMisplacedPosition">
            {{ index + 1 }} / {{ rows.length }}
          </span>
          <BaseButton
            variant="text"
            size="small"
            icon="chevron-right"
            :action="() => step(1)"
            :disabled="busy || index === rows.length - 1"
            :alt="$t('actions.next')"
            data-testid="testMisplacedNextButton"
          />
          <BaseButton
            variant="outline"
            size="medium"
            class="px-6"
            :action="ignore"
            :disabled="busy"
            :text="$t('~~Ignore')"
            :alt="$t('~~Ignore')"
            data-testid="testMisplacedIgnoreButton"
          />
          <BaseButton
            variant="solid"
            size="medium"
            class="px-6"
            :action="move"
            :disabled="busy"
            :text="$t('~~Move')"
            :alt="$t('~~Move')"
            data-testid="testMisplacedMoveButton"
          />
        </template>
        <BaseButton
          variant="outline"
          size="small"
          :action="() => load(true)"
          :disabled="loading"
          :text="$t('actions.refresh')"
          :alt="$t('actions.refresh')"
          data-testid="testMisplacedRefreshButton"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center p-6">
      <spinner />
    </div>
    <div
      v-else-if="rows.length === 0"
      class="rounded-lg border border-crisiscleanup-grey-100 bg-white p-6 text-center"
    >
      {{ $t('~~No misplaced worksites.') }}
    </div>

    <template v-else-if="selected">
      <article
        class="overflow-hidden rounded-lg border border-crisiscleanup-grey-100 bg-white"
        data-testid="testMisplacedReview"
      >
        <header
          class="flex flex-wrap items-center justify-between gap-3 border-b border-crisiscleanup-grey-100 px-5 py-4"
        >
          <div class="flex items-baseline gap-3">
            <a
              class="text-2xl font-bold text-[#2d5f55] underline underline-offset-4"
              :href="selected.url"
              target="_blank"
              rel="noopener"
              data-testid="testMisplacedWorksiteLink"
            >
              #{{ selected.worksite_id }}
            </a>
            <span class="font-semibold">{{ place(selected) }}</span>
          </div>
          <span
            class="flex items-center gap-1 text-sm text-crisiscleanup-grey-700"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {{ $t('~~Created {time} ago', { time: selected.created_ago }) }}
          </span>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_16rem]">
          <div class="flex flex-col gap-4 p-5">
            <h2
              class="text-xs font-semibold uppercase tracking-wider text-crisiscleanup-grey-700"
            >
              {{ $t('~~Incident match') }}
            </h2>
            <div
              class="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]"
            >
              <div
                class="rounded-lg border border-[#ecd3a6] bg-[#fdf3e3] p-4"
                data-testid="testMisplacedCurrentIncident"
              >
                <div
                  class="text-[11px] font-semibold uppercase tracking-wider text-[#8a5a17]"
                >
                  {{ $t('~~Currently entered in') }}
                </div>
                <div class="mt-2 text-lg font-bold">
                  {{ selected.current_incident_name }}
                </div>
                <div class="font-mono text-xs text-crisiscleanup-grey-700">
                  {{ $t('~~Incident') }} {{ selected.current_incident_id }}
                </div>
                <div class="mt-4">
                  <span class="text-xl font-bold text-[#a8691b]">
                    {{ daysLabel(currentDays) }}
                  </span>
                  <span class="ml-1 text-sm">
                    {{ $t('~~after incident start') }}
                  </span>
                </div>
              </div>
              <div
                class="hidden text-2xl text-crisiscleanup-grey-700 md:block"
                aria-hidden="true"
              >
                →
              </div>
              <div
                class="rounded-lg border border-[#a9cfc6] bg-[#e6f1ee] p-4"
                data-testid="testMisplacedProposedIncident"
              >
                <div
                  class="text-[11px] font-semibold uppercase tracking-wider text-[#2d5f55]"
                >
                  {{ $t('~~Worksite located inside') }}
                </div>
                <div class="mt-2 text-lg font-bold">
                  {{ selected.move_to_this_incident }}
                </div>
                <div class="font-mono text-xs text-crisiscleanup-grey-700">
                  {{ $t('~~Incident') }} {{ selected.incident_id_contained }}
                </div>
                <div class="mt-4">
                  <span class="text-xl font-bold text-[#2d5f55]">
                    {{ daysLabel(proposedDays) }}
                  </span>
                  <span class="ml-1 text-sm">
                    {{ $t('~~after incident start') }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2 text-xs">
              <div class="text-crisiscleanup-grey-700">
                {{ $t('~~Time between incident start and case creation') }}
              </div>
              <div
                v-for="bar in bars"
                :key="bar.name"
                class="grid grid-cols-[7rem_1fr_3rem] items-center gap-3"
              >
                <span class="truncate" :title="bar.name">{{ bar.name }}</span>
                <span class="h-2 rounded-full bg-crisiscleanup-grey-100">
                  <span
                    class="block h-2 min-w-[0.5rem] rounded-full"
                    :style="{ width: `${bar.percent}%`, background: bar.color }"
                  />
                </span>
                <span class="text-right font-mono">{{ bar.days }} d</span>
              </div>
            </div>
          </div>

          <aside
            class="flex flex-col gap-3 border-t border-crisiscleanup-grey-100 bg-crisiscleanup-light-grey p-5 text-sm lg:border-l lg:border-t-0"
            data-testid="testMisplacedCreatedBy"
          >
            <h2
              class="text-xs font-semibold uppercase tracking-wider text-crisiscleanup-grey-700"
            >
              {{ $t('~~Created by') }}
            </h2>
            <div class="flex items-center gap-3">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1f2a2e] font-semibold text-white"
                aria-hidden="true"
              >
                {{ initials(selected.user_name) }}
              </span>
              <div class="min-w-0">
                <div class="font-semibold">{{ selected.user_name || '—' }}</div>
                <div class="text-crisiscleanup-grey-700">
                  {{ selected.organization || '—' }}
                </div>
              </div>
            </div>
            <a
              v-if="selected.user_email"
              class="flex items-center gap-2 break-all text-crisiscleanup-grey-700 hover:underline"
              :href="`mailto:${selected.user_email}`"
            >
              <svg
                class="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              {{ selected.user_email }}
            </a>
            <a
              v-if="selected.user_mobile"
              class="flex items-center gap-2 text-crisiscleanup-grey-700 hover:underline"
              :href="`tel:${selected.user_mobile}`"
            >
              <svg
                class="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"
                />
              </svg>
              {{ selected.user_mobile }}
            </a>
          </aside>
        </div>

        <div
          class="grid grid-cols-1 gap-4 border-t border-crisiscleanup-grey-100 p-5 md:grid-cols-2"
        >
          <div>
            <div class="mb-1 text-sm">
              <span class="font-semibold">{{ $t('~~Current') }}:</span>
              {{ selected.current_incident_name }}
            </div>
            <MisplacedWorksiteMap
              :incident-id="selected.current_incident_id"
              :worksite-id="selected.worksite_id"
              :latitude="selected.latitude"
              :longitude="selected.longitude"
            />
          </div>
          <div>
            <div class="mb-1 text-sm">
              <span class="font-semibold">{{ $t('~~Proposed') }}:</span>
              {{ selected.move_to_this_incident }}
            </div>
            <MisplacedWorksiteMap
              :incident-id="selected.incident_id_contained"
              :worksite-id="selected.worksite_id"
              :latitude="selected.latitude"
              :longitude="selected.longitude"
            />
          </div>
        </div>
      </article>

      <div class="flex flex-col gap-2">
        <h2 class="font-bold">
          {{ $t('~~All flagged worksites by this user') }}
          <span class="font-normal text-crisiscleanup-grey-700">
            ({{ sameUser.length }})
          </span>
        </h2>
        <div
          class="overflow-x-auto rounded-lg border border-crisiscleanup-grey-100 bg-white"
        >
          <table
            class="w-full text-left text-sm"
            data-testid="testMisplacedUserTable"
          >
            <thead class="bg-crisiscleanup-light-grey text-xs">
              <tr>
                <th class="p-3 font-semibold">{{ $t('~~Worksite') }}</th>
                <th class="p-3 font-semibold">{{ $t('~~Location') }}</th>
                <th class="p-3 font-semibold">{{ $t('~~Created') }}</th>
                <th class="p-3 font-semibold">
                  {{ $t('~~Current incident') }}
                </th>
                <th class="p-3 font-semibold">
                  {{ $t('~~Suggested incident') }}
                </th>
                <th class="p-3 font-semibold">{{ $t('~~Entered by') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in sameUser"
                :key="row.worksite_id"
                class="cursor-pointer border-t border-crisiscleanup-grey-100 hover:bg-crisiscleanup-light-grey"
                :class="{
                  'bg-crisiscleanup-light-grey':
                    row.worksite_id === selected.worksite_id,
                }"
                @click="selectedId = row.worksite_id"
              >
                <td class="p-3">
                  <span class="font-semibold underline">
                    {{ row.worksite_id }}
                  </span>
                </td>
                <td class="p-3">{{ place(row) }}</td>
                <td class="whitespace-nowrap p-3">
                  {{ $t('~~{time} ago', { time: row.created_ago }) }}
                </td>
                <td class="p-3">
                  {{ row.current_incident_name }}
                  <span class="text-crisiscleanup-grey-700">
                    #{{ row.current_incident_id }}
                  </span>
                  <div class="text-xs font-semibold text-[#a8691b]">
                    +{{ daysLabel(days(row.time_after_incident)) }}
                  </div>
                </td>
                <td class="p-3">
                  {{ row.move_to_this_incident }}
                  <span class="text-crisiscleanup-grey-700">
                    #{{ row.incident_id_contained }}
                  </span>
                  <div class="text-xs font-semibold text-[#2d5f55]">
                    +{{ daysLabel(days(row.time_after_contained_incident)) }}
                  </div>
                </td>
                <td class="p-3">
                  {{ row.user_name || '—' }}
                  <div class="text-xs text-crisiscleanup-grey-700">
                    {{ row.organization }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import MisplacedWorksiteMap from '@/components/admin/MisplacedWorksiteMap.vue';
import {
  fetchMisplacedWorksites,
  ignoreMisplacedWorksite,
  misplacedCount,
  moveMisplacedWorksite,
  type MisplacedWorksite,
} from '@/hooks/useMisplacedWorksites';
import { getErrorMessage } from '@/utils/errors';

const { t } = useI18n();
const $toasted = useToast();
const rows = ref<MisplacedWorksite[]>([]);
const selectedId = ref<number>();
const loading = ref(false);
const busy = ref(false);

const selected = computed(
  () =>
    rows.value.find((row) => row.worksite_id === selectedId.value) ??
    rows.value[0],
);
const index = computed(() =>
  selected.value ? rows.value.indexOf(selected.value) : 0,
);

/** Whole days in a PostgreSQL interval such as "797 days" or "1 day 02:00:00". */
function days(interval: string) {
  return Number(/^(-?\d+) days?/.exec(interval)?.[1] ?? 0);
}

function daysLabel(count: number) {
  return t(count === 1 ? '~~{count} day' : '~~{count} days', { count });
}

function place(row: MisplacedWorksite) {
  return [row.city, row.state].filter(Boolean).join(', ');
}

function initials(name: string | null) {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

const currentDays = computed(() =>
  days(selected.value?.time_after_incident ?? ''),
);
const proposedDays = computed(() =>
  days(selected.value?.time_after_contained_incident ?? ''),
);
const bars = computed(() => {
  const longest = Math.max(currentDays.value, proposedDays.value, 1);
  return [
    {
      name: selected.value?.current_incident_name ?? '',
      days: currentDays.value,
      color: '#c08a2e',
    },
    {
      name: selected.value?.move_to_this_incident ?? '',
      days: proposedDays.value,
      color: '#2d5f55',
    },
  ].map((bar) => ({ ...bar, percent: (bar.days / longest) * 100 }));
});

/** The misplaced worksites created by the same user, to find repeat mistakes. */
const sameUser = computed(() => {
  const row = selected.value;
  if (!row) return [];
  const key = row.user_email ?? row.user_name;
  if (!key) return [row];
  return rows.value.filter(
    (other) => (other.user_email ?? other.user_name) === key,
  );
});

function step(offset: number) {
  selectedId.value = rows.value[index.value + offset]?.worksite_id;
}

async function load(refresh = false) {
  loading.value = true;
  try {
    rows.value = await fetchMisplacedWorksites(refresh);
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    loading.value = false;
  }
}

/** Drop the handled row and show the next one. */
function done(row: MisplacedWorksite) {
  const position = rows.value.indexOf(row);
  rows.value = rows.value.filter((r) => r !== row);
  selectedId.value =
    rows.value[Math.min(position, rows.value.length - 1)]?.worksite_id;
  misplacedCount.value = rows.value.length;
}

async function act(run: (row: MisplacedWorksite) => Promise<void>) {
  const row = selected.value;
  if (!row) return;
  busy.value = true;
  try {
    await run(row);
    done(row);
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    busy.value = false;
  }
}

const ignore = () => act((row) => ignoreMisplacedWorksite(row.worksite_id));
const move = () =>
  act((row) =>
    moveMisplacedWorksite(row.worksite_id, row.incident_id_contained),
  );

onMounted(() => load());
</script>
