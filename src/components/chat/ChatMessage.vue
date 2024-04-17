<template>
  <div
    class="flex items-start space-x-4 chat-message w-full"
    @mouseenter="showFavorite = true"
    @mouseleave="showFavorite = false"
  >
    <!-- Existing message content -->
    <div
      class="bg-blue-600 text-white rounded-md w-10 h-10 flex items-center justify-center text-lg mt-2"
    >
      {{ getUserInitials(message.created_by) }}
    </div>
    <div class="relative flex justify-between w-full">
      <!-- Existing message content -->
      <div>
        <div class="flex items-center justify-start gap-3 mt-0.5">
          <div class="text-gray-800 font-semibold">
            <UserDetailsTooltip
              :dark="false"
              :name-class="'text-h3 font-h3 text-crisiscleanup-dark-500 name-tooltip'"
              :user="message.created_by"
              data-testid="testCreatedByTooltip"
            />
          </div>
          <div class="text-gray-500 text-sm">
            {{ formatDateString(message.created_at, 'h:mm A') }}
          </div>
        </div>
        <div class="text-gray-700 mt-1 w-11/12">{{ message.content }}</div>
      </div>
      <!-- Existing message content -->
      <div
        class="absolute top-1/2 right-2 mt-3 cursor-pointer flex items-center gap-1"
      >
        <font-awesome-icon
          v-if="message.is_urgent"
          :alt="$t('chat.is_urgent')"
          data-testid="testIsUrgentIcon"
          icon="exclamation-circle"
          class="text-red-500"
        />
        <!-- Existing message content -->
        <font-awesome-icon
          v-if="showFavorite && !message.is_favorite"
          :alt="$t('chat.show_favorite')"
          data-testid="testShowFavoriteContent"
          icon="star"
          @click="$emit('onFavorite', message)"
        />
        <font-awesome-icon
          v-if="message.is_favorite"
          :alt="$t('chat.is_favorite')"
          data-testid="testIsFavoriteIcon"
          icon="star"
          @mouseover="showFavorite"
          @click="$emit('onUnfavorite', message)"
        />
      </div>
    </div>
  </div>
  <!-- Replies -->
  <template v-if="message.replies && message.replies.length > 0 && !isReply">
    <div class="flex items-center gap-3 mt-3">
      <button
        class="text-blue-600 hover:text-blue-800"
        @click="showReplies = !showReplies"
      >
        <span v-if="showReplies">Hide replies</span>
        <span v-else>Show replies</span>
        ({{ message.replies.length }})
      </button>
      <span class="text-gray-400 text-xs">
        Last reply {{ moment(message.replies.at(-1).created_at).fromNow() }}
      </span>
    </div>
    <div v-if="showReplies" class="mx-4">
      <div v-for="reply in message.replies" :key="reply.id">
        <ChatMessage :message="reply" class="my-1" is-reply />
      </div>
      <!-- Textarea for reply -->
      <div class="flex items-center gap-3 mt-3">
        <base-input
          v-model="replyContent"
          text-area
          class="w-full rounded-lg"
          placeholder="Reply to this message"
        ></base-input>
        <button
          class="bg-blue-600 text-white rounded-lg px-4 py-2"
          @click="sendReply"
        >
          Send
        </button>
      </div>
    </div>
  </template>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { ref } from 'vue';
import moment from 'moment';
import UserDetailsTooltip from '../user/DetailsTooltip.vue';
import { formatDateString } from '../../filters/index';
import type { Message } from '@/models/types';
import User from '@/models/User';
import BaseInput from '@/components/BaseInput.vue';

export default defineComponent({
  name: 'ChatMessage',
  components: { BaseInput, UserDetailsTooltip },
  props: {
    message: {
      type: Object as PropType<Message>,
      default: () => ({}),
    },
    isReply: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const showFavorite = ref(false);
    const showReplies = ref(false);
    const showReplyBox = ref(false);
    const replyContent = ref('');

    const getUserInitials = (id: number) => {
      const user = User.find(id);
      if (user) {
        return `${user.first_name[0]}${user.last_name[0]}`;
      }
      return '';
    };

    const sendReply = () => {
      // Here you can implement the logic to send the reply.
      // You can use the `replyContent` ref to get the content of the reply.
      console.log(replyContent.value);
      replyContent.value = '';
      showReplyBox.value = false;
    };
    return {
      showFavorite,
      formatDateString,
      moment,
      getUserInitials,
      showReplies,
      sendReply,
    };
  },
});
</script>

<style scoped></style>
