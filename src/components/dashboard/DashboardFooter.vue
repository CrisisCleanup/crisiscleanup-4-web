<template>
  <footer
    class="bg-crisiscleanup-light-smoke md:px-56 py-8 flex md:flex-row md:items-start flex-col justify-between items-center gap-5"
  >
    <div>
      <div
        v-for="route in Object.values(publicRoutes)"
        :key="route.route"
        class="mb-2"
      >
        <router-link :to="route.route">
          {{ $t(route.title || `nav.${route.key}`) }}
        </router-link>
      </div>
    </div>
    <div
      v-if="incidentsWithActiveHotline && incidentsWithActiveHotline.length > 0"
    >
      <div class="font-bold mb-4">{{ $t('disasters.hotlines') }}</div>
      <div
        v-for="incident in incidentsWithActiveHotline"
        :key="incident.id"
        class="flex flex-wrap items-center justify-center gap-2 mb-1"
      >
        {{ incident.short_name }}:
        <!-- Scale down phone numbers -->
        <div class="inline-block transform scale-70">
          <PhoneNumberDisplay
            v-for="hotlineNumber in formatIncidentPhoneNumbers(incident)"
            :key="hotlineNumber"
            :phone-number="hotlineNumber"
          />
        </div>
      </div>
    </div>
    <DownloadAppFooter />
  </footer>
</template>

<script setup lang="ts">
import _ from 'lodash';
import useNavigation from '@/hooks/useNavigation';
import DownloadAppFooter from '@/components/dashboard/DownloadAppFooter.vue';
import { formatIncidentPhoneNumbers } from '@/filters';
import { useActiveHotlines } from '@/hooks/useActiveHotlines';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay.vue';
const { HomeNavigation, FooterNavigation } = useNavigation();

const publicRoutes = computed(() => {
  const _homeSideRoutes = _.keyBy(HomeNavigation, 'key');
  const _homeFooterRoutes = _.keyBy(FooterNavigation, 'key');
  const homeRoutes = { ..._homeSideRoutes, ..._homeFooterRoutes };
  return {
    survivor: { ...homeRoutes.survivor, icon: 'contact' },
    training: homeRoutes.training,
    about: { title: 'publicNav.about_us', route: { name: 'nav.about' } },
    blog: { ...homeRoutes.blog, icon: 'notepad' },
    terms: homeRoutes.terms,
    privacy: homeRoutes.privacy,
  };
});
const { isLoading, incidentsWithActiveHotline } = useActiveHotlines();
</script>
