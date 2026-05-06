<script setup lang="ts">
import { useRAGCollections, type RAGCollection } from '@/hooks';
import BaseSelect from '@/components/BaseSelect.vue';
import { RAGAdminContextKey } from './rag/context';

type TabKey = 'chat' | 'files' | 'attention';

const { t } = useI18n();
const route = useRoute();

const collectionId = useStorage<string | undefined>(
  'rag:collectionId',
  undefined,
  localStorage,
  { writeDefaults: false, listenToStorageChanges: false },
);

const { collections } = useRAGCollections();

watchOnce(collections, () => {
  if (!collectionId.value) {
    const all = collections.value ?? [];
    // Prefer the canonical FAQ collection per the integration guide; fall
    // back to anything starting with "crisiscleanup", then to the first
    // collection in the list.
    const preferred =
      all.find((c: RAGCollection) => c.name === 'crisiscleanup-faq') ??
      all.find((c: RAGCollection) => c.name.startsWith('crisiscleanup')) ??
      all[0];
    if (preferred) collectionId.value = preferred.uuid;
  }
});

const collectionOptions = computed(() =>
  collections.value.map((c: RAGCollection) => ({
    ...c,
    label: c.name.toUpperCase(),
  })),
);
const currentCollection = computed(() =>
  collections.value?.find((c: RAGCollection) => c.uuid === collectionId.value),
);
const hasCollection = computed(() => Boolean(currentCollection.value));

provide(RAGAdminContextKey, { collectionId });

const tabs: { key: TabKey; label: string; routeName: string }[] = [
  { key: 'chat', label: '~~Chat', routeName: 'nav.rag_chat' },
  { key: 'files', label: '~~Files', routeName: 'nav.rag_files' },
  {
    key: 'attention',
    label: '~~Attention list',
    routeName: 'nav.rag_attention',
  },
];

const activeTabKey = computed<TabKey>(() => {
  const name = String(route.name ?? '');
  if (name === 'nav.rag_files') return 'files';
  if (name === 'nav.rag_attention') return 'attention';
  return 'chat';
});
</script>

<template>
  <div class="ccu-admin-rag flex flex-col h-full min-h-0 bg-slate-50">
    <!-- Header: title + collection picker, with tab strip below -->
    <header class="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-end gap-3 px-4 pt-4 pb-3">
        <div class="min-w-0">
          <h1 class="text-lg font-semibold text-slate-900 leading-tight">
            {{ $t('~~RAG console') }}
          </h1>
          <p class="text-xs text-slate-500 truncate">
            <template v-if="currentCollection">
              {{ $t('~~Collection') }}
              <span class="font-semibold text-slate-700">
                {{ currentCollection.name }}
              </span>
            </template>
            <template v-else>
              {{ t('adminRAG.select_collection') }}
            </template>
          </p>
        </div>
        <div class="md:ml-auto md:w-72">
          <label
            class="block text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-1"
          >
            {{ $t('~~Collection') }}
          </label>
          <BaseSelect
            :model-value="collectionId"
            :options="collectionOptions"
            item-key="uuid"
            label="label"
            :placeholder="t('adminRAG.select_collection')"
            :can-clear="false"
            searchable
            @update:model-value="(v: string) => (collectionId = v)"
          />
        </div>
      </div>

      <nav class="flex gap-1 px-4 -mb-px" aria-label="RAG tabs">
        <router-link
          v-for="tab in tabs"
          :key="tab.key"
          :to="{ name: tab.routeName }"
          class="px-3 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px"
          :class="
            activeTabKey === tab.key
              ? 'border-crisiscleanup-yellow-500 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          "
        >
          {{ $t(tab.label) }}
        </router-link>
      </nav>
    </header>

    <!-- Tab body -->
    <main class="flex-1 min-h-0">
      <div
        v-if="!hasCollection"
        class="flex flex-col items-center justify-center h-full text-center px-4 py-12"
      >
        <div
          class="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3"
        >
          <ccu-icon type="folder" size="lg" fa class="opacity-60" />
        </div>
        <h2 class="text-base font-semibold text-slate-900">
          {{ $t('~~Pick a collection to get started') }}
        </h2>
        <p class="mt-1 text-sm text-slate-500 max-w-md">
          {{
            $t(
              '~~Choose a collection above to chat with its contents, manage uploaded files, or configure its attention list.',
            )
          }}
        </p>
      </div>
      <router-view v-else />
    </main>
  </div>
</template>
