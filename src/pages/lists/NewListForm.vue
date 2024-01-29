<template>
  <div class="flex flex-col gap-3">
    <BaseInput v-model="newList.name" label="Name" placeholder="Enter name" />
    <BaseInput
      v-model="newList.description"
      label="Description"
      placeholder="Enter description"
      text-area
      :rows="4"
    />
    <BaseSelect
      v-model="newList.model"
      :options="modelOptions"
      label="Model"
      placeholder="Select model"
      :model-value="model"
      :disabled="model"
    />
    <BaseSelect
      v-model="newList.shared"
      :options="sharedOptions"
      label="Shared"
      placeholder="Select sharing option"
    />
    <BaseSelect
      v-model="newList.permissions"
      :options="permissionsOptions"
      label="Permissions"
      placeholder="Select permissions"
    />
    <base-checkbox
      :model-value="newList.incident === currentIncidentId"
      @update:model-value="
        newList.incident = $event ? currentIncidentId : undefined
      "
    >
      {{ $t('~~Use Current Incident') }}
    </base-checkbox>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BaseInput from '@/components/BaseInput.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import Incident from '@/models/Incident';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import { useCurrentIncident } from '@/hooks';

interface NewList {
  name: string;
  description: string;
  model: string;
  shared: string;
  permissions: string;
  incident: number | undefined;
}
const { currentIncidentId } = useCurrentIncident();

const emit = defineEmits(['onNewList']);

const props = defineProps({
  model: String,
});

const newList = ref<NewList>({
  name: '',
  description: '',
  model: '',
  shared: '',
  permissions: '',
  incident: undefined,
});

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

const incidents = Incident.query().orderBy('start_at', 'desc').get();

// Emit new onNewList when any item in the list changes deep
watch(
  newList,
  () => {
    emit('onNewList', JSON.parse(JSON.stringify(newList.value)));
  },
  {
    deep: true,
    immediate: true,
  },
);
</script>
