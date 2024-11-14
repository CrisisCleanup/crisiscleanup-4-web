<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue';
import axios from 'axios';
import { computed, ref, onMounted } from 'vue';
import BaseText from '@/components/BaseText.vue';
import Incident from '@/models/Incident';
import useCreateList from '@/hooks/lists/useCreateList';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

interface List {
  id: number;
  name: string;
  model: string;
  object_ids: number[];
}

// API base URL
const baseUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/lists`;
const lists = ref<List[]>([]);

const incidents = computed(() =>
  Incident.query().orderBy('start_at', 'desc').get(),
);

const { t } = useI18n();
const { createList } = useCreateList(getLists);
const router = useRouter();

const groupedLists = computed(() => {
  return lists.value.reduce((acc, list) => {
    if (!acc[list.model]) {
      acc[list.model] = [];
    }
    acc[list.model].push(list);
    return acc;
  }, {});
});

const addNewList = async () => {
  await createList();
  await getLists();
};

const getListCategory = (model) => {
  switch (model) {
    case 'worksite_worksites': {
      return t('list.worksite_lists');
    }
    case 'user_users': {
      return t('list.user_lists');
    }
    case 'organization_organizations': {
      return t('list.organization_lists');
    }
    case 'incident_incidents': {
      return t('list.incident_lists');
    }
    case 'file_files': {
      return t('list.file_lists');
    }
    case 'list_lists': {
      return t('list.list_lists');
    }
    case 'organization_organizations_incidents_teams': {
      return t('list.team_lists');
    }
    default: {
      return 'Unknown';
    }
  }
};

const getListItemName = (model) => {
  switch (model) {
    case 'worksite_worksites': {
      return t('list.worksite');
    }
    case 'user_users': {
      return t('list.user');
    }
    case 'organization_organizations': {
      return t('list.organization');
    }
    case 'incident_incidents': {
      return t('list.incident');
    }
    case 'file_files': {
      return t('list.file');
    }
    case 'list_lists': {
      return t('list.list');
    }
    case 'organization_organizations_incidents_teams': {
      return t('list.team');
    }
    default: {
      return 'Unknown';
    }
  }
};

const length = (array) => {
  if (array) {
    return array.length;
  }
  return 0;
};

async function getLists() {
  const response = await axios.get(baseUrl);
  lists.value = response.data.results;
}

const deleteList = async (listId) => {
  await axios.delete(`${baseUrl}/${listId}`);
  await getLists();
};

const printList = async (listId) => {
  await axios.get(`${baseUrl}/${listId}/print`);
};

const shareList = async (listId) => {
  await axios.get(`${baseUrl}/${listId}/share`);
};

const editList = async (listId) => {
  await router.push(`/lists/${listId}`);
};

onMounted(async () => {
  await getLists();
});
</script>

<template>
  <div class="mx-auto p-3 rounded-lg">
    <div class="flex justify-end">
      <base-button
        variant="solid"
        class="p-1"
        :action="addNewList"
        icon="plus"
        :alt="$t('actions.new')"
        >{{ $t('actions.new') }}
      </base-button>
    </div>
    <base-text variant="h1" class="my-3">{{ $t('list.my_lists') }}</base-text>
    <div v-for="model in Object.keys(groupedLists)" :key="model">
      <div class="text-xl font-bold mt-6">{{ getListCategory(model) }}</div>
      <div
        v-for="list in groupedLists[model]"
        :key="list.id"
        class="flex my-2 gap-1"
      >
        <div class="w-56">{{ list.name }}</div>
        <div class="w-56">
          {{ length(list.object_ids) }} {{ getListItemName(model) }}
        </div>
        <!--        <base-button-->
        <!--          :action="() => printList(list.id)"-->
        <!--          class="w-20 bg-crisiscleanup-dark-100"-->
        <!--        >-->
        <!--          {{ $t('actions.print') }}-->
        <!--        </base-button>-->
        <!--        <base-button-->
        <!--          :action="() => shareList(list.id)"-->
        <!--          class="w-20 bg-crisiscleanup-dark-100"-->
        <!--        >-->
        <!--          {{ $t('actions.share') }}-->
        <!--        </base-button>-->
        <base-button
          :action="() => editList(list.id)"
          class="w-20 bg-crisiscleanup-dark-100"
          :alt="$t('actions.edit')"
        >
          {{ $t('actions.edit') }}
        </base-button>
        <base-button
          class="w-20 bg-crisiscleanup-dark-100"
          :action="() => deleteList(list.id)"
          :alt="$t('actions.delete')"
        >
          {{ $t('actions.delete') }}
        </base-button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
