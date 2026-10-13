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
          <div class="flex flex-wrap items-center gap-2">
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
              :worksite-id="selected.worksite_id"
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
              :worksite-id="selected.worksite_id"
              :latitude="selected.latitude"
              :longitude="selected.longitude"
            />
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-1 gap-3 border border-crisiscleanup-grey-100 bg-white p-3 text-sm sm:grid-cols-2 xl:grid-cols-4"
        data-testid="testMisplacedDetails"
      >
        <div v-for="group in details" :key="group.title">
          <div class="mb-1 font-semibold">{{ group.title }}</div>
          <dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
            <template v-for="item in group.items" :key="item.label">
              <dt class="text-crisiscleanup-grey-700">{{ item.label }}</dt>
              <dd class="min-w-0 break-words">
                <a
                  v-if="item.href && item.value"
                  class="text-primary-dark underline"
                  :href="item.href"
                  :target="item.href.startsWith('http') ? '_blank' : undefined"
                  rel="noopener"
                >
                  {{ item.value }}
                </a>
                <template v-else>{{ item.value || '—' }}</template>
              </dd>
            </template>
          </dl>
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

function step(offset: number) {
  selectedId.value = rows.value[index.value + offset]?.worksite_id;
}

/** Every column of the "Worksites that need to be moved" report, grouped. */
const details = computed(() => {
  const row = selected.value;
  if (!row) return [];
  return [
    {
      title: t('~~Worksite'),
      items: [
        { label: t('~~ID'), value: row.worksite_id, href: row.url },
        { label: t('~~Link'), value: row.url, href: row.url },
        { label: t('~~City'), value: row.city },
        { label: t('~~State'), value: row.state },
        {
          label: t('~~Created'),
          value: t('~~{time} ago', { time: row.created_ago }),
        },
      ],
    },
    {
      title: t('~~Current incident'),
      items: [
        { label: t('~~Name'), value: row.current_incident_name },
        { label: t('~~ID'), value: row.current_incident_id },
        { label: t('~~Created after start'), value: row.time_after_incident },
      ],
    },
    {
      title: t('~~Proposed incident'),
      items: [
        { label: t('~~Name'), value: row.move_to_this_incident },
        { label: t('~~ID'), value: row.incident_id_contained },
        {
          label: t('~~Created after start'),
          value: row.time_after_contained_incident,
        },
      ],
    },
    {
      title: t('~~Created by'),
      items: [
        { label: t('~~Name'), value: row.user_name },
        {
          label: t('~~Email'),
          value: row.user_email,
          href: row.user_email ? `mailto:${row.user_email}` : undefined,
        },
        {
          label: t('~~Mobile'),
          value: row.user_mobile,
          href: row.user_mobile ? `tel:${row.user_mobile}` : undefined,
        },
        { label: t('~~Organization'), value: row.organization },
      ],
    },
  ] as {
    title: string;
    items: { label: string; value: unknown; href?: string }[];
  }[];
});

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
