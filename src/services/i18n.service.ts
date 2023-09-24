import moment from 'moment';
import { StorageService } from './storage.service';
import type {
  LanguagesResponse,
  LocalizationsCountResponse,
} from '@/models/types';

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

const i18nService = {
  async getLanguage(subtag: string) {
    const cachedLocalizations = StorageService.getItem<LanguagesResponse>(
      `cachedLocalizations:${subtag}`,
    );
    const localizationsUpdated = StorageService.getItem<string>(
      `localizationsUpdated:${subtag}`,
    );
    if (cachedLocalizations) {
      const response = await fetch(
        `${BASE_URL}/localizations/count?updated_at__gt=${localizationsUpdated}`,
      );
      const data = (await response.json()) as LocalizationsCountResponse;
      if (data.count === 0) {
        return cachedLocalizations;
      }
    }

    const localizations = await this.getLocalizations(subtag);
    StorageService.setItem(`cachedLocalizations:${subtag}`, localizations);
    StorageService.setItem(
      `localizationsUpdated:${subtag}`,
      moment().toISOString(),
    );
    return localizations;
  },
  async getLocalizations(subtag: string) {
    const url = new URL(`${BASE_URL}/languages/${subtag}`);

    return fetch(url, {
      method: 'get',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
      },
    })
      .then<LanguagesResponse>(async (resp) => resp.json())
      .then((data) => data);
  },
};

export { i18nService };
