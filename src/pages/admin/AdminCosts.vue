<template>
  <Loader
    :loading="loading"
    class="p-6 bg-crisiscleanup-light-grey h-full overflow-auto"
  >
    <template #content>
      <form-select
        v-model="style"
        :options="['stacked', 'split']"
        select-classes="bg-white border w-64 m-2"
        class="mb-2"
        :placeholder="$t('adminDashboard.chart_style')"
      />

      <template v-if="style === 'split'">
        <div v-for="chart in chartData" :key="chart.name">
          <div>{{ chart.name }}</div>
          <D3BarChart
            v-if="costs && chart.options"
            :chart-data="chart.data"
            :options="chart.options"
            class="h-84"
          />
        </div>
      </template>

      <D3BarChart
        v-if="costs && chartDataStacked.options && style === 'stacked'"
        :chart-data="chartDataStacked.data"
        :options="chartDataStacked.options"
        class="h-144"
      />
    </template>
  </Loader>
</template>

<script>
import axios from 'axios';
import Loader from '@/components/Loader.vue';
import D3BarChart from '@/components/live/D3BarChart.vue';
import { stringToColor } from '@/utils/colors';

export default {
  name: 'AdminCosts',
  components: { Loader, D3BarChart },
  setup() {
    const costs = ref();
    const loading = ref(false);
    const style = ref('stacked');
    const $http = axios;
    const chartData = computed(() => {
      if (costs.value)
        return Object.keys(costs.value).map((key) =>
          getChartDataData(key, costs.value[key]),
        );
    });
    const chartDataStacked = computed(() => {
      return getChartDataDataStacked();
    });

    const reloadCosts = async () => {
      const { data } = await $http.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/admins/costs`,
      );
      costs.value = data;
    };
    const getChartDataData = (name, results) => {
      const resultsPer = results.ResultsByTime;
      const options = {
        tooltips: {
          displayColors: true,
          callbacks: {
            mode: 'x',
          },
        },
        scales: {
          xAxes: [
            {
              type: 'time',
              offset: true,
              distribution: 'series',
              bounds: 'data',
              time: {
                unit: 'day',
                stepSize: 1,
                tooltipFormat: 'YYYY-MM-DD',
                displayFormats: {
                  day: 'D',
                },
              },
              ticks: {
                source: 'data',
              },
              stacked: true,
              gridLines: {
                display: false,
              },
              categoryPercentage: 1,
              barPercentage: 1,
            },
          ],
          yAxes: [
            {
              stacked: true,
              bounds: 'data',
              min: 0,
              max: 5000,
              ticks: {
                beginAtZero: true,
              },
              type: 'linear',
            },
          ],
        },
        responsive: true,
        maintainAspectRatio: false,
        legend: { position: 'bottom' },
      };
      const amounts = resultsPer.map((r) =>
        Number(r.Total.AmortizedCost.Amount).toFixed(2),
      );
      const data = {
        labels: resultsPer.map((r) => r.TimePeriod.End),
        datasets: [
          {
            data: amounts,
            backgroundColor: stringToColor(name),
            borderColor: '#dadada',
            borderWidth: 0.25,
            barPercentage: 0.3,
          },
        ],
      };
      return { name, options, data };
    };
    const getChartDataDataStacked = () => {
      const options = {
        tooltips: {
          displayColors: true,
          callbacks: {
            mode: 'label',
            footer(items, data) {
              const { datasets } = data;
              const total = datasets.reduce(
                (a, b) => a + Number(b.data[items[0].index]),
                0,
              );
              return `Total: ${total.toFixed(2)}`;
            },
          },
        },
        scales: {
          xAxes: [
            {
              type: 'time',
              offset: true,
              distribution: 'series',
              bounds: 'data',
              time: {
                unit: 'day',
                stepSize: 1,
                tooltipFormat: 'YYYY-MM-DD',
                displayFormats: {
                  day: 'D',
                },
              },
              ticks: {
                source: 'data',
              },
              stacked: true,
              gridLines: {
                display: false,
              },
              categoryPercentage: 1,
              barPercentage: 1,
            },
          ],
          yAxes: [
            {
              stacked: true,
              bounds: 'data',
              min: 0,
              max: 5000,
              ticks: {
                beginAtZero: true,
              },
              type: 'linear',
            },
          ],
        },
        responsive: true,
        maintainAspectRatio: false,
        legend: { position: 'bottom' },
      };
      const data = costs.value
        ? {
            labels: costs.value.developer.ResultsByTime.map(
              (r) => r.TimePeriod.End,
            ),
            datasets: Object.entries(costs.value).map(([key, value]) => {
              return {
                data: value.ResultsByTime.map((r) =>
                  Number(r.Total.AmortizedCost.Amount).toFixed(2),
                ),
                backgroundColor: stringToColor(key),
                borderColor: '#dadada',
                borderWidth: 0.25,
                barPercentage: 0.3,
                label: key,
              };
            }),
          }
        : {};
      return { options, data };
    };

    onMounted(async () => {
      loading.value = true;
      await reloadCosts();
      loading.value = false;
    });
    return {
      costs,
      loading,
      style,
      chartData,
      chartDataStacked,
    };
  },
};
</script>

<style scoped></style>
