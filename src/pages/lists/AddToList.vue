<template>
  <div>
    <BaseInput v-model.debounce="search" placeholder="Search" class="mb-2" />
    <div v-for="list in userLists" :key="list.id">
      <BaseCheckbox
        :model-value="list.object_ids?.includes(props.objectId)"
        @update:model-value="handleCheckboxChange(list.id, $event)"
      >
        {{ list.name }}
      </BaseCheckbox>
    </div>
    <div
      v-if="userLists.length === 0"
      class="italic text-crisiscleanup-dark-100"
    >
      {{ $t('list.no_lists_found') }}
    </div>
    <base-button
      :action="createList"
      :alt="$t('list.create')"
      class="mt-2 p-1 w-full"
      variant="solid"
    >
      {{ $t('list.create') }}
    </base-button>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted, watch } from 'vue';
import debounce from 'lodash/debounce';
import useCreateList from '@/hooks/lists/useCreateList';
import BaseButton from '@/components/BaseButton.vue';

interface List {
  id: number;
  name: string;
  object_ids?: number[];
}

const props = defineProps({
  modelType: String,
  incident: Number,
  objectId: {
    type: Number,
    required: true,
  },
});

const { createList } = useCreateList(getLists, props.modelType);

const userLists = ref<List[]>([]);

const baseUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/lists`;

async function getLists() {
  try {
    const response = await axios.get<{ results: List[] }>(baseUrl, {
      params: {
        incident: props.incident,
        model: props.modelType,
      },
    });
    userLists.value = response.data.results;
  } catch (error) {
    console.error('Error fetching user lists:', error);
  }
}

onMounted(async () => {
  await getLists();
});

const search = ref('');

watch(
  search,
  debounce(async (value: string) => {
    try {
      const response = await axios.get<{ results: List[] }>(baseUrl, {
        params: {
          incident: props.incident,
          model: props.modelType,
          search: value,
        },
      });
      userLists.value = response.data.results;
    } catch (error) {
      console.error('Error fetching user lists:', error);
    }
  }, 300),
);

const handleCheckboxChange = async (listId: number, isChecked: boolean) => {
  if (isChecked) {
    const list = userLists.value.find((list) => list.id === listId);
    if (list) {
      list.object_ids = list.object_ids || [];
      if (!list.object_ids.includes(props.objectId)) {
        list.object_ids.push(props.objectId);
        try {
          await axios.put(
            `${import.meta.env.VITE_APP_API_BASE_URL}/lists/${listId}`,
            list,
          );
        } catch (error) {
          console.error('Error updating list:', error);
        }
      }
    }
  } else {
    const list = userLists.value.find((list) => list.id === listId);
    if (list) {
      list.object_ids = list.object_ids || [];
      if (list.object_ids.includes(props.objectId)) {
        list.object_ids = list.object_ids.filter((id) => id !== props.objectId);
        try {
          await axios.put(
            `${import.meta.env.VITE_APP_API_BASE_URL}/lists/${listId}`,
            list,
          );
        } catch (error) {
          console.error('Error updating list:', error);
        }
      }
    }
  }
};
</script>
