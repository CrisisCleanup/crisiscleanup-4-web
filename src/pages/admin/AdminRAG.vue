<script lang="ts" setup>
import { ref, type Ref } from 'vue';
import type { Tab } from '@/hooks';
import {
  useRAG,
  useRAGCollections,
  useRAGConversations,
  useRAGUpload,
} from '@/hooks';
import {
  useStorage,
  whenever,
  useAsyncQueue,
  reactiveComputed,
} from '@vueuse/core';
import BaseInput from '@/components/BaseInput.vue';
import MarkdownRenderer from '@/components/MarkdownRender.vue';
import DragDrop from '@/components/DragDrop.vue';
import TitledCard from '@/components/cards/TitledCard.vue';
import TabbedCard from '@/components/cards/TabbedCard.vue';
import BaseText from '@/components/BaseText.vue';
import { generateUUID } from '@/utils/helpers';
import BaseCheckbox from '@/components/BaseCheckbox.vue';

const question = ref<string>('');
const { collections } = useRAGCollections();
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
watchOnce(collections, () => {
  if (!collection.value) {
    collectionId.value = collections.value?.find?.(
      (c) => c.name === 'crisiscleanup',
    )?.uuid;
  }
});

const setConversation = (newConversationId: string) => {
  console.log('set convo:', newConversationId, 'from:', conversationId.value);
  conversationId.value = newConversationId;
};

const { currentConversationEntries, conversations, fetchConversations } =
  useRAGConversations(collectionId as Ref<string>, conversationId);
const { history, submitQuestion, latestMessage, isStreamingMessage } = useRAG(
  collectionId as Ref<string>,
  conversationId as Ref<string>,
  currentConversationEntries,
);

// force refetch of conversations when a new conversation is receives first completed message.
const messageOnNewConversation = computed(
  () =>
    latestMessage.value &&
    conversations.value?.conversations?.findIndex?.(
      (c) => c.conversationId === conversationId.value,
    ),
);
watch(isStreamingMessage, async (newValue, oldValue) => {
  if (
    newValue === false &&
    oldValue === true &&
    messageOnNewConversation.value
  ) {
    await fetchConversations();
  }
});

const collectionOptions = computed(() =>
  collections.value.map((c) => ({ ...c, label: c.name.toUpperCase() })),
);

const collection = computed(
  () => collections.value?.find((c) => c.uuid === collectionId.value),
);
const hasCollection = computed(() => !!collection.value);
const { uploadFile, collectionDocuments, deleteFile, isDocumentsLoading } =
  useRAGUpload(collectionId);

const activeCollectionFileIds = ref<Record<number, boolean>>({});
whenever(collectionDocuments, (newValue) => {
  activeCollectionFileIds.value = {};
  for (const file of newValue) {
    activeCollectionFileIds.value[file.id] = true;
  }
});
const allFileIds = computed(() => collectionDocuments.value?.map((f) => f.id));
const isAllFileIdsActive = computed(
  () => allFileIds.value?.every((id) => activeCollectionFileIds.value[id]),
);
const activeFileIds = computed<number[] | undefined>(() =>
  isAllFileIdsActive.value
    ? undefined
    : Object.entries(activeCollectionFileIds.value)
        .filter(([, v]) => v)
        .map<number>(([k]) => k as unknown as number),
);

const uploadsQueue = ref<Blob[]>([]);
const uploadTasks = computed(
  () => uploadsQueue.value?.map((file) => () => uploadFile(file)),
);
whenever(
  uploadTasks,
  (tasks) => {
    useAsyncQueue(tasks, {
      interrupt: false,
      onFinished: () => {
        uploadsQueue.value = [];
      },
    });
  },
  { flush: 'post' },
);

const configTabs: Tab[] = [{ key: 'conversation' }, { key: 'files' }];
</script>

<template>
  <div class="rag grid grid-cols-2 gap-2 h-full overflow-x-visible">
    <div class="col-span-2">
      <BaseSelect
        v-model="collectionId"
        :placeholder="$t('Select Collection')"
        :options="collectionOptions"
        item-key="uuid"
        label="label"
        :loading="!hasCollection"
        :can-deselect="false"
      />
    </div>
    <TitledCard :title="$t('Chat')">
      <div ref="chatDomRef" class="rag--chat">
        <template v-for="h in history" :key="`${h.actor}:${h.content}`">
          <BaseText variant="h3" class="pl-1"
            >{{ h.actor.toUpperCase() }}:</BaseText
          >
          <MarkdownRenderer class="pl-3 py-1" :source="h.content" />
          <br />
        </template>
      </div>

      <template #footer>
        <div class="flex">
          <BaseInput
            v-model="question"
            placeholder="Ask a question"
            class="w-full"
            @keyup.enter="() => submitQuestion(question, activeFileIds)"
          />
        </div>
      </template>
    </TitledCard>

    <div class="flex flex-col">
      <TabbedCard :tabs="configTabs">
        <template #conversation>
          <template
            v-for="conv in conversations?.conversations"
            :key="conv.conversationId"
          >
            <div
              class="border-2 border-t-0 py-1 hover:bg-crisiscleanup-light-grey transition-all cursor-pointer ws-nowrap text-ellipsis"
              :class="{
                'bg-crisiscleanup-light-smoke shadow-inner':
                  conv.conversationId === conversationId,
              }"
              @click="() => setConversation(conv.conversationId)"
            >
              <BaseText
                variant="h4"
                :bold="conv.conversationId === conversationId"
                class="p-2 text-ellipsis ws-nowrap"
                >{{ conv.title.split('user: ')[1] }}</BaseText
              >
            </div>
          </template>
        </template>
        <template #conversation-footer>
          <div
            class="flex justify-center py-2 transition-all cursor-pointer conversation__new"
          >
            <ccu-icon
              :alt="$t('~~New Conversation')"
              type="active"
              with-text
              size="lg"
              @click="() => setConversation(generateUUID())"
            />
          </div>
        </template>
        <template #files>
          <div class="transition-all flex flex-col">
            <DragDrop
              class="border bg-white"
              :choose-title="$t('dragDrop.choose_files')"
              :drag-title="$t('fileUpload.select_file_upload')"
              @files="(files) => uploadsQueue.push(...files)"
            >
              <template v-if="isDocumentsLoading || uploadsQueue.length > 0">
                <spinner />
              </template>
            </DragDrop>
            <template v-for="doc in collectionDocuments" :key="doc.filename">
              <div class="border-1 inline-flex p-1 flex-grow justify-between">
                <base-checkbox
                  :model-value="activeCollectionFileIds[doc.id]"
                  @update:model-value="
                    (v) => (activeCollectionFileIds[doc.id] = v)
                  "
                >
                  <BaseText variant="h4" class="pl-1 text-left">{{
                    doc.filenameOriginal
                  }}</BaseText>
                </base-checkbox>
                <ccu-icon
                  type="trash"
                  size="sm"
                  class="transition-all hover:scale-[1.05] hover:translate-y-[-2px] self-end"
                  @click="() => deleteFile(doc.id)"
                />
              </div>
            </template>
          </div>
        </template>
      </TabbedCard>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.rag {
  grid-template-columns: 1fr 0.25fr;
  grid-template-rows: auto minmax(0, 1fr);
  transition: all 300ms ease-in-out;
  min-height: 90vh;
  max-height: 90vh;
}

:deep(.card) {
  @apply flex flex-col;
}

:deep(.card .body) {
  flex-grow: 1;
  overflow-y: scroll;
}

:deep(.card .body--inner) {
  @apply inline-grid grid-rows-2 w-full;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-columns: 1fr;
}
.conversation__new:hover {
  @apply bg-crisiscleanup-light-smoke;
  transition: filter 150ms ease-in-out;
  > button {
    transition: filter 150ms ease-in-out;
    filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.2));
  }
}
</style>
