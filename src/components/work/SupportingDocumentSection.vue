<template>
  <section class="flex flex-col">
    <DragDrop
      v-if="!disableDocumentUpload"
      class="w-full h-12 border-solid border-2"
      data-testid="testDocumentUploaderFile"
      :disabled="uploading"
      @files="handleFileUpload"
    >
      <div class="flex items-center justify-center">
        <spinner v-if="uploading" size="lg" />
        <font-awesome-icon
          v-else
          size="lg"
          icon="file"
          :alt="$t('formLabels.upload_documents')"
        />
      </div>
    </DragDrop>

    <div class="flex flex-wrap mt-4">
      <div
        v-for="file in documentList"
        :key="file.id"
        class="flex items-center mb-4 w-full"
      >
        <div
          class="flex items-center bg-white p-2 border rounded w-full justify-between"
        >
          <div class="flex items-center">
            <font-awesome-icon
              class="text-crisiscleanup-dark-400 mr-2"
              size="lg"
              icon="file"
            />
            <a
              :href="file.general_file_url"
              class="text-sm mr-2 text-blue-600 hover:text-blue-800 hover:underline"
              target="_blank"
              download
            >
              {{ file.filename_original }}
            </a>
          </div>
          <button
            v-if="!disableDocumentUpload"
            class="text-red-500 hover:text-red-700"
            @click="deleteFile(file.file)"
          >
            <font-awesome-icon icon="times" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { useToast } from 'vue-toastification';
import DragDrop from '../DragDrop.vue';
import Worksite from '../../models/Worksite';
import { getErrorMessage } from '../../utils/errors';
import { uploadFile } from '../../utils/file';

interface Props {
  disableDocumentUpload: boolean;
  worksite: Worksite & { token?: string };
  isPrintToken: boolean;
  isSurvivorToken: boolean;
}

export default defineComponent({
  name: 'SupportingDocumentSection',
  components: {
    DragDrop,
  },
  props: {
    disableDocumentUpload: {
      type: Boolean,
      default: false,
    },
    worksite: {
      type: Object,
    },
    isPrintToken: {
      type: Boolean,
    },
    isSurvivorToken: {
      type: Boolean,
    },
  },

  setup(
    props: Props,
    { emit }: { emit: (event: string, ...args: any[]) => void },
  ) {
    const uploading = ref(false);
    const localDocuments = ref([]);
    const documentList = computed(() => {
      if (props.worksite?.id || props.worksite?.token) {
        return (
          props.worksite.files?.filter(
            (file: any) => file.file_type_t === 'fileTypes.supporting_document',
          ) ?? []
        );
      }
      return localDocuments.value;
    });
    const $toasted = useToast();

    async function saveToWorkSite(file: any, id: any, token: any) {
      if (props.isPrintToken) {
        await Worksite.api().addFileWithToken(token, file);
      } else if (props.isSurvivorToken) {
        await Worksite.api().addFileWithSurvivorToken(token, file);
      } else {
        await Worksite.api().addFile(id, file);
        await Worksite.api().fetch(id);
      }
    }

    async function handleFileUpload(fileList: any) {
      if (fileList.length === 0) {
        uploading.value = false;
        return;
      }

      const formData = new FormData();
      formData.append('upload', fileList[0]);
      formData.append('type_t', 'fileTypes.supporting_document');
      uploading.value = true;
      try {
        const result = await uploadFile(formData);
        const file = result.data.id;
        emit('updateFiles', result.data);
        if (props.worksite.id || props.worksite.token) {
          await saveToWorkSite(file, props.worksite.id, props.worksite.token);
        } else {
          localDocuments.value.push(result.data);
        }

        emit('documentsChanged');
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      } finally {
        uploading.value = false;
      }
    }

    async function deleteFile(fileId: any) {
      if (props.worksite) {
        if (props.isSurvivorToken) {
          await Worksite.api().deleteFileWithSurvivorToken(
            props.worksite.token,
            fileId,
          );
        } else {
          await Worksite.api().deleteFile(props.worksite.id, fileId);
          await Worksite.api().fetch(props.worksite.id);
        }
      } else {
        const index = localDocuments.value.findIndex(
          (file: any) => file.id === fileId,
        );
        if (index !== -1) {
          localDocuments.value.splice(index, 1);
        }
      }

      emit('documentsChanged');
    }

    return {
      documentList,
      uploading,
      handleFileUpload,
      deleteFile,
    };
  },
});
</script>
