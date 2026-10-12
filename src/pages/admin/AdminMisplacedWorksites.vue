<template>
  <section class="m-3 flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-crisiscleanup-grey-700">
        {{
          $t(
            '~~Worksites created in the last 90 days that sit inside a different incident area.',
          )
        }}
      </p>
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

    <div v-if="loading" class="flex justify-center p-6">
      <spinner />
    </div>
    <div
      v-else-if="rows.length === 0"
      class="border border-crisiscleanup-grey-100 bg-white p-6 text-center"
    >
      {{ $t('~~No misplaced worksites.') }}
    </div>

    <template v-else-if="selected">
      <div
        class="flex flex-col gap-3 border border-crisiscleanup-grey-100 bg-white p-3"
        data-testid="testMisplacedReview"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <a
              class="font-semibold text-primary-dark underline"
              :href="selected.url"
              target="_blank"
              rel="noopener"
            >
              {{ $t('~~Worksite') }} {{ selected.worksite_id }}
            </a>
            <span class="ml-2 text-crisiscleanup-grey-700">
              {{ [selected.city, selected.state].filter(Boolean).join(', ') }}
            </span>
          </div>
          <div class="flex gap-2">
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
          </div>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div class="mb-1 text-sm">
              <span class="font-semibold">{{ $t('~~Current') }}:</span>
              {{ selected.current_incident_name }}
              ({{ selected.current_incident_id }})
            </div>
            <MisplacedWorksiteMap
              :incident-id="selected.current_incident_id"
              :latitude="selected.latitude"
              :longitude="selected.longitude"
            />
          </div>
          <div>
            <div class="mb-1 text-sm">
              <span class="font-semibold">{{ $t('~~Proposed') }}:</span>
              {{ selected.move_to_this_incident }}
              ({{ selected.incident_id_contained }})
            </div>
            <MisplacedWorksiteMap
              :incident-id="selected.incident_id_contained"
              :latitude="selected.latitude"
              :longitude="selected.longitude"
            />
          </div>
        </div>
      </div>

      <div
        class="overflow-x-auto border border-crisiscleanup-grey-100 bg-white"
      >
        <table
          class="w-full text-left text-xs"
          data-testid="testMisplacedTable"
        >
          <thead>
            <tr class="border-b">
              <th
                v-for="column in columns"
                :key="column"
                class="whitespace-nowrap p-2 font-semibold"
              >
                {{ column }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.worksite_id"
              class="cursor-pointer border-b hover:bg-crisiscleanup-light-grey"
              :class="{
                'bg-crisiscleanup-light-grey':
                  row.worksite_id === selected.worksite_id,
              }"
              @click="selectedId = row.worksite_id"
            >
              <td
                v-for="column in columns"
                :key="column"
                class="whitespace-nowrap p-2"
              >
                <a
                  v-if="column === 'url'"
                  class="text-primary-dark underline"
                  :href="row.url"
                  target="_blank"
                  rel="noopener"
                  @click.stop
                >
                  {{ row.url }}
                </a>
                <template v-else>{{ row[column] }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
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

// Every column of the "Worksites that need to be moved" report.
const columns = [
  'current_incident_id',
  'created_ago',
  'worksite_id',
  'city',
  'state',
  'current_incident_name',
  'time_after_incident',
  'url',
  'incident_id_contained',
  'move_to_this_incident',
  'time_after_contained_incident',
  'user_name',
  'user_email',
  'user_mobile',
  'organization',
] as const;

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
  const index = rows.value.indexOf(row);
  rows.value = rows.value.filter((r) => r !== row);
  selectedId.value =
    rows.value[Math.min(index, rows.value.length - 1)]?.worksite_id;
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
