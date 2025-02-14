import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
} from 'vitest';
import type { VueWrapper } from '@vue/test-utils';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import moment from 'moment';

// Mock `@vueuse/router`
vi.mock('@vueuse/router', () => {
  return {
    useRouteParams: vi.fn().mockImplementation(() => {
      return computed(() => '123'); // or ref('123')
    }),

    useRouteQuery: vi.fn().mockImplementation(() => {
      return computed(() => ({}));
    }),
  };
});

vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

vi.mock('vue-router', () => ({
  useRouter: () => ({
    currentRoute: ref({ path: '/', name: 'MockedHome' }),
    push: vi.fn(),
    replace: vi.fn(),
    // ... add anything else you might need
  }),
  useRoute: () => ({
    path: '/',
    name: 'MockedHome',
    params: {},
    query: {},
  }),
}));

import AddScheduleDialog from '@/components/scheduling/AddScheduleDialog.vue';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import type { Store } from 'vuex';
import type { Database } from '@vuex-orm/core';

const mockT = (key: string) => key;

describe('AddScheduleDialog.vue', () => {
  let wrapper: VueWrapper<any>;
  let database: Database;
  let store: Store<any>;

  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();

    // Mock the Team GET call
    mockedAxios.get.mockResolvedValue({
      data: {
        results: [
          { id: 1, name: 'Team A' },
          { id: 2, name: 'Team B' },
        ],
      },
      // If needed:
      entities: {
        teams: [
          { id: 1, name: 'Team A' },
          { id: 2, name: 'Team B' },
        ],
      },
    });

    wrapper = mount(AddScheduleDialog, {
      props: {
        worksite: {
          id: 123,
          case_number: 'V001',
          name: 'Test Worksite',
          work_types: [
            { id: 10, work_type: 'trees' },
            { id: 11, work_type: 'muck_out' },
          ],
        },
      },
      global: {
        stubs: {
          Datepicker: {
            template: `
                <input
                  :value="modelValue"
                  data-testid="testCommonStartAt"
                  @input="$emit('update:modelValue', $event.target.value)"
                />
              `,
            props: ['modelValue'],
          },
        },
        components: {
          BaseInput,
          BaseButton,
          BaseCheckbox,
          BaseSelect,
        },

        mocks: {
          $t: mockT,
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders component with worksite info', () => {
    expect(wrapper.exists()).toBe(true);

    // Check for some text that identifies the worksite info
    expect(wrapper.text()).toContain('~~Worksite Information'); // from your template
    expect(wrapper.text()).toContain('V001');
    expect(wrapper.text()).toContain('Test Worksite');

    // Should show two checkboxes for the 2 work types
    const checkboxes = wrapper.findAll('[data-testid^="testCheckboxWT-"]');
    expect(checkboxes.length).toBe(2);
  });

  it('disables the Save button if no work type is selected', async () => {
    const saveButton = wrapper.find('[data-testid="testSaveButton"]');
    // Should be disabled when zero Work Types are selected
    expect(saveButton.attributes('disabled')).toBeDefined();
  });

  it('enables the Save button once a work type is selected', async () => {
    // Select a work type
    const checkbox = wrapper.find('[data-testid="testCheckboxWT-10"] input');
    await checkbox.setChecked(true);

    // The save button should now be enabled
    const saveButton = wrapper.find('[data-testid="testSaveButton"]');
    expect(saveButton.attributes('disabled')).toBeUndefined();
  });

  it('saves schedules correctly when form is valid', async () => {
    // 1) Select a work type
    const checkbox = wrapper.find('[data-testid="testCheckboxWT-10"] input');
    await checkbox.setChecked(true);

    // Now you can use setValue like a normal input:
    const startInput = wrapper.find('[data-testid="testCommonStartAt"]');
    await startInput.setValue('2023-12-01 12:00');

    const endInput = wrapper.find('[data-testid="testCommonEndAt"]');
    await endInput.setValue('2023-12-01 13:00');

    await flushPromises();

    // 3) Mock the axios post response
    mockedAxios.post.mockResolvedValue({ data: {} });

    // 4) Save the schedules
    const saveButton = wrapper.find('[data-testid="testSaveButton"]');
    expect(saveButton.attributes('disabled')).toBeUndefined();
    await saveButton.trigger('click');
    await flushPromises();

    // 5) Check if the axios post was called with the correct payload
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/worksite_work_types_schedule',
      {
        worksite_work_types_ids: [10],
        start: moment('2023-12-01 12:00').toISOString(),
        end: moment('2023-12-01 13:00').toISOString(),
        team: null,
        notes: '',
      },
    );
  });
});
