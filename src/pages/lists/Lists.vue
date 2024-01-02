<script setup lang="ts">
import BaseSelect from '@/components/BaseSelect.vue';
import AjaxTable from '@/components/AjaxTable.vue';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';
import axios from 'axios';
import { ref } from 'vue';
import { makeTableColumns } from '@/utils/table';
import BaseText from '@/components/BaseText.vue';

// Table columns setup
const columns = makeTableColumns([
  ['id', '10%', 'id'],
  ['name', '15%', 'name'],
  ['model', '40%', 'model'],
  ['shared', '15%', 'shared'],
  ['permissions', '20%', 'permissions'],
]);

// New list ref
const newList = ref({
  name: '',
  description: '',
  model: '',
  shared: '',
  permissions: '',
});

// Constants for select options
const modelOptions = [
  'worksite_worksites',
  'user_users',
  'organization_organizations',
  'incident_incidents',
  'file_files',
  'list_lists',
  'organization_organizations_incidents_teams',
];

const sharedOptions = [
  'private',
  'team',
  'organization',
  'groups_affiliates',
  'all',
  'public',
];

const permissionsOptions = [
  'read_write_delete_copy',
  'read_write_copy',
  'read_copy',
  'read_only',
];

// API base URL
const baseUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/lists`;

// Submit function
const submit = async () => {
  await axios.post(baseUrl, newList.value);
  newList.value = {
    name: '',
    description: '',
    model: '',
    shared: '',
    permissions: '',
  };
};
</script>

<template>
  <div class="max-w-4xl mx-auto p-3 rounded-lg">
    <base-text variant="h1" class="mb-2">{{ $t('~~Add New List') }}</base-text>

    <form class="space-y-6">
      <BaseInput
        v-model="newList.name"
        label="Name"
        placeholder="Enter name"
        class=""
        size="large"
      />
      <BaseInput
        v-model="newList.description"
        label="Description"
        placeholder="Enter description"
        class="focus:border-blue-500"
        text-area
        :rows="4"
      />
      <BaseSelect
        v-model="newList.model"
        :options="modelOptions"
        label="Model"
        placeholder="Select model"
        class=""
      />
      <BaseSelect
        v-model="newList.shared"
        :options="sharedOptions"
        label="Shared"
        placeholder="Select sharing option"
        class=""
      />
      <BaseSelect
        v-model="newList.permissions"
        :options="permissionsOptions"
        label="Permissions"
        placeholder="Select permissions"
        class=""
      />
      <BaseButton :action="submit" variant="solid" class="w-full p-3">
        Submit
      </BaseButton>
    </form>
    <AjaxTable
      :columns="columns"
      :url="baseUrl"
      class="mt-10"
      @row-click="(payload) => $router.push(`/lists/${payload.id}`)"
    />
  </div>
</template>

<style scoped></style>
