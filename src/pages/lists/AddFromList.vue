<template>
  <v-popover placement="bottom-start">
    <!-- Main trigger button -->
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
        <div class="flex flex-col p-2 space-y-1">
          <!-- Each list is a submenu trigger -->
          <div
            v-for="list in userLists"
            :key="list.id"
            class="border-b border-gray-300 pb-1"
          >
            <v-menu
              placement="right-start"
              :triggers="['hover', 'focus']"
              instant-move
            >
              <!-- List Name/Creator/Item Count Row -->
              <div
                class="flex items-center gap-2 py-1 w-full cursor-pointer hover:bg-primary-light"
              >
                <span class="font-bold">{{ list.name }}</span>
                <span v-if="list._creator" class="text-sm text-gray-600">
                  ({{ list._creator.first_name }})
                </span>
                <span class="text-sm ml-auto">
                  {{ list._items?.length || 0 }} {{ $t('list.items') }}
                </span>
              </div>

              <template #popper>
                <v-menu
                  placement="right-start"
                  :triggers="['hover', 'focus']"
                  instant-move
                >
                  <div class="flex flex-col w-64 p-3">
                    <!-- Items Loop -->
                    <template v-if="list._items && list._items.length > 0">
                      <div
                        v-for="item in list._items"
                        :key="item.id"
                        class="px-4 py-1 cursor-pointer hover:bg-primary-light flex items-center gap-2"
                        @click.stop="$emit('add-item', item)"
                      >
                        <span v-if="list.model === 'worksite_worksites'">
                          {{ item.case_number }} - {{ item.name }}
                        </span>
                        <span v-else-if="list.model === 'user_users'">
                          {{ item.first_name }} {{ item.last_name }}
                          <span v-if="item.organization?.name">
                            ({{ item.organization.name }})
                          </span>
                        </span>
                        <span
                          v-else-if="
                            list.model === 'organization_organizations'
                          "
                        >
                          {{ item.name }}
                        </span>
                        <span v-else-if="list.model === 'incident_incidents'">
                          {{ item.name }}
                        </span>
                        <span v-else-if="list.model === 'file_files'">
                          {{ item.name }}
                        </span>
                        <span v-else-if="list.model === 'list_lists'">
                          {{ item.name }}
                        </span>
                        <span
                          v-else-if="
                            list.model ===
                            'organization_organizations_incidents_teams'
                          "
                        >
                          {{ item.name }}
                        </span>
                      </div>
                    </template>

                    <!-- No Items -->
                    <div v-else class="px-4 py-1 text-sm text-gray-500">
                      {{ $t('list.no_items_in_list') }}
                    </div>

                    <!-- Add all items -->
                    <base-button
                      v-if="list._items?.length"
                      class="mt-1 w-full"
                      variant="outline"
                      :action="() => $emit('add-from-list', list.object_ids)"
                    >
                      {{ $t('actions.add_all') }}
                    </base-button>
                  </div>
                </v-menu>
              </template>
            </v-menu>
          </div>

          <!-- Create New List -->
          <base-button
            class="px-4 py-1 cursor-pointer hover:bg-primary-light"
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
import BaseButton from '@/components/BaseButton.vue';
import { useToast } from 'vue-toastification';
import User from '@/models/User';
import useCreateList from '@/hooks/lists/useCreateList';

interface List {
  id: number;
  name: string;
  model: string;
  object_ids?: number[];
  created_by?: number;
  _items?: any[];
  _creator?: any;
}

const props = defineProps({
  modelType: String,
  incident: Number,
  title: {
    type: String,
    required: true,
  },
});

defineEmits(['add-from-list', 'add-item']);

const userLists = ref<List[]>([]);
const baseUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/lists`;
const $toasted = useToast();

onMounted(() => {
  getLists();
});

async function getLists() {
  try {
    const { data } = await axios.get<{ results: List[] }>(baseUrl, {
      params: {
        incident: props.incident,
        model: props.modelType,
      },
    });
    userLists.value = data.results;
    for (const list of userLists.value) {
      await fetchItemsForList(list);
      if (list.created_by) {
        list._creator = User.find(list.created_by);
      }
    }
  } catch (error) {
    console.error('Error fetching lists:', error);
  }
}

async function fetchItemsForList(list: List) {
  if (!list.object_ids?.length) {
    list._items = [];
    return;
  }
  switch (list.model) {
    case 'worksite_worksites': {
      list._items = await fetchModelOptions(
        '',
        'worksites',
        'id,name,case_number,incident,work_types',
        list.object_ids.join(','),
        props.incident,
      );
      break;
    }
    case 'user_users': {
      list._items = await fetchModelOptions(
        '',
        'users',
        'id,first_name,last_name,organization',
        list.object_ids.join(','),
      );
      break;
    }
    case 'organization_organizations': {
      list._items = await fetchModelOptions(
        '',
        'organizations',
        'id,name',
        list.object_ids.join(','),
      );
      break;
    }
    case 'incident_incidents': {
      list._items = await fetchModelOptions(
        '',
        'incidents',
        'id,name',
        list.object_ids.join(','),
      );
      break;
    }
    case 'file_files': {
      list._items = await fetchModelOptions(
        '',
        'files',
        'id,name',
        list.object_ids.join(','),
      );
      break;
    }
    case 'list_lists': {
      list._items = await fetchModelOptions(
        '',
        'lists',
        'id,name',
        list.object_ids.join(','),
      );
      break;
    }
    case 'organization_organizations_incidents_teams': {
      list._items = await fetchModelOptions(
        '',
        'teams',
        'id,name',
        list.object_ids.join(','),
      );
      break;
    }
    default: {
      list._items = [];
    }
  }
}

async function fetchModelOptions(
  value: string,
  endpoint: string,
  fields: string,
  idIn = '',
  incident = null,
) {
  const params: Record<string, any> = { fields, limit: 10 };
  if (value) params.search = value;
  if (idIn) params.id__in = idIn;
  if (incident) params.incident = incident;
  const { data } = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/${endpoint}`,
    { params },
  );
  return data.results;
}

const { createList } = useCreateList(getLists, props.modelType);
</script>
