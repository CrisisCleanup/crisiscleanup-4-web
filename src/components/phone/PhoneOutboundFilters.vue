<script setup lang="ts">
import Modal from '@/components/Modal.vue';
import UserSearchInput from '@/components/UserSearchInput.vue';
import BaseCheckbox from '@/components/BaseCheckbox.vue';

import { ref, reactive, computed } from 'vue';
import PhoneOutboundLanguageFilter from '@/utils/data_filters/PhoneOutboundLanguageFilter';
import Language from '@/models/Language';
import Incident from '@/models/Incident';
import PhoneOutboundIncidentFilter from '@/utils/data_filters/PhoneOutboundIncidentFilter';

const { t } = useI18n();

const emit = defineEmits(['update:filters', 'close', 'update:filterCount']);

const filters = reactive({
  language: new PhoneOutboundLanguageFilter('language', []),
  incident: new PhoneOutboundIncidentFilter('incident', []),
});

const props = defineProps<{
  initialFilters: Record<string, any>;
}>();

const totalFilterCount = computed(() => {
  let count = 0;
  for (const filter of Object.values(filters)) {
    count += filter.getCount();
  }
  return count;
});

const currentFilterSection = ref('language');

const onFilter = () => {
  let currentFilters = {};
  for (const filter of Object.values(filters)) {
    currentFilters = {
      ...currentFilters,
      ...filter.packFunction(),
    };
  }
  emit('update:filters', currentFilters);
  emit('update:filterCount', totalFilterCount.value);
};

onMounted(() => {
  for (const [key, _] of Object.entries(filters)) {
    filters[key].unpackFunction(props.initialFilters);
  }
});

const languages = computed(() =>
  Language.all().map((l) => {
    return {
      ...l,
      name_t: t(l.name_t),
    };
  }),
);

const incidents = computed(() =>
  Incident.all().map((i) => {
    return {
      ...i,
      name: t(i.name),
    };
  }),
);
</script>

<template>
  <modal
    :modal-classes="['max-w-2xl']"
    closeable
    :title="$t('usersVue.filters')"
    @close="() => $emit('close')"
  >
    <div
      class="flex items-center bg-crisiscleanup-light-grey p-2 px-3 w-full flex-wrap"
      data-testid="testUserFiltersDiv"
    >
      {{ $t('usersVue.filters') }}
      <template v-for="(filter, key) in filters">
        <template
          v-for="(label, identifier) in filter.labels"
          :key="key + identifier"
        >
          <tag
            closeable
            class="m-1"
            @closed="
              () => {
                filter.removeField(identifier);
                onFilter();
              }
            "
          >
            {{ label }}
          </tag>
        </template>
      </template>
    </div>
    <div class="flex h-64">
      <div class="w-40 border-r">
        <div
          class="p-3 px-4 cursor-pointer"
          data-testid="testFilterTeamDiv"
          :class="{
            'border-l-2 border-l-black': currentFilterSection === 'language',
          }"
          @click="currentFilterSection = 'language'"
        >
          {{ $t('~~Language') }}
          <span
            v-if="filters.language.count > 0"
            class="rounded-full px-1 bg-black text-white text-xs"
            >{{ filters.language.count }}</span
          >
        </div>
        <div
          class="p-3 px-4 cursor-pointer"
          data-testid="testFilterIncidentDiv"
          :class="{
            'border-l-2 border-l-black': currentFilterSection === 'incident',
          }"
          @click="currentFilterSection = 'incident'"
        >
          {{ $t('~~Incident') }}
          <span
            v-if="filters.incident.count > 0"
            class="rounded-full px-1 bg-black text-white text-xs"
            >{{ filters.incident.count }}</span
          >
        </div>
      </div>
      <div class="p-2 h-full overflow-auto">
        <div v-if="currentFilterSection === 'language'">
          {{ $t('~~Language') }}
          <base-checkbox
            v-for="language in languages"
            :key="language.id"
            :model-value="filters.language.data.includes(language.id)"
            :data-testid="`testUserEquipment${language.id}Checkbox`"
            class="block my-1 text-xs"
            @update:model-value="
              (value) => {
                if (value) {
                  filters.language.data = [
                    ...filters.language.data,
                    language.id,
                  ];
                } else {
                  filters.language.data = filters.language.data.filter(
                    (id) => id !== language.id,
                  );
                }
                onFilter();
              }
            "
            >{{ language.name_t }}</base-checkbox
          >
        </div>
        <div v-else-if="currentFilterSection === 'incident'">
          {{ $t('~~Incident') }}
          <base-checkbox
            v-for="incident in incidents"
            :key="incident.id"
            :model-value="filters.incident.data.includes(incident.id)"
            :data-testid="`testUserEquipment${incident.id}Checkbox`"
            class="block my-1 text-xs"
            @update:model-value="
              (value) => {
                if (value) {
                  filters.incident.data = [
                    ...filters.incident.data,
                    incident.id,
                  ];
                } else {
                  filters.incident.data = filters.incident.data.filter(
                    (id) => id !== incident.id,
                  );
                }
                onFilter();
              }
            "
            >{{ incident.name }}</base-checkbox
          >
        </div>
      </div>
    </div>
  </modal>
</template>

<style scoped></style>
