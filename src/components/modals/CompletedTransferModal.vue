<template>
  <modal
    :title="$t('userTransfer.you_have_been_moved')"
    data-testid="testYouHaveBeenMovedModal"
    modal-classes="max-w-lg h-64"
    closeable
    @cancel="$emit('close')"
  >
    <div class="p-3">
      <div
        v-if="currentUser && requestingUser"
        data-testid="testYouHaveBeenMovedToDiv"
      >
        {{ $t('userTransfer.you_have_been_moved_to') }}
        {{ currentUser.organization.name }} {{ $t('userTransfer.by') }}
        {{ requestingUser.first_name }} {{ requestingUser.last_name }} ({{
          requestingUser.email
        }})
      </div>
      <div>
        {{ $t('userTransfer.choose_to_stay_return') }}
      </div>
    </div>
    <template #footer>
      <div class="p-3 flex items-center justify-center">
        <base-button
          variant="outline"
          data-testid="testMoveBackButton"
          :action="goBack"
          :text="$t('actions.move_back')"
          :alt="$t('actions.move_back')"
          class="ml-2 p-3 px-6 text-xs"
        />
        <base-button
          :action="stay"
          :text="$t('actions.stay')"
          :alt="$t('actions.stay')"
          data-testid="testStayButton"
          variant="solid"
          class="ml-2 p-3 px-6 text-xs"
        />
      </div>
    </template>
  </modal>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue';
import type { PropType } from 'vue';
import moment from 'moment';
import { useRouter } from 'vue-router';
import axios from 'axios';
import User from '../../models/User';
import { useCurrentUser } from '@/hooks';
import type { UserTransferResult } from '@/models/types';
import { getApiUrl } from '@/utils/helpers';

export default defineComponent({
  name: 'CompletedTransferModal',
  props: {
    transferRequest: {
      type: Object as PropType<UserTransferResult>,
      required: true,
    },
  },
  emits: ['close'],
  setup(props, context) {
    const { currentUser } = useCurrentUser();
    const $http = axios;
    const router = useRouter();
    const transferReq = computed(() => props.transferRequest);

    const requestingUser = computed(() =>
      transferReq.value ? User.find(transferReq.value.requested_by) : undefined,
    );

    async function getRequestingUser() {
      if (!transferReq.value) {
        console.error(
          'Transfer request not defined. Cannot fetch requesting user',
        );
        return;
      }
      await User.api().get(`/users/${transferReq.value.requested_by}`);
    }

    async function markAsSeen() {
      if (!transferReq.value) {
        console.error(
          'Transfer request is not defined. Unable to set mark as seen.',
        );
        return false;
      }
      await $http.patch(
        getApiUrl(`/transfer_requests/${transferReq.value.id}`),
        {
          user_approved_at: moment().toISOString(),
        },
      );
      return true;
    }

    async function stay() {
      const isSuccess = await markAsSeen();
      if (isSuccess) {
        await markAsSeen();
        context.emit('close');
      }
    }

    async function goBack() {
      const isSuccess = await markAsSeen();
      if (isSuccess) {
        await router.push('/profile?move=true');
        context.emit('close');
      }
    }

    onMounted(async () => {
      await getRequestingUser();
    });

    return {
      currentUser,
      requestingUser,
      stay,
      goBack,
    };
  },
});
</script>

<style scoped></style>
