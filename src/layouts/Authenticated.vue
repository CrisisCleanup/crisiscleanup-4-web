<template>
  <template v-if="isPageReady">
    <!-- For mobile screens -->
    <template v-if="mq.mdMinus">
      <div class="flex flex-col">
        <DisasterIcon
          v-if="currentIncident && currentIncident.incidentImage"
          :current-incident="currentIncident"
          data-testid="testDisasterIcon"
          class="fixed left-4 top-4 z-disaster-icon"
          @click="showIncidentSelectionModal"
        />
        <main>
          <slot />
        </main>
        <footer
          style="width: 100svw"
          class="pt-3 pb-3 bg-zinc-800 text-white fixed inset-x-0 bottom-0 flex justify-around items-center z-header"
        >
          <div
            v-for="r in mobileRoutes"
            :key="r.key"
            class="flex flex-col items-center"
          >
            <a :href="r.to" class="text-white flex flex-col">
              <font-awesome-icon :icon="r.icon" class="mb-1" size="small" />
              {{ r.text }}
            </a>
          </div>
          <div class="flex flex-col items-center">
            <a
              class="text-white flex flex-col"
              @click="showingMoreLinks = true"
            >
              <font-awesome-icon icon="bars" class="mb-1" />
              {{ $t('nav.more') }}</a
            >
          </div>
        </footer>
      </div>
      <modal
        v-if="showingMoreLinks"
        data-testid="testShowingMoreLinksModal"
        modal-classes="bg-white h-120 shadow p-3"
        closeable
        :title="$t('nav.all_links')"
        @close="showingMoreLinks = false"
      >
        <div v-for="r in routes" :key="r.key" class="flex items-center">
          <base-link :href="r.to" class="text-black text-base p-1">
            {{ r.text || $t(`nav.${r.key}`) }}
          </base-link>
        </div>
        <AppDownloadLinks />
      </modal>
    </template>

    <!-- For desktop screens -->
    <template v-else>
      <div class="layout" data-testid="testIsAuthenticatedDiv">
        <div
          class="sidebar h-full overflow-auto"
          :class="{ 'slide-over': slideOverVisible }"
        >
          <div
            v-if="slideOverVisible"
            class="flex items-center justify-end p-1.5"
          >
            <font-awesome-icon
              icon="times"
              :alt="$t('nav.hide_navigation')"
              data-testid="testAuthenticatedToggleIcon"
              class="menu-button mx-2 cursor-pointer text-white self-end"
              size="2xl"
              @click="toggle"
            />
          </div>
          <NavMenu
            :key="route"
            :routes="routes"
            :logo-route="logoRoute"
            class="flex flex-col text-sm"
          />
        </div>
        <div class="header flex items-center">
          <font-awesome-icon
            icon="bars"
            :alt="$t('nav.show_navigation')"
            data-testid="testHamburgerIcon"
            class="menu-button mx-3 cursor-pointer"
            size="2xl"
            @click="toggle"
          />
          <Header
            :current-incident="currentIncident"
            :incidents="incidents"
            @update:incident="handleChange"
            @auth:logout="logoutApp"
          />
        </div>
        <div class="main">
          <div class="h-full overflow-auto w-screen md:w-auto">
            <slot />
          </div>
        </div>
        <template v-if="showAcceptTermsModal">
          <TermsandConditionsModal
            :organization="currentOrganization"
            data-testid="testShowAcceptTermsModal"
            @accepted-terms="acceptTermsAndConditions"
          />
        </template>
        <template
          v-if="
            currentOrganization &&
            (!currentOrganization.is_active || !currentOrganization.is_verified)
          "
        >
          <OrganizationInactiveModal @user-logged-out="logoutApp" />
        </template>
        <div v-if="showLoginModal">
          <modal
            modal-classes="bg-white max-w-lg shadow p-5"
            :closeable="false"
          >
            <LoginForm :redirect="false" />
            <template #footer>
              <div></div>
            </template>
          </modal>
        </div>
      </div>
    </template>
  </template>
  <!--   Page spinner -->
  <div v-else class="flex h-screen items-center justify-center">
    <spinner show-quote allow-reset />
  </div>
</template>

<script lang="ts">
import { computed, ref } from 'vue';
import moment from 'moment';
import { useAsyncState } from '@vueuse/core';
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { useMq } from 'vue3-mq';
import Incident from '@/models/Incident';
import Organization from '@/models/Organization';
import Language from '@/models/Language';
import Report from '@/models/Report';
import Role from '@/models/Role';
import PhoneStatus from '@/models/PhoneStatus';
import NavMenu from '../components/navigation/NavMenu.vue';
import TermsandConditionsModal from '../components/modals/TermsandConditionsModal.vue';
import Header from '../components/header/Header.vue';
import LoginForm from '../components/LoginForm.vue';
import useSetupLanguage from '@/hooks/useSetupLanguage';
import useAcl from '@/hooks/useAcl';
import DisasterIcon from '@/components/DisasterIcon.vue';
import useDialogs from '@/hooks/useDialogs';
import {
  useAuthStore,
  useCurrentIncident,
  useCurrentUser,
  useZendesk,
  ZendeskCommand,
  ZendeskTarget,
} from '@/hooks';
import useEmitter from '@/hooks/useEmitter';
import AppDownloadLinks from '@/components/AppDownloadLinks.vue';
import OrganizationInactiveModal from '@/components/modals/OrganizationInactiveModal.vue';
import { getErrorMessage } from '@/utils/errors';
import { isLandscape } from '@/utils/helpers';
import createDebug from 'debug';
import type { Portal } from '@/models/types';
import { VERSION_3_LAUNCH_DATE } from '@/constants';
import { useAuthenticatedRoutes } from '@/hooks/useAuthenticatedRoutes';
import axios from 'axios';

const debug = createDebug('@ccu:layouts:Authed');
const loadDebug = debug.extend('loading');

export default defineComponent({
  name: 'Authenticated',
  components: {
    OrganizationInactiveModal,
    AppDownloadLinks,
    DisasterIcon,
    LoginForm,
    NavMenu,
    TermsandConditionsModal,
    Header,
  },
  setup() {
    const mq = useMq();

    const {
      currentUser,
      hasCurrentUser,
      updateCurrentUser,
      isOrganizationInactive,
      isOrphan,
    } = useCurrentUser();
    const {
      hasCurrentIncident,
      currentIncident,
      currentIncidentId,
      fetchIncidentDetails,
      loadRecentIncident,
      updateCurrentIncidentId,
    } = useCurrentIncident();
    const authStore = useAuthStore();
    const { setupLanguage } = useSetupLanguage();
    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n();
    const store = useStore();
    const { $can } = useAcl();
    const zendesk = useZendesk()!;
    const { selection } = useDialogs();
    const { emitter } = useEmitter();
    const { routes } = useAuthenticatedRoutes();

    const slideOverVisible = ref(false);
    const showAcceptTermsModal = ref(false);
    const showingMoreLinks = ref(false);

    router.beforeEach((to, from, next) => {
      store.commit('events/addEvent', {
        event_key: 'user_ui-read_page',
        created_at: moment().toISOString(),
        attr: {
          api_endpoint: to.fullPath,
        },
      });

      // Orphaned Users can't really login this will navigate to a public landing page once it is built
      if (isOrphan.value && to.name !== 'nav.request_access') {
        const requestAccessLocation: RouteLocationRaw = {
          name: 'nav.request_access',
          query: { orphan: String(true) },
        };
        return next(requestAccessLocation);
      }

      // route guard for inactive organizations.
      if (isOrganizationInactive.value) {
        authStore.logout();
        return next();
      }
      if (to.meta.admin && currentUser.value && !currentUser.value.isAdmin) {
        return next({ name: 'nav.dashboard' });
      }
      return next();
    });

    router.onError((error, to) => {
      if (
        error?.message?.includes(
          'Failed to fetch dynamically imported module',
        ) ||
        error?.message?.includes('Importing a module script failed')
      ) {
        if (to?.fullPath) {
          window.location = to.fullPath;
        } else {
          window.location.reload();
        }
      }
    });
    loadDebug('Loading started...');
    const onPageReadyUnSub = whenever(hasCurrentIncident, () => {
      loadDebug('Loading finished...');
      onPageReadyUnSub();
    });

    const showLoginModal = computed(() => store.getters['auth/showLoginModal']);

    const portal = computed(() => store.getters['enums/portal'] as Portal);

    const incidentFieldsStr = computedEager(() =>
      Incident.basicFields().join(','),
    );

    const toggle = () => {
      slideOverVisible.value = !slideOverVisible.value;
    };

    const currentOrganization = computed(() =>
      Organization.find(currentUser?.value?.organization?.id),
    );

    const incidents = computed(() =>
      Incident.query().orderBy('start_at', 'desc').get(),
    );

    const logoRoute = computed(() => ({
      name: 'nav.pew',
      key: 'pew',
      text: t('nav.pew'),
      to: '/pew-pew',
    }));

    const mobileRoutes = computed(() =>
      [
        {
          name: 'nav.dashboard',
          key: 'dashboard',
          text: t('nav.dashboard'),
          to: `/incident/${currentIncidentId.value}/dashboard`,
          icon: 'dashboard',
        },
        {
          name: 'nav.work',
          key: 'work',
          to: `/incident/${currentIncidentId.value}/work`,
          icon: 'briefcase',
          text: t('nav.work'),
        },
        {
          name: 'nav.phone',
          key: 'phone',
          icon: 'phone',
          text: t('nav.phone'),
          to: `/incident/${currentIncidentId.value}/phone`,
          disabled: !$can || !$can('phone_agent'),
        },
        {
          name: 'nav.profile',
          key: 'profile',
          icon: 'user',
          text: t('nav.profile'),
          to: '/profile',
        },
      ].filter((r) => !r.disabled),
    );

    const hasAcceptedTaC = computed(() => {
      if (!currentUser.value) return false;
      const acceptedTimestamp = currentUser.value?.accepted_terms_timestamp;
      if (!acceptedTimestamp) return false;
      const acceptedDate = moment(acceptedTimestamp);
      if (moment(VERSION_3_LAUNCH_DATE).isAfter(acceptedDate)) return false;
      const portalTOSUpdatedAt = portal.value?.tos_updated_at;
      return !(
        portalTOSUpdatedAt && moment(portalTOSUpdatedAt).isAfter(acceptedDate)
      );
    });

    whenever(
      () => currentOrganization.value && !hasAcceptedTaC.value,
      () => {
        showAcceptTermsModal.value = true;
      },
    );

    const acceptTermsAndConditions = async () => {
      await updateCurrentUser({
        accepted_terms: true,
        accepted_terms_timestamp: moment().toISOString(),
      });
      showAcceptTermsModal.value = false;
    };

    const checkUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            axios
              .post(
                `${import.meta.env.VITE_APP_API_BASE_URL}/user_geo_locations`,
                {
                  point: {
                    coordinates: [
                      position.coords.longitude,
                      position.coords.latitude,
                    ],
                    type: 'Point',
                  },
                },
              )
              .then(() => {
                debug('User location updated');
              });
          },
          (error) => {
            console.error(`Error Code = ${error.code} - ${error.message}`);
          },
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    };

    const handleChange = async (value: number) => {
      if (!value) return;
      await updateCurrentIncidentId(value).catch(getErrorMessage);
    };

    async function showIncidentSelectionModal() {
      const result = await selection({
        title: t('Select Incident'),
        content: t('locationVue.select_incident'),
        options: incidents.value,
        placeholder: t('locationVue.select_incident'),
        itemKey: 'id',
        label: 'name',
      });

      if (result) {
        await handleChange(result as number);
      }
    }

    // TODO: why is this needed?
    emitter.on('update:incident', (incidentId) => {
      debug('trigger update:incident (%s)', incidentId);
      handleChange(incidentId as number).catch((error) =>
        getErrorMessage(error),
      );
    });

    // update zendesk current user.
    watchEffect(() => {
      if (currentUser.value && zendesk.isOpen.value) {
        // ccu user id custom zendesk field.
        const ccuIdFieldId = '16781124470797';
        // prefill base zendesk fields.
        zendesk.zE(ZendeskTarget.WEB_WIDGET, ZendeskCommand.PREFILL, {
          name: {
            value: currentUser.value.full_name,
            readOnly: false,
          },
          email: {
            value: currentUser.value.email,
            readOnly: false,
          },
        });
        // merge contact form fields.
        zendesk.config.webWidget.contactForm!.fields ??= [];
        zendesk.config.webWidget.contactForm!.fields = [
          ...zendesk.config.webWidget.contactForm!.fields.filter(
            (field) => field.id !== ccuIdFieldId,
          ),
          {
            id: ccuIdFieldId,
            hidden: true,
            prefill: { '*': String(currentUser.value.id) },
          },
        ];
      }
    });

    // TODO: Move these network calls to where they belong
    async function loadPageData() {
      await Promise.allSettled([
        Incident.api().get(
          `/incidents?fields=${incidentFieldsStr.value}&limit=250&sort=-start_at`,
          { dataKey: 'results' },
        ),
        Organization.api().get(
          `/organizations/${currentUser.value!.organization.id}`,
        ),
        Language.api().get('/languages', {
          dataKey: 'results',
        }),
        Report.api().get('/reports', {
          dataKey: 'results',
        }),
        Role.api().get('/roles', {
          dataKey: 'results',
        }),
        PhoneStatus.api().get('/phone_statuses', {
          dataKey: 'results',
        }),
      ]);
    }

    const loadState = useAsyncState(
      () => Promise.all([setupLanguage(), loadPageData(), checkUserLocation()]),
      undefined,
      {
        immediate: false,
        resetOnExecute: false,
      },
    );

    let onCurrentUserUnSub: (() => void) | undefined;
    onCurrentUserUnSub = whenever(
      hasCurrentUser,
      () => {
        debug('authenticated init:', currentUser.value);
        // Prioritize fetching the current user's incident details to optimize page load times.
        // We only need to fetch current user incident details to load page immediately before loading other page data.
        // Example:
        // Load /incidents/104
        // Load other page data (/incidents, /organizations, /languages, etc.)
        // It's because loading /incidents before loading current user incident is slow
        // Note: The sequence of operations here is crucial for achieving the desired performance.
        if (!currentIncidentId.value) {
          loadRecentIncident().catch(getErrorMessage);
        }
        fetchIncidentDetails().catch(getErrorMessage);
        // Load all other page data after loading user incident
        loadState.execute().catch(getErrorMessage);
        if (onCurrentUserUnSub) onCurrentUserUnSub();
      },
      { immediate: true },
    );

    // fetch current incident details.
    // todo: this probably belongs down where these details are required (maybe work).
    whenever(
      () =>
        hasCurrentIncident.value &&
        (currentIncident.form_fields === undefined ||
          currentIncident.form_fields === null),
      () => fetchIncidentDetails().catch(getErrorMessage),
      { immediate: true },
    );

    return {
      user: currentUser,
      showLoginModal,
      portal,
      isPageReady: hasCurrentIncident,
      showAcceptTermsModal,
      showingMoreLinks,
      currentUser,
      currentOrganization,
      currentIncident,
      incidents,
      route,
      routes,
      mobileRoutes,
      logoRoute,
      acceptTermsAndConditions,
      logoutApp: () => authStore.logout(),
      handleChange,
      isLandscape,
      slideOverVisible,
      toggle,
      mq,
      showIncidentSelectionModal,
    };
  },
});
</script>

<style lang="postcss" scoped>
.layout {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-rows: 80px 1fr;
  grid-auto-columns: 1fr;
  grid-auto-rows: 1fr;
  grid-auto-flow: row;
  grid-template-areas:
    'header'
    'main';
  padding-bottom: env(safe-area-inset-bottom);
}

.sidebar {
  @apply bg-crisiscleanup-dark-500 z-sidebar;
  grid-area: sidebar;
  display: none;
}

.sidebar.slide-over {
  display: block;
  position: fixed;
  left: 0;
  top: 0;
  width: 150px;
  height: 100%;
}

.header {
  grid-area: header;
}

.main {
  grid-area: main;
  min-height: 0;
  min-width: 0;
}

@media (min-width: 768px) {
  .layout {
    display: grid;
    grid-template-columns: 125px 1fr;
    grid-template-rows: 65px 1fr;
    grid-auto-columns: 1fr;
    grid-auto-rows: 1fr;
    grid-auto-flow: row;
    grid-template-areas:
      'sidebar header'
      'sidebar main';
  }

  .sidebar {
    display: block;
    background-color: theme('colors.crisiscleanup-dark.900');
  }

  .menu-button {
    display: none;
  }
}
</style>
