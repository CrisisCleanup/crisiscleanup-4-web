<template>
  <div class="header header--grid bg-white w-full h-full border-b z-header">
    <div class="flex justify-between h-full items-center">
      <div class="flex items-center ml-2">
        <div class="h-10 w-10 flex items-center">
          <DisasterIcon
            v-if="currentIncident && currentIncident.incidentImage"
            :current-incident="currentIncident"
            data-testid="testDisasterIcon"
            :alt="$t('info.double_click_surprise')"
            :title="$t('info.double_click_surprise')"
          />
        </div>
        <div class="flex flex-col ml-2 md:w-84 lg:w-84">
          <BaseSelect
            :key="String(currentIncident && currentIncident.id)"
            :model-value="currentIncident?.id"
            :options="incidentOptions"
            :clearable="false"
            data-testid="testIncidentSelectorSelect"
            searchable
            container-classes="relative mx-auto w-full flex items-center justify-end cursor-pointer bg-white text-base leading-snug outline-none border"
            select-classes="w-full absolute inset-0 outline-none focus:ring-0 appearance-none border-0 text-base font-sans bg-white rounded p-2"
            item-key="id"
            label="label"
            @update:model-value="
              (payload: string) => $emit('update:incident', payload)
            "
          >
            <template #list-header>
              <div
                class="px-5 py-1 cursor-pointer flex items-center hover:bg-gray-300 hover:text-white"
                @click="showRedeployModal = true"
              >
                <ccu-icon
                  :alt="$t('actions.add_incident')"
                  type="active"
                  size="small"
                  class="mr-1"
                />
                {{ $t('actions.add_incident') }}
              </div>
            </template>
          </BaseSelect>
        </div>
      </div>
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
      <div class="flex h-full items-center">
        <div
          v-if="can && can('phone_agent')"
          class="flex items-center header-item h-full"
          data-testid="testPhoneIndicatorDiv"
        >
          <PhoneIndicator />
        </div>

        <UserProfileMenu
          class="header-item"
          data-testid="testLogoutLink"
          @auth:logout="() => $emit('auth:logout')"
        />
      </div>
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
