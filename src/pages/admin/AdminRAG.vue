<script lang="ts" setup>
import { ref } from 'vue';
import { useRAG } from '@/hooks';
import BaseInput from '@/components/BaseInput.vue';
import MarkdownRenderer from '@/components/MarkdownRender.vue';

const question = ref<string>('');
const { history, submitQuestion } = useRAG();
</script>

<template>
  <div class="rag grid h-full">
    <div class="">
      <template v-for="h in history" :key="`${h.actor}:${h.content}`">
        <BaseText variant="h3">{{ h.actor.toUpperCase() }}:</BaseText>
        <MarkdownRenderer :source="h.content" />
        <br />
      </template>
    </div>
    <div class="flex items-end">
      <BaseInput
        v-model="question"
        placeholder="Ask a question"
        class="w-full"
        @keyup.enter="() => submitQuestion(question)"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.rag {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 0.1fr;
}
</style>
