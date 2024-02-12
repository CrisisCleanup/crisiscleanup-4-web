<template>
  <div class="flex flex-col gap-3">
    <BaseInput
      v-model="newList.name"
      label="Name"
      :placeholder="$t('~~Enter name')"
    />
    <BaseInput
      v-model="newList.description"
      label="Description"
      :placeholder="$t('~~Enter description')"
      text-area
      :rows="4"
    />
    <BaseSelect
      v-if="!props.model"
      v-model="newList.model"
      :options="modelOptions"
      label="Model"
      :placeholder="$t('~~Select List Type')"
      :model-value="model"
      :disabled="model"
    />

    {{ $t('~~Share With') }}
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
  worksite_worksites: t('~~Work List'),
  user_users: t('~~User List'),
  organization_organizations: t('~~Organization List'),
  incident_incidents: t('~~Incident List'),
  file_files: t('~~Files List'),
  organization_organizations_incidents_teams: t('~~Teams List'),
  list_lists: t('~~List Lists'),
};

const sharedOptions = {
  private: t('~~Only Me'),
  public: t('~~Everyone'),
  groups_affiliates: t('~~My Organization'),
  team: t('~~My Team'),
};

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
