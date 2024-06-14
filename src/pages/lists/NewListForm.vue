<template>
  <div class="flex flex-col gap-3">
    <BaseInput
      v-model="newList.name"
      label="Name"
      :placeholder="$t('list.name')"
    />
    <BaseInput
      v-model="newList.description"
      label="Description"
      :placeholder="$t('list.description')"
      text-area
      :rows="4"
    />
    <BaseSelect
      v-if="!props.model"
      v-model="newList.model"
      :options="modelOptions"
      label="Model"
      :placeholder="$t('list.select_list_type')"
      :model-value="model"
      :disabled="model"
    />

    {{ $t('list.share_with') }}
    <base-radio
      v-for="(value, key) in sharedOptions"
      :key="key"
      :label="key"
      data-testid="testListSharedRadio"
      :name="value"
      :model-value="newList.shared"
      @update:model-value="newList.shared = $event"
    />
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

const { t } = useI18n();

const newList = ref<NewList>({
  name: '',
  description: '',
  model: props.model,
  shared: '',
  permissions: 'read_write_delete_copy',
  incident: currentIncidentId.value,
});

const modelOptions = {
  worksite_worksites: t('list.worksite_lists'),
  user_users: t('list.user_lists'),
  organization_organizations: t('list.organization_lists'),
  incident_incidents: t('list.incident_lists'),
  file_files: t('list.incident_list'),
  organization_organizations_incidents_teams: t('list.team_lists'),
  list_lists: t('list.list_lists'),
};

const sharedOptions = {
  private: t('list.private'),
  public: t('list.public'),
  groups_affiliates: t('list.groups_affiliates'),
  team: t('list.my_team'),
};

// Emit new onNewList when any item in the list changes deep
watch(
  newList,
  () => {
    emit('onNewList', { ...newList.value });
  },
  {
    deep: true,
    immediate: true,
  },
);
</script>
