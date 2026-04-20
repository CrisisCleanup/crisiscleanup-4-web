<template>
  <section class="flex">
    <DragDrop
      v-if="!disableImageUpload"
      class="w-20 h-20 border-solid border-2"
      data-testid="testImageUploaderFile"
      :disabled="uploading"
      @files="handleFileUpload"
    >
      <div class="flex items-center justify-center">
        <spinner v-if="uploading" size="lg" />
        <font-awesome-icon
          v-else
          size="lg"
          icon="camera"
          :alt="$t('formLabels.upload_photos')"
        />
      </div>
    </DragDrop>

    <div class="flex flex-wrap">
      <ImageModal
        :image-list="imageList"
        :disable-modal="disableModal"
        data-testid="testImageUploaderModal"
        @remove-image="deleteFile"
      />
    </div>
  </section>
</template>

<script lang="ts">
import _ from 'lodash';
import { defineAsyncComponent } from 'vue';
import { useToast } from 'vue-toastification';
import DragDrop from '../DragDrop.vue';
import Worksite from '../../models/Worksite';
import { getErrorMessage } from '../../utils/errors';
import { uploadFile } from '../../utils/file';

const ImageModal = defineAsyncComponent(() => import('../ImageModal.vue'));

interface Props {
  disableImageUpload: boolean;
  worksite: any; // TODO: Replace with proper Worksite type if available
  isPrintToken: boolean;
  isSurvivorToken: boolean;
  disableModal: boolean;
}

export default defineComponent({
  name: 'WorksiteImageSection',
  components: {
    DragDrop,
    ImageModal,
  },
  props: {
    disableImageUpload: {
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
    disableModal: {
      type: Boolean,
      default: false,
    },
  },

  setup(
    props: Props,
    { emit }: { emit: (event: string, ...args: any[]) => void },
  ) {
    const uploading = ref(false);
    const localImages = ref([]);
    const imageList = computed(() => {
      if (props.worksite?.id || props.worksite?.token) {
        return (
          props.worksite?.files?.filter(
            (file: any) => file.file_type_t !== 'fileTypes.supporting_document',
          ) ?? []
        );
      }
      return localImages.value;
    });
    const $toasted = useToast();

    function changeImage(image: any) {
      emit('changeImage', image);
    }

    function imageClick(image: any) {
      emit('image-click', image);
    }

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
      formData.append('type_t', 'fileTypes.worksite_photo');
      uploading.value = true;
      try {
        const result = await uploadFile(formData);
        const file = result.data.id;
        emit('updateFiles', result.data);
        if (props.worksite.id || props.worksite.token) {
          await saveToWorkSite(file, props.worksite.id, props.worksite.token);
        } else {
          localImages.value.push(result.data);
        }

        emit('photosChanged');
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      } finally {
        uploading.value = false;
      }
    }

    async function deleteFile(fileId: any, id: any) {
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
        const i = _.findIndex(localImages.value, (c: any) => {
          return c.id === id;
        });
        localImages.value.splice(i, 1);
        emit('popLocal', localImages.value);
      }

      emit('photosChanged');
    }

    return {
      imageList,
      uploading,
      changeImage,
      imageClick,
      handleFileUpload,
      saveToWorkSite,
      deleteFile,
    };
  },
});
</script>
