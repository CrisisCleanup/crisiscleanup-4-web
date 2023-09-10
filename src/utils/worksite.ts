import moment from 'moment';
import axios from 'axios';
import { DbService } from '../services/db.service';
import { generateHash } from './helpers';
import type Worksite from '@/models/Worksite';

export type CachedCase = Worksite;
export interface CachedCaseResponse {
  count: number;
  results: CachedCase[];
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
  console.debug('loadCasesCached::QueryHash', query, queryHash);
  const cachedCases = (await DbService.getItem(
    cacheKeys.CASES,
  )) as CachedCaseResponse;
  const casesUpdated = (await DbService.getItem(cacheKeys.UPDATED)) as string; // ISO date string
  const casesReconciled = ((await DbService.getItem(cacheKeys.RECONCILED)) ||
    moment().toISOString()) as string; // ISO date string
  if (cachedCases) {
    const [response, reconciliationResponse] = await Promise.all([
      loadCases({
        ...query,
        updated_at__gt: casesUpdated,
      }),
      loadCases({
        updated_at__gt: casesReconciled,
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

const loadCaseImagesCached = async (query: Record<string, any>) => {
  const hashCode = (string_: string) =>
    string_
      .split('')
      .reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0);
  const queryHash = hashCode(JSON.stringify(query));
  const cachedCases = (await DbService.getItem(
    `cachedCaseImages:${queryHash}`,
  )) as CachedCaseResponse;
  const casesUpdated = (await DbService.getItem(
    `casesImagesUpdated:${queryHash}`,
  )) as string; // ISO date string
  const casesReconciled = ((await DbService.getItem(
    `casesImagesReconciled:${queryHash}`,
  )) || moment().toISOString()) as string; // ISO date string
  if (cachedCases) {
    const [response, reconciliationResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_APP_API_BASE_URL}/worksites_images`, {
        params: {
          ...query,
          updated_at__gt: casesUpdated,
        },
      }),
      axios.get(`${import.meta.env.VITE_APP_API_BASE_URL}/worksites_images`, {
        params: {
          updated_at__gt: casesReconciled,
          fields: 'id,incident',
        },
      }),
    ]);

    for (const element of reconciliationResponse.data.results) {
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

    await DbService.setItem(
      `casesImagesReconciled:${queryHash}`,
      moment().toISOString(),
    );

    await DbService.setItem(`cachedCaseImages:${queryHash}`, cachedCases);

    if (response.data.count === 0) {
      return cachedCases;
    }

    for (const element of response.data.results) {
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

    await DbService.setItem(`cachedCaseImages:${queryHash}`, cachedCases);
    await DbService.setItem(
      `casesImagesUpdated:${queryHash}`,
      moment().toISOString(),
    );
    return cachedCases;
  }

  const response = await axios.get<CachedCaseResponse>(
    `${import.meta.env.VITE_APP_API_BASE_URL}/worksites_images`,
    {
      params: {
        ...query,
      },
    },
  );
  await DbService.setItem(`cachedCaseImages:${queryHash}`, response.data);
  await DbService.setItem(
    `casesImagesUpdated:${queryHash}`,
    moment().toISOString(),
  );
  return response.data;
};

export { loadCasesCached, loadCases, loadCaseImagesCached };
