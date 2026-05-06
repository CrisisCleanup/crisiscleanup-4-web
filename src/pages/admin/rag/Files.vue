<script setup lang="ts">
import FilesPanel from '@/components/admin/rag/FilesPanel.vue';
import { RAGAdminContextKey } from './context';

const ctx = inject(RAGAdminContextKey);
if (!ctx) throw new Error('RAGAdminContextKey not provided');
const { collectionId } = ctx;
</script>

<template>
  <div class="h-full overflow-y-auto p-4">
    <FilesPanel :collection-id="collectionId" />
  </div>
</template>
