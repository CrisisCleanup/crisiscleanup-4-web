import axios from 'axios';
import size from 'lodash/size';
import moment from 'moment/moment';
import detectBrowserLanguage from 'detect-browser-language';
import { i18nService } from '@/services/i18n.service';
import { i18n } from '@/main';
import { store } from '@/store';
import Language from '@/models/Language';
import { useCurrentUser } from '@/hooks/index';
import type { CCUApiListResponse } from '@/models/types';
import { getApiUrl } from '@/utils/helpers';

export default function useSetupLanguage() {
  return {
    async setupLanguage() {
      const { setLocaleMessage, locale } = i18n.global;
      let currentLanguage: string;
      const { currentUser } = useCurrentUser();
      if (
        currentUser?.value?.primary_language ||
        currentUser?.value?.secondary_language
      ) {
        const userLanguage =
          Language.find(currentUser.value?.primary_language) ||
          Language.find(currentUser.value?.secondary_language);

        currentLanguage = detectBrowserLanguage();
        if (userLanguage) {
          currentLanguage = userLanguage.subtag;
        }
      } else {
        currentLanguage = detectBrowserLanguage();
      }

      try {
        const response = await axios.get<
          CCUApiListResponse<{
            id: string;
            name_t: string;
            subtag: string;
          }>
        >(getApiUrl('/languages'));

        const _availableLanguages = response?.data?.results ?? [];

        const availableLanguages = new Set(
          _availableLanguages.map((l) => l.subtag),
        );
        const defaultLanguages = {
          en: 'en-US',
          es: 'es',
          fr: 'fr',
          ar: 'ar',
        };
        // Check if current language is available, if not, set to default
        for (const [key, value] of Object.entries(defaultLanguages)) {
          if (
            currentLanguage.startsWith(key) &&
            !availableLanguages.has(currentLanguage)
          ) {
            currentLanguage = value;
            break;
          }
        }
      } catch (error) {
        console.log(error);
      }

      store.commit('locale/setLanguage', currentLanguage);
      if (currentLanguage) {
        try {
          const data = await i18nService.getLanguage(currentLanguage);
          const { translations } = data;
          if (size(translations) > 0) {
            setLocaleMessage(currentLanguage, translations);
            locale.value = currentLanguage;
            axios.defaults.headers.common['Accept-Language'] = currentLanguage;
            const htmlHtmlElement = document.querySelector('html');
            if (htmlHtmlElement) {
              htmlHtmlElement.setAttribute('lang', currentLanguage);
            }
          }
        } catch {
          // $log.error(e);
        }

        moment.locale(currentLanguage.split('-')[0]);
      }

      moment.locale(currentLanguage.split('-')[0]);
    },
  };
}
