<template>
  <base-select
    :options="onGroupSearch"
    searchable
    item-key="id"
    label="name"
    :object="true"
    :placeholder="$t('Group (optional)')"
    :model-value="modelValue"
    @update:model-value="
      (value) => {
        $emit('update:modelValue', value);
      }
    "
  >
    <template v-if="isAdmin" #option="{ option }">
      <div
        class="flex justify-between text-sm p-1 cursor-pointer hover:bg-crisiscleanup-light-grey border-b"
      >
        <span>{{ option.id }} - {{ option.name }}</span>
      </div>
    </template>
  </base-select>
</template>

<script lang="ts">
import axios from 'axios';
import { getQueryString } from '../utils/urls';

export default defineComponent({
  name: 'GroupSearchInput',
  props: {
    modelValue: {
      type: Object,
      default: null,
    },
    size: {
      type: String,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    includeInactive: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    async function onGroupSearch(value) {
      emit('input', value);

      const parameters = {
        fields: 'id,name',
        limit: '10',
        search: value,
      };

      const results = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/groups?${getQueryString(
          parameters,
        )}`,
      );
      return results.data.results;
    }

    return {
      onGroupSearch,
    };
  },
});
</script>
