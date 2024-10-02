<template>
  <div
    class="flex items-start space-x-4 chat-message w-full hover:bg-crisiscleanup-light-smoke p-0.5 cursor-pointer"
    :class="message.is_urgent ? 'bg-[#FF000050]' : ''"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <Avatar
      :initials="message.full_name"
      :url="getUserAvatarLink(message?.full_name ?? '')"
      data-testid="testAvatarIcon"
      :custom-size="{ width: '40px', height: '40px' }"
      inner-classes="shadow"
    />
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
              :user-object="userObject"
            />
          </div>
          <div class="text-gray-500 text-sm">
            <!-- If date is not today, include date -->
            <template v-if="!isToday(message.created_at)">{{
              formatDateString(message.created_at, 'MMM D')
            }}</template>
            {{ formatDateString(message.created_at, 'h:mm A') }}
          </div>
        </div>
        <div class="text-gray-700 mt-1 w-11/12">
          <span v-html="message.content"></span>
        </div>
      </div>
      <!-- Existing message content -->
      <div
        v-if="message.is_urgent || message.is_favorite ? true : showActions"
        class="actions-bar absolute top-1 right-2 mt-3 transform -translate-y-1/2 cursor-pointer flex items-center gap-1 bg-gray-100 p-2 rounded"
      >
        <!-- Urgent Icon -->
        <font-awesome-icon
          v-if="message.is_urgent"
          :alt="$t('chat.is_urgent')"
          icon="exclamation-circle"
          class="text-red-500"
        />

        <!-- Favorite/Unfavorite Icon -->
        <font-awesome-icon
          v-if="!message.is_favorite"
          :alt="$t('chat.show_favorite')"
          :icon="['far', 'star']"
          @click="$emit('onFavorite', message)"
        />

        <font-awesome-icon
          v-if="message.is_favorite"
          :alt="$t('chat.is_favorite')"
          icon="star"
          class="text-yellow-500"
          @click="$emit('onUnfavorite', message)"
        />

        <!-- Reply Icon -->
        <font-awesome-icon
          v-if="!isReply"
          icon="reply"
          @click="() => (showReplyBox = !showReplyBox)"
        />
      </div>
    </div>
  </div>
  <!-- Replies -->
  <template v-if="message.replies && message.replies.length > 0 && !isReply">
    <div class="flex items-center gap-3 mt-3">
      <button
        class="text-blue-600 hover:text-blue-800"
        @click="
          () => {
            showReplies = !showReplies;
            showReplyBox = false;
          }
        "
      >
        <span v-if="showReplies || showReplyBox">Hide replies</span>
        <span v-else>Show replies</span>
        ({{ message.replies.length }})
      </button>
      <span class="text-gray-400 text-xs">
        {{ $t('chat.last_reply') }}
        {{ moment(message.replies.at(-1).created_at).fromNow() }}
      </span>
    </div>
  </template>
  <div v-if="showReplies || showReplyBox" class="mx-12">
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
      <base-button
        class="bg-crisiscleanup-dark-blue"
        data-testid="testSendMessageButton"
        :disabled="!Boolean(replyContent)"
        ccu-icon="plane"
        :action="sendReply"
        :alt="$t('actions.send_message')"
      />
    </div>
  </div>
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
import BaseButton from '@/components/BaseButton.vue';
import Avatar from '@/components/Avatar.vue';
import CcuIcon from '@/components/BaseIcon.vue';
import { getUserAvatarLink } from '@/utils/urls';
import { DbService, USER_DATABASE } from '@/services/db.service';

export default defineComponent({
  name: 'ChatMessage',
  components: { CcuIcon, Avatar, BaseButton, BaseInput, UserDetailsTooltip },
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
  setup(props, { emit }) {
    const showActions = ref(false);
    const replyContent = ref('');
    const showReplies = ref(false);
    const showReplyBox = ref(false);
    const userObject = ref(null);

    const getUserInitials = (id: number) => {
      const user = User.find(id);
      if (user) {
        return `${user.first_name[0]}${user.last_name[0]}`;
      }
      return '';
    };

    const isToday = (date: string) => {
      return moment(date).isSame(moment(), 'day');
    };

    const sendReply = () => {
      emit('onReply', replyContent.value);
      replyContent.value = '';
    };

    onMounted(async () => {
      userObject.value = await DbService.getItem(
        `user_${props.message.created_by}`,
        USER_DATABASE,
      );
    });

    return {
      getUserAvatarLink,
      showActions,
      formatDateString,
      moment,
      getUserInitials,
      showReplies,
      sendReply,
      showReplyBox,
      isToday,
      replyContent,
      userObject,
    };
  },
});
</script>

<style scoped></style>
