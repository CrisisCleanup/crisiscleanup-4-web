import moment from 'moment';
import axios from 'axios';
import { DbService, WORKSITE_IMAGES_DATABASE } from '@/services/db.service';
import { generateHash } from './helpers';
import type Worksite from '@/models/Worksite';
import createDebug from 'debug';

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

const loadCaseImagesCached = async (query: Record<string, unknown>) => {
  // Sort the query keys
  const queryKeys = Object.keys(query).sort();
  const sortedQuery: Record<string, unknown> = {};
  for (const key of queryKeys) {
    sortedQuery[key] = query[key];
  }

  const queryHash = generateHash(JSON.stringify(sortedQuery)); // Using the same hash function as in loadCasesCached
  const cacheKeys = {
    IMAGES: `cachedCaseImages:${queryHash}`,
    UPDATED: `casesImagesUpdated:${queryHash}`,
    RECONCILED: `casesImagesReconciled:${queryHash}`,
  };

  debug('loadCaseImagesCached::QueryHash %o | %s', query, queryHash);
  const cachedCaseImages = (await DbService.getItem(
    cacheKeys.IMAGES,
    WORKSITE_IMAGES_DATABASE,
  )) as CachedCaseResponse;

  const casesUpdatedAt = (await DbService.getItem(
    cacheKeys.UPDATED,
    WORKSITE_IMAGES_DATABASE,
  )) as string;

  const casesReconciledAt = ((await DbService.getItem(
    cacheKeys.RECONCILED,
    WORKSITE_IMAGES_DATABASE,
  )) || moment().toISOString()) as string;

  if (cachedCaseImages) {
    const [response, reconciliationResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_APP_API_BASE_URL}/worksites_images`, {
        params: {
          ...query,
          updated_at__gt: casesUpdatedAt,
        },
      }),
      axios.get(`${import.meta.env.VITE_APP_API_BASE_URL}/worksites_images`, {
        params: {
          updated_at__gt: casesReconciledAt,
          fields: 'id,incident',
        },
      }),
    ]);

    for (const element of reconciliationResponse.data.results) {
      const itemIndex = cachedCaseImages.results.findIndex(
        (o) => o.id === element.id,
      );
      if (
        itemIndex > -1 &&
        element.incident !== cachedCaseImages.results[itemIndex].incident
      ) {
        cachedCaseImages.results.splice(itemIndex, 1);
      }
    }

    await DbService.setItem(
      cacheKeys.RECONCILED,
      moment().toISOString(),
      WORKSITE_IMAGES_DATABASE,
    );

    if (response.data.count === 0) {
      return cachedCaseImages;
    }

    for (const element of response.data.results) {
      const itemIndex = cachedCaseImages.results.findIndex(
        (o) => o.id === element.id,
      );
      if (itemIndex > -1) {
        cachedCaseImages.results[itemIndex] = element;
      } else {
        cachedCaseImages.results.push(element);
      }
    }

    cachedCaseImages.count = cachedCaseImages.results.length;

    await DbService.setItem(
      cacheKeys.IMAGES,
      cachedCaseImages,
      WORKSITE_IMAGES_DATABASE,
    );

    await DbService.setItem(
      cacheKeys.UPDATED,
      moment().toISOString(),
      WORKSITE_IMAGES_DATABASE,
    );

    return cachedCaseImages;
  }

  const response = await axios.get<CachedCaseResponse>(
    `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_images`,
    {
      params: query,
    },
  );

  await DbService.setItem(
    cacheKeys.IMAGES,
    response.data,
    WORKSITE_IMAGES_DATABASE,
  );

  await DbService.setItem(
    cacheKeys.UPDATED,
    moment().toISOString(),
    WORKSITE_IMAGES_DATABASE,
  );

  return response.data;
};

export { loadCasesCached, loadCases, loadCaseImagesCached };
