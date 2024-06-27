import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import * as d3 from 'd3';
import { useI18n } from 'vue-i18n';

// Mock the i18n dependency
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: vi.fn((key) => key),
  }),
}));

// Mock the lodash dependency
vi.mock('lodash', () => ({
  __esModule: true,
  default: {
    uniqueId: vi.fn(() => 'unique-id'),
    startCase: vi.fn((str) => str),
  },
}));

// Mock the d3 module
vi.mock('d3', async (importOriginal) => {
  const actualD3 = await importOriginal();
  return {
    ...actualD3,
    select: vi.fn(() => ({
      append: vi.fn().mockReturnThis(),
      attr: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      data: vi.fn().mockReturnThis(),
      join: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      style: vi.fn().mockReturnThis(),
      transition: vi.fn().mockReturnThis(),
      duration: vi.fn().mockReturnThis(),
    })),
    pie: vi.fn(() => {
      const pieMock = () => [{ data: ['reportedCases', 10] }];
      pieMock.value = vi.fn().mockReturnThis();
      return pieMock;
    }),
    arc: vi.fn(() => {
      const arcMock = () => 'M0,0';
      arcMock.innerRadius = vi.fn().mockReturnThis();
      arcMock.outerRadius = vi.fn().mockReturnThis();
      return arcMock;
    }),
    sum: vi.fn(() => 90),
    scaleOrdinal: vi.fn(() => ({
      domain: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    })),
  };
});

// Import the component after the mocks are set up
import CaseDonutChart from '@/components/live/CaseDonutChart.vue'; // Adjust the import path as necessary

describe('CaseDonutChart', () => {
  it('renders correctly', () => {
    const wrapper = mount(CaseDonutChart, {
      props: {
        chartData: {
          reportedCases: 10,
          claimedCases: 50,
          completedCases: 30,
        },
        chartId: 'd3-chart-unique-id',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders with default props', () => {
    const wrapper = mount(CaseDonutChart);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.props().chartId).toBe('d3-chart-unique-id');
    expect(wrapper.props().chartData).toEqual({
      reportedCases: 10,
      claimedCases: 50,
      completedCases: 30,
    });
  });

  it.todo('initializes the D3 chart correctly', async () => {
    const wrapper = mount(CaseDonutChart, {
      props: {
        chartData: {
          reportedCases: 10,
          claimedCases: 50,
          completedCases: 30,
        },
        chartId: 'd3-chart-unique-id',
      },
    });

    await wrapper.vm.$nextTick();

    expect(d3.select).toHaveBeenCalled();
    expect(d3.pie).toHaveBeenCalled();
    expect(d3.arc).toHaveBeenCalled();
    expect(d3.sum).toHaveBeenCalled();
    expect(d3.scaleOrdinal).toHaveBeenCalled();
  });

  it.todo('handles prop updates correctly', async () => {
    const wrapper = mount(CaseDonutChart, {
      props: {
        chartData: {
          reportedCases: 10,
          claimedCases: 50,
          completedCases: 30,
        },
        chartId: 'd3-chart-unique-id',
      },
    });

    await wrapper.setProps({
      chartData: {
        reportedCases: 20,
        claimedCases: 60,
        completedCases: 40,
      },
    });

    expect(wrapper.props().chartData).toEqual({
      reportedCases: 20,
      claimedCases: 60,
      completedCases: 40,
    });

    await wrapper.vm.$nextTick();

    expect(d3.select).toHaveBeenCalled();
    expect(d3.pie).toHaveBeenCalled();
    expect(d3.arc).toHaveBeenCalled();
    expect(d3.sum).toHaveBeenCalled();
    expect(d3.scaleOrdinal).toHaveBeenCalled();
  });
});
