<template>
  <PageTabBar
    v-if="bugReportsData && ticketCountData"
    :tabs="tabs"
    @on-total-dashboard-count-fetched="handleTotalDashboardCountFetched"
  />
</template>

<script setup lang="ts">
import PageTabBar from '@/layouts/page/PageTabBar.vue';
import useAcl from '@/hooks/useAcl';
import type { Tab } from '@/hooks/useTabs';
import { useCurrentUser } from '@/hooks';
import moment from 'moment';

const tabs = reactive<Tab[]>([
  {
    key: 'nav.admin_dashboard',
  },
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
  {
    key: 'nav.sentiment_analysis',
  },
  {
    key: 'nav.portal_files',
  },
]);

const ccuApi = useApi();
const { $can } = useAcl();

const bugReportsData = ref({ count: 0 });
const ticketCountData = ref({ count: 0 });
const totalDashboardCount = ref(0);
const { currentUser } = useCurrentUser();
const router = useRouter();

onMounted(async () => {
  if (!currentUser.value?.isAdmin) {
    return router.push('/dashboard');
  }
  if (!$can('development_mode')) {
    const { isFinished: isBugsFinished, data: _bugsData } = ccuApi(
      '/bug_reports',
      {
        method: 'GET',
        params: {
          created_at__gte: moment().subtract(60, 'day').format('YYYY-MM-DD'),
        },
      },
    );

    const { isFinished: isTicketsFinished, data: _ticketsData } = ccuApi(
      'zendesk/search/count.json?query=type:ticket status<solved',
      {
        method: 'GET',
      },
    );

    whenever(isBugsFinished, () => {
      if (_bugsData.value) {
        bugReportsData.value = _bugsData.value;
      }
    });

    whenever(isTicketsFinished, () => {
      if (_ticketsData.value) {
        ticketCountData.value = _ticketsData.value;
      }
    });
  }
});

function handleTotalDashboardCountFetched(count: number) {
  totalDashboardCount.value = count;
  console.log('totalDashboardCount', totalDashboardCount.value);
}

watch(bugReportsData, () => {
  const bugsTab = tabs.find((tab: Tab) => tab.key === 'nav.bugs');
  if (bugsTab) {
    bugsTab.title = `Bugs (${bugReportsData.value.count})`;
  }
});

watch(ticketCountData, () => {
  const ticketTab = tabs.find((tab: Tab) => tab.key === 'nav.admin_tickets');
  if (ticketTab) {
    ticketTab.title = `Tickets (${ticketCountData.value.count})`;
  }
});

watch(totalDashboardCount, () => {
  const dashboardTab = tabs.find(
    (tab: Tab) => tab.key === 'nav.admin_dashboard',
  );
  if (dashboardTab) {
    dashboardTab.title = `Dashboard (${totalDashboardCount.value})`;
  }
});
</script>

<style scoped></style>
