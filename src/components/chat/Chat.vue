<template>
  <div class="flex-1 p-2 sm:p-3 flex flex-col w-full h-full">
    <div class="flex sm:items-center py-1 border-b border-gray-200">
      <div class="text-lg">{{ chat.name }}</div>
    </div>
    <div class="flex gap-2 h-full">
      <div class="w-1/3 bg-crisiscleanup-light-smoke p-2">
        <div class="text-lg mb-2">
          {{ $t('chat.online_now') }} ({{ onlineUsersWithData?.length }})
        </div>
        <div class="h-180 overflow-auto">
          <div
            v-for="organization in sortedOrganizations"
            :key="organization.id"
            class="organization-group"
          >
            <div
              class="organization-header flex items-center cursor-pointer"
              @click="toggleOrganization(organization.id)"
            >
              <span class="arrow" :class="{ open: isOpen(organization.id) }">
                <ccu-icon fa size="md" type="caret-down"></ccu-icon>
              </span>
              <span class="organization-name">
                {{ organization.name }} ({{ organization.users.length }})
              </span>
            </div>
            <div v-if="isOpen(organization.id)" class="users-list">
              <div
                v-for="user in organization.users"
                :key="user.id"
                class="flex items-center space-x-2 w-full"
              >
                <Avatar
                  v-if="user"
                  :initials="user.first_name"
                  :url="
                    user.profilePictureUrl
                      ? user.profilePictureUrl
                      : getUserAvatarLink(user.first_name)
                  "
                  data-testid="testAvatarIcon"
                  :custom-size="{ width: '40px', height: '40px' }"
                  inner-classes="shadow"
                />
                <UserDetailsTooltip :user="user.id" :user-object="user" />
                <div v-if="mobileOnlineUsers.includes(user.id)">
                  <font-awesome-icon
                    icon="mobile-screen"
                    class="text-green-700"
                    :title="$t('chat.using_mobile_app')"
                    :alt="$t('chat.using_mobile_app')"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <tabs tab-details-classes="" class="flex-1">
        <tab :name="$t('chat.chat')">
          <div class="message-container h-156">
            <div
              id="messages"
              ref="messagesBox"
              data-testid="testMessagesContent"
              class="flex flex-col flex-grow py-2 space-y-1 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
              @wheel="handleWheel"
              @ontouchmove="handleWheel"
            >
              <font-awesome-icon v-if="loadingMessages" icon="spinner" spin />
              <template
                v-for="(message, index) in sortedMessages"
                :key="message.id"
              >
                <!-- Date Divider -->
                <div
                  v-if="
                    index === 0 ||
                    !moment(message.created_at).isSame(
                      sortedMessages[index - 1].created_at,
                      'day',
                    )
                  "
                  class="flex items-center justify-center relative text-center my-5 w-full"
                >
                  <div class="flex-grow bg-gray-300 h-px"></div>
                  <span
                    class="px-3 py-1 bg-white text-gray-800 border border-gray-300 rounded-full text-sm"
                  >
                    {{ moment(message.created_at).format('dddd, MMMM Do') }}
                  </span>
                  <div class="flex-grow bg-gray-300 h-px"></div>
                </div>
                <!-- Chat Message -->
                <ChatMessage
                  :message="message"
                  @on-favorite="(message: any) => toggleFavorite(message, true)"
                  @on-unfavorite="
                    (message: any) => toggleFavorite(message, false)
                  "
                  @on-reply="(content) => sendMessage(message.id, content)"
                />
              </template>
            </div>
            <div
              class="border-t-2 pt-1 sm:mb-0"
              :class="
                urgent ? 'border-crisiscleanup-chat-red' : 'border-gray-200'
              "
            >
              <div
                v-if="urgent"
                class="text-crisiscleanup-chat-red flex items-center mb-1"
              >
                <ccu-icon
                  :alt="$t('chat.urgent')"
                  data-testid="testIsUrgentStyle"
                  size="small"
                  type="attention-red"
                  class="mr-1"
                />
                {{ $t('chat.urgent') }}
              </div>
              <div class="flex flex-col">
                <base-input
                  v-model="currentMessage"
                  data-testid="testCurrentMessageContent"
                  text-area
                  class=""
                  @enter="sendMessage"
                />
                <div class="flex items-center justify-between py-2">
                  <base-checkbox
                    v-model="urgent"
                    data-testid="testIsUrgentCheckbox"
                  >
                    {{ $t('chat.urgent') }}
                  </base-checkbox>
                  <span
                    class="italic cursor-pointer"
                    data-testid="testFocusNewsTabLink"
                    @click="focusNewsTab"
                    >{{ $t('chat.read_faq_first') }}</span
                  >
                  <div class="flex">
                    <base-button
                      class="bg-crisiscleanup-dark-blue"
                      data-testid="testSendMessageButton"
                      :disabled="!Boolean(currentMessage)"
                      ccu-icon="plane"
                      :action="sendMessage"
                      :alt="$t('actions.send_message')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </tab>
        <tab :name="$t('chat.favorites')">
          <div class="flex flex-col h-156">
            <div
              class="flex flex-col flex-grow py-2 space-y-1 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
            >
              <ChatMessage
                v-for="favorite in favorites"
                :key="favorite.id"
                data-testid="testFavoritesContent"
                :message="favorite"
              />
            </div>
          </div>
        </tab>
        <tab :name="$t('chat.search')">
          <div class="flex flex-col w-full h-156">
            <base-input
              data-testid="testMessagesSearchTextInput"
              :model-value="search"
              icon="search"
              class="w-full mt-2"
              :placeholder="$t('info.search_items')"
              @update:model-value="
                (value) => {
                  search = value;
                  throttle(searchMessages, 1000)();
                }
              "
            />
            <div
              class="flex flex-col flex-grow py-2 space-y-1 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
            >
              <ChatMessage
                v-for="chat in searchResults"
                :key="chat.id"
                data-testid="testFavoritesContent"
                :message="chat"
              />
            </div>
          </div>
        </tab>
      </tabs>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue';
import axios from 'axios';
import moment from 'moment';
import { useToast } from 'vue-toastification';
import { getQueryString, getUserAvatarLink } from '../../utils/urls';
import { getErrorMessage } from '../../utils/errors';
import useCurrentUser from '../../hooks/useCurrentUser';
import type User from '../../models/User';
import { useWebSockets } from '../../hooks/useWebSockets';
import ChatMessage from './ChatMessage.vue';
import type { Message } from '@/models/types';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import UserDetailsTooltip from '@/components/user/DetailsTooltip.vue';
import Avatar from '@/components/Avatar.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import _ from 'lodash';
import { DbService, USER_DATABASE } from '@/services/db.service';

export default defineComponent({
  name: 'Chat',
  components: { FontAwesomeIcon, Avatar, UserDetailsTooltip, ChatMessage },
  props: {
    chat: {
      type: Object,
      default: () => ({}),
    },
    stateKey: {
      type: String,
      default: 'chat_last_seen',
    },
  },
  setup(props, { emit }) {
    const socket = ref<WebSocket | null>(null);
    const online_users_socket = ref<WebSocket | null>(null);
    const currentMessage = ref('');
    const search = ref('');
    const messages = ref<Message[]>([]);
    const favorites = ref<Message[]>([]);
    const searchResults = ref<Message[]>([]);
    const allOnlineUsers = ref<number[]>([]);
    const mobileOnlineUsers = ref<number[]>([]);
    const urgent = ref(false);
    const loadingMessages = ref(false);
    const searchLoading = ref(false);
    let sendToWebsocket: (data: Partial<Message>) => void;
    const messagesBox = ref<HTMLDivElement | null>(null);
    const { currentUser, updateUserStates, userStates } = useCurrentUser();
    const $toasted = useToast();

    const sortedMessages = computed(() => {
      const currentMessages = [...messages.value];
      currentMessages.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
      return _.uniqWith(currentMessages, _.isEqual);
    });

    const expandedOrganizations = ref<{ [key: number]: boolean }>({});

    const onlineUsersWithData = computed(() => {
      return userCache.value
        ? allOnlineUsers.value.map((id) => userCache.value[id])
        : [];
    });

    const userCache = ref<{ [key: number]: User }>({});

    const getUsersById = async (ids: number[]) => {
      // Initialize arrays to track missing IDs
      const missingIdsFromCache = ids.filter((id) => !userCache.value[id]);
      const missingIdsFromDb: number[] = [];

      // Try to retrieve missing users from the DbService
      for (const id of missingIdsFromCache) {
        const user = await DbService.getItem(`user_${id}`, USER_DATABASE);
        if (user) {
          userCache.value[id] = user as User;
        } else {
          missingIdsFromDb.push(id);
        }
      }

      // Fetch remaining missing users from the API
      if (missingIdsFromDb.length > 0) {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/users?id__in=${missingIdsFromDb.join(
            ',',
          )}&limit=1000&fields=id,first_name,last_name,organization,email,mobile`,
        );
        const userList = response.data.results;
        for (const user of userList) {
          userCache.value[user.id] = user;
          // Store the user in the DbService for future use
          await DbService.setItem(`user_${user.id}`, user, USER_DATABASE);
        }
      }

      // Return the users in the order of the original IDs array
      return ids.map((id) => userCache.value[id]);
    };

    const groupedByOrganization = computed(() => {
      const grouped: { [key: number]: any } = {};
      for (const user of onlineUsersWithData.value) {
        if (user.organization) {
          const orgId = user.organization.id;
          if (!grouped[orgId]) {
            grouped[orgId] = {
              id: orgId,
              name: user.organization.name,
              users: [],
            };
          }
          grouped[orgId].users.push(user);
        }
      }
      return Object.values(grouped);
    });

    const sortedOrganizations = computed(() => {
      return [...groupedByOrganization.value]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((org) => {
          org.users.sort((a, b) => a.last_name.localeCompare(b.last_name));
          return org;
        });
    });

    watch(sortedOrganizations, (sortedOrgs) => {
      for (const org of sortedOrgs) {
        // Automatically expand groups with 3 or fewer users
        if (org.users.length <= 3) {
          expandedOrganizations.value[org.id] = true;
        }
      }
    });

    const toggleOrganization = (orgId: number) => {
      expandedOrganizations.value[orgId] = !expandedOrganizations.value[orgId];
    };

    const isOpen = (orgId: number) => {
      return expandedOrganizations.value[orgId];
    };

    async function searchMessages() {
      if (!search.value) {
        searchResults.value = [];
        return;
      }
      searchLoading.value = true;
      const parameters = {
        message_group: props.chat.id,
        limit: 30,
        search: search.value,
      } as Record<string, any>;
      const queryString = getQueryString(parameters);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/chat_messages?${queryString}`,
        );
        searchResults.value = response.data.results;
      } catch (error) {
        $toasted.error(getErrorMessage(error));
      } finally {
        searchLoading.value = false;
      }
    }

    const handleWheel = debounce(function () {
      if (
        messagesBox?.value?.scrollTop === 0 &&
        sortedMessages.value.length > 0 &&
        !loadingMessages.value
      ) {
        getMessages(sortedMessages.value[0].created_at, false);
      }
    }, 500);

    async function getMessages(before: string | null = null, scroll = true) {
      loadingMessages.value = true;
      const parameters = {
        message_group: props.chat.id,
        limit: 50,
      } as Record<string, any>;
      if (before && messages.value.length > 0) {
        parameters.created_at__lte = before;
      }

      const queryString = getQueryString(parameters);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/chat_messages?${queryString}`,
        );
        messages.value = [...messages.value, ...response.data.results];
        if (scroll) {
          nextTick(() => {
            if (messagesBox.value) {
              messagesBox.value.scrollTop = messagesBox.value.scrollHeight;
            }
          });
        }
      } catch (error) {
        $toasted.error(getErrorMessage(error));
      } finally {
        loadingMessages.value = false;
      }
    }

    async function getFavorites() {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/chat_groups/${props.chat.id}/my_favorites`,
        );
        favorites.value = response.data;
      } catch (error) {
        $toasted.error(getErrorMessage(error));
      }
    }

    async function getUnreadMessagesCount() {
      loadingMessages.value = true;
      const parameters = {
        message_group: props.chat.id,
        limit: 1,
        is_urgent: false,
      } as Record<string, any>;
      if (userStates.value?.[props.stateKey]) {
        parameters.created_at__gte = userStates.value?.[props.stateKey];
      }

      const queryString = getQueryString(parameters);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/chat_messages?${queryString}`,
        );
        emit('unreadCount', response.data.count);
      } catch (error) {
        $toasted.error(getErrorMessage(error));
      } finally {
        loadingMessages.value = false;
      }
    }

    async function getUnreadUrgentMessagesCount() {
      loadingMessages.value = true;
      const parameters = {
        message_group: props.chat.id,
        limit: 1,
        is_urgent: true,
      } as Record<string, any>;
      if (userStates.value?.[props.stateKey]) {
        parameters.created_at__gte = userStates.value?.[props.stateKey];
      }

      const queryString = getQueryString(parameters);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/chat_messages?${queryString}`,
        );
        emit('unreadUrgentCount', response.data.count);
      } catch (error) {
        $toasted.error(getErrorMessage(error));
      } finally {
        loadingMessages.value = false;
      }
    }

    async function sendMessage(parentId = null, content = null) {
      sendToWebsocket({
        content: content || currentMessage.value,
        is_urgent: urgent.value,
        parent_message_id: parentId,
      });
      currentMessage.value = '';
      urgent.value = false;
      await updateUserStates({ [props.stateKey]: moment().toISOString() }, {});
    }

    async function toggleFavorite(
      message: { id: any; is_favorite: boolean },
      state: any,
    ) {
      try {
        if (state) {
          await axios.post(
            `${import.meta.env.VITE_APP_API_BASE_URL}/chat_messages/${message.id}/favorite`,
          );
          message.is_favorite = true;
        } else {
          await axios.post(
            `${import.meta.env.VITE_APP_API_BASE_URL}/chat_messages/${message.id}/unfavorite`,
          );
          message.is_favorite = false;
        }

        await getFavorites();
      } catch (error) {
        $toasted.error(getErrorMessage(error));
      }
    }

    function focusNewsTab() {
      emit('focusNewsTab');
    }

    // Throttle the online users handler to prevent UI freezes
    const handleOnlineUsersUpdate = throttle(async (data) => {
      let updatedAllOnlineUsers: number[] = [];
      let updatedMobileOnlineUsers: number[] = [];

      if (Array.isArray(data)) {
        updatedAllOnlineUsers = data as number[];
      } else if (data.online_users) {
        updatedAllOnlineUsers = [
          ...new Set([
            ...(data.online_users as number[]),
            ...(data.online_mobile_users as number[]),
          ]),
        ];
        updatedMobileOnlineUsers = data.online_mobile_users as number[];
      } else {
        const users = Object.keys(data)
          .map((key) => JSON.parse(data[key]))
          .filter(
            (user) => moment().diff(moment(user.last_seen_at), 'minutes') < 5,
          );

        updatedAllOnlineUsers = users.map((u) => u.user_id);
        updatedMobileOnlineUsers = users
          .filter((u) => u.is_mobile)
          .map((u) => u.user_id);
      }

      await getUsersById(updatedAllOnlineUsers);

      allOnlineUsers.value = updatedAllOnlineUsers;
      mobileOnlineUsers.value = updatedMobileOnlineUsers;
    }, 10_000);

    onBeforeMount(() => {
      const { socket: s, send } = useWebSockets<Message>(
        `/ws/chat/${props.chat.id}`,
        'chat',
        (data: Message) => {
          if (data.parent_message) {
            const parent = messages.value.find(
              (message) => message.id === data.parent_message,
            );
            if (parent) {
              parent.replies = parent.replies || [];
              parent.replies.push(data);
            }
          } else {
            messages.value = [data, ...messages.value];
            if (String(data.created_by) !== String(currentUser?.value?.id)) {
              if (data.is_urgent) {
                emit('onNewUrgentMessage');
              } else {
                emit('onNewMessage');
              }
            }

            nextTick(() => {
              if (messagesBox.value) {
                messagesBox.value.scrollTop = messagesBox.value.scrollHeight;
              }
            });
          }
        },
      );

      const { socket: online_users_s } = useWebSockets(
        '/ws/online_chat_users',
        'phone_stats',
        handleOnlineUsersUpdate,
      );

      online_users_socket.value = online_users_s;
      socket.value = s;
      sendToWebsocket = send;
    });

    onMounted(async () => {
      await getUnreadMessagesCount();
      await getUnreadUrgentMessagesCount();
      await getMessages();
      await getFavorites();
    });

    onBeforeUnmount(() => {
      socket?.value?.close();
      online_users_socket?.value?.close();
    });

    return {
      socket,
      messages,
      favorites,
      currentMessage,
      urgent,
      loadingMessages,
      sortedMessages,
      messagesBox,
      handleWheel,
      sendMessage,
      toggleFavorite,
      focusNewsTab,
      throttle,
      searchMessages,
      search,
      searchResults,
      allOnlineUsers,
      mobileOnlineUsers,
      onlineUsersWithData,
      sortedOrganizations,
      toggleOrganization,
      isOpen,
      moment,
    };
  },
  methods: { getUserAvatarLink },
});
</script>

<style scoped>
.organization-group {
  margin-bottom: 1rem;
}

.organization-header {
  display: flex;
  align-items: center;
}

.organization-name {
  margin-left: 0.5rem;
}

.arrow {
  transition: transform 0.3s;
}

.arrow.open {
  transform: rotate(180deg);
}

.users-list {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
}

.scrollbar-w-2::-webkit-scrollbar {
  width: 0.25rem;
  height: 0.25rem;
}

.scrollbar-track-blue-lighter::-webkit-scrollbar-track {
  --bg-opacity: 1;
  background-color: #f7fafc;
  background-color: rgba(247, 250, 252, var(--bg-opacity));
}

.scrollbar-thumb-blue::-webkit-scrollbar-thumb {
  --bg-opacity: 1;
  background-color: #edf2f7;
  background-color: rgba(237, 242, 247, var(--bg-opacity));
}

.scrollbar-thumb-rounded::-webkit-scrollbar-thumb {
  border-radius: 0.25rem;
}
.message-container {
  @apply flex flex-col;
}
</style>
