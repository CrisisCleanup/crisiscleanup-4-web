<script setup lang="ts">
import useConnectFirst from '@/hooks/useConnectFirst';
import LanguageTag from '@/components/tags/LanguageTag.vue';
import { useCurrentUser } from '@/hooks';
import EditAgentModal from '@/components/phone/EditAgentModal.vue';
import PhoneCmsItems from '@/components/phone/PhoneCmsItems.vue';
import PhoneOutbound from '@/models/PhoneOutbound';
import User from '@/models/User';
import moment from 'moment';
import Avatar from '@/components/Avatar.vue';
import { momentFromNow } from '../../filters';
import QRCode from '@/components/QRCode.vue';
import useDialogs from '@/hooks/useDialogs';
import axios from 'axios';
import BaseButton from '@/components/BaseButton.vue';
import { useI18n } from 'vue-i18n';
import { throttle } from 'lodash';
import TrainingBanner from '@/components/dashboard/TrainingBanner.vue';

const emit = defineEmits(['setCase']);
const { apiGetQueueStats, languages } = useConnectFirst({
  emit,
});
const { component } = useDialogs();
const { currentUser } = useCurrentUser();
const { t } = useI18n();

const editingAgent = ref(false);
const unreadNewsCount = ref(0);
const stats = ref({ inQueue: 0, active: 0, staffed: 0 });
const remainingCallbacks = ref(0);
const remainingCalldowns = ref(0);
const search = ref('');
async function updateCallbacks() {
  remainingCallbacks.value =
    await PhoneOutbound.api().getRemainingCallbackCount('');
  remainingCalldowns.value =
    await PhoneOutbound.api().getRemainingCalldownCount('');
}

const callsWaiting = computed(function () {
  return (
    Number(stats.value.inQueue || 0) +
    Number(stats.value.active || 0) +
    Number(remainingCallbacks.value || 0) +
    Number(remainingCalldowns.value || 0)
  );
});

const recentUsers = ref<User[]>([]);
const persistentInvitations = ref([]);

async function getRecentPhoneUsers() {
  const _results = await User.api().get(
    `/users?recent_phone_users=7&limit=10&&organization=${currentUser?.value?.organization.id}&search=${search.value}`,
    { dataKey: 'results' },
  );

  const results = (_results.entities?.users || []) as User[];
  recentUsers.value = results;
}

async function getPersistentInvitations() {
  const response = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/persistent_invitations`,
    {
      params: {
        model: 'organization_organizations',
        requires_approval: false,
        limit: 1,
      },
    },
  );
  persistentInvitations.value = response.data.results;
}

const createPersistentInvitation = async () => {
  const url = `${import.meta.env.VITE_APP_API_BASE_URL}/persistent_invitations`;
  const data = {
    model: 'organization_organizations',
    object_id: currentUser.value.organization.id,
    requires_approval: false,
  };

  const response = await axios.post(url, data);
  return response.data;
};

const showInvitationQrCode = async () => {
  if (persistentInvitations.value.length > 0) {
    return showQRCode(persistentInvitations.value[0]);
  } else {
    const persistentInvitation = await createPersistentInvitation();
    await getPersistentInvitations();
    return showQRCode(persistentInvitation);
  }
};

function showQRCode(persistentInvitation) {
  return component({
    title: t('persistentInvitations.join_the_team'),
    component: QRCode,
    classes: 'w-full h-84 overflow-auto p-3',
    modalClasses: 'bg-white max-w-sm shadow',
    props: {
      // eslint-disable-next-line vue/require-prop-type-constructor
      value: window.location.origin + '/i/' + persistentInvitation.token,
    },
  });
}

onMounted(async () => {
  await updateCallbacks();
  await getRecentPhoneUsers();
  await getPersistentInvitations();
  const queueStatsResponse = await apiGetQueueStats();
  stats.value = queueStatsResponse.data;
});
</script>

<template>
  <TrainingBanner />
  <div class="flex flex-col items-center justify-center">
    <div
      class="flex md:flex-row flex-col w-full p-2 items-center justify-center margin-auto bg-crisiscleanup-light-smoke my-4 max-w-6xl"
    >
      <base-button
        data-testid="testIsNotTakingCallsButton"
        variant="solid"
        class="py-1 px-4"
        :action="
          () => {
            $router.push('/phone?start=true');
          }
        "
        :text="$t('phoneDashboard.go_to_calls')"
        :alt="$t('phoneDashboard.go_to_calls')"
      ></base-button>
      <div class="flex items-center justify-between mr-3">
        <div class="flex items-start justify-start">
          <div class="flex ml-4 mr-1">
            <base-text
              v-if="currentUser"
              data-testid="testCurrentUserMobileContent"
              variant="bodysm"
              class="w-max"
            >
              {{ currentUser.mobile }}
            </base-text>
          </div>
        </div>
        <div class="py-3 w-full">
          <div
            class="flex flex-wrap items-center"
            data-testid="testPhoneDashboardLanguagesDiv"
          >
            <div class="mx-2 text-crisiscleanup-dark-200 hidden md:block">
              {{ $t('phoneDashboard.languages') }}
            </div>
            <div
              v-for="l in languages"
              :key="`l_${l}`"
              class="flex flex-col tag-container"
            >
              <LanguageTag class="tag-item mx-0.5" :language-id="l.id" />
            </div>
            <ccu-icon
              type="edit"
              data-testid="testLanguageEditIcon"
              size="small"
              class="mx-1"
              :alt="$t('actions.edit')"
              @click="editingAgent = true"
            />
          </div>
        </div>
        <EditAgentModal v-if="editingAgent" @cancel="editingAgent = false" />
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl w-full">
      <div>
        <div class="text-lg font-semibold px-4">
          {{ $t('phoneDashboard.news') }}
        </div>
        <PhoneCmsItems
          class="p-2 h-156"
          data-testid="testPhoneCmsItemsDiv"
          style="z-index: 1002"
          @unread-count="unreadNewsCount = $event"
        ></PhoneCmsItems>
      </div>
      <div>
        <div>
          <div class="text-lg font-semibold px-4">
            {{ $t('phoneDashboard.stats') }}
          </div>
          <div class="m-2">
            <div
              class="stats-card flex items-center justify-center flex-col mb-2"
            >
              <div class="text-4xl">{{ callsWaiting }}</div>
              <div>{{ $t('phoneDashboard.remaining_calls') }}</div>
            </div>
            <div class="flex flex-wrap gap-2">
              <div class="stats-card w-full md:w-1/2">
                <p>{{ $t('phoneDashboard.volunteers_talking') }}</p>
                <p>{{ stats.active || 0 }}</p>
              </div>
              <div class="stats-card w-full md:w-1/2">
                <p>{{ $t('phoneDashboard.volunteers_online') }}</p>
                <p>{{ stats.staffed || 0 }}</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between mt-8 px-4">
            <div class="text-lg font-semibold">
              {{ $t('usersVue.invite_new_user') }}
            </div>
            <base-button
              :action="showInvitationQrCode"
              :text="$t('actions.show_qr_code')"
              icon="qrcode"
              class="text-crisiscleanup-dark-blue"
            />
          </div>
          <div>
            <base-input
              :model-value="search"
              icon="search"
              class="m-2"
              :placeholder="$t('actions.search_users')"
              @update:model-value="
                (value) => {
                  search = value;
                  throttle(getRecentPhoneUsers, 1000)();
                }
              "
            ></base-input>

            {{ $t('phoneDashboard.recently_active_users') }}
            <div class="max-h-156 overflow-auto">
              <div
                v-for="user in recentUsers"
                :key="user.id"
                class="flex gap-2 mb-3 shadow-sm px-4 py-2"
              >
                <Avatar
                  :initials="user.first_name"
                  :url="user.profilePictureUrl"
                  class="mb-4 mr-2"
                  size="xsmall"
                />
                <div class="flex justify-between items-center flex-grow">
                  <div>
                    {{ user.full_name }}
                    <div class="text-sm">
                      <font-awesome-icon
                        icon="envelope"
                        :alt="$t('actions.email')"
                      />
                      <a :href="`mailto:${user.email}`" class="ml-1">{{
                        user.email
                      }}</a>
                    </div>
                    <div v-if="user.mobile" class="text-sm">
                      <font-awesome-icon
                        icon="phone"
                        :alt="$t('actions.call')"
                      />
                      <a :href="`tel:${user.mobile}`" class="ml-1">{{
                        user.mobile
                      }}</a>
                    </div>
                    <div class="opacity-50 mt-2">
                      {{ user.allRolesNames }}
                    </div>
                    <div class="opacity-50">
                      {{ user.organization.name }}
                    </div>
                    <div class="opacity-50">
                      {{ momentFromNow(user.current_sign_in_at) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-card {
  @apply bg-white rounded-lg p-4 shadow-md;
}

@media (max-width: 768px) {
  .stats-card {
    @apply w-full;
  }
}
</style>
