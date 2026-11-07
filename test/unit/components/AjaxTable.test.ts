import { describe, expect, it } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { commonComponentStubs } from '../../helpers';
import { makeTableColumns } from '../../../src/utils/table';
import AjaxTable from '@/components/AjaxTable.vue';
import axios from 'axios';
import useEmitter from '@/hooks/useEmitter';

describe('AjaxTable', () => {
  it('should render', async () => {
    const wrapper = mount(AjaxTable, {
      props: {
        columns: makeTableColumns([
          ['id', '1fr', 'ID'],
          ['name', '1fr', 'Name'],
        ]),
        url: `${import.meta.env.VITE_APP_API_BASE_URL}/table`,
        query: {},
      },
      global: {
        stubs: {
          ...commonComponentStubs,
        },
      },
    });
    await flushPromises();
    expect(wrapper.html()).toContain('Name from table data');
    expect(wrapper.html()).toContain('id_from_table_data');
    expect(wrapper.html()).not.toContain('info.search_items');
  });
  it('should render with search', async () => {
    const wrapper = mount(AjaxTable, {
      props: {
        enableSearch: true,
        columns: makeTableColumns([
          ['id', '1fr', 'ID'],
          ['name', '1fr', 'Name'],
        ]),
        url: `${import.meta.env.VITE_APP_API_BASE_URL}/table`,
        query: {},
      },
      global: {
        stubs: {
          ...commonComponentStubs,
        },
      },
    });
    await flushPromises();
    expect(wrapper.html()).toContain('info.search_items');
  });
});

describe('AjaxTable requests', () => {
  const wrappers: ReturnType<typeof mount>[] = [];
  const createTable = () => {
    const wrapper = mount(AjaxTable, {
      props: { url: '/table', query: {}, tableId: 'request-test' },
      global: { stubs: { ...commonComponentStubs, Table: true } },
    });
    wrappers.push(wrapper);
    return wrapper;
  };

  afterEach(() => {
    for (const wrapper of wrappers) wrapper.unmount();
    wrappers.length = 0;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('coalesces query changes and cancels trailing requests on unmount', async () => {
    vi.useFakeTimers();
    const get = vi
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: { results: [], count: 0 } });
    const wrapper = createTable();
    await flushPromises();
    get.mockClear();
    await wrapper.setProps({ query: { search: 'a' } });
    await wrapper.setProps({ query: { search: 'ab' } });
    await wrapper.setProps({ query: { search: 'abc' } });
    expect(get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(get).toHaveBeenCalledTimes(2);
    expect(get.mock.calls[1][1]?.params.search).toBe('abc');
    await wrapper.setProps({ query: { search: 'abcd' } });
    wrapper.unmount();
    const count = get.mock.calls.length;
    useEmitter().emitter.emit('refreshTable-request-test');
    await vi.advanceTimersByTimeAsync(2000);
    expect(get).toHaveBeenCalledTimes(count);
  });

  it('ignores late responses after a newer query finishes', async () => {
    let resolveOld!: (value: unknown) => void;
    const get = vi
      .spyOn(axios, 'get')
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValue({ data: { results: [{ id: 'new' }], count: 1 } });
    const wrapper = createTable();
    await wrapper.setProps({ query: { search: 'new' } });
    await flushPromises();
    resolveOld({ data: { results: [{ id: 'old' }], count: 1 } });
    await flushPromises();
    expect(get.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(wrapper.emitted('update:items')?.at(-1)).toEqual([[{ id: 'new' }]]);
  });
});
