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
      <base-button
        :button-classes="{ 'justify-start': true, 'justify-center': false }"
        class="px-4 py-1 w-64 cursor-pointer hover:bg-primary-light"
        :action="() => createList(getLists)"
        :alt="$t('actions.create_new')"
      >
        {{ $t('actions.create_new') }}
      </base-button>
      <base-button
        v-if="selectedTableItems.length > 0"
        :button-classes="{ 'justify-start': true, 'justify-center': false }"
        class="px-4 py-1 w-64 cursor-pointer hover:bg-primary-light"
        :action="() => updateLists(userLists, selectedTableItems, null, false)"
        :alt="$t('actions.remove_from_all_lists')"
        variant="text"
      >
        {{ $t('actions.remove_from_all_lists') }}
      </base-button>
      <v-menu
        v-if="selectedTableItems.length > 0"
        placement="right-start"
        :triggers="['hover', 'focus']"
        instant-move
      >
        <div
          class="px-4 py-1 w-64 cursor-pointer hover:bg-primary-light flex gap-1 items-center justify-between"
        >
          {{ $t('actions.remove_from_list') }}
          <ccu-icon size="xs" type="arrow-right" class="inline-block" />
        </div>

        <template #popper>
          <v-menu
            placement="right-start"
            :triggers="['hover', 'focus']"
            instant-move
            :delay="500"
          >
            <div v-for="list in userLists" :key="list.id">
              <base-button
                :button-classes="{
                  'justify-start': true,
                  'justify-center': false,
                }"
                :disabled="selectedTableItems.length === 0"
                variant="text"
                class="px-4 py-1 w-64 cursor-pointer hover:bg-primary-light"
                :action="
                  () =>
                    updateLists(userLists, selectedTableItems, list.id, false)
                "
              >
                {{ list.name }}
              </base-button>
            </div>
          </v-menu>
        </template>
      </v-menu>
      <v-menu
        v-if="selectedTableItems.length > 0"
        placement="right-start"
        :triggers="['hover', 'focus']"
        instant-move
      >
        <div
          class="px-4 py-1 w-64 cursor-pointer hover:bg-primary-light flex gap-1 items-center justify-between"
        >
          {{ $t('actions.add_to_list') }}
          <ccu-icon size="xs" type="arrow-right" class="inline-block" />
        </div>

        <template #popper>
          <v-menu
            placement="right-start"
            :triggers="['hover', 'focus']"
            instant-move
            :delay="500"
          >
            <div v-for="list in userLists" :key="list.id">
              <base-button
                :button-classes="{
                  'justify-start': true,
                  'justify-center': false,
                }"
                :disabled="selectedTableItems.length === 0"
                variant="text"
                class="px-4 py-1 w-64 cursor-pointer hover:bg-primary-light"
                :action="
                  () =>
                    updateLists(userLists, selectedTableItems, list.id, true)
                "
              >
                {{ list.name }}
              </base-button>
            </div>
          </v-menu>
        </template>
      </v-menu>
      <v-menu
        placement="right-start"
        :triggers="['hover', 'focus']"
        instant-move
        :delay="500"
      >
        <div
          class="px-4 py-1 w-64 cursor-pointer hover:bg-primary-light flex gap-1 items-center justify-between"
        >
          {{ $t('actions.view') }}
          <ccu-icon size="xs" type="arrow-right" class="inline-block" />
        </div>

        <template #popper>
          <v-menu
            placement="right-start"
            :triggers="['hover', 'focus']"
            instant-move
          >
            <div v-for="list in userLists" :key="list.id" class="flex flex-col">
              <base-button
                :button-classes="{
                  'justify-start': true,
                  'justify-center': false,
                }"
                class="px-4 py-1 cursor-pointer hover:bg-primary-light flex-grow"
                :action="() => $router.push(`/lists/${list.id}`)"
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
            </div>
          </v-menu>
        </template>
      </v-menu>
      <!--      select from list-->
    </template>
  </v-popover>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted, watch } from 'vue';
import debounce from 'lodash/debounce';
import BaseButton from '@/components/BaseButton.vue';
import CcuIcon from '@/components/BaseIcon.vue';
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
  selectedTableItems: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

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
/**
 * Updates the lists based on the action to add or remove object IDs.
 * @param {Array} userLists - Array of list objects.
 * @param {Array} objectIds - Array of IDs to add or remove.
 * @param {number|null} specificListId - Specific list ID for targeted addition/removal, null for all lists.
 * @param {boolean} isAdding - Determines whether to add or remove the objectIds.
 */
const updateLists = async (userLists, objectIds, specificListId, isAdding) => {
  const updates = [];

  for (const list of userLists) {
    // Initialize object_ids as an empty array if it's null
    if (!list.object_ids) {
      list.object_ids = [];
    }

    // When removing from all lists or a specific list, or adding to a specific list
    if (specificListId === null || list.id === specificListId) {
      let updated = false;
      for (const objectId of objectIds) {
        const index = list.object_ids.indexOf(objectId);

        if (isAdding) {
          // Add only if the object ID is not already in the list
          if (index === -1) {
            list.object_ids.push(objectId);
            updated = true;
          }
        } else {
          // Remove if the object ID is in the list
          if (index !== -1) {
            list.object_ids.splice(index, 1);
            updated = true;
          }
        }
      }

      // If there are changes, add the update promise to the array
      if (updated) {
        updates.push(
          axios.put(
            `${import.meta.env.VITE_APP_API_BASE_URL}/lists/${list.id}`,
            list,
          ),
        );
      }

      // If updating a specific list, break after processing it
      if (specificListId !== null) {
        break;
      }
    }
  }

  // Execute all update calls in parallel
  try {
    await Promise.all(updates);
    $toasted.success('Lists updated successfully.');
    await getLists();
  } catch (error) {
    console.error('Error updating lists:', error);
  }
};

const getUser = (id: number) => {
  return User.find(id);
};

const { createList } = useCreateList(getLists, props.modelType);

const length = (array) => {
  if (array) {
    return array.length;
  }
  return 0;
};
</script>
