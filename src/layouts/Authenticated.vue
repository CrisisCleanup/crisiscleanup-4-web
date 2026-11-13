<template>
  <template v-if="isPageReady">
    <!-- A page with meta.keepOnLayoutChange is rendered one time and moved
         into the shell that is on screen. A change of shell, such as a phone
         that rotates, then keeps the page and its state. Other pages are
         rendered again by the new shell, because they set up their map and
         their listeners only when they mount. -->
    <Teleport v-if="keepsPage && pageSlot" :to="pageSlot">
      <slot />
    </Teleport>
    <!-- For mobile screens -->
    <template v-if="isMobile">
      <div class="flex flex-col">
        <header
          class="fixed inset-x-0 top-0 h-12 z-header bg-white border-b border-crisiscleanup-grey-100 flex items-center px-3 gap-2"
          data-testid="testMobileHeader"
        >
          <button
            type="button"
            class="flex-1 min-w-0 flex items-center gap-2 px-2 py-1 rounded hover:bg-crisiscleanup-smoke transition"
            :aria-label="$t('locationVue.select_incident')"
            data-testid="testMobileIncidentTrigger"
            @click="showIncidentSelectionModal"
          >
            <div
              class="incident-tile w-7 h-7 flex-none grid place-items-center rounded bg-crisiscleanup-smoke overflow-hidden"
            >
              <DisasterIcon
                v-if="currentIncident?.incident_type"
                :current-incident="currentIncident"
                data-testid="testDisasterIcon"
              />
            </div>
            <span
              v-if="currentIncident?.case_label"
              class="bg-primary-light text-black text-[11px] font-bold px-1.5 py-0.5 rounded-sm flex-none"
            >
              {{ currentIncident.case_label }}
            </span>
            <span
              class="flex-1 min-w-0 truncate font-bold text-[13px] text-left"
            >
              {{ currentIncident?.name }}
            </span>
            <font-awesome-icon
              icon="chevron-down"
              class="text-crisiscleanup-grey-900 text-[12px] flex-none"
            />
          </button>
          <v-popover
            v-if="currentUser"
            popper-class="menu-popover"
            placement="bottom-end"
          >
            <button
              type="button"
              class="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-crisiscleanup-smoke transition max-w-[140px]"
              :aria-label="currentUser.full_name"
              data-testid="testMobileUserMenu"
            >
              <Avatar
                :initials="currentUser.first_name"
                :url="currentUser.profilePictureUrl"
                :alt="currentUser.full_name"
                :custom-size="{ width: '28px', height: '28px' }"
                inner-classes=""
                data-testid="testAvatarIcon"
              />
              <span
                class="truncate font-bold text-[12px] text-black"
                data-testid="testMobileUserName"
              >
                {{ currentUser.first_name }}
              </span>
              <font-awesome-icon
                icon="caret-down"
                class="text-crisiscleanup-grey-900 text-[12px] flex-none"
              />
            </button>
            <template #popper="{ hide: hidePopover }">
              <div class="flex flex-col">
                <base-button
                  class="text-base p-2 hover:bg-crisiscleanup-light-grey cursor-pointer"
                  :text="$t('nav.profile')"
                  :alt="$t('nav.profile')"
                  :action="
                    () => {
                      $router.push('/profile');
                      hidePopover();
                    }
                  "
                />
                <base-button
                  class="text-base p-2 hover:bg-crisiscleanup-light-grey cursor-pointer"
                  :text="$t('nav.downloads')"
                  :alt="$t('nav.downloads')"
                  :action="
                    () => {
                      $router.push('/downloads');
                      hidePopover();
                    }
                  "
                />
                <base-button
                  class="text-base p-2 hover:bg-crisiscleanup-light-grey cursor-pointer"
                  :text="$t('list.lists')"
                  :alt="$t('list.lists')"
                  :action="
                    () => {
                      $router.push('/lists');
                      hidePopover();
                    }
                  "
                />
                <base-button
                  class="text-base p-2 hover:bg-crisiscleanup-light-grey cursor-pointer"
                  :text="$t('actions.logout')"
                  :alt="$t('actions.logout')"
                  :action="
                    () => {
                      logoutApp();
                      hidePopover();
                    }
                  "
                />
              </div>
            </template>
          </v-popover>
        </header>
        <main :ref="setPageSlot" class="pt-12 pb-16">
          <slot v-if="!keepsPage" />
        </main>
        <footer
          style="width: 100svw"
          class="ccu-mobile-nav fixed inset-x-0 bottom-0 z-header flex justify-around items-stretch"
        >
          <router-link
            v-for="r in mobileRoutes"
            :key="r.key"
            :to="r.to"
            class="ccu-mobile-nav__link flex flex-col items-center justify-center"
          >
            <component
              :is="r.lucide"
              class="ccu-mobile-nav__icon"
              aria-hidden="true"
            />
            <span class="ccu-mobile-nav__label">{{ r.text }}</span>
          </router-link>
          <button
            type="button"
            class="ccu-mobile-nav__link flex flex-col items-center justify-center"
            @click="showingMoreLinks = true"
          >
            <LucideMenu class="ccu-mobile-nav__icon" aria-hidden="true" />
            <span class="ccu-mobile-nav__label">{{ $t('nav.more') }}</span>
          </button>
        </footer>
      </div>
      <modal
        v-if="showingMoreLinks"
        data-testid="testShowingMoreLinksModal"
        modal-classes="bg-white h-132 shadow p-3"
        closeable
        :title="$t('nav.all_links')"
        @close="showingMoreLinks = false"
      >
        <div v-for="r in routes" :key="r.key" class="flex items-center">
          <base-link :to="r.to" class="text-black text-base p-1">
            {{ r.text || $t(`nav.${r.key}`) }}
          </base-link>
        </div>
        <div class="flex flex-col items-center my-1">
          <base-button
            :action="logoutApp"
            variant="outline"
            class="p-1 my-2 w-full"
          >
            {{ $t('actions.logout') }}
          </base-button>
          <AppDownloadLinks />
        </div>
      </modal>
    </template>

    <!-- For desktop screens -->
    <template v-else>
      <div class="layout" data-testid="testIsAuthenticatedDiv">
        <div class="sidebar h-full overflow-auto">
          <NavMenu
            :key="route"
            :routes="routes"
            :logo-route="logoRoute"
            class="flex flex-col text-sm"
          />
        </div>
        <div class="header flex items-center">
          <Header
            :current-incident="currentIncident"
            :incidents="incidents"
            @update:incident="handleChange"
            @auth:logout="logoutApp"
          />
        </div>
        <main class="main">
          <div :ref="setPageSlot" class="h-full overflow-auto">
            <slot v-if="!keepsPage" />
          </div>
        </main>
      </div>
    </template>

    <TermsandConditionsModal
      v-if="showAcceptTermsModal"
      :organization="currentOrganization"
      data-testid="testShowAcceptTermsModal"
      @accepted-terms="acceptTermsAndConditions"
    />
    <OrganizationInactiveModal
      v-if="
        currentOrganization &&
        (!currentOrganization.is_active || !currentOrganization.is_verified)
      "
      @user-logged-out="logoutApp"
    />
    <modal
      v-if="showLoginModal"
      modal-classes="bg-white max-w-lg shadow p-5"
      :closeable="false"
    >
      <LoginForm :redirect="false" />
      <template #footer>
        <div></div>
      </template>
    </modal>
  </template>
  <!--   Page spinner -->
  <div v-else class="flex h-viewport items-center justify-center">
    <spinner show-quote allow-reset />
  </div>
</template>

<script lang="ts">
import { computed, ref } from 'vue';
import moment from '@/utils/dates';
import { useAsyncState } from '@vueuse/core';
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { useViewport } from '@/hooks/useViewport';
import Incident from '@/models/Incident';
import Organization from '@/models/Organization';
import Language from '@/models/Language';
import Report from '@/models/Report';
import Role from '@/models/Role';
import PhoneStatus from '@/models/PhoneStatus';
import LucideLayoutDashboard from '~icons/lucide/layout-dashboard';
import LucideBriefcase from '~icons/lucide/briefcase';
import LucidePhone from '~icons/lucide/phone';
import LucideUser from '~icons/lucide/user';
import LucideMenu from '~icons/lucide/menu';
import NavMenu from '../components/navigation/NavMenu.vue';
import TermsandConditionsModal from '../components/modals/TermsandConditionsModal.vue';
import Header from '../components/header/Header.vue';
import LoginForm from '../components/LoginForm.vue';
import useSetupLanguage from '@/hooks/useSetupLanguage';
import useAcl from '@/hooks/useAcl';
import DisasterIcon from '@/components/DisasterIcon.vue';
import Avatar from '@/components/Avatar.vue';
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
import createDebug from 'debug';
import type { Portal } from '@/models/types';
import { VERSION_3_LAUNCH_DATE } from '@/constants';
import { useAuthenticatedRoutes } from '@/hooks/useAuthenticatedRoutes';
import { runWhenIdle } from '@/utils/scriptLoader';
import axios from 'axios';

const debug = createDebug('@ccu:layouts:Authed');
const loadDebug = debug.extend('loading');

export default defineComponent({
  name: 'Authenticated',
  components: {
    OrganizationInactiveModal,
    AppDownloadLinks,
    DisasterIcon,
    Avatar,
    LoginForm,
    NavMenu,
    TermsandConditionsModal,
    Header,
    LucideMenu,
  },
  setup() {
    const { isMobile } = useViewport();

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

    const showAcceptTermsModal = ref(false);

    // The element of the current shell that holds the page. A shell that
    // leaves the screen reports null. The function ignores it, so the page
    // stays mounted until the new shell reports its own element.
    const keepsPage = computed(() => route.meta.keepOnLayoutChange === true);
    const pageSlot = ref<HTMLElement>();
    const setPageSlot = (element: unknown) => {
      if (element instanceof HTMLElement) {
        pageSlot.value = element;
      }
    };
    const showingMoreLinks = ref(false);

    watch(
      () => route.fullPath,
      () => {
        showingMoreLinks.value = false;
      },
    );

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

    // NOTE: stale-chunk load errors are handled once, globally, in router.ts.
    // A second handler here had no reload guard, which caused an infinite
    // hard-reload loop whenever chunks failed persistently (stale cached
    // index.html after a deploy).
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
          lucide: LucideLayoutDashboard,
        },
        {
          name: 'nav.work',
          key: 'work',
          to: `/incident/${currentIncidentId.value}/work`,
          lucide: LucideBriefcase,
          text: t('nav.work'),
        },
        {
          name: 'nav.phone',
          key: 'phone',
          lucide: LucidePhone,
          text: t('nav.phone'),
          to: `/incident/${currentIncidentId.value}/phone`,
          disabled: !$can || !$can('phone_agent'),
        },
        {
          name: 'nav.profile',
          key: 'profile',
          lucide: LucideUser,
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

    // Critical for first render: incident list, current org, language catalog.
    async function loadCriticalPageData() {
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
      ]);
    }

    // Deferred to idle — reports/roles/phone statuses and geolocation aren't
    // needed before first paint of any route.
    function scheduleBackgroundPageData() {
      runWhenIdle(() => {
        Promise.allSettled([
          Report.api().get('/reports', { dataKey: 'results' }),
          Role.api().get('/roles', { dataKey: 'results' }),
          PhoneStatus.api().get('/phone_statuses', { dataKey: 'results' }),
        ]).catch(() => {});
        checkUserLocation();
      });
    }

    const loadState = useAsyncState(
      async () => {
        await Promise.all([setupLanguage(), loadCriticalPageData()]);
        scheduleBackgroundPageData();
      },
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
      isMobile,
      keepsPage,
      pageSlot,
      setPageSlot,
      showIncidentSelectionModal,
    };
  },
});
</script>

<style lang="postcss" scoped>
.layout {
  width: 100vw;
  height: var(--cc-viewport-height);
  /* The header and the sidebar change size when the screen becomes short.
     The change is short, so the page does not jump. */
  transition:
    grid-template-columns 200ms ease,
    grid-template-rows 200ms ease;
  display: grid;
  /* `minmax(0, 1fr)` and not `1fr`: the column must not grow to the width of
     the header content, or the page scrolls sideways on a narrow screen. */
  grid-template-columns: calc(96px + env(safe-area-inset-left)) minmax(0, 1fr);
  grid-template-rows: 64px 1fr;
  grid-template-areas:
    'sidebar header'
    'sidebar main';
  padding-bottom: env(safe-area-inset-bottom);
  padding-right: env(safe-area-inset-right);
}

/* On a short screen the shell gives its height and width to the page: the
   header is lower, and the sidebar shows icons without labels. */
@media (max-height: 500px) {
  .layout {
    grid-template-columns: calc(56px + env(safe-area-inset-left)) minmax(0, 1fr);
    grid-template-rows: 48px 1fr;
  }
}

.sidebar {
  @apply z-sidebar;
  grid-area: sidebar;
  background-color: theme('colors.crisiscleanup-dark.900');
  padding-left: env(safe-area-inset-left);
}

.header {
  grid-area: header;
  min-width: 0;
}

.main {
  grid-area: main;
  min-height: 0;
  min-width: 0;
}

.incident-tile :deep(.standard-icon),
.incident-tile :deep(.easter-egg) {
  width: 22px;
  height: 22px;
}
.incident-tile :deep(.disaster-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ccu-mobile-nav {
  background-color: theme('colors.crisiscleanup-dark.900');
  border-top: 1px solid theme('colors.crisiscleanup-dark.500');
  padding-top: 6px;
  padding-bottom: max(6px, env(safe-area-inset-bottom));
}

.ccu-mobile-nav__link {
  flex: 1;
  min-width: 0;
  padding: 6px 4px;
  color: theme('colors.crisiscleanup-dark.200');
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  gap: 4px;
  position: relative;
  transition: color 160ms ease;
}

.ccu-mobile-nav__link:hover {
  color: white;
}

.ccu-mobile-nav__link.router-link-active {
  color: theme('colors.primary.light');
}

.ccu-mobile-nav__link.router-link-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 25%;
  right: 25%;
  height: 2px;
  background-color: theme('colors.primary.light');
}

.ccu-mobile-nav__icon {
  width: 22px;
  height: 22px;
  stroke-width: 1.75;
}

.ccu-mobile-nav__label {
  line-height: 1;
}
</style>
