import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import CapabilityItem from '@/components/CapabilityItem.vue'; // Adjust the path if necessary

// Mock the store
import { useStore } from 'vuex';
vi.mock('vuex', () => ({
  useStore: vi.fn(),
}));

describe('CapabilityItem.vue', () => {
  const mockStore = {
    getters: {
      'enums/phases': [
        { id: 1, name_t: 'phase1' },
        { id: 2, name_t: 'phase2' },
      ],
    },
  };

  beforeEach(() => {
    useStore.mockReturnValue(mockStore);
  });

  it('renders correctly with default props', () => {
    const wrapper = mount(CapabilityItem, {
      props: {
        capability: {
          name_t: 'testCapability',
          description_t: 'testDescription',
        },
        index: 0,
        availableCapabilities: [],
      },
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('testCapability');
  });

  it('renders phases correctly', () => {
    const wrapper = mount(CapabilityItem, {
      props: {
        capability: {
          name_t: 'testCapability',
          description_t: 'testDescription',
        },
        index: 0,
        availableCapabilities: [{ phase: 1 }],
      },
    });
    const phases = wrapper.findAll('.col-span-1');
    expect(phases.length).toBe(2); // Two phases from the mocked store
  });

  it('applies the correct class based on available capabilities', () => {
    const wrapper = mount(CapabilityItem, {
      props: {
        capability: {
          name_t: 'testCapability',
          description_t: 'testDescription',
        },
        index: 0,
        availableCapabilities: [{ phase: 1 }],
      },
    });
    const firstPhase = wrapper.findAll('.col-span-1').at(0);
    expect(firstPhase.classes()).toContain('border-2');
    expect(firstPhase.classes()).toContain('border-white');
    expect(firstPhase.classes()).toContain('light-box');

    const secondPhase = wrapper.findAll('.col-span-1').at(1);
    expect(secondPhase.classes()).toContain('bg-crisiscleanup-dark-400');
  });

  it.todo('emits the correct event on hover', async () => {
    const wrapper = mount(CapabilityItem, {
      props: {
        capability: {
          name_t: 'testCapability',
          description_t: 'testDescription',
        },
        index: 0,
        availableCapabilities: [],
      },
    });
    const firstPhase = wrapper.findAll('.col-span-1').at(0);

    await firstPhase.trigger('mouseover');
    expect(wrapper.emitted().onHover).toBeTruthy();
    expect(wrapper.emitted().onHover[0]).toEqual(['phase1' + 0]);

    await firstPhase.trigger('mouseleave');
    expect(wrapper.emitted().onHover[1]).toEqual(['']);
  });
});
