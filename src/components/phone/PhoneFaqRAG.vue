<script setup lang="ts">
import type { Ref } from 'vue';
import { ref } from 'vue';
import { useRAG, useRAGCollections } from '@/hooks';
import { useStorage } from '@vueuse/core/index';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';
import moment from 'moment';
import useCurrentUser from '@/hooks/useCurrentUser';

const question = ref<string>('');
const { collections } = useRAGCollections();
const { currentUser } = useCurrentUser();
const collectionId = useStorage<string | undefined>(
  'rag:collectionId',
  undefined,
  localStorage,
  { writeDefaults: false, listenToStorageChanges: false },
);
const conversationId = useStorage<string | undefined>(
  'rag:conversationId',
  undefined,
  localStorage,
  { writeDefaults: false, listenToStorageChanges: false },
);
watchOnce(collections, () => {
  if (!collection.value) {
    collectionId.value = collections.value?.find?.(
      (c) => c.name === 'crisiscleanup',
    )?.uuid;
  }
});

const collection = computed(() =>
  collections.value?.find((c) => c.uuid === collectionId.value),
);

const { history, submitQuestion } = useRAG(
  collectionId as Ref<string>,
  conversationId as Ref<string>,
);

const sendMessage = () => {
  if (question.value) {
    submitQuestion(question.value);
    question.value = '';
  }
};

function formatDateTime(dateTime) {
  return moment(dateTime).format('MMMM Do YYYY, h:mm:ss a');
}
</script>

<template>
  <div class="flex flex-col">
    <div v-if="collection" class="flex flex-col flex-1 overflow-hidden">
      <!-- Chat history -->
      <div v-if="history.length > 0" class="overflow-auto p-4 space-y-2 h-120">
        <div
          v-for="message in history"
          :key="message.messageId"
          class="max-w-xs mx-auto"
        >
          <div v-if="message.actor" class="text-left">
            <div
              :class="
                message.actor === 'user'
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-green-200 text-green-800'
              "
              class="p-2 rounded-lg"
            >
              <div class="font-bold">
                {{
                  message.actor == 'user'
                    ? currentUser?.full_name
                    : 'Crisis Cleanup'
                }}
              </div>
              <div>{{ message.content }}</div>
              <div class="text-xs text-gray-500 mt-2">
                {{ formatDateTime(message.createdAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="p-4">
        <div>No history</div>
      </div>

      <!-- Input area -->
      <div class="p-4 border-t-2">
        <div class="flex flex-col gap-2">
          <base-input
            v-model="question"
            :placeholder="$t('phoneDashboard.faq')"
          />
          <base-button
            :action="sendMessage"
            variant="solid"
            class="p-2"
            :alt="$t('actions.submit')"
          >
            {{ $t('actions.submit') }}
          </base-button>
        </div>
      </div>
    </div>
    <div v-else class="flex justify-center items-center flex-1">
      <div>Loading...</div>
    </div>
  </div>
</template>

<style scoped></style>
