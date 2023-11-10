<template>
  <div class="p-3">
    <div class="flex gap-2 items-center justify-between">
      <base-select
        class="flex-1"
        :placeholder="$t('adminCMS.select_library')"
        data-testid=""
        searchable
        item-key="id"
        label="title"
        :options="onLibrarySearch"
        object
        @update:model-value="
          (value: string) => {
            onLibrarySelected(value);
          }
        "
      ></base-select>
      <DragDrop
        data-testid="testLibraryFileUpload"
        :disabled="uploading"
        class="cursor-pointer h-12"
        @files="handleFileUpload"
      >
        <base-button
          :title="$t('actions.upload')"
          :text="$t('actions.upload')"
          variant="solid"
          class="h-12 flex-1 p-1"
          :disabled="!selectedLibrary"
        />
      </DragDrop>
    </div>
    <div v-if="selectedLibrary" class="mt-3">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <div
          v-for="image in selectedLibrary.files"
          :key="image.id"
          class="border cursor-pointer"
          :class="
            isItemSelected(image)
              ? 'border-4 border-crisiscleanup-dark-100'
              : ''
          "
        >
          <img
            :src="image.blog_url"
            :alt="image.description"
            class="w-full h-32"
            @click="toggleItemSelection(image)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';
import { getErrorMessage } from '@/utils/errors';
import { useToast } from 'vue-toastification';
import DragDrop from '@/components/DragDrop.vue';
import { useI18n } from 'vue-i18n';
import BaseButton from '@/components/BaseButton.vue';

export default defineComponent({
  name: 'CmsLibrary',
  components: { BaseButton, DragDrop },
  emits: ['update:selectedItems'],
  setup(props, { emit }) {
    const $toasted = useToast();
    const { t } = useI18n();

    const uploading = ref(false);
    const selectedLibrary = ref(null);
    const selectedItems = ref([]);

    const onLibrarySearch = async (search: string) => {
      return axios
        .get(`${import.meta.env.VITE_APP_API_BASE_URL}/admins/libraries`, {
          params: {
            limit: 10,
            title__istartswith: search,
            fields: 'id,title',
          },
        })
        .then((response) => {
          return response.data.results;
        });
    };

    const onLibrarySelected = async (value: string) => {
      if (!value) {
        selectedLibrary.value = null;
        return;
      }
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/admins/libraries/${value.id}`,
      );
      selectedLibrary.value = response.data;
    };

    const toggleItemSelection = (item) => {
      const index = selectedItems.value.findIndex((i) => i.id === item.id);
      if (index === -1) {
        selectedItems.value.push(item);
      } else {
        selectedItems.value.splice(index, 1);
      }

      emit('update:selectedItems', selectedItems.value);
    };

    const isItemSelected = (item) => {
      return selectedItems.value.findIndex((i) => i.id === item.id) !== -1;
    };

    async function handleFileUpload(e) {
      const fileList = e;
      if (fileList.length === 0) {
        uploading.value = false;
        return;
      }

      const formData = new FormData();
      formData.append('upload', fileList[0]);
      formData.append('type_t', 'fileTypes.other_file');
      uploading.value = true;
      try {
        const result = await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/files`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Accept: 'application/json',
            },
          },
        );

        await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/admins/libraries/${
            selectedLibrary.value.id
          }/files`,
          {
            file: result.data.id,
          },
        );

        $toasted.success(t('info.upload_file_successful'));
      } catch (error) {
        $toasted.error(getErrorMessage(error));
      } finally {
        uploading.value = false;
      }
    }

    const addFile = async (file: File) => {
      return;
    };

    return {
      onLibrarySearch,
      onLibrarySelected,
      handleFileUpload,
      uploading,
      selectedLibrary,
      toggleItemSelection,
      isItemSelected,
    };
  },
});
</script>

<style lang="postcss">
.cms-viewer {
  &__content {
    @apply text-lg;
    a {
      text-decoration: underline !important;
    }
  }
}
</style>
