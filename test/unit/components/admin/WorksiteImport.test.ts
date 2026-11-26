import { shallowMount } from '@vue/test-utils';
import axios from 'axios';
import { expect, it, vi } from 'vitest';
import WorksiteImport from '@/components/admin/WorksiteImport.vue';

it('shows the failed worksite and its reason from the import status', async () => {
  vi.spyOn(axios, 'get').mockResolvedValue({ data: [] });
  const wrapper = shallowMount(WorksiteImport, {
    global: {
      stubs: {
        Modal: { template: '<div><slot /></div>' },
        BaseButton: true,
        BaseCheckbox: true,
        BaseSelect: true,
        BaseText: true,
      },
    },
  });

  wrapper.vm.showErrors({
    recent_errors: [
      { address: '123 Test St', error: 'city: This field is required.' },
    ],
  });
  await wrapper.vm.$nextTick();

  expect(wrapper.text()).toContain('123 Test St');
  expect(wrapper.text()).toContain('city: This field is required.');
  expect(wrapper.text()).not.toContain('Invalid Date');
});
