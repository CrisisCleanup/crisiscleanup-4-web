<template>
  <div
    class="header bg-white w-full h-full border-b border-crisiscleanup-grey-100 z-header flex items-center justify-between px-[18px] gap-3.5"
  >
    <div class="flex items-center gap-3.5 min-w-0">
      <BaseSelect
        :key="String(currentIncident && currentIncident.id)"
        :model-value="currentIncident?.id"
        :options="incidentOptions"
        :clearable="false"
        data-testid="testIncidentSelectorSelect"
        searchable
        item-key="id"
        label="label"
        class="ccu-incident-picker min-w-[320px]"
        @update:model-value="
          (payload: string) => $emit('update:incident', payload)
        "
      >
        <template #selected-option="{ option }">
          <div
            v-if="option"
            class="multiselect-single-label flex items-center h-full max-w-full absolute left-0 top-0 gap-2.5 px-2.5 pointer-events-none"
          >
            <div
              class="incident-tile w-9 h-9 flex-none grid place-items-center rounded bg-crisiscleanup-smoke overflow-hidden"
            >
              <DisasterIcon
                v-if="option.incident_type"
                :current-incident="option"
                data-testid="testDisasterIcon"
                :alt="$t('info.double_click_surprise')"
                :title="$t('info.double_click_surprise')"
              />
            </div>
            <span
              v-if="option.case_label"
              class="bg-primary-light text-black text-[11px] font-bold px-1.5 py-0.5 rounded-sm flex-none"
            >
              {{ option.case_label }}
            </span>
            <span
              class="flex-1 min-w-0 truncate font-bold text-[13px] text-black"
            >
              {{ option.name }}
            </span>
          </div>
        </template>

        <template #option="{ option }">
          <div class="flex items-center gap-2.5 w-full min-w-0">
            <div
              class="incident-tile w-8 h-8 flex-none grid place-items-center rounded bg-crisiscleanup-smoke overflow-hidden"
            >
              <DisasterIcon
                v-if="option.incident_type"
                :current-incident="option"
              />
            </div>
            <span
              v-if="option.case_label"
              class="bg-primary-light text-black text-[11px] font-bold px-1.5 py-0.5 rounded-sm flex-none"
            >
              {{ option.case_label }}
            </span>
            <span class="flex-1 min-w-0 truncate font-bold text-[13px]">
              {{ option.name }}
            </span>
          </div>
        </template>

        <template #list-header>
          <div
            class="px-3 py-2 cursor-pointer flex items-center gap-2 text-[13px] font-bold hover:bg-crisiscleanup-smoke border-b border-crisiscleanup-grey-100"
            @click="showRedeployModal = true"
          >
            <ccu-icon
              :alt="$t('actions.add_incident')"
              type="active"
              size="small"
            />
            {{ $t('actions.add_incident') }}
          </div>
        </template>
      </BaseSelect>

      <div v-if="can('development_mode')" class="flex gap-2">
        <base-button
          class="p-1.5"
          variant="solid"
          data-testid="testDebugUserButton"
          :text="$t('actions.debug_user')"
          :alt="$t('actions.debug_user')"
          :action="showCurrentUser"
        />
        <base-button
          class="p-1.5"
          variant="solid"
          data-testid="testDebugIncidentStatesButton"
          :text="$t('actions.debug_incident_states')"
          :alt="$t('actions.debug_incident_states')"
          :action="showCurrentIncidentStates"
        />
        <base-button
          class="p-1.5"
          variant="solid"
          data-testid="testDebugPortalButton"
          :text="$t('actions.debug_portal')"
          :alt="$t('actions.debug_portal')"
          :action="showCurrentPortal"
        />
      </div>
    </div>

    <div class="flex h-full items-center gap-3.5">
      <div
        v-if="can && can('phone_agent')"
        class="flex items-center"
        data-testid="testPhoneIndicatorDiv"
      >
        <PhoneIndicator />
      </div>

      <UserProfileMenu
        data-testid="testLogoutLink"
        @auth:logout="() => $emit('auth:logout')"
      />
    </div>
    <RedeployRequest
      v-if="showRedeployModal"
      :hide-trigger="true"
      :open-modal="true"
      data-testid="testRedeployRequestButton"
      @close="showRedeployModal = false"
    />
  </div>
</template>

<script lang="ts">
import { computed, type PropType, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import DisasterIcon from '../DisasterIcon.vue';
import BaseSelect from '../BaseSelect.vue';
import useDialogs from '../../hooks/useDialogs';
import JsonWrapper from '../JsonWrapper.vue';
import useAcl from '../../hooks/useAcl';
import PhoneIndicator from '../phone/PhoneIndicator.vue';
import RedeployRequest from '../modals/RedeployRequest.vue';
import UserProfileMenu from './UserProfileMenu.vue';
import User from '@/models/User';
import BaseText from '@/components/BaseText.vue';
import AppDownloadLinks from '@/components/AppDownloadLinks.vue';
import { useCurrentUser } from '@/hooks';
import type Incident from '@/models/Incident';

export default defineComponent({
  name: 'Header',
  components: {
    AppDownloadLinks,
    BaseText,
    RedeployRequest,
    PhoneIndicator,
    BaseSelect,
    UserProfileMenu,
    DisasterIcon,
  },
  props: {
    incidents: {
      type: Array as PropType<Incident[]>,
      default: () => [],
    },
    currentIncident: {
      type: Object as PropType<Incident>,
      default: () => ({}),
    },
  },
  setup(props) {
    const { component } = useDialogs();
    const { $can } = useAcl();
    const { t } = useI18n();
    const store = useStore();

    const incidentOptions = computed(() =>
      props.incidents.map((i) => ({
        ...i,
        label: `${i.case_label}: ${i.name}`,
      })),
    );

    const { currentUser } = useCurrentUser();
    async function showCurrentUser() {
      await component({
        title: t('userTable.user_data'),
        component: JsonWrapper,
        classes: 'w-full h-96',
        props: {
          jsonData: currentUser.value,
        },
      });
    }

    async function showCurrentIncidentStates() {
      const states = currentUser?.value?.getStatesForIncident(
        props.currentIncident?.id,
        true,
      );
      await component({
        title: t('userTable.incident_data'),
        component: JsonWrapper,
        classes: 'w-full h-96',
        props: {
          jsonData: states,
        },
      });
    }

    async function showCurrentPortal() {
      const portal = store.getters['enums/portal'];
      await component({
        title: t('nav.portal'),
        component: JsonWrapper,
        classes: 'w-full h-96',
        props: {
          jsonData: portal,
        },
      });
    }

    const showRedeployModal = ref(false);
    return {
      can: $can,
      showRedeployModal,
      incidentOptions,
      showCurrentUser,
      $t(text: string) {
        return text ? t(text) : null;
      },
      showCurrentIncidentStates,
      showCurrentPortal,
    };
  },
});
</script>

<style scoped>
.incident-tile :deep(.standard-icon),
.incident-tile :deep(.easter-egg) {
  width: 28px;
  height: 28px;
}
.incident-tile :deep(.disaster-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
