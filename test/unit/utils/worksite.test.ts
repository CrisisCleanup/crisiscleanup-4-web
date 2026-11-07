import axios from 'axios';
import { DbService } from '@/services/db.service';
import {
  loadCasesCached,
  loadCasesCachedWithPagination,
} from '@/utils/worksite';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
vi.mock('@/services/db.service', () => ({
  DbService: { getItem: vi.fn(), setItem: vi.fn() },
}));
vi.mock('@/utils/helpers', () => ({ generateHash: (value: string) => value }));
vi.mock('@/models/User', () => ({ default: {} }));

const records = [
  { id: 1, incident: 7, status: 'open' },
  { id: 2, incident: 7, status: 'open' },
];

describe.each([
  ['all', loadCasesCached],
  ['paginated', loadCasesCachedWithPagination],
] as const)('case cache (%s)', (_, load) => {
  const database = new Map<string, unknown>();

  beforeEach(() => {
    vi.clearAllMocks();
    database.clear();
    vi.mocked(DbService.getItem).mockImplementation(async (key) =>
      structuredClone(database.get(key)),
    );
    vi.mocked(DbService.setItem).mockImplementation(async (key, value) => {
      database.set(key, structuredClone(value));
      return key;
    });
  });

  it('refreshes filtered membership after a case stops matching', async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: { count: 1, results: [records[0]] } })
      .mockResolvedValue({ data: { count: 0, results: [] } });

    const query = { incident: 7, work_type__status: 'open' };
    const initial = await load(query);
    const updated = await load(query);
    expect(initial.results).toHaveLength(1);
    expect(updated.results).toEqual([]);
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.not.objectContaining({
          updated_at__gt: expect.anything(),
        }),
      }),
    );
  });

  it('merges updates and removals with one cache write and an accurate count', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { count: records.length, results: records },
    });
    await load({ incident: 7 });
    vi.mocked(DbService.setItem).mockClear();
    vi.mocked(axios.get).mockImplementation(async (url) => ({
      data: String(url).endsWith('/worksites_changes')
        ? [{ worksite_id: 2, incident_id: 8, invalidated_at: undefined }]
        : {
            count: 2,
            results: [
              { ...records[0], status: 'closed' },
              { id: 3, incident: 7, status: 'open' },
            ],
          },
    }));

    expect(await load({ incident: 7 })).toEqual({
      count: 2,
      results: [
        { ...records[0], status: 'closed' },
        { id: 3, incident: 7, status: 'open' },
      ],
    });
    const caseWrites = vi
      .mocked(DbService.setItem)
      .mock.calls.filter(([key]) => key.startsWith('cachedCases:'));
    expect(caseWrites).toHaveLength(1);
  });

  it('updates the count when reconciliation only removes cases', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { count: 2, results: records },
    });
    await load({ incident: 7 });
    vi.mocked(axios.get).mockImplementation(async (url) => ({
      data: String(url).endsWith('/worksites_changes')
        ? [{ worksite_id: 1, incident_id: 7, invalidated_at: '2026-09-08' }]
        : { count: 0, results: [] },
    }));

    expect(await load({ incident: 7 })).toEqual({
      count: 1,
      results: [records[1]],
    });
  });
});
