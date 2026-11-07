import moment from '@/utils/dates';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { DbService, WORKSITE_IMAGES_DATABASE } from '@/services/db.service';
import { generateHash } from './helpers';
import type Worksite from '@/models/Worksite';
import User from '@/models/User';

export type CachedCase = Worksite;
export interface CachedCaseResponse {
  count: number;
  results: CachedCase[];
}

export interface WorksiteChange {
  worksite_id: number;
  incident_id: number;
  invalidated_at: string | null;
}

const loadCases = async (query: Record<string, unknown>) => {
  const response = await axios.get<CachedCaseResponse>(
    `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_all`,
    {
      params: {
        ...query,
      },
    },
  );
  return response.data;
};

const loadCasesPaginated = async (query: Record<string, unknown>) => {
  const results: CachedCase[] = [];
  let nextUrl: string | null =
    `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_page`;
  let params = { ...query };

  while (nextUrl) {
    const response: AxiosResponse = await axios.get<CachedCaseResponse>(
      nextUrl,
      { params },
    );
    const { data } = response;
    results.push(...data.results);
    nextUrl = data.next;

    // If nextUrl is relative, construct the full URL
    if (nextUrl && !nextUrl.startsWith('http')) {
      nextUrl = `${import.meta.env.VITE_APP_API_BASE_URL}${nextUrl}`;
    }

    // After the first request, params are included in the next URL
    params = {};
  }

  return {
    count: results.length,
    results,
  };
};

const loadWorksiteChanges = async (
  since: string,
): Promise<WorksiteChange[]> => {
  const response = await axios.get<WorksiteChange[]>(
    `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_changes`,
    {
      params: { since },
    },
  );
  return response.data;
};

const loadUserLocations = async (query: Record<string, unknown>) => {
  const response = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/user_geo_locations/latest_locations`,
  );
  const userIds = response.data.map((location: any) => location.user_id);
  await User.api().get(`/users?id__in=${userIds.join(',')}`, {
    dataKey: 'results',
  });
  return response.data;
};

const loadCachedCaseRecords = async (
  query: Record<string, unknown>,
  load: (query: Record<string, unknown>) => Promise<CachedCaseResponse>,
): Promise<CachedCaseResponse> => {
  // Filtered deltas cannot report cases that stop matching the query.
  if (Object.keys(query).some((key) => key !== 'incident')) {
    return load(query);
  }

  const queryHash = generateHash(JSON.stringify(query));
  const cacheKeys = {
    CASES: `cachedCases:${queryHash}`,
    UPDATED: `casesUpdated:${queryHash}`,
    RECONCILED: `casesReconciled:${queryHash}`,
  };
  const cachedCases = (await DbService.getItem(cacheKeys.CASES)) as
    | CachedCaseResponse
    | undefined;
  const updatedAt = (await DbService.getItem(cacheKeys.UPDATED)) as
    | string
    | undefined;
  const reconciledAt = (await DbService.getItem(cacheKeys.RECONCILED)) as
    | string
    | undefined;
  // Capture the cursor before the requests so concurrent changes are not skipped.
  const requestedAt = moment().toISOString();
  let results: CachedCaseResponse;

  if (cachedCases && updatedAt) {
    const [response, changes] = await Promise.all([
      load({ ...query, updated_at__gt: updatedAt }),
      loadWorksiteChanges(reconciledAt || updatedAt),
    ]);
    const byId = new Map(cachedCases.results.map((item) => [item.id, item]));
    for (const change of changes) {
      const cached = byId.get(change.worksite_id);
      if (
        cached &&
        (change.invalidated_at != undefined ||
          change.incident_id !== cached.incident)
      ) {
        byId.delete(change.worksite_id);
      }
    }
    for (const item of response.results) byId.set(item.id, item);
    results = { count: byId.size, results: [...byId.values()] };
  } else {
    results = await load(query);
  }

  await DbService.setItem(cacheKeys.CASES, results);
  await DbService.setItem(cacheKeys.UPDATED, requestedAt);
  await DbService.setItem(cacheKeys.RECONCILED, requestedAt);
  return results;
};

const loadCasesCached = (query: Record<string, unknown>) =>
  loadCachedCaseRecords(query, loadCases);

const loadCasesCachedWithPagination = (query: Record<string, unknown>) =>
  loadCachedCaseRecords(query, (params) =>
    loadCasesPaginated({ ...params, limit: 5000 }),
  );

const loadCaseImagesCached = async (query) => {
  // Sort the query keys
  const queryKeys = Object.keys(query).sort();
  const sortedQuery = {};
  for (const key of queryKeys) {
    sortedQuery[key] = query[key];
  }

  const queryHash = generateHash(JSON.stringify(sortedQuery));
  const cacheKeys = {
    IMAGES: `cachedCaseImages:${queryHash}`,
    UPDATED: `casesImagesUpdated:${queryHash}`,
    RECONCILED: `casesImagesReconciled:${queryHash}`,
  };

  const cachedCaseImages = await DbService.getItem(
    cacheKeys.IMAGES,
    WORKSITE_IMAGES_DATABASE,
  );

  const casesUpdatedAt = await DbService.getItem(
    cacheKeys.UPDATED,
    WORKSITE_IMAGES_DATABASE,
  );

  const casesReconciledAt =
    (await DbService.getItem(cacheKeys.RECONCILED, WORKSITE_IMAGES_DATABASE)) ||
    moment().toISOString();

  // Internal pagination parameters
  const DEFAULT_LIMIT = 1000; // Adjust as needed
  const MAX_CONCURRENT_REQUESTS = 5; // Adjust as needed

  if (cachedCaseImages) {
    // Fetch updates
    const firstResponse = await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_images`,
      {
        params: {
          ...query,
          updated_at__gt: casesUpdatedAt,
          limit: DEFAULT_LIMIT,
          offset: 0,
        },
      },
    );

    const totalCount = firstResponse.data.count;
    const totalBatches = Math.ceil(totalCount / DEFAULT_LIMIT);
    const allResults = [...firstResponse.data.results];

    if (totalBatches > 1) {
      const offsets = [];
      for (let i = 1; i < totalBatches; i++) {
        offsets.push(i * DEFAULT_LIMIT);
      }

      const fetchBatch = async (offset) => {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_images`,
          {
            params: {
              ...query,
              updated_at__gt: casesUpdatedAt,
              limit: DEFAULT_LIMIT,
              offset,
            },
          },
        );
        return response.data.results;
      };

      const fetchAllBatches = async () => {
        const results = [];
        let index = 0;

        const workers = Array.from(
          { length: MAX_CONCURRENT_REQUESTS },
          async () => {
            while (index < offsets.length) {
              const currentIndex = index++;
              const batchResults = await fetchBatch(offsets[currentIndex]);
              results.push(...batchResults);
            }
          },
        );

        await Promise.all(workers);
        return results;
      };

      const remainingResults = await fetchAllBatches();
      allResults.push(...remainingResults);
    }

    // Process and reconcile data
    const cachedResultsMap = new Map();
    for (const item of cachedCaseImages.results) {
      cachedResultsMap.set(item.id, item);
    }

    // Reconciliation logic (if needed)
    // Assuming reconciliationResponse is fetched similarly with pagination

    // Update cached results with new data
    for (const item of allResults) {
      cachedResultsMap.set(item.id, item);
    }

    const finalResults = [...cachedResultsMap.values()];

    const finalData = {
      count: finalResults.length,
      results: finalResults,
    };

    // Update cache
    await DbService.setItem(
      cacheKeys.IMAGES,
      finalData,
      WORKSITE_IMAGES_DATABASE,
    );

    await DbService.setItem(
      cacheKeys.UPDATED,
      moment().toISOString(),
      WORKSITE_IMAGES_DATABASE,
    );

    return finalData;
  }

  // If no cached data, fetch all data
  const firstResponse = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_images`,
    {
      params: {
        ...query,
        limit: DEFAULT_LIMIT,
        offset: 0,
      },
    },
  );

  const totalCount = firstResponse.data.count;
  const totalBatches = Math.ceil(totalCount / DEFAULT_LIMIT);
  const allResults = [...firstResponse.data.results];

  if (totalBatches > 1) {
    const offsets = [];
    for (let i = 1; i < totalBatches; i++) {
      offsets.push(i * DEFAULT_LIMIT);
    }

    const fetchBatch = async (offset) => {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_images`,
        {
          params: {
            ...query,
            limit: DEFAULT_LIMIT,
            offset,
          },
        },
      );
      return response.data.results;
    };

    const fetchAllBatches = async () => {
      const results = [];
      let index = 0;

      const workers = Array.from(
        { length: MAX_CONCURRENT_REQUESTS },
        async () => {
          while (index < offsets.length) {
            const currentIndex = index++;
            const batchResults = await fetchBatch(offsets[currentIndex]);
            results.push(...batchResults);
          }
        },
      );

      await Promise.all(workers);
      return results;
    };

    const remainingResults = await fetchAllBatches();
    allResults.push(...remainingResults);
  }

  const finalData = {
    count: allResults.length,
    results: allResults,
  };

  // Cache the data
  await DbService.setItem(
    cacheKeys.IMAGES,
    finalData,
    WORKSITE_IMAGES_DATABASE,
  );

  await DbService.setItem(
    cacheKeys.UPDATED,
    moment().toISOString(),
    WORKSITE_IMAGES_DATABASE,
  );

  return finalData;
};

export {
  loadCasesCached,
  loadCasesCachedWithPagination,
  loadCases,
  loadCaseImagesCached,
  loadUserLocations,
  loadWorksiteChanges,
};
