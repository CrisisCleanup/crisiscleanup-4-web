<template>
  <PageTabBar v-if="bugReportsData && ticketCountData" :tabs="tabs" />
</template>

<script lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import PageTabBar from '../../layouts/page/PageTabBar.vue';
import useAcl from '@/hooks/useAcl';
import type { Tab } from '@/hooks/useTabs';
import { useCurrentUser } from '@/hooks';

export default defineComponent({
  name: 'AdminPage',
  components: { PageTabBar },
  setup() {
    const tabs = reactive<Tab[]>([
      {
        key: 'nav.admin_dashboard',
      },
      // reactive({
      //   key: 'nav.admin_events',
      // }),
      {
        key: 'nav.admin_event_stream',
      },
      {
        key: 'nav.admin_tickets',
      },
      {
        key: 'nav.bugs',
      },
      {
        key: 'nav.cms',
      },
      {
        key: 'nav.incident_wizard',
      },
      {
        key: 'nav.localizations',
      },
      {
        key: 'nav.rag',
      },
      {
        key: 'nav.reports',
      },
    ]);

    const ccuApi = useApi();
    const { $can } = useAcl();

    const bugReportsData = ref({ count: 0 });
    const ticketCountData = ref({ count: 0 });
    const { currentUser } = useCurrentUser();
    const router = useRouter();

    onMounted(async () => {
      if (!currentUser.value?.isAdmin) {
        return router.push('/dashboard');
      }
      if (!$can('development_mode')) {
        const bugsData = await ccuApi('/bug_reports', {
          method: 'GET',
        });
        if (bugsData.data) {
          bugReportsData.value = bugsData.data;
        }

        const ticketsData = await ccuApi(
          'zendesk/search/count.json?query=type:ticket status<solved',
          {
            method: 'GET',
          },
        );
        if (bugsData.data) {
          bugsData.value = ticketsData.data;
        }
      }
    });

    watch(bugReportsData, () => {
      const bugsTab = tabs.find((tab) => tab.key === 'nav.bugs');
      bugsTab.title = `Bugs (${bugReportsData.value.count})`;
    });

    watch(ticketCountData, () => {
      const ticketTab = tabs.find((tab) => tab.key === 'nav.admin_tickets');
      ticketTab.title = `Tickets (${ticketCountData.value.count})`;
    });

    return {
      tabs,
      bugReportsData,
      ticketCountData,
    };
  },
});
</script>

<style scoped></style>
