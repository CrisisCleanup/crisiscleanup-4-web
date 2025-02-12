<template>
  <div class="max-w-4xl mx-auto p-6 rounded-lg">
    <h2 class="text-xl font-bold mb-4">Edit List Details</h2>
    <form class="space-y-6" @submit.prevent="updateList">
      <BaseInput
        v-model="currentList.name"
        label="Name"
        placeholder="Enter list name"
        class="focus:border-blue-500"
      />
      <BaseInput
        v-model="currentList.description"
        label="Description"
        placeholder="Enter list description"
        class="focus:border-blue-500"
        text-area
        :rows="4"
      />
      <BaseInput
        v-model="currentList.model"
        label="List Type"
        placeholder="Enter list type"
        class="focus:border-blue-500"
        disabled
      />
      <!-- Incident Select (optional) -->
      <base-select
        v-model="currentList.incident"
        data-testid="testIncidentSelect"
        class="my-2"
        :options="incidents"
        searchable
        item-key="id"
        label="name"
        :placeholder="$t('actions.select_incident')"
      />

      <!-- Save Changes Button -->
      <BaseButton
        type="submit"
        variant="solid"
        class="w-full p-3"
        :action="updateList"
        >{{ $t('actions.save') }}</BaseButton
      >
    </form>

    <div class="mt-10">
      <h3 class="text-xl font-bold mb-4">Add Item to List</h3>
      <BaseSelect
        v-model="selectedItemId"
        :options="MODEL_TO_OPTIONS[currentList.model]?.options"
        :label="MODEL_TO_OPTIONS[currentList.model]?.label"
        :item-key="MODEL_TO_OPTIONS[currentList.model]?.itemKey"
        :placeholder="MODEL_TO_OPTIONS[currentList.model]?.placeholder"
        searchable
      >
        <template
          v-if="currentList.model === 'worksite_worksites'"
          #option="{ option }"
        >
          <span>{{ option.case_number }} - {{ option.name }}</span>
        </template>
        <template
          v-else-if="currentList.model === 'user_users'"
          #option="{ option }"
        >
          <span
            >{{ option.first_name }} {{ option.last_name }} ({{
              option.organization.name
            }})</span
          >
        </template>
        <template
          v-else-if="currentList.model === 'organization_organizations'"
          #option="{ option }"
        >
          <span>{{ option.name }}</span>
        </template>
        <template
          v-else-if="currentList.model === 'incident_incidents'"
          #option="{ option }"
        >
          <span>{{ option.name }}</span>
        </template>
        <template
          v-else-if="currentList.model === 'file_files'"
          #option="{ option }"
        >
          <span>{{ option.name }}</span>
        </template>
        <template
          v-else-if="currentList.model === 'list_lists'"
          #option="{ option }"
        >
          <span>{{ option.name }}</span>
        </template>
        <template
          v-else-if="
            currentList.model === 'organization_organizations_incidents_teams'
          "
          #option="{ option }"
        >
          <span>{{ option.name }}</span>
        </template>
      </BaseSelect>
      <!-- Add Item Button -->
      <BaseButton
        variant="solid"
        class="mt-2 w-full p-3"
        :disabled="!selectedItemId"
        :action="() => addItem(selectedItemId)"
        >{{ $t('actions.add') }}</BaseButton
      >
    </div>

    <div class="mt-10">
      <h3 class="text-xl font-bold mb-4">List Items</h3>
      <div v-if="listItems.length > 0">
        <div v-for="item in listItems" :key="item.id">
          <router-link
            v-if="currentList.model === 'worksite_worksites'"
            :to="`/incident/${item.incident}/work/${item.id}?showOnMap=true`"
            ><span class="text-primary-dark hover:underline"
              >{{ item.case_number }} - {{ item.name }}</span
            ></router-link
          >
          <span v-else-if="currentList.model === 'user_users'"
            >{{ item.first_name }} {{ item.last_name }} ({{
              item.organization.name
            }})</span
          >
          <span
            v-else-if="currentList.model === 'organization_organizations'"
            >{{ item.name }}</span
          >
          <span v-else-if="currentList.model === 'incident_incidents'">{{
            item.name
          }}</span>
          <span v-else-if="currentList.model === 'file_files'">{{
            item.name
          }}</span>
          <span v-else-if="currentList.model === 'list_lists'">{{
            item.name
          }}</span>
          <span
            v-else-if="
              currentList.model === 'organization_organizations_incidents_teams'
            "
            >{{ item.name }}</span
          >
        </div>
      </div>
      <div v-else>
        <span>No items in list</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseSelect from '@/components/BaseSelect.vue';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';
import axios from 'axios';
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { computedAsync } from '@vueuse/core';
import Incident from '@/models/Incident';
import { useCurrentIncident } from '@/hooks';

interface List {
  id: number;
  name: string;
  description: string;
  model: string;
  shared: string;
  permissions: string;
  object_ids: number[];
  incident: number | null;
}

interface ModelOption {
  options: (value: string) => Promise<any[]>;
  label: string;
  itemKey: string;
  placeholder: string;
}

const baseUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/lists`;
const selectedItemId = ref<number | null>(null);
const route = useRoute();
const listId = route.params.id as string;
const { currentIncidentId } = useCurrentIncident();
const currentList = ref<List>({
  id: Number(listId),
  name: '',
  description: '',
  model: '',
  shared: '',
  permissions: '',
  object_ids: [],
  incident: null,
});
const incidents = computed(() =>
  Incident.query().orderBy('start_at', 'desc').get(),
);

const MODEL_TO_OPTIONS: Record<string, ModelOption> = {
  worksite_worksites: {
    options: async (value) =>
      fetchModelOptions(value, 'worksites', 'id,name,case_number'),
    label: 'name',
    itemKey: 'id',
    placeholder: 'Select a worksite',
  },
  user_users: {
    options: async (value) =>
      fetchModelOptions(value, 'users', 'id,first_name,last_name,organization'),
    label: 'first_name',
    itemKey: 'id',
    placeholder: 'Select a user',
  },
  organization_organizations: {
    options: async (value) =>
      fetchModelOptions(value, 'organizations', 'id,name'),
    label: 'name',
    itemKey: 'id',
    placeholder: 'Select an organization',
  },
  incident_incidents: {
    options: async (value) => fetchModelOptions(value, 'incidents', 'id,name'),
    label: 'name',
    itemKey: 'id',
    placeholder: 'Select an incident',
  },
  file_files: {
    options: async (value) => fetchModelOptions(value, 'files', 'id,name'),
    label: 'name',
    itemKey: 'id',
    placeholder: 'Select a file',
  },
  list_lists: {
    options: async (value) => fetchModelOptions(value, 'lists', 'id,name'),
    label: 'name',
    itemKey: 'id',
    placeholder: 'Select a list',
  },
  organization_organizations_incidents_teams: {
    options: async (value) => fetchModelOptions(value, 'teams', 'id,name'),
    label: 'name',
    itemKey: 'id',
    placeholder: 'Select a team',
  },
};
// Fetch Model Options with id__in support
async function fetchModelOptions(
  value: string,
  endpoint: string,
  fields: string,
  idIn = '',
  incident = null,
) {
  const params: Record<string, any> = { fields, limit: '10', search: value };
  if (idIn) {
    params.id__in = idIn; // Adding id__in to the parameters
  }
  if (incident) {
    params.incident = incident.id;
  }
  const results = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/${endpoint}`,
    { params },
  );
  return results.data.results;
}

// Fetch list details and items on component mount
onMounted(fetchListDetails);

async function fetchListDetails() {
  try {
    const listResponse = await axios.get(`${baseUrl}/${listId}`);
    Object.assign(currentList.value, listResponse.data);
  } catch (error) {
    console.error('Error fetching list details:', error);
  }
}

// Add item to the list
const addItem = async (itemId: number) => {
  currentList.value.object_ids = currentList.value.object_ids || [];
  if (!currentList.value.object_ids.includes(itemId)) {
    currentList.value.object_ids.push(itemId);
    try {
      await axios.patch(`${baseUrl}/${listId}`, {
        object_ids: currentList.value.object_ids,
      });
    } catch (error) {
      console.error('Error updating list:', error);
    }
  }
};

// Update list details
const updateList = async () => {
  try {
    await axios.put(`${baseUrl}/${listId}`, currentList.value);
  } catch (error) {
    console.error('Error updating list:', error);
  }
};

const listItems = computedAsync(async () => {
  if (
    currentList.value.object_ids?.length &&
    currentList.value.model === 'worksite_worksites'
  ) {
    return await fetchModelOptions(
      '',
      'worksites',
      'id,name,case_number,incident',
      currentList.value.object_ids.join(','),
      currentIncidentId,
    );
  } else if (
    currentList.value.object_ids?.length &&
    currentList.value.model === 'user_users'
  ) {
    return await fetchModelOptions(
      '',
      'users',
      'id,first_name,last_name,organization',
      currentList.value.object_ids.join(','),
    );
  } else if (
    currentList.value.object_ids?.length &&
    currentList.value.model === 'organization_organizations'
  ) {
    return await fetchModelOptions(
      '',
      'organizations',
      'id,name',
      currentList.value.object_ids.join(','),
    );
  } else if (
    currentList.value.object_ids?.length &&
    currentList.value.model === 'incident_incidents'
  ) {
    return await fetchModelOptions(
      '',
      'incidents',
      'id,name',
      currentList.value.object_ids.join(','),
    );
  } else if (
    currentList.value.object_ids?.length &&
    currentList.value.model === 'file_files'
  ) {
    return await fetchModelOptions(
      '',
      'files',
      'id,name',
      currentList.value.object_ids.join(','),
    );
  } else if (
    currentList.value.object_ids?.length &&
    currentList.value.model === 'list_lists'
  ) {
    return await fetchModelOptions(
      '',
      'lists',
      'id,name',
      currentList.value.object_ids.join(','),
    );
  } else if (
    currentList.value.object_ids?.length &&
    currentList.value.model === 'organization_organizations_incidents_teams'
  ) {
    return await fetchModelOptions(
      '',
      'teams',
      'id,name',
      currentList.value.object_ids.join(','),
    );
  }
  return [];
}, []);
</script>
