import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Capability from '@/components/Capability.vue'; // Adjust the path if necessary
import CapabilityItem from '@/components/CapabilityItem.vue';
import { useStore } from 'vuex';

vi.mock('vuex', () => ({
  useStore: vi.fn(),
}));

describe('Capability.vue', () => {
  const mockStore = {
    getters: {
      'enums/phases': [
        { id: 1, phase_name_t: 'phase1' },
        { id: 2, phase_name_t: 'phase2' },
      ],
    },
  };

  beforeEach(() => {
    useStore.mockReturnValue(mockStore);
  });

  it('renders correctly with default props', () => {
    const wrapper = mount(Capability, {
      props: {
        capabilities: [],
        organizationCapabilities: [],
      },
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('info.no_items_found');
  });

  it('renders capabilities correctly', () => {
    const wrapper = mount(Capability, {
      props: {
        capabilities: [
          { id: 1, name_t: 'capability1', parent_id: null, children: [] },
          { id: 2, name_t: 'capability2', parent_id: 1, children: [] },
        ],
        organizationCapabilities: [{ capability: 2 }],
      },
    });
    const capabilityDiv = wrapper.find(
      '[data-testid="testCapabilityTableDiv"]',
    );
    expect(capabilityDiv.exists()).toBe(true);
    expect(wrapper.text()).toContain('capability1');
  });

  it.todo('renders phases correctly', () => {
    const wrapper = mount(Capability, {
      props: {
        capabilities: [
          { id: 1, name_t: 'capability1', parent_id: null, children: [] },
        ],
        organizationCapabilities: [],
      },
    });

    const capabilityDiv = wrapper.find(
      '[data-testid="testCapabilityTableDiv"]',
    );
    expect(capabilityDiv.exists()).toBe(true);

    const phaseItems = wrapper.findAll(
      '[data-testid^="testCapabilitycapability1Phase"]',
    );
    expect(phaseItems.length).toBe(2); // Two phases from the mocked store
  });

  it.todo('renders CapabilityItem correctly', () => {
    const wrapper = mount(Capability, {
      props: {
        capabilities: [
          {
            id: 1,
            name_t: 'capability1',
            parent_id: null,
            children: [
              {
                id: 2,
                name_t: 'capability2',
                parent_id: 1,
                children: [],
              },
            ],
          },
        ],
        organizationCapabilities: [{ capability: 2 }],
      },
    });

    const capabilityItems = wrapper.findAllComponents(CapabilityItem);
    expect(capabilityItems.length).toBe(1);
    expect(capabilityItems.at(0)?.props('capability').name_t).toBe(
      'capability2',
    );
  });

  it.todo('emits on-hover event correctly', async () => {
    const wrapper = mount(Capability, {
      props: {
        capabilities: [
          {
            id: 1,
            name_t: 'capability1',
            parent_id: null,
            children: [
              {
                id: 2,
                name_t: 'capability2',
                parent_id: 1,
                children: [],
              },
            ],
          },
        ],
        organizationCapabilities: [{ capability: 2 }],
      },
    });

    const capabilityItem = wrapper.findComponent(CapabilityItem);
    await capabilityItem.vm.$emit('on-hover', 'testHover');
    expect(wrapper.vm.hoverItem).toBe('testHover');
  });
});
