<script setup lang="ts">
import { useToast } from 'vue-toastification';
import BaseInput from '@/components/BaseInput.vue';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import WatchedUsersSelect from './WatchedUsersSelect.vue';
import type {
  AttentionList,
  AttentionListBoosts,
  AttentionListLimits,
  AttentionListRecencyDays,
} from '@/hooks/useRAG';

const props = defineProps<{
  attentionList: AttentionList | undefined;
  fieldErrors: Readonly<Record<string, string>>;
  isUpdating: boolean;
}>();

const emit = defineEmits<{
  (e: 'save', patch: Partial<AttentionList>): void;
}>();

const { t } = useI18n();
const toast = useToast();

const draft = ref<AttentionList>({});

const reset = (source: AttentionList | undefined): void => {
  draft.value = {
    watchedUserIds: [...(source?.watchedUserIds ?? [])],
    includePublicBlog: source?.includePublicBlog ?? true,
    includeMagazines: source?.includeMagazines ?? false,
    includeCmsItems: source?.includeCmsItems ?? true,
    cmsTags: [...(source?.cmsTags ?? ['blog', 'faq'])],
    limits: { ...source?.limits } as AttentionListLimits,
    boosts: { ...source?.boosts } as AttentionListBoosts,
    recencyDays: { ...source?.recencyDays } as AttentionListRecencyDays,
  };
};

watch(
  () => props.attentionList,
  (next: AttentionList | undefined) => reset(next),
  { immediate: true, deep: true },
);

const cmsTagsInput = computed({
  get: () => draft.value.cmsTags?.join(', ') ?? '',
  set: (v: string) => {
    draft.value.cmsTags = v
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  },
});

const errFor = (path: string) => props.fieldErrors[path] ?? '';

interface LimitRow {
  key: keyof AttentionListLimits;
  label: string;
  help: string;
}

const limitsKeys: LimitRow[] = [
  {
    key: 'chatPerUser',
    label: '~~Chat per watched user',
    help: '~~Cap on chat messages embedded per watched user per sync. Default 100. Total = watched-user count × this value. Must be int ≥ 1.',
  },
  {
    key: 'blogPerWatchedUser',
    label: '~~Blog per watched user',
    help: '~~Cap on blog posts per watched user per sync. Default 25. Total = watched-user count × this value. Must be int ≥ 1.',
  },
  {
    key: 'publicBlog',
    label: '~~Public blog',
    help: '~~Collection-wide cap on public blog posts per sync (not per user). Default 50. Must be int ≥ 1.',
  },
  {
    key: 'magazines',
    label: '~~Magazines',
    help: '~~Collection-wide cap on magazine PDFs per sync. Default 10. Ignored when "Include magazines" is off — disable via the toggle, not by sending 0 (rejected).',
  },
  {
    key: 'cmsPerWatchedUser',
    label: '~~CMS per watched user',
    help: '~~Cap on CMS items per watched user per sync. Default 25. Used only when "Include CMS items" is on. Must be int ≥ 1.',
  },
  {
    key: 'publicCms',
    label: '~~Public CMS',
    help: '~~Collection-wide cap on public CMS items per sync. Default 50. Used only when "Include CMS items" is on. Must be int ≥ 1.',
  },
];

interface RecencyRow {
  key: keyof AttentionListRecencyDays;
  label: string;
  help: string;
  showWhen?: () => boolean;
}

const recencyKeys: RecencyRow[] = [
  {
    key: 'watchedChat',
    label: '~~Watched chat recency',
    help: '~~Embed only chat messages newer than this many days (applies to ChatMessage.created_at). Default 365. Drop the field to restore the default — there is no "no cutoff" option.',
  },
  {
    key: 'watchedBlog',
    label: '~~Watched blog recency',
    help: '~~Embed only blog posts from watched users newer than this many days (applies to CmsItem.publish_at). Default 730.',
  },
  {
    key: 'publicBlog',
    label: '~~Public blog recency',
    help: '~~Embed only public blog posts newer than this many days (applies to CmsItem.publish_at). Default 730.',
  },
  {
    key: 'magazine',
    label: '~~Magazine recency',
    help: '~~Embed only magazines newer than this many days. Default null (no cutoff) — magazines are rare and editorial. Send an integer to enforce a window.',
  },
  {
    key: 'watchedCms',
    label: '~~Watched CMS recency',
    help: '~~Embed only watched-user CMS items newer than this many days. Default 730. Used only when "Include CMS items" is on.',
    showWhen: () => Boolean(props.attentionList?.includeCmsItems),
  },
  {
    key: 'publicCms',
    label: '~~Public CMS recency',
    help: '~~Embed only public CMS items newer than this many days. Default 730. Used only when "Include CMS items" is on.',
    showWhen: () => Boolean(props.attentionList?.includeCmsItems),
  },
];

const visibleRecency = computed<RecencyRow[]>(() =>
  recencyKeys.filter((r: RecencyRow) => (r.showWhen ? r.showWhen() : true)),
);

const tooltipOpts = (key: string) => ({
  content: t(key),
  triggers: ['hover', 'focus', 'click'],
  popperClass: 'interactive-tooltip w-auto',
});

const onNumber = (
  bag: AttentionListLimits | AttentionListBoosts | AttentionListRecencyDays,
  key: string,
  raw: string,
) => {
  if (raw === '' || raw === null) {
    delete bag[key as keyof typeof bag];
    return;
  }
  const n = Number(raw);
  if (!Number.isNaN(n)) bag[key as keyof typeof bag] = n;
};

const buildPatch = (): Partial<AttentionList> => {
  // Strip empty objects so we don't accidentally clear values the user didn't
  // touch. Lists (watchedUserIds, cmsTags) always send — they replace
  // outright per the integration guide.
  const out: Partial<AttentionList> = {
    watchedUserIds: draft.value.watchedUserIds ?? [],
    includePublicBlog: draft.value.includePublicBlog,
    includeMagazines: draft.value.includeMagazines,
    includeCmsItems: draft.value.includeCmsItems,
  };
  if (draft.value.includeCmsItems) {
    out.cmsTags = draft.value.cmsTags ?? [];
  }
  const trimDict = <T extends object>(d: T | undefined): T | undefined => {
    if (!d) return undefined;
    const copy: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(d)) {
      if (v !== undefined && v !== null && v !== '') copy[k] = v;
    }
    return Object.keys(copy).length === 0 ? undefined : (copy as T);
  };
  const limits = trimDict(draft.value.limits);
  const boosts = trimDict(draft.value.boosts);
  const recency = trimDict(draft.value.recencyDays);
  if (limits) out.limits = limits;
  if (boosts) out.boosts = boosts;
  if (recency) out.recencyDays = recency;
  return out;
};

const onSave = () => {
  emit('save', buildPatch());
};

const onReset = () => {
  reset(props.attentionList);
  toast.info(t('~~Reverted to last saved'));
};

defineExpose({ reset: onReset });
</script>

<template>
  <form
    id="attention-list-form"
    class="ccu-attention-editor flex flex-col gap-3"
    @submit.prevent="onSave"
  >
    <!-- Watched users -->
    <section class="bg-white border border-slate-200 rounded-lg p-4">
      <h3
        class="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5"
      >
        {{ $t('~~Watched users') }}
        <ccu-icon
          v-tooltip="
            tooltipOpts(
              '~~Operators whose chat, blog posts, and CMS items are embedded daily and boosted at retrieval time. Use trusted signal carriers — e.g. incident commanders, outreach leads.',
            )
          "
          type="help"
          size="sm"
          class="text-slate-400"
        />
      </h3>
      <p class="text-xs text-slate-500 mb-3">
        {{ $t('~~Search by name or email. Editing replaces the list.') }}
      </p>
      <WatchedUsersSelect
        v-model="draft.watchedUserIds!"
        :placeholder="t('~~Search users…')"
      />
      <p v-if="errFor('watchedUserIds')" class="text-[11px] text-red-700 mt-2">
        {{ errFor('watchedUserIds') }}
      </p>
    </section>

    <!-- Sources -->
    <section class="bg-white border border-slate-200 rounded-lg p-4">
      <h3
        class="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5"
      >
        {{ $t('~~Sources') }}
        <ccu-icon
          v-tooltip="
            tooltipOpts(
              '~~Toggle which content streams are embedded. Each enabled source is fetched and chunked at every sync.',
            )
          "
          type="help"
          size="sm"
          class="text-slate-400"
        />
      </h3>
      <div class="flex flex-col gap-2 text-sm">
        <div class="flex items-center gap-1.5">
          <BaseCheckbox v-model="draft.includePublicBlog">
            {{ $t('~~Include public blog') }}
          </BaseCheckbox>
          <ccu-icon
            v-tooltip="
              tooltipOpts(
                '~~Embed public CmsItems tagged for blog content. Independent of CMS tags below.',
              )
            "
            type="help"
            size="sm"
            class="text-slate-400"
          />
        </div>
        <div class="flex items-center gap-1.5">
          <BaseCheckbox v-model="draft.includeCmsItems">
            {{ $t('~~Include CMS items') }}
          </BaseCheckbox>
          <ccu-icon
            v-tooltip="
              tooltipOpts(
                '~~Embed any CmsItem matching the tags below. Use this to scope retrieval to FAQ, runbooks, or other tagged knowledge.',
              )
            "
            type="help"
            size="sm"
            class="text-slate-400"
          />
        </div>
        <div class="flex items-center gap-1.5">
          <BaseCheckbox v-model="draft.includeMagazines">
            {{ $t('~~Include magazines') }}
          </BaseCheckbox>
          <ccu-icon
            v-tooltip="
              tooltipOpts(
                '~~Embed PDFs from the magazine library. Adds significant chunk volume — keep the magazines limit modest.',
              )
            "
            type="help"
            size="sm"
            class="text-slate-400"
          />
        </div>
      </div>
      <div v-if="draft.includeCmsItems" class="mt-3">
        <label
          class="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5"
        >
          {{ $t('~~CMS tags') }}
          <ccu-icon
            v-tooltip="
              tooltipOpts(
                '~~Comma-separated tag list. Only CmsItems carrying at least one of these tags get embedded. Defaults to blog and faq.',
              )
            "
            type="help"
            size="sm"
            class="text-slate-400"
          />
        </label>
        <BaseInput
          v-model="cmsTagsInput"
          :placeholder="t('~~comma-separated, e.g. blog, faq')"
        />
        <p v-if="errFor('cmsTags')" class="text-[11px] text-red-700 mt-1">
          {{ errFor('cmsTags') }}
        </p>
      </div>
    </section>

    <!-- Limits -->
    <section class="bg-white border border-slate-200 rounded-lg p-4">
      <h3
        class="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5"
      >
        {{ $t('~~Limits') }}
        <ccu-icon
          v-tooltip="
            tooltipOpts(
              '~~Per-source caps applied at every sync. Lower values keep the index smaller and retrieval faster but reduce coverage.',
            )
          "
          type="help"
          size="sm"
          class="text-slate-400"
        />
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div v-for="row in limitsKeys" :key="row.key">
          <label
            class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1"
          >
            {{ $t(row.label) }}
            <ccu-icon
              v-tooltip="tooltipOpts(row.help)"
              type="help"
              size="sm"
              class="text-slate-400 normal-case"
            />
          </label>
          <input
            type="number"
            min="1"
            class="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-sm tabular-nums focus:bg-white focus:border-slate-400 focus:outline-none"
            :value="draft.limits?.[row.key] ?? ''"
            @input="
              onNumber(
                (draft.limits ??= {}),
                row.key as string,
                ($event.target as HTMLInputElement).value,
              )
            "
          />
          <p
            v-if="errFor('limits.' + row.key)"
            class="text-[11px] text-red-700 mt-1"
          >
            {{ errFor('limits.' + row.key) }}
          </p>
        </div>
      </div>
    </section>

    <!-- Boosts & recency -->
    <section class="bg-white border border-slate-200 rounded-lg p-4">
      <h3
        class="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5"
      >
        {{ $t('~~Boosts & recency') }}
        <ccu-icon
          v-tooltip="
            tooltipOpts(
              '~~Tune retrieval scoring and how far back content stays eligible for embedding.',
            )
          "
          type="help"
          size="sm"
          class="text-slate-400"
        />
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label
            class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1"
          >
            {{ $t('~~Watched boost') }}
            <ccu-icon
              v-tooltip="
                tooltipOpts(
                  '~~Score multiplier applied to chunks from watched users at retrieval time. 1.0 = no boost, 2.0 = strong preference.',
                )
              "
              type="help"
              size="sm"
              class="text-slate-400 normal-case"
            />
          </label>
          <input
            type="number"
            step="0.05"
            min="1"
            max="2"
            class="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-sm tabular-nums focus:bg-white focus:border-slate-400 focus:outline-none"
            :value="draft.boosts?.watched ?? ''"
            @input="
              onNumber(
                (draft.boosts ??= {}),
                'watched',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
          <p class="text-[10px] text-slate-400 mt-1">
            {{ $t('~~1.0 to 2.0') }}
          </p>
          <p
            v-if="errFor('boosts.watched')"
            class="text-[11px] text-red-700 mt-1"
          >
            {{ errFor('boosts.watched') }}
          </p>
        </div>
        <div v-for="row in visibleRecency" :key="row.key">
          <label
            class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1"
          >
            {{ $t(row.label) }}
            <ccu-icon
              v-tooltip="tooltipOpts(row.help)"
              type="help"
              size="sm"
              class="text-slate-400 normal-case"
            />
          </label>
          <input
            type="number"
            min="1"
            class="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-sm tabular-nums focus:bg-white focus:border-slate-400 focus:outline-none"
            :value="draft.recencyDays?.[row.key] ?? ''"
            @input="
              onNumber(
                (draft.recencyDays ??= {}),
                row.key as string,
                ($event.target as HTMLInputElement).value,
              )
            "
          />
          <p class="text-[10px] text-slate-400 mt-1">{{ $t('~~days') }}</p>
          <p
            v-if="errFor('recencyDays.' + row.key)"
            class="text-[11px] text-red-700 mt-1"
          >
            {{ errFor('recencyDays.' + row.key) }}
          </p>
        </div>
      </div>
    </section>

    <!-- Non-field error -->
    <p v-if="errFor('')" class="text-sm text-red-700" role="alert">
      {{ errFor('') }}
    </p>
  </form>
</template>
