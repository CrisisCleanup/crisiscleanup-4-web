<script setup lang="ts">
import { type Ref } from 'vue';
import { useToast } from 'vue-toastification';
import {
  useRAG,
  useRAGConversations,
  useRAGUpload,
  type RAGEntry,
  type CCUDocumentFileItem,
} from '@/hooks';
import useDialogs from '@/hooks/useDialogs';
import { generateUUID } from '@/utils/helpers';
import { getAndToastErrorMessage } from '@/utils/errors';
import MessageTools from '@/components/admin/rag/MessageTools.vue';
import ChatThread from '@/components/admin/rag/ChatThread.vue';
import ChatComposer from '@/components/admin/rag/ChatComposer.vue';
import ConversationList from '@/components/admin/rag/ConversationList.vue';
import FileScopeDrawer from '@/components/admin/rag/FileScopeDrawer.vue';
import { RAGAdminContextKey } from './context';

const ctx = inject(RAGAdminContextKey);
if (!ctx) throw new Error('RAGAdminContextKey not provided');
const { collectionId } = ctx;

const { t } = useI18n();
const toast = useToast();
const { component } = useDialogs();

const conversationId = useStorage<string | undefined>(
  'rag:conversationId',
  undefined,
  localStorage,
  { writeDefaults: false, listenToStorageChanges: false },
);
const allCollectionFileIds = useStorage<Record<string, number[]>>(
  'rag:active:fileIds',
  {},
  localStorage,
  { writeDefaults: false, listenToStorageChanges: false },
);

const hasCollection = computed(() => Boolean(collectionId.value));

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
const sidebarOpenMobile = ref(false);
const openSources = async (entry: RAGEntry) => {
  await component({
    title: t('~~Sources & search trace'),
    component: MessageTools,
    classes: 'w-full h-144 p-0',
    modalClasses: 'bg-white max-w-4xl shadow',
    props: { entry },
  });
};
</script>

<template>
  <div
    class="ccu-rag-chat grid h-full"
    :class="
      sidebarOpenMobile
        ? 'grid-cols-1'
        : 'grid-cols-1 md:[grid-template-columns:280px_minmax(0,1fr)]'
    "
  >
    <!-- Conversations sidebar (desktop) + slide-over (mobile) -->
    <ConversationList
      class="hidden md:flex"
      :conversations="conversations?.conversations ?? []"
      :current-id="conversationId"
      @select="setConversation"
      @delete="onDeleteConversation"
      @new="onNewConversation"
    />

    <transition name="ccu-rag-mobile-sidebar">
      <div
        v-if="sidebarOpenMobile"
        class="md:hidden fixed inset-0 z-30 flex"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex-1 bg-black/30" @click="sidebarOpenMobile = false" />
        <ConversationList
          class="w-[280px] max-w-[90vw] h-full"
          :conversations="conversations?.conversations ?? []"
          :current-id="conversationId"
          @select="
            (id: string) => {
              setConversation(id);
              sidebarOpenMobile = false;
            }
          "
          @delete="onDeleteConversation"
          @new="
            () => {
              onNewConversation();
              sidebarOpenMobile = false;
            }
          "
        />
      </div>
    </transition>

    <div
      class="relative flex flex-col min-w-0 bg-white border-l border-slate-200"
    >
      <!-- Mobile-only header bar with sidebar toggle -->
      <div
        class="md:hidden flex items-center gap-2 px-3 py-2 border-b border-slate-200"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
          @click="sidebarOpenMobile = true"
        >
          <ccu-icon type="hamburger" size="xs" />
          {{ $t('~~Conversations') }}
        </button>
      </div>

      <ChatThread
        :history="history"
        :is-streaming="isStreamingMessage"
        @open-sources="openSources"
        @new="onNewConversation"
      />
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
</template>

<style scoped>
.ccu-rag-mobile-sidebar-enter-active,
.ccu-rag-mobile-sidebar-leave-active {
  transition: opacity 180ms ease-out;
}
.ccu-rag-mobile-sidebar-enter-from,
.ccu-rag-mobile-sidebar-leave-to {
  opacity: 0;
}
</style>
