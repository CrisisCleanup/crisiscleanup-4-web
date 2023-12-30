<script lang="ts" setup>
import { ref, type Ref } from 'vue';
import type { Tab } from '@/hooks';
import {
  useRAG,
  useRAGCollections,
  useRAGConversations,
  useRAGUpload,
} from '@/hooks';
import useDialogs from '@/hooks/useDialogs';
import { useStorage, whenever, useAsyncQueue } from '@vueuse/core';
import BaseInput from '@/components/BaseInput.vue';
import MarkdownRenderer from '@/components/MarkdownRender.vue';
import DragDrop from '@/components/DragDrop.vue';
import TitledCard from '@/components/cards/TitledCard.vue';
import TabbedCard from '@/components/cards/TabbedCard.vue';
import BaseText from '@/components/BaseText.vue';
import { generateUUID } from '@/utils/helpers';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import { truncate } from 'lodash';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { getAndToastErrorMessage } from '@/utils/errors';

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
const { confirm } = useDialogs();
const toast = useToast();
const { t } = useI18n();

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

const doSubmitQuestion = () => {
  submitQuestion(question.value, activeFileIds.value);
  question.value = '';
};

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

const allCollectionFileIds = useStorage<Record<string, number[]>>(
  'rag:active:fileIds',
  {},
  localStorage,
  {
    writeDefaults: false,
    listenToStorageChanges: false,
    onError: console.error,
  },
);

const currentCollectionActiveFileIds = computed<Set<number>>(
  () =>
    new Set(allCollectionFileIds.value?.[collectionId.value as string] ?? []),
);

// shallowly validate active file ids (or default them to all if none)
whenever(
  collectionDocuments,
  (newValue) => {
    const validFileIds = new Set(newValue?.map((doc) => doc.id) ?? []);
    const hasCurrentFileIds =
      currentCollectionActiveFileIds.value &&
      currentCollectionActiveFileIds.value.size > 0;
    // ternary is less readable here
    // eslint-disable-next-line unicorn/prefer-ternary
    if (hasCurrentFileIds) {
      allCollectionFileIds.value = {
        ...allCollectionFileIds.value,
        // remove any invalid (possibly deleted) active file ids
        [collectionId.value!]: [...currentCollectionActiveFileIds.value].filter(
          (id) => validFileIds.has(id),
        ),
      };
    } else {
      // use all as active as default
      allCollectionFileIds.value = {
        ...allCollectionFileIds.value,
        [collectionId.value!]: [...validFileIds],
      };
    }
  },
  // we dont want to react to changes within collectionDocuments, only collectionDocuments itself changing
  { deep: false },
);

const toggleFile = (fileId: number) => {
  const isActive = currentCollectionActiveFileIds.value?.has(fileId);
  let newValue: number[];
  if (isActive) {
    const values = new Set(currentCollectionActiveFileIds.value);
    values.delete(fileId);
    newValue = [...values];
  } else {
    newValue = [...currentCollectionActiveFileIds.value, fileId];
  }
  allCollectionFileIds.value[collectionId.value as string] = newValue;
};

const deleteActiveFiles = async () => {
  const didConfirm = await confirm({
    title: t('actions.confirm'),
    content: t(
      `Are you sure you want to delete ${currentCollectionActiveFileIds.value.size} files?`,
    ),
    actions: {
      no: {
        text: t('actions.cancel'),
        type: 'outline',
        size: 'medium',
      },
      yes: {
        text: t(`Delete ${currentCollectionActiveFileIds.value.size} files`),
        variant: 'solid',
        size: 'medium',
      },
    },
  });
  if (didConfirm === 'yes') {
    await deleteFile(...currentCollectionActiveFileIds.value)
      .then(() => toast.success('Files deleted'))
      .catch(getAndToastErrorMessage);
    allCollectionFileIds.value[collectionId.value as string] = [];
  } else {
    toast.warning(t('actions.cancelled'));
  }
};

const isAllFileIdsActive = computed(
  () =>
    currentCollectionActiveFileIds.value?.size ===
    collectionDocuments.value?.length,
);

// currently selected file ids (undefined if all selected to skip filter)
const activeFileIds = computed<number[] | undefined>(() =>
  isAllFileIdsActive.value
    ? undefined
    : [...currentCollectionActiveFileIds.value],
);

// file uploads queue
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
    <div class="col-span-1 md:col-span-2">
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
            @keyup.enter="() => doSubmitQuestion()"
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
                class="p-2 ws-nowrap truncate text-wrap"
                >{{
                  truncate(conv.title.split('user: ')[1], { length: 250 })
                }}</BaseText
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
          <div
            class="border-2 border-transparent border-b-crisiscleanup-light-smoke py-1 pl-1"
          >
            <base-checkbox
              :model-value="isAllFileIdsActive"
              @update:model-value="
                (v) =>
                  (allCollectionFileIds[collectionId!] = v
                    ? collectionDocuments!.map((doc) => doc.id)
                    : [])
              "
            >
              <BaseText
                variant="h4"
                class="pl-1 text-left truncate text-ellipsis"
                >Select All</BaseText
              >
            </base-checkbox>
          </div>
          <template v-for="doc in collectionDocuments" :key="doc.filename">
            <div
              class="border-b-2 py-1 pl-1 hover:bg-crisiscleanup-light-grey transition-all cursor-pointer ws-nowrap text-ellipsis"
              :title="doc.filenameOriginal"
              @click="() => toggleFile(doc.id)"
            >
              <base-checkbox
                :model-value="currentCollectionActiveFileIds.has(doc.id)"
                @update:model-value="() => toggleFile(doc.id)"
              >
                <BaseText
                  variant="h4"
                  class="pl-1 text-left truncate text-ellipsis"
                  >{{ doc.filenameOriginal }}</BaseText
                >
              </base-checkbox>
            </div>
          </template>
        </template>
        <template #files-footer>
          <div class="flex flex-col">
            <BaseButton
              class="flex-1"
              variant="solid"
              size="md"
              :text="
                $t(`Delete Files (${currentCollectionActiveFileIds.size})`)
              "
              ccu-icon="trash"
              icon-size="sm"
              :disabled="currentCollectionActiveFileIds.size === 0"
              :action="deleteActiveFiles"
            >
            </BaseButton>
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
          </div>
        </template>
      </TabbedCard>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.rag {
  /** 3 (1x3) column stack on small displays */
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) minmax(0, 0.25fr);
  transition: all 300ms ease-in-out;
  min-height: 90vh;
  max-height: 200vh;
}

@media screen(md) {
  .rag {
    /** 2x2 grid stack on small displays */
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.3fr);
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 90vh;
    max-height: 90vh;
  }
}

:deep(.card) {
  @apply flex flex-col;
}

:deep(.card .body) {
  flex-grow: 1;
  overflow-y: auto;
}

:deep(.card .body--inner) {
  @apply inline-grid grid-rows-2 w-full;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-columns: minmax(0, 1fr);
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
