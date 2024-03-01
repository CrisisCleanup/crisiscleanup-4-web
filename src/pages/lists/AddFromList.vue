<template>
  <v-popover placement="bottom-start">
    <base-button
      action="add"
      suffix-icon="caret-down"
      class="ml-3 my-3 border border-1.5 border-black p-1 px-4 bg-white"
    >
      {{ title }}
    </base-button>
    <template #popper>
      <v-menu
        placement="right-start"
        :triggers="['hover', 'focus']"
        instant-move
      >
        <div class="flex flex-col cursor-pointer">
          <base-button
            v-for="list in userLists"
            :key="list.id"
            :button-classes="{
              'justify-start': true,
              'justify-center': false,
            }"
            class="px-4 py-1 hover:bg-primary-light flex-grow"
            :action="() => $emit('add-from-list', list.object_ids)"
          >
            <div class="flex items-center gap-2 w-full">
              <span class="w-40 text-left">{{ list.name }}</span>
              <span class="w-40">
                {{ getUser(list.created_by).first_name }}
              </span>
              <span class="">
                {{ length(list.object_ids) }} {{ $t('list.items') }}
              </span>
            </div>
          </base-button>
          <base-button
            :button-classes="{ 'justify-start': true, 'justify-center': false }"
            class="px-4 py-1 cursor-pointer hover:bg-primary-light flex-grow"
            :action="() => createList(getLists)"
          >
            {{ $t('list.create') }}
          </base-button>
        </div>
      </v-menu>
    </template>
  </v-popover>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted, watch } from 'vue';
import BaseButton from '@/components/BaseButton.vue';
import { useToast } from 'vue-toastification';
import User from '@/models/User';
import useCreateList from '@/hooks/lists/useCreateList';

interface List {
  id: number;
  name: string;
  object_ids?: number[];
  created_by?: number;
}

const props = defineProps({
  modelType: String,
  incident: Number,
  title: {
    type: String,
    required: true,
  },
});

defineEmits(['add-from-list']);

const userLists = ref<List[]>([]);
const $toasted = useToast();

const baseUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/lists`;

async function getUsers(userIds) {
  await User.api().get(`/users?id__in=${userIds.join(',')}`, {
    dataKey: 'results',
  });
}
async function getLists() {
  try {
    const response = await axios.get<{ results: List[] }>(baseUrl, {
      params: {
        incident: props.incident,
        model: props.modelType,
      },
    });
    userLists.value = response.data.results;
    const userIds = [];
    for (const list of userLists.value) {
      userIds.push(list.created_by);
    }
    await getUsers(userIds);
  } catch (error) {
    console.error('Error fetching user lists:', error);
  }
}
onMounted(async () => {
  await getLists();
});

const getUser = (id: number) => {
  return User.find(id);
};

const length = (array) => {
  if (array) {
    return array.length;
  }
  return 0;
};
const { createList } = useCreateList(getLists, props.modelType);
</script>
