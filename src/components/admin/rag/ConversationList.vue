<script setup lang="ts">
import { truncate } from 'lodash';
import useDialogs from '@/hooks/useDialogs';

interface ConversationSummary {
  conversationId: string;
  title: string;
}

const props = defineProps<{
  conversations: ConversationSummary[];
  currentId?: string;
}>();

const emit = defineEmits<{
  (e: 'select', conversationId: string): void;
  (e: 'delete', conversationId: string): void;
  (e: 'new'): void;
}>();

const { t } = useI18n();
const { confirm } = useDialogs();

const onDelete = async (id: string) => {
  const result = await confirm({
    title: t('actions.confirm'),
    content: t('adminRAG.confirm_delete_conversation'),
    actions: {
      no: { text: t('actions.cancel'), type: 'outline', size: 'medium' },
      yes: { text: t('actions.delete'), variant: 'solid', size: 'medium' },
    },
  });
  if (result === 'yes') emit('delete', id);
};
</script>

<template>
  <aside class="ccu-rag-conv-list flex flex-col h-full bg-slate-50">
    <div class="px-3 py-3 border-b border-slate-200">
      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
        @click="emit('new')"
      >
        <ccu-icon type="active" size="sm" />
        {{ $t('~~New conversation') }}
      </button>
    </div>
    <div class="flex-1 overflow-y-auto py-1">
      <p
        v-if="conversations.length === 0"
        class="px-3 py-4 text-xs text-slate-500"
      >
        {{ $t('~~No conversations yet.') }}
      </p>
      <button
        v-for="conv in conversations"
        :key="conv.conversationId"
        type="button"
        class="w-full text-left px-3 py-2 border-l-2 transition-colors group"
        :class="
          conv.conversationId === currentId
            ? 'bg-white border-slate-700 text-slate-900'
            : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-900'
        "
        @click="emit('select', conv.conversationId)"
      >
        <div class="flex items-start gap-2">
          <span
            class="flex-1 text-sm truncate"
            :class="{
              'font-semibold': conv.conversationId === currentId,
            }"
          >
            {{ truncate(conv.title || $t('~~Untitled'), { length: 80 }) }}
          </span>
          <span
            class="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600"
            :title="t('actions.delete')"
            @click.stop="onDelete(conv.conversationId)"
          >
            <ccu-icon type="cancel" size="xs" />
          </span>
        </div>
      </button>
    </div>
  </aside>
</template>
