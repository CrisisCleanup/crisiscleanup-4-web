<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { useRAGAttentionList, type AttentionList } from '@/hooks/useRAG';
import AttentionListStats from './AttentionListStats.vue';
import AttentionListEditor from './AttentionListEditor.vue';

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

watch(collectionIdRef, () => stopPolling());
onBeforeUnmount(stopPolling);
</script>

<template>
  <div class="ccu-attention-panel flex flex-col gap-3 max-w-3xl mx-auto py-2">
    <div v-if="!collectionId" class="text-sm text-slate-500">
      {{ $t('~~Select a collection to manage its attention list.') }}
    </div>

    <template v-else-if="isLoading && !attentionList">
      <div class="flex justify-center py-12"><Spinner /></div>
    </template>

    <!-- State 1: collection has no attention_list yet -->
    <template v-else-if="!hasAttentionList">
      <section
        class="border border-dashed border-slate-300 rounded-lg p-8 text-center bg-white"
      >
        <h2 class="text-base font-semibold text-slate-900 mb-1">
          {{ $t('~~Attention list not configured') }}
        </h2>
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

    <!-- State 2/3: attention_list configured -->
    <template v-else>
      <AttentionListStats
        :attention-counts="attentionCounts"
        :staleness="staleness"
        :last-sync-at="lastSyncAt"
        :is-syncing="isSyncing"
        @sync="onSyncNow"
      />
      <AttentionListEditor
        :attention-list="attentionList"
        :field-errors="fieldErrors"
        :is-updating="isUpdating"
        @save="onSave"
      />
    </template>
  </div>
</template>
