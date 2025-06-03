<template>
  <div :id="chartId" ref="chartContainer" class="gauge-container">
    <div v-if="title" class="gauge-title" style="font-size: 14px">
      {{ title }}
    </div>
    <svg
      ref="svg"
      class="gauge-svg"
      viewBox="0 0 300 175"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <!-- Speedometer gradient -->
        <linearGradient
          id="speedometerGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stop-color="#4A4A4A" />
          <stop offset="50%" stop-color="#666666" />
          <stop offset="100%" stop-color="#808080" />
        </linearGradient>

        <!-- Metallic effect for the gauge -->
        <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2A2A2A" />
          <stop offset="50%" stop-color="#333333" />
          <stop offset="100%" stop-color="#2A2A2A" />
        </linearGradient>

        <!-- Glow effect -->
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Background semicircle with metallic effect -->
      <path class="background-arc" fill="url(#metallicGradient)" />

      <!-- Spike segments -->
      <g class="spikes-container"></g>

      <!-- Needle -->
      <g class="needle-group">
        <line class="needle-line" />
        <circle class="needle-center" />
      </g>

      <!-- Labels -->
      <g class="labels-group">
        <text class="label-left">Low</text>
        <text class="label-right">High</text>
        <text class="value-display" style="font-size: 18px">
          {{ displayValue }}%
        </text>
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import * as d3 from 'd3';
import {
  defineComponent,
  ref,
  onMounted,
  onUnmounted,
  watch,
  computed,
} from 'vue';
import _ from 'lodash';

export default defineComponent({
  name: 'ModernSpikeGauge',
  props: {
    chartData: {
      type: Number,
      default: 60,
      validator: (value: number) => value >= 0 && value <= 100,
    },
    chartId: {
      type: String,
      default: () => `spike-gauge-${_.uniqueId()}`,
      required: false,
    },
    title: {
      type: String,
      default: '',
      required: false,
    },
  },

  setup(props) {
    const chartContainer = ref<HTMLElement>();
    const svg = ref<SVGElement>();

    let resizeObserver: ResizeObserver;
    let animatedValue = ref(0);

    const displayValue = computed(() => Math.round(animatedValue.value));

    // Responsive dimensions
    const getDimensions = () => {
      if (!chartContainer.value) return { width: 400, height: 200 };

      const containerRect = chartContainer.value.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height - 40; // Account for title height

      // Calculate dimensions maintaining aspect ratio
      const aspectRatio = 1.7; // width/height ratio
      let width, height;

      if (containerWidth / containerHeight > aspectRatio) {
        // Container is wider than needed
        height = containerHeight;
        width = height * aspectRatio;
      } else {
        // Container is taller than needed
        width = containerWidth;
        height = width / aspectRatio;
      }

      // Ensure minimum dimensions
      width = Math.max(300, Math.min(width, containerWidth));
      height = Math.max(150, Math.min(height, containerHeight));

      return { width, height };
    };

    // Animation
    const animateValue = (targetValue: number) => {
      d3.select({ value: animatedValue.value })
        .transition()
        .duration(1200)
        .ease(d3.easeCircleOut)
        .tween('value', function () {
          const interpolate = d3.interpolate(animatedValue.value, targetValue);
          return (t) => {
            animatedValue.value = interpolate(t);
            updateNeedle();
            updateSpikes();
          };
        });
    };

    let scale: d3.ScaleLinear<number, number>;
    let needleLine: d3.Selection<SVGLineElement, unknown, null, undefined>;
    let spikesContainer: d3.Selection<SVGGElement, unknown, null, undefined>;

    const updateNeedle = () => {
      if (!needleLine || !scale) return;

      const { width, height } = getDimensions();
      const radius = Math.min(width, height * 1.4) * 0.4;
      const centerX = width / 2;
      const centerY = height * 0.75;

      // Fix: Subtract π/2 to align with gauge coordinate system
      const angle = scale(animatedValue.value) - Math.PI / 2;
      const needleLength = radius * 0.9;
      const x2 = centerX + Math.cos(angle) * needleLength;
      const y2 = centerY + Math.sin(angle) * needleLength;

      // Remove previous jiggle class
      needleLine.classed('needle-jiggle', false);

      // Force a reflow
      void needleLine.node()?.offsetHeight;

      // Add jiggle class
      needleLine.classed('needle-jiggle', true);

      needleLine
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', x2)
        .attr('y2', y2);
    };

    const updateSpikes = () => {
      if (!spikesContainer) return;

      spikesContainer
        .selectAll('.spike')
        .attr('fill', (d: any) =>
          d <= animatedValue.value ? 'url(#speedometerGradient)' : '#2C3E50',
        )
        .attr('filter', (d: any) =>
          d <= animatedValue.value ? 'url(#glow)' : 'none',
        )
        .attr('opacity', (d: any) => (d <= animatedValue.value ? 1 : 0.3));
    };

    const renderGauge = () => {
      if (!svg.value) return;

      const { width, height } = getDimensions();
      const radius = Math.min(width, height * 1.4) * 0.4;
      const centerX = width / 2;
      const centerY = height * 0.75;

      // Update SVG dimensions
      d3.select(svg.value).attr('width', width).attr('height', height);

      // Scale for top semicircle
      scale = d3
        .scaleLinear()
        .domain([0, 100])
        .range([-Math.PI / 2, Math.PI / 2])
        .clamp(true);

      // Background semicircle - metallic effect
      const backgroundArc = d3.select(svg.value).select('.background-arc');
      backgroundArc
        .attr(
          'd',
          d3.arc()({
            innerRadius: 0,
            outerRadius: radius * 0.7,
            startAngle: -Math.PI / 2,
            endAngle: Math.PI / 2,
          }) || '',
        )
        .attr('fill', 'url(#metallicGradient)')
        .attr('opacity', 0.8)
        .attr('transform', `translate(${centerX}, ${centerY})`);

      // Create spike data (21 spikes for 0-100 in increments of 5)
      const spikeData = Array.from({ length: 21 }, (_, i) => i * 5);

      // Spike arc generator
      const spikeArc = d3
        .arc<number>()
        .innerRadius(radius * 0.75)
        .outerRadius(radius * 0.85)
        .startAngle((d) => scale(d))
        .endAngle((d) => scale(d + 3)); // Smaller gap between spikes

      // Render spikes
      spikesContainer = d3.select(svg.value).select('.spikes-container');
      spikesContainer.attr('transform', `translate(${centerX}, ${centerY})`);

      const spikes = spikesContainer
        .selectAll('.spike')
        .data(spikeData)
        .join('path')
        .attr('class', 'spike')
        .attr('d', spikeArc)
        .attr('fill', '#2C3E50')
        .attr('opacity', 0.3)
        .attr('stroke', '#34495E')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer');

      // Add hover effects
      spikes
        .on('mouseenter', function (event, d) {
          if (d <= animatedValue.value) {
            d3.select(this).attr('opacity', 0.8);
          } else {
            d3.select(this).attr('fill', '#34495E');
          }
        })
        .on('mouseleave', function (event, d) {
          if (d <= animatedValue.value) {
            d3.select(this).attr('opacity', 1);
          } else {
            d3.select(this).attr('fill', '#2C3E50');
          }
        });

      // Needle setup - minimal styling
      needleLine = d3.select(svg.value).select('.needle-line');
      needleLine
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('transform-origin', 'center bottom');

      // Needle center
      d3.select(svg.value)
        .select('.needle-center')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', 4)
        .attr('fill', '#333333')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1);

      // Labels - minimal futuristic styling
      const fontSize = Math.max(12, radius * 0.06);

      d3.select(svg.value)
        .select('.label-left')
        .attr('x', centerX - radius * 0.85)
        .attr('y', centerY + radius * 0.45)
        .attr('text-anchor', 'middle')
        .attr('font-size', fontSize)
        .attr('fill', '#AAAAAA')
        .attr('font-weight', '400')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .attr('text-transform', 'uppercase')
        .attr('letter-spacing', '1px');

      d3.select(svg.value)
        .select('.label-right')
        .attr('x', centerX + radius * 0.85)
        .attr('y', centerY + radius * 0.45)
        .attr('text-anchor', 'middle')
        .attr('font-size', fontSize)
        .attr('fill', '#AAAAAA')
        .attr('font-weight', '400')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .attr('text-transform', 'uppercase')
        .attr('letter-spacing', '1px');

      // Value display - electric accent
      d3.select(svg.value)
        .select('.value-display')
        .attr('x', centerX)
        .attr('y', centerY + radius * 0.4)
        .attr('text-anchor', 'middle')
        .attr('font-size', fontSize * 2.2)
        .attr('fill', '#FFFFFF')
        .attr('font-weight', '500')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .attr('text-shadow', '0 2px 4px rgba(0,0,0,0.3)');

      // Initial state
      updateNeedle();
      updateSpikes();
    };

    const setupResizeObserver = () => {
      if (!chartContainer.value) return;

      resizeObserver = new ResizeObserver(
        _.debounce(() => {
          renderGauge();
        }, 150),
      );

      resizeObserver.observe(chartContainer.value);
    };

    onMounted(() => {
      renderGauge();
      setupResizeObserver();

      // Animate to initial value with stagger effect
      setTimeout(() => {
        animateValue(props.chartData);
      }, 500);
    });

    onUnmounted(() => {
      resizeObserver?.disconnect();
    });

    watch(
      () => props.chartData,
      (newValue) => {
        animateValue(Math.max(0, Math.min(100, newValue)));
      },
    );

    return {
      chartContainer,
      svg,
      displayValue,
    };
  },
});
</script>

<style scoped>
.gauge-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0;
  margin: 0;
  overflow: hidden;
  background: #1a1a1a;
  border-radius: 8px;
  position: relative;
}

.gauge-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  width: 100%;
  padding: 12px 0;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.gauge-svg {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  display: block;
  margin: 0 auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.spike {
  transition: all 0.2s ease;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 0.5;
}

.needle-line {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  stroke: #ffffff;
  stroke-width: 2;
  stroke-linecap: 'round';
  transform-origin: center bottom;
}

.needle-center {
  fill: #333333;
  stroke: #ffffff;
  stroke-width: 1;
}

@keyframes needleJiggle {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(2deg);
  }
  50% {
    transform: rotate(0deg);
  }
  75% {
    transform: rotate(-2deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

.needle-jiggle {
  animation: needleJiggle 0.3s ease-in-out;
}

.label-left,
.label-right {
  fill: #aaaaaa;
  font-size: 12px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.value-display {
  fill: #ffffff;
  font-size: 24px;
  font-weight: 500;
}
</style>
