import { beforeAll, describe, expect, test, vi } from 'vitest';
import Language from '@/models/Language';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import { createStore } from 'vuex';
import { i18n } from '@/modules/i18n';

describe('models > Language', () => {
  let database: VuexORM.Database;
  let store: ReturnType<typeof createStore>;

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

  test('computed property: shortName', () => {
    // Mock the translation function
    i18n.global.t = (key) => key;

    const language = new Language({ name_t: 'English (United States)' });
    expect(language.shortName).toBe('English');

    const languageSingleWord = new Language({ name_t: 'Español' });
    expect(languageSingleWord.shortName).toBe('Español');
  });

  test('static method: browserLanguage', () => {
    // Set a mock browser language
    const mockBrowserLanguage = 'en-US';
    store.state.entities.languages._browserLanguage = mockBrowserLanguage;

    // Insert some languages
    Language.insert({
      data: [
        { id: '1', subtag: 'en-US', name_t: 'English' },
        { id: '2', subtag: 'es-ES', name_t: 'Español' },
      ],
    });

    const browserLanguage = Language.browserLanguage;
    expect(browserLanguage?.subtag).toBe(mockBrowserLanguage);
  });

  test('api actions: fetchBySubtags', async () => {
    const actions = Language.api();
    const getMock = vi
      .spyOn(actions, 'get')
      .mockImplementation(() => Promise.resolve());

    const subtags = ['en-US', 'es-ES'];

    // Insert an existing language into the store
    Language.insert({
      data: { id: '1', subtag: 'en-US', name_t: 'English' },
    });

    await actions.fetchBySubtags(subtags);

    expect(getMock).toHaveBeenCalledWith('/languages', {
      params: { subtag: 'es-ES' },
      dataKey: 'results',
    });

    getMock.mockRestore();
  });

  test('api actions: translateText', async () => {
    const actions = Language.api();
    const postMock = vi.spyOn(actions, 'post').mockImplementation(
      () =>
        Promise.resolve({
          response: {
            data: {
              text: 'hello',
              translated_text: 'hola',
              source_subtag: 'en',
              target_subtag: 'es',
            },
          },
        }) as any,
    );

    // Mock fetchOrFindId method
    const fetchOrFindIdMock = vi
      .spyOn(Language, 'fetchOrFindId')
      .mockImplementation(() => Promise.resolve({ subtag: 'es' }));

    const result = await actions.translateText(1, 'hello');

    expect(postMock).toHaveBeenCalledWith(
      '/languages/es/translate',
      { text: 'hello' },
      { save: false },
    );

    expect(result.translated_text).toBe('hola');

    postMock.mockRestore();
    fetchOrFindIdMock.mockRestore();
  });
});
