<script lang="ts" setup>
import { ref, type Ref } from 'vue';
import type { RAGEntry, Tab } from '@/hooks';
import {
  useRAG,
  useRAGCollections,
  useRAGConversations,
  useRAGUpload,
} from '@/hooks';
import useDialogs from '@/hooks/useDialogs';
import { useStorage, whenever } from '@vueuse/core';
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
import MessageTools from '@/components/admin/rag/MessageTools.vue';

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
const { confirm, component } = useDialogs();
const toast = useToast();
const { t } = useI18n();

const setConversation = (newConversationId: string) => {
  console.log('set convo:', newConversationId, 'from:', conversationId.value);
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

const onDeleteConversation = async (conversationId: string) => {
  const didConfirm = await confirm({
    title: t('actions.confirm'),
    content: t(`Are you sure you want to delete this conversation?`),
    actions: {
      no: {
        text: t('actions.cancel'),
        type: 'outline',
        size: 'medium',
      },
      yes: {
        text: t(`Delete`),
        variant: 'solid',
        size: 'medium',
      },
    },
  });
  if (didConfirm === 'yes') {
    await deleteConversation(conversationId)
      .then(() => toast.success('Conversation deleted'))
      .catch(getAndToastErrorMessage);
  } else {
    toast.warning(t('actions.cancelled'));
  }
};

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
const hasUploadsQueue = computed(() => uploadsQueue.value.length > 0);
whenever(hasUploadsQueue, async () => {
  await Promise.allSettled(
    uploadsQueue.value.map((file) =>
      uploadFile(file).catch((error) => getAndToastErrorMessage(error)),
    ),
  ).finally(() => {
    uploadsQueue.value = [];
  });
});

// display message tools
const displayMessageTools = async (entry: RAGEntry) => {
  await component({
    title: 'Documents',
    component: MessageTools,
    classes: 'w-full h-144 p-3',
    modalClasses: 'bg-white max-w-4xl shadow',
    props: {
      entry,
    },
  });
};

const collectionsDropdownProps = computed(() => ({
  placeholder: t('Select Collection'),
  options: collectionOptions.value,
  itemKey: 'uuid',
  label: 'label',
  loading: !hasCollection.value,
  canDeselect: false,
  value: collectionId.value,
}));

const configTabs: Tab[] = [{ key: 'conversation' }, { key: 'files' }];
</script>

<template>
  <div class="rag grid grid-cols-2 gap-2 h-full overflow-x-visible">
    <TitledCard
      :title="$t('Chat')"
      :dropdown="collectionsDropdownProps"
      @update:dropdown="(value) => (collectionId = value)"
    >
      <div ref="chatDomRef" class="rag--chat p-2 inline-grid auto-rows-min">
        <template v-for="h in history" :key="`${h.actor}:${h.content}`">
          <BaseText variant="h4" class="pl-1 font-display"
            >{{ h.actor.toUpperCase() }}:</BaseText
          >
          <div>
            <MarkdownRenderer class="pl-3 py-1" :source="h.content" />
            <div v-if="h.tools" class="float-right">
              <ccu-icon
                type="info"
                size="md"
                title="Info"
                class="hover:bg-crisiscleanup-light-grey transition-all cursor-pointer hover:scale-105"
                @click="() => displayMessageTools(h)"
              />
            </div>
          </div>
          <br />
        </template>
      </div>

      <template #body-header>
        <div class="flex p-3">
          <BaseInput
            v-model="question"
            :placeholder="
              isStreamingMessage
                ? t('Performing some witchcraft...')
                : t('Ask a question...')
            "
            class="w-full chat--input"
            :disabled="isStreamingMessage"
            @keyup.enter="() => doSubmitQuestion()"
          />
        </div>
      </template>
    </TitledCard>

    <div class="flex flex-col">
      <TabbedCard
        :tabs="configTabs"
        :loading="false"
        active-recall-key="rag:active:tab"
      >
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
              <div class="flex pr-1">
                <BaseText
                  variant="h4"
                  :bold="conv.conversationId === conversationId"
                  class="p-2 ws-nowrap truncate text-wrap flex-1"
                  >{{
                    truncate(conv.title.split('user: ')[1], { length: 250 })
                  }}</BaseText
                >
                <div class="mt-auto mb-auto">
                  <ccu-icon
                    type="cancel"
                    size="xs"
                    class="rounded-full hover:translate-y-[-1px] hover:scale-105 p-1 opacity-50 hover:opacity-100 z-10"
                    @click.capture="
                      () => onDeleteConversation(conv.conversationId)
                    "
                  />
                </div>
              </div>
            </div>
          </template>
        </template>
        <template #conversation-footer>
          <div
            class="flex justify-center py-2 transition-all cursor-pointer conversation__new"
          >
            <ccu-icon
              :alt="$t('adminRAG.new_conversation')"
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
  /** (2x1) column stack on small displays */
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) minmax(0, 0.25fr);
  transition: all 300ms ease-in-out;
  min-height: 90vh;
  max-height: 200vh;
}

@media screen(md) {
  .rag {
    /** 2x2 grid stack on small displays */
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.4fr);
    grid-template-rows: minmax(0, 1fr);
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

:deep(.chat--input input) {
  @apply rounded-xl !important;
  @apply transition-all;
  &:hover,
  &:focus {
    @apply ring-1 ring-primary-light;
  }
}

:deep(.card__dropdown) {
  @apply m-0 pr-2;
  div.border {
    border-width: 0;
  }
  div[aria-controls='multiselect-options'] {
    min-height: auto;
    min-width: auto;
    border: none;
    p {
      @apply pr-3;
    }
  }
}
</style>
