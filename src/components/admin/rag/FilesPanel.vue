<script setup lang="ts">
import { useToast } from 'vue-toastification';
import DragDrop from '@/components/DragDrop.vue';
import MoveFileDialog from './MoveFileDialog.vue';
import { useRAGUpload, type CCUDocumentFileItem } from '@/hooks';
import useDialogs from '@/hooks/useDialogs';
import { getAndToastErrorMessage } from '@/utils/errors';

const props = defineProps<{
  collectionId: string | undefined;
}>();

const { t } = useI18n();
const toast = useToast();
const { confirm, component } = useDialogs();

const collectionIdRef = toRef(props, 'collectionId');

const {
  uploadFile,
  collectionDocuments,
  deleteFile,
  isDocumentsLoading,
  updateFile,
} = useRAGUpload(collectionIdRef);

const allCollectionFileIds = useStorage<Record<string, number[]>>(
  'rag:active:fileIds',
  {},
  localStorage,
  { writeDefaults: false, listenToStorageChanges: false },
);

const currentActiveFileIds = computed<Set<number>>(
  () =>
    new Set<number>(
      allCollectionFileIds.value?.[props.collectionId as string] ?? [],
    ),
);

whenever(collectionDocuments, (newValue: CCUDocumentFileItem[] | undefined) => {
  if (!props.collectionId) return;
  const validFileIds = new Set<number>(newValue?.map((doc) => doc.id) ?? []);
  const hasCurrent = currentActiveFileIds.value.size > 0;
  allCollectionFileIds.value = {
    ...allCollectionFileIds.value,
    [props.collectionId]: hasCurrent
      ? [...currentActiveFileIds.value].filter((id) => validFileIds.has(id))
      : [...validFileIds],
  };
});

const search = ref('');

const filteredFiles = computed<CCUDocumentFileItem[]>(() => {
  const all = collectionDocuments.value ?? [];
  if (!search.value) return all;
  const q = search.value.toLowerCase();
  return all.filter(
    (f: CCUDocumentFileItem) =>
      f.filenameOriginal.toLowerCase().includes(q) ||
      (f.attr?.virtualPath ?? '').toLowerCase().includes(q),
  );
});

const totalCount = computed(() => collectionDocuments.value?.length ?? 0);

const allShownActive = computed(() => {
  if (filteredFiles.value.length === 0) return false;
  return filteredFiles.value.every((f: CCUDocumentFileItem) =>
    currentActiveFileIds.value.has(f.id),
  );
});

const toggleFile = (fileId: number, toActive?: boolean) => {
  if (!props.collectionId) return;
  const isActive = currentActiveFileIds.value.has(fileId);
  let next: number[];
  if (isActive && (toActive === false || toActive === undefined)) {
    const values = new Set<number>(currentActiveFileIds.value);
    values.delete(fileId);
    next = [...values];
  } else {
    next = [...currentActiveFileIds.value, fileId];
  }
  allCollectionFileIds.value[props.collectionId] = next;
};

const toggleAllShown = () => {
  if (!props.collectionId) return;
  const ids = filteredFiles.value.map((f: CCUDocumentFileItem) => f.id);
  const everyActive = allShownActive.value;
  const baseline = currentActiveFileIds.value;
  if (everyActive) {
    const next = new Set<number>(baseline);
    for (const id of ids) next.delete(id);
    allCollectionFileIds.value[props.collectionId] = [...next];
  } else {
    const next = new Set<number>(baseline);
    for (const id of ids) next.add(id);
    allCollectionFileIds.value[props.collectionId] = [...next];
  }
};

const deleteActiveFiles = async () => {
  const result = await confirm({
    title: t('actions.confirm'),
    content: t('adminRAG.confirm_delete_files'),
    actions: {
      no: { text: t('actions.cancel'), type: 'outline', size: 'medium' },
      yes: {
        text: t('adminRAG.delete_files_with_count'),
        variant: 'solid',
        size: 'medium',
      },
    },
  });
  if (result !== 'yes') {
    toast.warning(t('actions.cancelled'));
    return;
  }
  await deleteFile(...currentActiveFileIds.value)
    .then(() => toast.success(t('adminRAG.files_deleted')))
    .catch(getAndToastErrorMessage);
  if (props.collectionId) allCollectionFileIds.value[props.collectionId] = [];
};

const uploadsQueue = ref<Blob[]>([]);
const hasUploadsQueue = computed(() => uploadsQueue.value.length > 0);
whenever(hasUploadsQueue, async () => {
  await Promise.allSettled(
    uploadsQueue.value.map((file: Blob) =>
      uploadFile(file).catch((error: unknown) =>
        getAndToastErrorMessage(error),
      ),
    ),
  ).finally(() => {
    uploadsQueue.value = [];
  });
});

const moveFile = async (file: CCUDocumentFileItem) => {
  const draft = ref(file.attr?.virtualPath ?? '');
  const result = await component({
    title: t('adminRAG.move_to_folder'),
    component: MoveFileDialog,
    modalClasses: 'bg-white max-w-md shadow',
    props: { documentFile: file, modelValue: draft.value },
    listeners: {
      'update:modelValue': (v: string) => {
        draft.value = v;
      },
    },
  });
  if (result !== 'ok') {
    toast.warning(t('adminRAG.file_move_cancelled'));
    return;
  }
  const next = draft.value;
  if (next === file.attr?.virtualPath) return;
  file.attr = { ...file.attr, virtualPath: next };
  await updateFile(file, { virtualPath: next });
  toast.success(t('adminRAG.file_move_to') + next, {
    pauseOnFocusLoss: false,
    timeout: 2000,
  });
};

const formatExt = (filename: string): string => {
  const m = /\.([^.]+)$/.exec(filename);
  return m ? m[1].toUpperCase() : 'FILE';
};
</script>

<template>
  <div class="ccu-rag-files-panel max-w-5xl mx-auto flex flex-col gap-4">
    <!-- Drop zone -->
    <section
      class="bg-white rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors"
    >
      <DragDrop
        class="ccu-rag-dropzone block w-full px-6 py-8 text-center"
        :choose-title="t('~~Click to browse')"
        :drag-title="t('~~Drop files to upload')"
        @files="(files: Blob[]) => uploadsQueue.push(...files)"
      >
        <div
          v-if="isDocumentsLoading || uploadsQueue.length > 0"
          class="flex items-center justify-center gap-2 text-sm text-slate-600"
        >
          <Spinner />
          <span>{{ $t('~~Uploading…') }}</span>
        </div>
        <div v-else class="flex flex-col items-center gap-2 text-slate-500">
          <ccu-icon type="up" size="lg" class="opacity-60" />
          <p class="text-sm font-semibold text-slate-700">
            {{ $t('~~Drop files here or click to browse') }}
          </p>
          <p class="text-xs">
            {{ $t('~~PDF, DOCX, TXT, MD up to several MB.') }}
          </p>
        </div>
      </DragDrop>
    </section>

    <!-- File list card -->
    <section class="bg-white rounded-lg border border-slate-200 shadow-sm">
      <header
        class="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-slate-200"
      >
        <div>
          <h3 class="text-sm font-bold text-slate-900">
            {{ $t('~~Files') }}
            <span class="ml-1 text-slate-400 font-normal">
              ({{ totalCount.toLocaleString() }})
            </span>
          </h3>
          <p
            v-if="currentActiveFileIds.size > 0"
            class="text-xs text-slate-500"
          >
            {{ currentActiveFileIds.size }} {{ $t('~~active in retrieval') }}
          </p>
        </div>
        <div class="sm:ml-auto flex items-center gap-2 w-full sm:w-auto">
          <input
            v-model="search"
            type="search"
            :placeholder="t('actions.search')"
            class="h-9 flex-1 sm:w-64 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm focus:bg-white focus:border-slate-400 focus:outline-none"
          />
          <BaseButton
            variant="outline"
            size="sm"
            ccu-icon="trash"
            icon-size="sm"
            :text="t('actions.delete')"
            :disabled="currentActiveFileIds.size === 0"
            :action="deleteActiveFiles"
          />
        </div>
      </header>

      <!-- Header row -->
      <div
        v-if="filteredFiles.length > 0"
        class="grid grid-cols-12 items-center gap-3 px-4 py-2 border-b border-slate-100 text-[11px] uppercase tracking-wide font-semibold text-slate-500 bg-slate-50"
      >
        <div class="col-span-1 flex items-center">
          <input
            type="checkbox"
            :checked="allShownActive"
            class="rounded border-slate-300"
            @change="toggleAllShown"
          />
        </div>
        <div class="col-span-7 sm:col-span-7">{{ $t('~~Name') }}</div>
        <div class="col-span-3 hidden sm:block">{{ $t('~~Folder') }}</div>
        <div class="col-span-1 text-right pr-2">&nbsp;</div>
      </div>

      <!-- File rows -->
      <ul
        v-if="filteredFiles.length > 0"
        class="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto"
      >
        <li
          v-for="file in filteredFiles"
          :key="file.id"
          class="grid grid-cols-12 items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
          @click="toggleFile(file.id)"
        >
          <div class="col-span-1 flex items-center" @click.stop>
            <input
              type="checkbox"
              :checked="currentActiveFileIds.has(file.id)"
              class="rounded border-slate-300"
              @change="toggleFile(file.id)"
            />
          </div>
          <div class="col-span-7 flex items-center gap-2 min-w-0">
            <span
              class="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase"
            >
              {{ formatExt(file.filenameOriginal) }}
            </span>
            <span
              class="truncate text-sm text-slate-900"
              :title="file.filenameOriginal"
            >
              {{ file.filenameOriginal }}
            </span>
          </div>
          <div
            class="col-span-3 hidden sm:block text-xs text-slate-500 truncate"
            :title="file.attr?.virtualPath ?? ''"
          >
            {{ file.attr?.virtualPath || '—' }}
          </div>
          <div class="col-span-1 text-right">
            <button
              type="button"
              class="opacity-50 hover:opacity-100 text-slate-500 hover:text-slate-900 px-2"
              :title="t('adminRAG.move_to_folder')"
              @click.stop="moveFile(file)"
            >
              <ccu-icon type="folder" size="xs" fa />
            </button>
          </div>
        </li>
      </ul>
      <div v-else class="px-6 py-10 text-center text-sm text-slate-500">
        <p v-if="search">
          {{ $t('~~No files match the search.') }}
        </p>
        <p v-else>{{ $t('~~No files uploaded yet.') }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
:deep(.ccu-rag-dropzone) {
  background: transparent !important;
  border: 0 !important;
}
</style>
