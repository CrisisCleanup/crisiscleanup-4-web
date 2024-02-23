<script setup lang="ts">
import AjaxTable from '@/components/AjaxTable.vue';
import { makeTableColumns } from '@/utils/table';
import CmsViewer from '@/components/cms/CmsViewer.vue';
import JsonWrapper from '@/components/JsonWrapper.vue';
import useDialogs from '@/hooks/useDialogs';

const { component } = useDialogs();

const columns = makeTableColumns([
  ['title', '25%', 'Title'],
  ['created_at', '15%', 'Created At'],
  ['recipients', 'auto', 'Recipients', 'recipients'],
  ['actions', '25%', 'Actions', 'actions'],
]);

const tableUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/messages`;

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
});

const showJson = async (message) => {
  await component({
    title: message.title,
    component: JsonWrapper,
    classes: 'w-full h-96',
    modalClasses: 'max-w-3xl',
    props: {
      jsonData: message.settings,
    } as any,
  });
};

const showDetails = async (message) => {
  await component({
    title: message.title,
    component: CmsViewer,
    classes: 'h-120 overflow-y-auto',
    modalClasses: 'max-w-4xl',
    props: {
      content: message.settings.content,
    },
  });
};
</script>

<template>
  <AjaxTable
    :url="tableUrl"
    :columns="columns"
    :query="{
      search: search,
    }"
  >
    <template #recipients="slotProps">
      <div v-if="slotProps.item.settings.sent_to.length > 0">
        <div
          v-for="recipient in slotProps.item.settings.sent_to"
          :key="recipient"
        >
          {{ recipient }}
        </div>
      </div>
      <div v-else>
        {{ $t('no_recipients') }}
      </div>
    </template>
    <template #actions="slotProps">
      <base-button
        :text="$t('actions.show_details')"
        :alt="$t('actions.show_details')"
        data-testid="testShowDetailsButton"
        variant="solid"
        size="small"
        class="mx-2"
        :action="
          () => {
            showDetails(slotProps.item);
          }
        "
      />
      <base-button
        :text="$t('actions.show_json')"
        :alt="$t('actions.show_json')"
        data-testid="testShowJsonButton"
        variant="solid"
        size="small"
        class="mx-2"
        :action="
          () => {
            showJson(slotProps.item);
          }
        "
      />
    </template>
  </AjaxTable>
</template>

<style scoped></style>
