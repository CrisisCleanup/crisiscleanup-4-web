<script lang="ts" setup>
import { ref, type Ref } from 'vue';
import type { Tab } from '@/hooks';
import {
  useRAG,
  useRAGCollections,
  useRAGConversations,
  useRAGUpload,
} from '@/hooks';
import { useElementSize, whenever, useStorage } from '@vueuse/core';
import BaseInput from '@/components/BaseInput.vue';
import MarkdownRenderer from '@/components/MarkdownRender.vue';
import { getErrorMessage } from '@/utils/errors';
import DragDrop from '@/components/DragDrop.vue';
import TitledCard from '@/components/cards/TitledCard.vue';
import TabbedCard from '@/components/cards/TabbedCard.vue';
import BaseText from '@/components/BaseText.vue';
import { generateUUID } from '@/utils/helpers';

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

const uploadsQueue = ref<Blob[]>([]);
whenever(uploadsQueue, async (newValue) => {
  if (!newValue || newValue.length === 0) return;
  await uploadFiles(newValue)
    .catch(getErrorMessage)
    .finally(() => {
      uploadsQueue.value = [];
    });
});

const uploadFiles = async (fileList: Blob[]) =>
  await Promise.all(fileList.map(uploadFile));

const chatDomRef = ref<HTMLElement>();
const chatDomSize = useElementSize(chatDomRef);
const chatDomHeight = ref(0);
whenever(chatDomHeight, (newValue) => {
  if (chatDomRef.value) {
    chatDomRef.value.style.maxHeight = `${newValue}px`;
  }
});
onMounted(() => {
  chatDomHeight.value = chatDomSize.height.value;
});
whenever(chatDomSize.height, (newValue) => {
  chatDomHeight.value = newValue;
});

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
      <div ref="chatDomRef" class="rag--chat overflow-y-auto">
        <template v-for="h in history" :key="`${h.actor}:${h.content}`">
          <BaseText variant="h3" class="pl-1"
            >{{ h.actor.toUpperCase() }}:</BaseText
          >
          <MarkdownRenderer
            class="pl-3 py-1 overflow-y-auto"
            :source="h.content"
          />
          <br />
        </template>
      </div>

      <div class="flex items-end col-span-2 self-end">
        <BaseInput
          v-model="question"
          placeholder="Ask a question"
          class="w-full"
          @keyup.enter="() => submitQuestion(question)"
        />
      </div>
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
          <div class="mx-auto py-2 transition-all cursor-pointer">
            <ccu-icon
              :alt="$t('~~New Conversation')"
              type="active"
              with-text
              size="lg"
              class="conversation__new"
              @click="() => setConversation(generateUUID())"
            />
          </div>
        </template>
        <template #files>
          <div class="overflow-y-auto transition-all">
            <DragDrop
              class="border bg-white"
              :choose-title="$t('dragDrop.choose_files')"
              :drag-title="$t('fileUpload.select_file_upload')"
              @files="(files) => (uploadsQueue = files)"
            >
              <template v-if="isDocumentsLoading || uploadsQueue.length > 0">
                <spinner />
              </template>
            </DragDrop>
            <template v-for="doc in collectionDocuments" :key="doc.filename">
              <div class="border-1 p-3">
                <ccu-icon
                  type="trash"
                  size="sm"
                  class="transition-all hover:scale-[1.05] hover:translate-y-[-2px]"
                  @click="() => deleteFile(doc.id)"
                >
                  <BaseText variant="h4" class="pl-1 text-left">{{
                    doc.filenameOriginal
                  }}</BaseText>
                </ccu-icon>
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
  grid-template-rows: auto 1fr;
  transition: all 300ms ease-in-out;
}

:deep(.card) {
  @apply flex flex-col;
}

:deep(.card .body) {
  flex-grow: 1;
}

:deep(.card .body--inner) {
  @apply inline-grid grid-rows-2 w-full;
  grid-template-rows: 1fr auto;
  grid-template-columns: 1fr;
}
.conversation__new:hover {
  transition: filter 150ms ease-in-out;
  filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.2));
}
</style>
