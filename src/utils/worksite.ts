import moment from 'moment';
import axios from 'axios';
import { DbService, WORKSITE_IMAGES_DATABASE } from '@/services/db.service';
import { generateHash } from './helpers';
import type Worksite from '@/models/Worksite';
import createDebug from 'debug';
import User from '@/models/User';

export type CachedCase = Worksite;
export interface CachedCaseResponse {
  count: number;
  results: CachedCase[];
}

const debug = createDebug('@ccu:utils:worksite');

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

const loadCasesCached = async (query: Record<string, unknown>) => {
  const queryKeys = Object.keys(query).sort();
  const sortedQuery: Record<string, unknown> = {};
  for (const key of queryKeys) {
    sortedQuery[key] = query[key];
  }

  const queryHash = generateHash(JSON.stringify(sortedQuery));
  const cacheKeys = {
    CASES: `cachedCases:${queryHash}`,
    UPDATED: `casesUpdated:${queryHash}`,
    RECONCILED: `casesReconciled:${queryHash}`,
  };
  debug('loadCasesCached::QueryHash %o | %s', query, queryHash);
  const cachedCases = (await DbService.getItem(
    cacheKeys.CASES,
  )) as CachedCaseResponse;
  const casesUpdatedAt = (await DbService.getItem(cacheKeys.UPDATED)) as string; // ISO date string
  const casesReconciledAt = ((await DbService.getItem(cacheKeys.RECONCILED)) ||
    moment().toISOString()) as string; // ISO date string
  if (cachedCases) {
    const [response, reconciliationResponse] = await Promise.all([
      loadCases({
        ...query,
        updated_at__gt: casesUpdatedAt,
      }),
      loadCases({
        updated_at__gt: casesReconciledAt,
        fields: 'id,incident',
      }),
    ]);

    for (const element of reconciliationResponse.results) {
      const itemIndex = cachedCases.results.findIndex(
        (o) => o.id === element.id,
      );
      if (
        itemIndex > -1 &&
        element.incident !== cachedCases.results[itemIndex].incident
      ) {
        cachedCases.results.splice(itemIndex, 1);
      }
    }

    await DbService.setItem(cacheKeys.RECONCILED, moment().toISOString());
    await DbService.setItem(cacheKeys.CASES, cachedCases);

    if (response.count === 0) {
      return cachedCases;
    }

    for (const element of response.results) {
      const itemIndex = cachedCases.results.findIndex(
        (o) => o.id === element.id,
      );
      if (itemIndex > -1) {
        cachedCases.results[itemIndex] = element;
      } else {
        cachedCases.results.push(element);
      }
    }

    cachedCases.count = cachedCases.results.length;

    await DbService.setItem(cacheKeys.CASES, cachedCases);
    await DbService.setItem(cacheKeys.UPDATED, moment().toISOString());
    return cachedCases;
  }

  const results = await loadCases(query);
  await DbService.setItem(cacheKeys.CASES, results);
  await DbService.setItem(cacheKeys.UPDATED, moment().toISOString());
  return results;
};

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

export { loadCasesCached, loadCases, loadCaseImagesCached, loadUserLocations };
