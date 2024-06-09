import { describe, expect, test, beforeEach, beforeAll, vi } from 'vitest';
import PasswordResetRequest from '@/models/PasswordResetRequest';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import moment from 'moment';
import type { Store } from 'vuex';

describe('models > PasswordResetRequest', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(PasswordResetRequest);

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
    PasswordResetRequest.deleteAll();
  });

  test('PasswordResetRequest model has the correct entity name', () => {
    expect(PasswordResetRequest.entity).toBe('password_reset_requests');
  });

  test('PasswordResetRequest model has correct default fields', () => {
    const request = new PasswordResetRequest();
    expect(request.id).toBe('');
    expect(request.email).toBe('');
    expect(request.requested_at).toBe(null);
    expect(request.expires_at).toBe(null);
    expect(request.is_expired).toBe(null);
    expect(request.is_valid).toBe(null);
    expect(request.invalid_message).toBe(null);
  });

  test('computed property: requested_at_moment', () => {
    const request = new PasswordResetRequest({
      requested_at: '2023-01-01T00:00:00Z',
    });
    expect(request.requested_at_moment).toBe(
      moment('2023-01-01T00:00:00Z').format('DD/MM/YYYY'),
    );
    const requestWithoutDate = new PasswordResetRequest();
    expect(requestWithoutDate.requested_at_moment).toBe('');
  });

  test('computed property: expires_at_moment', () => {
    const request = new PasswordResetRequest({
      expires_at: '2023-01-01T00:00:00Z',
    });
    expect(request.expires_at_moment).toBe(
      moment('2023-01-01T00:00:00Z').format('DD/MM/YYYY'),
    );
    const requestWithoutDate = new PasswordResetRequest();
    expect(requestWithoutDate.expires_at_moment).toBe('');
  });

  test('api action: reset', async () => {
    const actions = PasswordResetRequest.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.reset('token-id', 'new-password');

    expect(postMock).toHaveBeenCalledWith(
      `/password_reset_requests/token-id/reset`,
      {
        password: 'new-password',
        password_reset_token: 'token-id',
      },
      { save: false },
    );

    postMock.mockRestore();
  });
});
