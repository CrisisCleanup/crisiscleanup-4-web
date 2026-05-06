<script setup lang="ts">
import { truncate } from 'lodash';
import moment from '@/utils/dates';
import useDialogs from '@/hooks/useDialogs';

interface ConversationSummary {
  conversationId: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
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

const relativeTime = (iso: string | undefined) =>
  iso ? moment(iso).fromNow() : '';
</script>

<template>
  <aside class="ccu-rag-conv-list flex flex-col h-full bg-slate-50">
    <div class="px-3 py-3 border-b border-slate-200">
      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-slate-300 bg-white hover:border-crisiscleanup-yellow-500 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
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
        class="w-full text-left pl-3 pr-2 py-2 border-l-2 transition-colors group"
        :class="
          conv.conversationId === currentId
            ? 'border-crisiscleanup-yellow-500 bg-crisiscleanup-yellow-100/40 text-slate-900'
            : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-900'
        "
        @click="emit('select', conv.conversationId)"
      >
        <div class="flex items-start gap-2">
          <div class="flex-1 min-w-0">
            <div
              class="text-sm truncate"
              :class="{
                'font-semibold': conv.conversationId === currentId,
              }"
            >
              {{ truncate(conv.title || $t('~~Untitled'), { length: 80 }) }}
            </div>
            <div
              v-if="conv.updatedAt || conv.createdAt"
              class="mt-0.5 text-[11px] text-slate-400 truncate"
            >
              {{ relativeTime(conv.updatedAt ?? conv.createdAt) }}
            </div>
          </div>
          <button
            type="button"
            class="flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 -m-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
            :title="t('actions.delete')"
            :aria-label="t('actions.delete')"
            @click.stop="onDelete(conv.conversationId)"
          >
            <ccu-icon type="cancel" size="xs" />
          </button>
        </div>
      </button>
    </div>
  </aside>
</template>
