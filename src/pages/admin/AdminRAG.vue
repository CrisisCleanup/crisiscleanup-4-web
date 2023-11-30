<script lang="ts" setup>
import { ref } from 'vue';
import { useRAG } from '@/hooks';
import BaseInput from '@/components/BaseInput.vue';

const question = ref<string>('');
const { history, submitQuestion, loading } = useRAG();
</script>

<template>
  <div class="grid h-full">
    <div>
      <template v-for="h in history" :key="`${h.actor}:${h.content}`">
        <BaseText variant="h3">{{ h.actor.toUpperCase() }}:</BaseText>
        <BaseText> {{ h.content }} </BaseText>
      </template>
      <Spinner v-if="loading" />
    </div>
    <BaseInput
      v-model="question"
      placeholder="Ask a question"
      class="w-full"
      @keyup.enter="() => submitQuestion(question)"
    />
  </div>
</template>
