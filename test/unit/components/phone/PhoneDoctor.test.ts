import type { Mock } from 'vitest';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import PhoneDoctor from '@/components/phone/PhoneDoctor.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';

// Mocking dependencies
import { useCurrentUser } from '@/hooks';
import { useAcl } from '@/hooks';
import { useValidation } from '@/hooks';
import axios from 'axios';
import PhoneTestService from '@/services/phone.test.service';
import User from '@/models/User';

// Mock modules
vi.mock('@/hooks', () => ({
  useCurrentUser: vi.fn(),
  useAcl: vi.fn(),
  useValidation: vi.fn(),
}));

vi.mock('axios');

vi.mock('@/services/phone.test.service', () => ({
  default: vi.fn().mockImplementation(() => ({
    createAgent: vi.fn(),
    getAccessToken: vi.fn(),
    initPhoneService: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    apiLogoutAgent: vi.fn(),
    dial: vi.fn(),
  })),
}));

// Mock components
vi.mock('~icons/la/stethoscope', () => ({
  default: {
    template: '<svg></svg>',
  },
}));

describe('PhoneDoctor.vue', () => {
  let wrapper: any;

  beforeEach(() => {
    // Mock current user
    (useCurrentUser as unknown as Mock).mockReturnValue({
      currentUser: ref({
        id: 'user123',
        primary_language: 1,
        mobile: '+1234567890',
      }),
    });

    // Mock ACL
    (useAcl as unknown as Mock).mockReturnValue({
      $can: vi.fn().mockReturnValue(true),
    });

    // Mock validation
    (useValidation as unknown as Mock).mockReturnValue({
      validatePhoneNumber: vi.fn().mockReturnValue({
        newValue: '+1234567890',
        valid: true,
      }),
    });

    // Mock axios responses
    (axios.get as Mock) = vi.fn().mockResolvedValue({ data: {} });
    (axios.post as Mock) = vi.fn().mockResolvedValue({ data: {} });
    (axios.patch as Mock) = vi.fn().mockResolvedValue({ data: {} });

    // Mock User.api().patch
    vi.spyOn(User, 'api').mockReturnValue({
      patch: vi.fn().mockResolvedValue({ data: {} }),
    });

    // Mount the component
    wrapper = mount(PhoneDoctor, {
      global: {
        components: {
          BaseButton,
          BaseInput,
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component', () => {
    expect(wrapper.html()).toContain('Phone Doctor');
    expect(wrapper.html()).toContain('phoneDoctor.run_diagnostic');
  });

  it('should handle phone number update', async () => {
    // Simulate failed phone number validation
    wrapper.vm.errorMessages.base.phoneNumber = 'Invalid phone number format.';
    await wrapper.vm.$nextTick();

    // Open the base step
    wrapper.vm.stepsExpanded.base = true;
    await wrapper.vm.$nextTick();

    // Find the input and button
    const phoneNumberInput = wrapper.findComponent(BaseInput);
    const updateButton = wrapper
      .findAllComponents(BaseButton)
      .find((btn) => btn.text().includes('~~Update Phone Number'));

    // Set new phone number
    wrapper.vm.newPhoneNumber = '(784) 767-8269';
    await phoneNumberInput.vm.$emit('update:modelValue', '(784) 767-8269');
    await updateButton?.trigger('click');
    await flushPromises();

    // Check if phone number was updated
    expect(wrapper.vm.errorMessages.base.phoneNumber).toBe('');
    expect(wrapper.vm.stepStatuses['base']).toBe('success');
  });

  it('should disable steps until previous step is successful', async () => {
    // Simulate base step not successful
    wrapper.vm.stepStatuses['base'] = 'error';
    await wrapper.vm.$nextTick();

    const secondStepButton = wrapper.findAllComponents(BaseButton)[2];
    expect(secondStepButton.attributes('disabled')).toBeDefined();

    // Simulate base step successful
    wrapper.vm.stepStatuses['base'] = 'success';
    await wrapper.vm.$nextTick();

    expect(secondStepButton.attributes('disabled')).toBeUndefined();
  });

  it('should disable individual step run buttons when diagnostics are running', async () => {
    // Simulate diagnostics are running
    wrapper.vm.isDiagnosticsRunning = true;
    await wrapper.vm.$nextTick();

    // All step run buttons should be disabled
    const runButtons = wrapper
      .findAllComponents(BaseButton)
      .filter((btn) => btn.text().includes('Run'));
    for (const button of runButtons) {
      expect(button.attributes('disabled')).toBeDefined();
    }
  });

  it('should handle API errors gracefully', async () => {
    // Mock axios.get to reject with an error
    (axios.get as Mock).mockRejectedValue(new Error('API Error'));

    // Run the 'agent' step
    const agentStep = wrapper.vm.steps.find((step) => step.key === 'agent');
    const result = await agentStep.action();
    await flushPromises();

    // Check that the step failed and error message is displayed
    expect(result).toBe(false);
    expect(wrapper.vm.stepStatuses['agent']).toBe('error');
    expect(wrapper.vm.errorMessages['agent']).toBe(
      '~~Failed to connect agent.',
    );
  });
});
