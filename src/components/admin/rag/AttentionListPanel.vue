<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { useRAGAttentionList, type AttentionList } from '@/hooks/useRAG';
import AttentionListStats from './AttentionListStats.vue';
import AttentionListEditor from './AttentionListEditor.vue';
import AttentionListReference from './AttentionListReference.vue';

const props = defineProps<{
  collectionId: string | undefined;
}>();

const { t } = useI18n();
const toast = useToast();

const collectionIdRef = toRef(props, 'collectionId');
const {
  attentionList,
  hasAttentionList,
  attentionCounts,
  staleness,
  lastSyncAt,
  fieldErrors,
  isLoading,
  isUpdating,
  isSyncing,
  refetch,
  updateAttentionList,
  syncNow,
  enableAttentionList,
} = useRAGAttentionList(collectionIdRef);

const editorRef = ref<{ reset: () => void } | null>(null);

let pollHandle: number | undefined;
const stopPolling = () => {
  if (pollHandle !== undefined) {
    window.clearInterval(pollHandle);
    pollHandle = undefined;
  }
};

const onSave = async (patch: Partial<AttentionList>) => {
  try {
    await updateAttentionList(patch);
    toast.success(t('~~Attention list saved'));
  } catch {
    toast.error(t('~~Some fields need attention'));
  }
};

const onSyncNow = async () => {
  try {
    const before = lastSyncAt.value?.getTime() ?? 0;
    await syncNow();
    toast.info(t('~~Sync queued'));
    stopPolling();
    pollHandle = window.setInterval(async () => {
      await refetch();
      const now = lastSyncAt.value?.getTime() ?? 0;
      if (now > before) {
        stopPolling();
        toast.success(t('~~Sync finished'));
      }
    }, 12_000);
  } catch {
    /* hook already toasted */
  }
};

const onEnable = async () => {
  try {
    await enableAttentionList();
    toast.success(t('~~Attention list enabled'));
  } catch {
    /* already toasted */
  }
};

const onReset = () => editorRef.value?.reset();

watch(collectionIdRef, () => stopPolling());
onBeforeUnmount(stopPolling);
</script>

<template>
  <div
    class="ccu-attention-panel flex flex-col h-full min-h-0 max-w-6xl w-full mx-auto py-3 gap-4"
  >
    <!-- Title row: bigger title + actions on the right -->
    <header class="flex-shrink-0 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 class="text-xl font-semibold text-slate-900 leading-tight">
          {{ $t('~~Attention list') }}
        </h2>
        <p class="text-sm text-slate-500 mt-0.5">
          {{
            $t(
              '~~Index watched-user chat, blogs, and CMS items alongside uploaded files.',
            )
          }}
        </p>
      </div>
      <div
        v-if="hasAttentionList && attentionList"
        class="flex items-center gap-2 flex-shrink-0"
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
          form="attention-list-form"
          class="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          :disabled="isUpdating"
        >
          {{ isUpdating ? $t('~~Saving…') : $t('actions.save') }}
        </button>
      </div>
    </header>

    <div v-if="!collectionId" class="text-sm text-slate-500">
      {{ $t('~~Select a collection to manage its attention list.') }}
    </div>

    <!-- State 1: collection has no attention_list yet -->
    <template v-else-if="!isLoading && !hasAttentionList">
      <section
        class="border border-dashed border-slate-300 rounded-lg p-8 text-center bg-white"
      >
        <h3 class="text-base font-semibold text-slate-900 mb-1">
          {{ $t('~~Attention list not configured') }}
        </h3>
        <p class="text-sm text-slate-500 mb-4 max-w-md mx-auto">
          {{
            $t(
              '~~Enable to start indexing watched-user chat, public blog posts, and CMS items alongside uploaded files.',
            )
          }}
        </p>
        <button
          type="button"
          class="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          :disabled="isUpdating || isSyncing"
          @click="onEnable"
        >
          {{
            isUpdating || isSyncing
              ? $t('~~Enabling…')
              : $t('~~Enable attention list')
          }}
        </button>
      </section>
    </template>

    <!-- State 2/3: attention_list configured (or initial load) -->
    <template v-else>
      <AttentionListStats
        class="flex-shrink-0"
        :attention-counts="attentionCounts"
        :staleness="staleness"
        :last-sync-at="lastSyncAt"
        :is-syncing="isSyncing"
        :is-loading="isLoading && !attentionList"
        @sync="onSyncNow"
      />

      <!-- Editor + reference, side-by-side on md+ -->
      <div
        class="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-4 overflow-hidden"
      >
        <div class="min-h-0 overflow-y-auto pr-1">
          <AttentionListEditor
            v-if="attentionList"
            ref="editorRef"
            :attention-list="attentionList"
            :field-errors="fieldErrors"
            :is-updating="isUpdating"
            @save="onSave"
          />
        </div>
        <aside class="hidden md:block min-h-0 overflow-y-auto pr-1">
          <AttentionListReference />
        </aside>
      </div>
    </template>
  </div>
</template>
