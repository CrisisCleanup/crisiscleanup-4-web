<template>
  <div v-if="chartData.length > 0" class="flex flex-col items-center w-full">
    <div class="h-84 w-108">
      <apexchart
        type="line"
        :options="chartOptions"
        :series="series"
      ></apexchart>
    </div>
    <div
      class="flex items-center mt-4 flex-grow gap-2 w-full h-full p-1 text-center"
    >
      <div class="h-full flex-1 text-xl bg-crisiscleanup-light-smoke p-5">
        <div class="font-bold">
          {{ chartData[0].velocity.toFixed(2) }}
        </div>
        <div>{{ $t('volunteerChart.current_engagement') }}</div>
      </div>
      <div
        class="p-5 text-white h-full flex-1 text-xl"
        :class="{
          'bg-crisiscleanup-green-900': monthlyChange > 0,
          'bg-crisiscleanup-red': monthlyChange < 0,
          'bg-crisiscleanup-light-smoke': monthlyChange === 0,
        }"
      >
        <div class="font-bold">{{ monthlyChange?.toFixed(2) }}%</div>
        <div v-if="monthlyChange < 0">
          {{ $t('volunteerChart.down_from_last_month') }}
        </div>
        <div v-else-if="monthlyChange > 0">
          {{ $t('volunteerChart.up_from_last_month') }}
        </div>
        <div v-else>
          {{ $t('volunteerChart.no_change_from_last_month') }}
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    <div class="flex items-center justify-center h-84 w-108 opacity-50 text-xl">
      <div class="text-center">
        {{ $t('volunteerChart.no_data') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, onMounted, computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';

const props = defineProps({
  data: Array,
});

const chartData = computed(() => {
  return props.data.map((d) => ({
    date: new Date(d.the_date),
    velocity: d.velocity,
  }));
});

const chartOptions = ref({
  chart: {
    height: '100%',
    width: '100%',
    type: 'line',
    zoom: {
      enabled: false,
    },
    toolbar: {
      show: true, // Ensure toolbar is enabled if needed, or set to false to disable
    },
  },
  grid: {
    show: true,
    borderColor: '#e7e7e7',
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  xaxis: {
    type: 'datetime',
    labels: {
      style: {
        fontSize: '12px',
      },
    },
    axisBorder: {
      show: true,
      color: '#151515', // Darker gray color for the x-axis baseline
      height: 0.5, // Increase this to make the line heavier
    },
  },
  yaxis: {
    min: 0,
    max: 1,
    tickAmount: 2,
    labels: {
      formatter: function (value) {
        return (value * 100).toFixed(0) + '%'; // Convert to percentage and round
      },
      style: {
        color: '#333',
        fontSize: '12px',
      },
    },
  },

  tooltip: {
    enabled: true,
    x: {
      format: 'dd MMM',
    },
    y: {
      formatter: function (value) {
        return (value * 100).toFixed(2) + '%'; // Tooltip also in percentage format
      },
    },
  },
  annotations: {
    yaxis: [
      {
        y: 0.1, // 10% in decimal
        borderColor: 'red',
        dashArray: 4,
        strokeWidth: 0,
        label: {
          position: 'left',
          offsetX: 60,
          borderColor: '',
          style: {
            color: 'red',
            background: 'white',
            padding: {
              right: 10, // Adds extra padding on the right side of the label
            },
          },
          text: 'Hotline Closes',
        },
      },
    ],
  },

  responsive: [
    {
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom',
          offsetX: -10,
          offsetY: 0,
        },
      },
    },
  ],
});

const series = computed(() => [
  {
    name: 'Velocity',
    data: props.data.map((d) => [new Date(d.the_date).getTime(), d.velocity]),
  },
]);

const monthlyChange = computed(() => {
  return Number(calculateMonthlyChange(chartData.value, 'velocity'));
});

function calculateMonthlyChange(data, metric) {
  let lastMonthValue = null;
  let previousMonthValue = null;
  let currentMonth = new Date(data[0].the_date).getMonth();

  // Iterate over the sorted data to find the last entry of each of the last two months
  for (const datum of data) {
    const entryDate = new Date(datum.the_date);
    const entryMonth = entryDate.getMonth();

    // Check if we moved to the previous month
    if (entryMonth !== currentMonth) {
      if (lastMonthValue === null) {
        lastMonthValue = datum[metric];
        currentMonth = entryMonth;
      } else if (previousMonthValue === null) {
        previousMonthValue = datum[metric];
        break; // We found both months' last entries
      }
    }
  }

  // Calculate the percentage change between the two months
  if (previousMonthValue === null || lastMonthValue === null) {
    return null;
  }

  if (previousMonthValue === 0) {
    return lastMonthValue === 0 ? 0 : Number.POSITIVE_INFINITY; // Handle division by zero
  }

  const percentageChange =
    ((lastMonthValue - previousMonthValue) / previousMonthValue) * 100;
  return percentageChange.toFixed(2);
}

onMounted(() => {
  chartOptions.value.xaxis.categories = props.data.map((d) =>
    new Date(d.the_date).getTime(),
  );
});
</script>

<style>
.vue-apexcharts {
  width: 100% !important;
}
</style>
