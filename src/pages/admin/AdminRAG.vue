<script setup lang="ts">
import { type Ref } from 'vue';
import { useToast } from 'vue-toastification';
import {
  useRAG,
  useRAGCollections,
  useRAGConversations,
  useRAGUpload,
  type RAGCollection,
  type RAGEntry,
  type CCUDocumentFileItem,
} from '@/hooks';
import useDialogs from '@/hooks/useDialogs';
import { generateUUID } from '@/utils/helpers';
import { getAndToastErrorMessage } from '@/utils/errors';
import BaseSelect from '@/components/BaseSelect.vue';
import MessageTools from '@/components/admin/rag/MessageTools.vue';
import ChatThread from '@/components/admin/rag/ChatThread.vue';
import ChatComposer from '@/components/admin/rag/ChatComposer.vue';
import ConversationList from '@/components/admin/rag/ConversationList.vue';
import FileScopeDrawer from '@/components/admin/rag/FileScopeDrawer.vue';
import FilesPanel from '@/components/admin/rag/FilesPanel.vue';
import AttentionListPanel from '@/components/admin/rag/AttentionListPanel.vue';

type TabKey = 'chat' | 'files' | 'attention';

const { t } = useI18n();
const toast = useToast();
const { component } = useDialogs();

const collectionId = useStorage<string | undefined>(
  'rag:collectionId',
  undefined,
  localStorage,
  { writeDefaults: false, listenToStorageChanges: false },
);
const conversationId = useStorage<string | undefined>(
  'rag:conversationId',
  undefined,
  localStorage,
  { writeDefaults: false, listenToStorageChanges: false },
);
// Always land on the Chat tab on mount; persist intra-session changes only.
const activeTab = ref<TabKey>('chat');
const allCollectionFileIds = useStorage<Record<string, number[]>>(
  'rag:active:fileIds',
  {},
  localStorage,
  { writeDefaults: false, listenToStorageChanges: false },
);

const { collections } = useRAGCollections();

watchOnce(collections, () => {
  if (!collectionId.value) {
    const all = collections.value ?? [];
    // Prefer the canonical FAQ collection per the integration guide; fall
    // back to anything starting with "crisiscleanup", then to the first
    // collection in the list. This mirrors the admin's likely intent
    // without forcing a hard-coded name.
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

const setConversation = (newConversationId: string) => {
  conversationId.value = newConversationId;
};

const {
  currentConversationEntries,
  conversations,
  fetchConversations,
  deleteConversation,
} = useRAGConversations(collectionId as Ref<string>, conversationId);

const { history, submitQuestion, latestMessage, isStreamingMessage } = useRAG(
  collectionId as Ref<string>,
  conversationId as Ref<string>,
  currentConversationEntries,
);

const { collectionDocuments, documentsTree } = useRAGUpload(
  collectionId as Ref<string | undefined>,
);

const currentActiveFileIds = computed<Set<number>>(
  () =>
    new Set<number>(
      allCollectionFileIds.value?.[collectionId.value as string] ?? [],
    ),
);
const totalFileCount = computed(() => collectionDocuments.value?.length ?? 0);
const isAllFileIdsActive = computed(
  () =>
    currentActiveFileIds.value.size === totalFileCount.value &&
    totalFileCount.value > 0,
);
const activeFileIds = computed<number[] | undefined>(() =>
  isAllFileIdsActive.value ? undefined : [...currentActiveFileIds.value],
);

const toggleFileScope = (fileId: number, toActive?: boolean) => {
  if (!collectionId.value) return;
  const isActive = currentActiveFileIds.value.has(fileId);
  let next: number[];
  if (isActive && (toActive === false || toActive === undefined)) {
    const values = new Set<number>(currentActiveFileIds.value);
    values.delete(fileId);
    next = [...values];
  } else {
    next = [...currentActiveFileIds.value, fileId];
  }
  allCollectionFileIds.value[collectionId.value] = next;
};

const setAllFileScope = (allSelected: boolean) => {
  if (!collectionId.value) return;
  allCollectionFileIds.value[collectionId.value] = allSelected
    ? (collectionDocuments.value ?? []).map((d: CCUDocumentFileItem) => d.id)
    : [];
};

const onSubmit = (question: string) => {
  if (!hasCollection.value) {
    toast.warning(t('adminRAG.select_collection'));
    return;
  }
  submitQuestion(question, activeFileIds.value);
};

const onDeleteConversation = async (id: string) => {
  await deleteConversation(id)
    .then(() => toast.success(t('adminRAG.conversation_deleted')))
    .catch(getAndToastErrorMessage);
};

const onNewConversation = () => setConversation(generateUUID());

interface ConversationSummary {
  conversationId: string;
  title: string;
}

const messageOnNewConversation = computed(
  () =>
    latestMessage.value &&
    conversations.value?.conversations?.findIndex?.(
      (c: ConversationSummary) => c.conversationId === conversationId.value,
    ),
);
watch(
  isStreamingMessage,
  async (newValue: boolean, oldValue: boolean | undefined) => {
    if (
      newValue === false &&
      oldValue === true &&
      messageOnNewConversation.value
    ) {
      await fetchConversations();
    }
  },
);

const drawerOpen = ref(false);
const openSources = async (entry: RAGEntry) => {
  await component({
    title: t('~~Sources & search trace'),
    component: MessageTools,
    classes: 'w-full h-144 p-0',
    modalClasses: 'bg-white max-w-4xl shadow',
    props: { entry },
  });
};

const tabs: { key: TabKey; label: string }[] = [
  { key: 'chat', label: '~~Chat' },
  { key: 'files', label: '~~Files' },
  { key: 'attention', label: '~~Attention list' },
];
</script>

<template>
  <div class="ccu-admin-rag flex flex-col h-full bg-slate-50">
    <!-- Top bar: collection picker + tabs -->
    <header
      class="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 bg-white border-b-2 border-slate-200 shadow-sm"
    >
      <div class="md:w-72">
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
      <nav
        class="flex gap-1 ml-auto p-1 rounded-lg bg-slate-100 border border-slate-200"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="px-3 py-1.5 rounded-md text-sm font-semibold transition-colors"
          :class="
            activeTab === tab.key
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          "
          @click="activeTab = tab.key"
        >
          {{ $t(tab.label) }}
        </button>
      </nav>
    </header>

    <!-- Tab body -->
    <main class="flex-1 min-h-0">
      <!-- Chat -->
      <div
        v-show="activeTab === 'chat'"
        class="grid h-full"
        style="grid-template-columns: 280px minmax(0, 1fr)"
      >
        <ConversationList
          :conversations="conversations?.conversations ?? []"
          :current-id="conversationId"
          @select="setConversation"
          @delete="onDeleteConversation"
          @new="onNewConversation"
        />
        <div
          class="relative flex flex-col min-w-0 bg-white border-l border-slate-200"
        >
          <ChatThread :history="history" @open-sources="openSources" />
          <ChatComposer
            :disabled="isStreamingMessage || !hasCollection"
            :active-file-count="
              isAllFileIdsActive ? totalFileCount : currentActiveFileIds.size
            "
            :total-file-count="totalFileCount"
            @submit="onSubmit"
            @toggle-scope="drawerOpen = !drawerOpen"
          />
          <FileScopeDrawer
            :open="drawerOpen"
            :documents-tree="documentsTree"
            :active-file-ids="currentActiveFileIds"
            :total-count="totalFileCount"
            @close="drawerOpen = false"
            @toggle="toggleFileScope"
            @select-all="setAllFileScope"
          />
        </div>
      </div>

      <!-- Files -->
      <div v-show="activeTab === 'files'" class="h-full overflow-y-auto p-4">
        <FilesPanel :collection-id="collectionId" />
      </div>

      <!-- Attention list -->
      <div
        v-show="activeTab === 'attention'"
        class="h-full overflow-y-auto p-4"
      >
        <AttentionListPanel :collection-id="collectionId" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.ccu-admin-rag {
  /* Lock the page to viewport so the chat thread scrolls internally. */
  min-height: 88vh;
  max-height: calc(100vh - 64px);
}
</style>
