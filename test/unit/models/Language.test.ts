import { beforeAll, describe, expect, test } from 'vitest';
import Language from '@/models/Language';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import detectBrowserLanguage from 'detect-browser-language';
import _ from 'lodash';
import { i18n } from '@/modules/i18n';
import type { Store } from 'vuex';

describe('models > Language', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(Language);
    VuexORM.use(VuexORMAxios, {
      axios,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      baseURL: `${import.meta.env.VITE_APP_API_BASE_URL}`,
    });
    store = createStore({
      plugins: [VuexORM.install(database)],
    });
  });

  beforeEach(() => {
    // Clear the store before each test
    Language.deleteAll();
  });

  test('has valid resource name', () => {
    expect(Language.entity).toMatch('languages');
  });

  test('has correct default fields', () => {
    const language = new Language();
    expect(language.id).toBe('');
    expect(language.subtag).toBe(null);
    expect(language.name_t).toBe(null);
  });

  test('has correct state', () => {
    const state = Language.state();
    expect(state._browserLanguage).toBe(detectBrowserLanguage());
  });

  test('computed property: browserLanguage', () => {
    const browserLanguage = detectBrowserLanguage();
    Language.insert({
      data: { id: '1', subtag: browserLanguage, name_t: 'English' },
    });
    expect(Language.browserLanguage?.name_t).toBe('English');
  });

  test('method: fetchBySubtags', async () => {
    const getMock = vi.spyOn(Language.api(), 'get').mockImplementation(() =>
      Promise.resolve({
        response: {
          data: {
            results: [{ id: '2', subtag: 'es', name_t: 'Spanish' }],
          },
        },
      }),
    );

    Language.insert({ data: { id: '1', subtag: 'en', name_t: 'English' } });

    const languages = await Language.fetchBySubtags(['en', 'es']);
    expect(languages.length).toBe(2);
    expect(languages[0]?.name_t).toBe('English');
    expect(languages[1]?.name_t).toBe('Spanish');

    expect(getMock).toHaveBeenCalledWith('/languages', {
      params: { subtag: 'es' },
      dataKey: 'results',
    });

    getMock.mockRestore();
  });

  test('method: translateText', async () => {
    const postMock = vi.spyOn(Language.api(), 'post').mockImplementation(() =>
      Promise.resolve({
        response: {
          data: {
            text: 'Hello',
            translated_text: 'Hola',
            source_subtag: 'en',
            target_subtag: 'es',
          },
        },
      }),
    );

    Language.insert({ data: { id: '1', subtag: 'es', name_t: 'Spanish' } });

    const translation = await Language.translateText(1, 'Hello');
    expect(translation.translated_text).toBe('Hola');

    expect(postMock).toHaveBeenCalledWith(
      '/languages/es/translate',
      { text: 'Hello' },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('computed property: shortName', () => {
    i18n.global.t = (key) => key; // Mock translation function
    const language = new Language({ name_t: 'language.english' });
    expect(language.shortName).toBe('language.english');
  });
});
