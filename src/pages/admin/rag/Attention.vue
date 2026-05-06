<script setup lang="ts">
import AttentionListPanel from '@/components/admin/rag/AttentionListPanel.vue';
import { RAGAdminContextKey } from './context';

const ctx = inject(RAGAdminContextKey);
if (!ctx) throw new Error('RAGAdminContextKey not provided');
const { collectionId } = ctx;
</script>

<template>
  <div class="h-full min-h-0 flex flex-col px-4">
    <AttentionListPanel :collection-id="collectionId" />
  </div>
</template>
