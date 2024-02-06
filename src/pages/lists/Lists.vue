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
      return t('~~Worksite Lists');
    }
    case 'user_users': {
      return t('~~User Lists');
    }
    case 'organization_organizations': {
      return t('~~Organization Lists');
    }
    case 'incident_incidents': {
      return t('~~Incident Lists');
    }
    case 'file_files': {
      return t('~~File Lists');
    }
    case 'list_lists': {
      return t('~~List Lists');
    }
    case 'organization_organizations_incidents_teams': {
      return t('~~Teams Lists');
    }
    default: {
      return 'Unknown';
    }
  }
};

const getListItemName = (model) => {
  switch (model) {
    case 'worksite_worksites': {
      return t('~~Worksite');
    }
    case 'user_users': {
      return t('~~User');
    }
    case 'organization_organizations': {
      return t('~~Organization');
    }
    case 'incident_incidents': {
      return t('~~Incident');
    }
    case 'file_files': {
      return t('~~File');
    }
    case 'list_lists': {
      return t('~~List');
    }
    case 'organization_organizations_incidents_teams': {
      return t('~~Team');
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
      <base-button variant="solid" class="p-1" :action="addNewList" icon="plus"
        >{{ $t('~~Add New List') }}
      </base-button>
    </div>
    <base-text variant="h1" class="my-3">{{ $t('~~My Lists') }}</base-text>
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
        <base-button
          :action="() => printList(list.id)"
          class="w-20 bg-crisiscleanup-dark-100"
        >
          {{ $t('~~Print') }}
        </base-button>
        <base-button
          :action="() => shareList(list.id)"
          class="w-20 bg-crisiscleanup-dark-100"
        >
          {{ $t('~~Share') }}
        </base-button>
        <base-button
          :action="() => editList(list.id)"
          class="w-20 bg-crisiscleanup-dark-100"
        >
          {{ $t('~~Edit') }}
        </base-button>
        <base-button
          class="w-20 bg-crisiscleanup-dark-100"
          :action="() => deleteList(list.id)"
        >
          {{ $t('~~Delete') }}
        </base-button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
