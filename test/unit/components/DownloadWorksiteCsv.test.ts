import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import DownloadWorksiteCsv from '@/components/downloads/DownloadWorksiteCsv.vue';
import { forceFileDownloadFromURl } from '@/utils/downloads';

vi.mock('@/utils/downloads', () => ({ forceFileDownloadFromURl: vi.fn() }));

const wrappers: ReturnType<typeof mount>[] = [];
const createDownload = (wait = 20) => {
  const wrapper = mount(DownloadWorksiteCsv, {
    props: { downloadId: '123', wait },
    global: { stubs: { Spinner: true } },
  });
  wrappers.push(wrapper);
  return wrapper;
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount();
  wrappers.length = 0;
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.useRealTimers();
});

it('waits for a pending status request and downloads the result once', async () => {
  let resolveStatus!: (value: unknown) => void;
  const get = vi
    .spyOn(axios, 'get')
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveStatus = resolve;
        }),
    )
    .mockResolvedValue({
      data: { csv_url: '/file.csv', filename_original: 'file.csv' },
    });
  createDownload();
  await vi.advanceTimersByTimeAsync(5000);
  expect(get).toHaveBeenCalledTimes(1);
  resolveStatus({ data: { file: 'file-id' } });
  await flushPromises();
  await vi.advanceTimersByTimeAsync(5000);
  expect(get).toHaveBeenCalledTimes(2);
  expect(forceFileDownloadFromURl).toHaveBeenCalledTimes(1);
  expect(forceFileDownloadFromURl).toHaveBeenCalledWith(
    '/file.csv',
    'file.csv',
  );
});

it('cancels requests when the dialog closes and ignores late results', async () => {
  let resolveStatus!: (value: unknown) => void;
  const get = vi.spyOn(axios, 'get').mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveStatus = resolve;
      }),
  );
  const wrapper = createDownload();
  await vi.advanceTimersByTimeAsync(1000);
  wrapper.unmount();
  expect(get.mock.calls[0][1]?.signal?.aborted).toBe(true);
  resolveStatus({ data: { file: 'file-id' } });
  await flushPromises();
  await vi.advanceTimersByTimeAsync(5000);
  expect(get).toHaveBeenCalledTimes(1);
  expect(forceFileDownloadFromURl).not.toHaveBeenCalled();
});

it('stops at the configured attempt limit', async () => {
  const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: {} });
  const wrapper = createDownload(2);
  await vi.advanceTimersByTimeAsync(5000);
  expect(get).toHaveBeenCalledTimes(2);
  expect(wrapper.text()).toContain('info.processing_download_d');
});
