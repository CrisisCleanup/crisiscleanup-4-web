<template>
  <div class="bg-white p-2 text-xs flex justify-end w-full">
    <div class="flex items-center justify-center">
      <PhoneIndicator />
    </div>
    <div class="flex items-center justify-between mr-3">
      <div class="flex items-start justify-start">
        <div class="flex ml-4 mr-1">
          <base-text
            v-if="currentUser"
            data-testid="testCurrentUserMobileContent"
            variant="bodysm"
          >
            {{ currentUser.mobile }}
          </base-text>
        </div>
      </div>
      <div class="py-3">
        <div
          class="flex flex-row tags"
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
    </div>
    <div class="flex items-center justify-between">
      <base-button
        v-if="isOnCall || caller"
        data-testid="testIsOnCallButton"
        size="medium"
        :disabled="true"
        :text="$t('phoneDashboard.on_call')"
        :alt="$t('phoneDashboard.on_call')"
        class="text-white bg-crisiscleanup-dark-400 bg-opacity-40"
      ></base-button>
      <base-button
        v-else-if="isNotTakingCalls"
        data-testid="testIsNotTakingCallsButton"
        variant="solid"
        size="medium"
        :action="loginPhone"
        :text="$t('phoneDashboard.start_taking_calls')"
        :alt="$t('phoneDashboard.start_taking_calls')"
      ></base-button>
      <base-button
        v-else-if="!isOnCall"
        data-testid="testIsNotOnCallButton"
        variant="solid"
        size="medium"
        :action="setAway"
        :text="$t('phoneDashboard.stop_taking_calls')"
        :alt="$t('phoneDashboard.stop_taking_calls')"
      ></base-button>
      <base-checkbox
        v-if="!notPlayingNice"
        v-model="notPlayingNice"
        data-testid="notPlayingNiceCheckbox"
        class="p-0.5 ml-3 text-[["
        ><span class="whitespace-nowrap">{{
          $t('phoneDashboard.not_playing_nice')
        }}</span></base-checkbox
      >
      <base-select
        v-if="notPlayingNice"
        data-testid="notPlayingNiceSelect"
        class="w-56 mx-3 h-9"
        :options="[
          AllowedCallType.INBOUND_ONLY,
          AllowedCallType.OUTBOUND_ONLY,
          AllowedCallType.BOTH,
        ]"
        @update:model-value="$emit('setAllowedCallType', $event)"
      ></base-select>
      <ccu-icon
        v-if="(isOnCall || caller) && isOutboundCall"
        :alt="$t('actions.hangup')"
        data-testid="testHangupIcon"
        size="lg"
        class="ml-2"
        type="hangup"
        @click="hangup"
      ></ccu-icon>
    </div>
    <EditAgentModal v-if="editingAgent" @cancel="editingAgent = false" />
  </div>
</template>

<script lang="ts">
import { reactive, ref } from 'vue';
import LanguageTag from '../tags/LanguageTag.vue';
import useConnectFirst from '../../hooks/useConnectFirst';
import EditAgentModal from './EditAgentModal.vue';
import PhoneIndicator from './PhoneIndicator.vue';
import usePhoneService from '@/hooks/phone/usePhoneService';
import { useCurrentUser } from '@/hooks';
import BaseSelect from '@/components/BaseSelect.vue';
import { AllowedCallType } from '@/pages/phone/PhoneSystem.vue';

export default defineComponent({
  name: 'Agent',
  components: { BaseSelect, PhoneIndicator, EditAgentModal, LanguageTag },
  setup(props, context) {
    const editingAgent = ref(false);
    const { currentUser } = useCurrentUser();
    const phoneService = reactive(usePhoneService());
    const notPlayingNice = ref(false);
    const {
      languages,
      isOnCall,
      caller,
      isNotTakingCalls,
      setAway,
      loginPhone,
      isOutboundCall,
    } = useConnectFirst(context);
    return {
      editingAgent,
      languages,
      currentUser,
      isOnCall,
      caller,
      isNotTakingCalls,
      setAway,
      loginPhone,
      isOutboundCall,
      hangup: phoneService.hangup,
      notPlayingNice,
      AllowedCallType,
    };
  },
});
</script>
