import axios from 'axios';
import moment from '@/utils/dates';
import type { Ref } from 'vue';
import { getQueryString } from '@/utils/urls';
import { i18n } from '@/modules/i18n';
import type { SiteStatistic } from '@/hooks/live/types';
import type Organization from '@/models/Organization';
import { cssVar, type CaseStatusKey } from '@/utils/statusColors';

export default function useSiteStatistics(
  queryFilter: Record<string, any>,
  organizations: Ref<Organization[]>,
) {
  const currentSiteStats = ref<SiteStatistic[]>([]);
  const currentEngagement = ref(0);
  const circularBarplotData = ref([]);
  const barChartData = ref([]);
  const totalCasesChartData = ref<Array<Record<string, any>>>([]);
  const mapStatistics = ref<Array<Record<string, any>>>([]);

  function formatStatValue(value: string | number) {
    return Number(value).toFixed(0);
  }

  async function fetchEngagementData() {
    const { start_date, end_date, incident } = queryFilter.value;
    const params = {
      start_date: start_date.format('YYYY-MM-DD'),
      end_date: end_date.format('YYYY-MM-DD'),
    };
    if (incident) {
      params.incident = incident;
    }

    const queryString = getQueryString(params);

    const response = await axios.get(
      `${
        import.meta.env.VITE_APP_API_BASE_URL
      }/reports_data/pp_engagement?${queryString}`,
    );
    if (response.data.length > 0) {
      currentEngagement.value =
        (response.data[0].three_day_velocity || 0) * 100;
    }
  }

  async function fetchSiteStatistics() {
    const { incident } = queryFilter.value;
    const params = {};
    if (incident) {
      params.incident = incident;
    }

    const queryString = getQueryString(params);

    const response = await axios.get(
      `${
        import.meta.env.VITE_APP_API_BASE_URL
      }/reports_data/pp_site_stats?${queryString}`,
    );
    if (response.data.length > 0) {
      // Snap to fresh values; the rAF ticker in `useAnimatedNumber` (KPI primary
      // cell) handles the visual count-up without driving Vue reactivity each
      // second. See plan perf #2.
      currentSiteStats.value = response.data;
    }
  }

  async function fetchCircularBarplotData(date = moment(), interval = 60) {
    const { incident } = queryFilter.value;
    const d = date.format('YYYY-MM-DD');

    const params = {
      date: d,
      interval,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    if (incident) {
      params.incident = incident;
    }

    const queryString = getQueryString(params);
    const response = await axios.get(
      `${
        import.meta.env.VITE_APP_API_BASE_URL
      }/reports_data/daily_calls?${queryString}`,
    );
    circularBarplotData.value = response.data;
  }

  async function getCompletionRateData() {
    const { start_date, end_date, incident } = queryFilter.value;
    const params = {
      start_date: start_date.format('YYYY-MM-DD'),
      end_date: end_date.format('YYYY-MM-DD'),
    };
    if (incident) {
      params.incident = incident;
    }

    const queryString = getQueryString(params);

    const response = await axios.get(
      `${
        import.meta.env.VITE_APP_API_BASE_URL
      }/reports_data/completion_rate?${queryString}`,
    );
    const chart = response.data;

    // const options = {
    //   tooltips: {
    //     displayColors: true,
    //     callbacks: {
    //       mode: 'x',
    //     },
    //   },
    //   scales: {
    //     xAxes: [
    //       {
    //         type: 'time',
    //         offset: true,
    //         distribution: 'series',
    //         bounds: 'data',
    //         time: {
    //           unit: 'day',
    //           stepSize: 1,
    //           tooltipFormat: 'YYYY-MM-DD',
    //           displayFormats: {
    //             day: 'D',
    //           },
    //         },
    //         ticks: {
    //           source: 'data',
    //         },
    //         stacked: true,
    //         gridLines: {
    //           display: false,
    //         },
    //         categoryPercentage: 1,
    //         barPercentage: 1,
    //       },
    //     ],
    //     yAxes: [
    //       {
    //         stacked: true,
    //         ticks: {
    //           beginAtZero: true,
    //         },
    //         type: 'linear',
    //       },
    //     ],
    //   },
    //   responsive: true,
    //   maintainAspectRatio: false,
    //   legend: { position: 'bottom' },
    // };
    // const data = {
    //   labels: chart.labels,
    //   datasets: [
    //     {
    //       ...chart.datasets[0],
    //       backgroundColor: 'green',
    //       borderColor: '#dadada',
    //       borderWidth: 0.25,
    //       barPercentage: 0.3,
    //     },
    //     {
    //       ...chart.datasets[1],
    //       backgroundColor: 'red',
    //       borderWidth: 0.25,
    //       borderColor: '#dadada',
    //       barPercentage: 0.3,
    //     },
    //   ],
    // };
    // return { options, data };
    // this.charts.completion.options = options;
    // this.charts.completion.data = data;

    barChartData.value = chart.labels.map((item: any, index: number) => {
      return {
        group: item,
        newCases: chart.datasets[0].data[index],
        closedCases: chart.datasets[1].data[index],
      };
    });
  }

  async function getIncidentStats() {
    const { start_date, incident } = queryFilter.value;
    const params = {
      start_date: start_date.format('YYYY-MM-DD'),
      end_date: moment().format('YYYY-MM-DD'),
    };
    if (incident) {
      params.incident = incident;
    }

    const queryString = getQueryString(params);

    const response = await axios.get(
      `${
        import.meta.env.VITE_APP_API_BASE_URL
      }/reports_data/worksite_statistics?${queryString}`,
    );
    const incidentStats = response.data;

    const make = (
      name: string,
      key: CaseStatusKey,
      count: number,
      titleKey: string,
      filter?: string,
    ) => ({
      name,
      statusKey: key,
      color: cssVar(key),
      count,
      // 4px top accent in the status hue — see plan moment #1.
      style: `border-top-color: ${cssVar(key)}`,
      title: i18n.global.t(titleKey),
      ...(filter ? { filter } : {}),
    });

    mapStatistics.value = [
      make(
        'All Cases',
        'all',
        incidentStats.all.total,
        'pewPew.all_cases',
        '*',
      ),
      make(
        'Unclaimed',
        'unclaimed',
        incidentStats.unclaimed.total,
        'pewPew.unclaimed',
        'unclaimed',
      ),
      make(
        'Claimed',
        'claimed',
        incidentStats.claimed.total,
        'pewPew.claimed',
        'claimed',
      ),
      make(
        'In Progress',
        'in_progress',
        incidentStats.assigned.total,
        'pewPew.in_progress',
        'in_progress',
      ),
      make(
        'Partly Done',
        'partly_done',
        incidentStats.partial.total,
        'pewPew.partly_done',
        'partially-completed',
      ),
      make(
        'Closed',
        'closed',
        incidentStats.closed.total,
        'pewPew.closed',
        'closed',
      ),
      make('Overdue', 'overdue', incidentStats.overdue.total, 'pewPew.overdue'),
      make(
        'Total Orgs',
        'unknown',
        organizations.value.length,
        'pewPew.total_orgs',
      ),
      make('Counties Parishes', 'unknown', 0, 'pewPew.counties_parishes'),
      make('Volunteers', 'unknown', 0, 'pewPew.volunteers'),
      make('Households', 'unknown', 0, 'pewPew.households'),
    ];

    totalCasesChartData.value = mapStatistics.value.filter(
      (stat) => stat.name !== 'All Cases',
    );
  }

  function loadData() {
    fetchSiteStatistics().then(null);
    fetchEngagementData().then(null);
    fetchCircularBarplotData().then(null);
    getCompletionRateData().then(null);
    getIncidentStats().then(null);
  }

  loadData();

  watch(
    () => queryFilter.value,
    (value) => {
      loadData();
    },
  );

  return {
    currentSiteStats,
    currentEngagement,
    circularBarplotData,
    barChartData,
    totalCasesChartData,
    mapStatistics,
    formatStatValue,
  };
}
