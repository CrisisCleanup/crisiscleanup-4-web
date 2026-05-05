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

const showGuide = ref(false);

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
</script>

<template>
  <form
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

    <!-- Reference guide -->
    <section class="bg-white border border-slate-200 rounded-lg">
      <button
        type="button"
        class="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        :aria-expanded="showGuide"
        @click="showGuide = !showGuide"
      >
        <span class="flex items-center gap-2">
          <ccu-icon type="info" size="sm" class="text-slate-400" />
          {{ $t('~~Configuration reference') }}
        </span>
        <ccu-icon
          :type="showGuide ? 'up' : 'down'"
          size="xs"
          class="text-slate-400"
        />
      </button>
      <div
        v-if="showGuide"
        class="px-4 pb-4 text-xs text-slate-600 space-y-4 border-t border-slate-100"
      >
        <p class="pt-3">
          {{
            $t(
              '~~Every value below is part of the collection’s attention list. All limits and recency cutoffs must be integers ≥ 1; the boost is a float in [1.0, 2.0]. Drop a key to fall back to its default — there is no API-level "no cutoff" except for magazines.',
            )
          }}
        </p>

        <div>
          <h4
            class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
          >
            {{ $t('~~Top-level') }}
          </h4>
          <ul class="space-y-1 list-disc pl-5">
            <li>
              <code class="text-slate-900">watched_user_ids</code> —
              {{
                $t(
                  '~~list[int] of user PKs. Each id must reference an existing user; missing ids return 400.',
                )
              }}
            </li>
            <li>
              <code class="text-slate-900">include_public_blog</code> —
              {{
                $t(
                  '~~bool, default true. When false, public blog posts are not synced. Watched-user blog posts still sync via watched_blog regardless.',
                )
              }}
            </li>
            <li>
              <code class="text-slate-900">include_magazines</code> —
              {{
                $t(
                  '~~bool, default true. When false, the magazine collector is skipped (and limits.magazines is ignored).',
                )
              }}
            </li>
            <li>
              <code class="text-slate-900">include_cms_items</code> —
              {{
                $t(
                  '~~bool, default false. Opt-in switch enabling watched_cms and public_cms source types.',
                )
              }}
            </li>
            <li>
              <code class="text-slate-900">cms_tags</code> —
              {{
                $t(
                  '~~list[str], default ["blog", "faq"]. Lower-cased on save; empty list rejected. JSONB containment is exact-match.',
                )
              }}
            </li>
          </ul>
        </div>

        <div>
          <h4
            class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
          >
            {{ $t('~~limits — record counts (int ≥ 1)') }}
          </h4>
          <p class="mb-1 italic text-slate-500">
            {{
              $t(
                '~~Caps count records (posts, messages, magazines), not embedding chunks. One record may produce multiple chunks.',
              )
            }}
          </p>
          <ul class="space-y-0.5 list-disc pl-5">
            <li>
              <code class="text-slate-900">chat_per_user</code> —
              {{ $t('~~default 100. Per watched user; total = users × this.') }}
            </li>
            <li>
              <code class="text-slate-900">blog_per_watched_user</code> —
              {{ $t('~~default 25. Per watched user; total = users × this.') }}
            </li>
            <li>
              <code class="text-slate-900">public_blog</code> —
              {{ $t('~~default 50. Collection-wide.') }}
            </li>
            <li>
              <code class="text-slate-900">magazines</code> —
              {{
                $t(
                  '~~default 10. Collection-wide. Sending 0 returns 400 — disable via the toggle.',
                )
              }}
            </li>
            <li>
              <code class="text-slate-900">cms_per_watched_user</code> —
              {{ $t('~~default 25. Used only when include_cms_items=true.') }}
            </li>
            <li>
              <code class="text-slate-900">public_cms</code> —
              {{ $t('~~default 50. Used only when include_cms_items=true.') }}
            </li>
          </ul>
        </div>

        <div>
          <h4
            class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
          >
            {{ $t('~~boosts — score multipliers (float)') }}
          </h4>
          <ul class="space-y-0.5 list-disc pl-5">
            <li>
              <code class="text-slate-900">watched</code> —
              {{
                $t(
                  '~~default 1.25, range [1.0, 2.0] inclusive. Applied after vector-similarity normalisation, before final ranking. Outside range → 400.',
                )
              }}
            </li>
          </ul>
        </div>

        <div>
          <h4
            class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
          >
            {{ $t('~~recency_days — cutoffs (int ≥ 1)') }}
          </h4>
          <p class="mb-1 italic text-slate-500">
            {{
              $t(
                '~~Days back from now. Records older than the cutoff are dropped at sync time. Floats and 0 are rejected.',
              )
            }}
          </p>
          <ul class="space-y-0.5 list-disc pl-5">
            <li>
              <code class="text-slate-900">watched_chat</code> —
              {{ $t('~~default 365. Applied to ChatMessage.created_at.') }}
            </li>
            <li>
              <code class="text-slate-900">watched_blog</code> —
              {{ $t('~~default 730. Applied to CmsItem.publish_at.') }}
            </li>
            <li>
              <code class="text-slate-900">public_blog</code> —
              {{ $t('~~default 730. Applied to CmsItem.publish_at.') }}
            </li>
            <li>
              <code class="text-slate-900">magazine</code> —
              {{
                $t(
                  '~~default null (no cutoff). Send an int to enforce a window.',
                )
              }}
            </li>
            <li>
              <code class="text-slate-900">watched_cms</code> —
              {{ $t('~~default 730. Used only when include_cms_items=true.') }}
            </li>
            <li>
              <code class="text-slate-900">public_cms</code> —
              {{ $t('~~default 730. Used only when include_cms_items=true.') }}
            </li>
          </ul>
        </div>

        <div>
          <h4
            class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
          >
            {{ $t('~~Read-only response fields') }}
          </h4>
          <ul class="space-y-0.5 list-disc pl-5">
            <li>
              <code class="text-slate-900"
                >attention_counts.&lt;source&gt;</code
              >
              —
              {{
                $t(
                  '~~per-source embedding chunk count (rows in langchain_pg_embedding).',
                )
              }}
            </li>
            <li>
              <code class="text-slate-900">chunks_total</code> —
              {{ $t('~~headline total. Sum of per-source counts.') }}
            </li>
            <li>
              <code class="text-slate-900">last_sync_at</code> —
              {{ $t('~~ISO-8601 UTC. null when never synced.') }}
            </li>
          </ul>
        </div>

        <p class="pt-2 text-slate-500">
          {{
            $t(
              '~~Source of truth: _LIMIT_DEFAULTS, _BOOST_WATCHED_DEFAULT, _RECENCY_DEFAULTS and _DEFAULT_CMS_TAGS in crisiscleanup/rag/attention/config.py.',
            )
          }}
        </p>
      </div>
    </section>

    <!-- Save bar -->
    <div
      class="sticky bottom-0 -mx-4 px-4 py-3 bg-white/95 backdrop-blur border-t border-slate-200 flex gap-2 justify-end"
    >
      <button
        type="button"
        class="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors disabled:opacity-50"
        :disabled="isUpdating"
        @click="onReset"
      >
        {{ $t('~~Reset') }}
      </button>
      <button
        type="submit"
        class="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        :disabled="isUpdating"
      >
        {{ isUpdating ? $t('~~Saving…') : $t('actions.save') }}
      </button>
    </div>
  </form>
</template>
