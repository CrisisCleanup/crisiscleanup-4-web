import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import { createStore } from 'vuex';
import WorksiteSearchInput from '@/components/work/WorksiteSearchInput.vue';
import GeocoderService from '@/services/geocoder.service';

vi.mock('@/hooks/useCurrentUser', () => ({
  default: () => ({ currentUser: ref({ organization: {} }) }),
}));
vi.mock('@/hooks/useRecentWorksites', () => ({
  useRecentWorksites: () => ({
    recentWorksites: ref([]),
    addRecentWorksite: vi.fn(),
    deleteRecentWorksite: vi.fn(),
  }),
}));
vi.mock('@/services/geocoder.service', () => ({
  default: { getMatchingAddresses: vi.fn() },
}));
vi.mock('@/models/Worksite', () => ({
  default: { getWorkType: () => {} },
}));

const wrappers: ReturnType<typeof mount>[] = [];
function createSearch() {
  const store = createStore({
    getters: { 'incident/currentIncidentId': () => 7 },
  });
  const wrapper = mount(WorksiteSearchInput, {
    props: { useGeocoder: true },
    global: {
      plugins: [store],
      stubs: { BaseInput: true, Badge: true },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(GeocoderService.getMatchingAddresses).mockResolvedValue([]);
});
afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount();
  wrappers.length = 0;
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.useRealTimers();
});

it('starts geocoding without waiting for the case API and ignores obsolete results', async () => {
  let resolveOld!: (value: unknown) => void;
  const get = vi
    .spyOn(axios, 'get')
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    )
    .mockResolvedValue({ data: { results: [{ id: 2, name: 'new' }] } });
  const wrapper = createSearch();
  const input = wrapper.findComponent({ name: 'BaseInput' });
  input.vm.$emit('update:modelValue', 'old');
  await vi.advanceTimersByTimeAsync(300);
  expect(GeocoderService.getMatchingAddresses).toHaveBeenCalledWith(
    'old',
    'USA',
  );
  input.vm.$emit('update:modelValue', 'new');
  resolveOld({ data: { results: [{ id: 1, name: 'old' }] } });
  await flushPromises();
  expect(wrapper.emitted('onWorksiteSearch')).toBeUndefined();
  await vi.advanceTimersByTimeAsync(300);
  expect(wrapper.emitted('onWorksiteSearch')?.at(-1)).toEqual([
    [{ id: 2, name: 'new' }],
  ]);
  expect(get.mock.calls[0][1]?.signal?.aborted).toBe(true);
});

it('cancels delayed searches and removes the keydown listener on unmount', async () => {
  const get = vi
    .spyOn(axios, 'get')
    .mockResolvedValue({ data: { results: [] } });
  const wrapper = createSearch();
  const clearSuggestions = vi.fn();
  await wrapper.setProps({ onClearSuggestions: clearSuggestions });
  await flushPromises();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(clearSuggestions).toHaveBeenCalledTimes(1);
  wrapper
    .findComponent({ name: 'BaseInput' })
    .vm.$emit('update:modelValue', 'pending');
  wrapper.unmount();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  await vi.advanceTimersByTimeAsync(500);
  expect(get).not.toHaveBeenCalled();
  expect(clearSuggestions).toHaveBeenCalledTimes(1);
});
