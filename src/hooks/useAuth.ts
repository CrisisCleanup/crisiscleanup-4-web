import axios, { type AxiosError } from 'axios';
import { reactive, type Ref } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import {
  createEventHook,
  createSharedComposable,
  useStorage,
} from '@vueuse/core';
import { useAxios } from '@vueuse/integrations/useAxios';
import createDebug from 'debug';
import moment from 'moment';
import { generateRandomString, pkceChallengeFromVerifier } from '@/utils/oauth';
import { getErrorMessage } from '@/utils/errors';

const debug = createDebug('@crisiscleanup:useUser');

export enum AuthStatus {
  INIT = 'INIT',
  ANONYMOUS = 'ANONYMOUS',
  AUTHENTICATED = 'AUTHENTICATED',
  REFRESHING = 'REFRESHING',
  LOGOUT = 'LOGOUT',
}

export interface AuthState {
  accessToken?: string;
  refreshToken?: string;
  userId?: number;
  status: AuthStatus;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface AuthorizeProps {
  challenge: string;
  challengeMethod?: string;
  clientId: string;
  redirectUri?: string;
  state: string;
}

interface AuthorizedToken {
  access_token: string;
  access_token_expiry: string;
  refresh_token: string;
  revoked: undefined | string;
  updated: string;
  created: string;
  user: number;
  application: number;
}

/**
 * Build oauth2 authorization url.
 * @param props Authorize props.
 */
const buildAuthorizeUrl = (props: AuthorizeProps) => {
  const url = new URL(
    '/o/authorize/',
    new URL(import.meta.env.VITE_APP_API_BASE_URL),
  );
  url.search = new URLSearchParams({
    response_type: 'code',
    code_challenge: props.challenge,
    code_challenge_method: props.challengeMethod ?? 'S256',
    client_id: props.clientId,
    redirect_uri: `${window.location.origin}/o/callback`,
    state: props.state,
  }).toString();
  return url.toString();
};

const authStore = () => {
  const authInstance = axios.create({
    baseURL: import.meta.env.VITE_APP_API_BASE_URL,
    withCredentials: true,
  });
  axios.defaults.withCredentials = true;

  // Current user request state
  const usersMeState = useAxios<{ id: number }>(
    '/users/me',
    {
      method: 'GET',
      withCredentials: true,
      baseURL: import.meta.env.VITE_APP_API_BASE_URL,
    },
    authInstance,
    {
      immediate: false,
      resetOnExecute: false,
    },
  );

  // User token state.
  const exchangeState = useAxios<TokenResponse>(
    '/o/token/',
    {
      method: 'POST',
      withCredentials: true,
      baseURL: import.meta.env.VITE_APP_API_BASE_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
    authInstance,
    {
      immediate: false,
      resetOnExecute: false,
    },
  );

  // Authorized tokens state.
  const tokensState = useAxios<{ results: AuthorizedToken[] }>(
    '/authorized_tokens',
    {
      method: 'GET',
      withCredentials: true,
      baseURL: import.meta.env.VITE_APP_API_BASE_URL,
    },
    authInstance,
    {
      immediate: false,
      resetOnExecute: false,
    },
  );

  // Code verifier state.
  const verifierStorage = useStorage('code-verifier', '', localStorage, {
    writeDefaults: true,
    deep: false,
  });

  const route = useRoute();
  const router = useRouter();
  const store = useStore();

  // Initialize auth state.
  const authState = reactive<AuthState>({
    userId: undefined,
    status: AuthStatus.INIT,
  });

  // Hook for current user response object.
  // This is to maintain SRP / enable management of current user state
  // w/o tightly coupling it to authentication state.
  const onCurrentUserHook = createEventHook<{
    id: number;
    [key: string]: unknown;
  }>();

  // React to users/me response.
  watch(
    usersMeState.data,
    async (response) => {
      debug('user me state data: %O', usersMeState.data.value);
      if (response?.id) {
        await onCurrentUserHook.trigger(response);
        authState.userId = response.id;
        if (!authState.accessToken) {
          await tokensState.execute();
        }

        authState.status = AuthStatus.AUTHENTICATED;
      } else {
        authState.userId = undefined;
        authState.status = AuthStatus.ANONYMOUS;
      }
    },
    { flush: 'sync' },
  );

  // Failure to fetch current user.
  whenever(usersMeState.error as Ref<AxiosError>, async (err: AxiosError) => {
    debug('error state: (state: %O) %O', authState, err);

    // todo: refresh
    // if (authState.refreshToken) {
    //   refreshMe();
    //   return;
    // }

    await router.isReady();
    const isAuthLayout = route?.meta?.layout === 'authenticated';
    const shouldForce = ['nav.login', 'nav.dashboard_home'].includes(
      route?.name,
    );

    if (err?.response?.status === 401 && (isAuthLayout || shouldForce)) {
      debug('recv 401; user not authenticated.');
      authState.userId = undefined;
      authState.status = AuthStatus.ANONYMOUS;
      await authorize(route?.path, true);
    }
  });

  const isAuthenticated = computedEager(
    () => authState.status === AuthStatus.AUTHENTICATED,
  );
  const isRefreshing = computedEager(
    () => authState.status === AuthStatus.REFRESHING,
  );

  // readonly current user id ref.
  const currentUserId = toRef(() => authState.userId);
  const currentAccessToken = toRef(() => authState.accessToken);

  // React to auth state changes.
  watch(
    () => authState.status,
    async (newStatus, oldStatus) => {
      debug(
        `Auth changed from %n to %n ${oldStatus} to ${newStatus}.`,
        oldStatus,
        newStatus,
      );

      const movedToAnon =
        newStatus === AuthStatus.ANONYMOUS &&
        oldStatus !== AuthStatus.ANONYMOUS;

      const movedToLogout =
        newStatus === AuthStatus.LOGOUT && oldStatus !== AuthStatus.LOGOUT;

      const logoutToAnon =
        newStatus === AuthStatus.ANONYMOUS && oldStatus === AuthStatus.LOGOUT;

      // * -> LOGOUT
      if (movedToLogout) {
        await doLogout().finally(async () => authorize(route?.path));
        return;
      }

      // LOGOUT -> ANONYMOUS
      if (logoutToAnon) {
        authState.userId = undefined;
        authState.accessToken = undefined;
        authState.refreshToken = undefined;
        authState.userId = undefined;
      }

      // INIT/AUTHENTICATED/REFRESHING -> ANONYMOUS
      if (movedToAnon) {
        await authorize(route?.path);
        return;
      }

      // AUTHENTICATED/INIT -> REFRESHING
      if (
        newStatus === AuthStatus.REFRESHING &&
        oldStatus !== AuthStatus.AUTHENTICATED
      ) {
        // TODO: refresh.
        return getMe();
      }
    },
  );

  // React to token response from exchange.
  watch(exchangeState.data, async (response) => {
    debug('got token response from exchange: %O', response);
    if (response?.access_token) {
      authState.accessToken = response.access_token;
      authState.refreshToken = response.refresh_token;
    }
  });

  // React to token response from session.
  watch(tokensState.data, async (response) => {
    debug('got token response from session: %O', response);
    const token = response?.results?.[0];
    if (token && moment(token.access_token_expiry).isAfter(moment())) {
      authState.accessToken = token.access_token;
      authState.refreshToken = token.refresh_token;
    } else {
      debug('Existing auth tokens expired. Re-authorizing..');
      authState.userId = undefined;
      authState.status = AuthStatus.ANONYMOUS;
      await authorize(route?.path, true);
    }
  });

  // Sync access token to axios header.
  whenever(
    () => authState.accessToken,
    async (newToken) => {
      debug('updating axios header with new token: %O', authState);
      axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    },
  );

  // Sync acl user id.
  whenever(
    () => authState.userId,
    (value) => {
      store.commit('acl/setUserAcl', value);
    },
  );

  // Attempt to fetch current
  const getMe = async () => usersMeState.execute();

  // Refresh token.
  const refreshMe = () => {
    console.log('REFRESHING:', authState);
    authState.status = AuthStatus.REFRESHING;
  };

  // Oauth authorize.
  const authorize = async (from?: string, force?: boolean) => {
    if (usersMeState.isLoading.value && !force) {
      debug('skipping authorize requesting; pending get user.');
      return;
    }

    verifierStorage.value = generateRandomString();
    const challenge = await pkceChallengeFromVerifier(verifierStorage.value);
    const state = from ?? '/dashboard';
    const url = buildAuthorizeUrl({
      clientId: import.meta.env.VITE_APP_CRISISCLEANUP_WEB_CLIENT_ID,
      challenge,
      state,
    });
    window.location.href = url;
  };

  // Exchange authorization code for token.
  const exchange = async (authorizationCode: string) => {
    if (!verifierStorage.value) {
      console.error('Attempting exchange w/o challenge verifier!');
      // redir to login
      throw new Error(
        'Attempted to exchange authorization code w/o a verifier.',
      );
    }

    if (!authorizationCode) {
      throw new Error('Missing authorization code!');
    }

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_APP_CRISISCLEANUP_WEB_CLIENT_ID,
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: `${window.location.origin}/o/callback`,
      code_verifier: verifierStorage.value,
    });

    await exchangeState.execute('/o/token/', {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: params.toString(),
    });
  };

  // Handle logout state.
  const doLogout = async () => {
    try {
      await authInstance.post('/logout/', null, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${authState.accessToken}`,
        },
      });
      if (authState.refreshToken) await doRevokeToken(authState.refreshToken);
      if (authState.accessToken) await doRevokeToken(authState.accessToken);
      authState.status = AuthStatus.ANONYMOUS;
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error));
    }
  };

  // Revoke given token.
  const doRevokeToken = async (token: string) => {
    return authInstance.post(
      '/o/revoke_token/',
      new URLSearchParams({
        token,
        client_id: import.meta.env.VITE_APP_CRISISCLEANUP_WEB_CLIENT_ID,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
  };

  // Move to log out.
  const logout = () => {
    authState.status = AuthStatus.LOGOUT;
  };

  return {
    getMe,
    refreshMe,
    isAuthenticated,
    isRefreshing,
    authorize,
    exchange,
    logout,
    onCurrentUserHook,
    currentUserId,
    currentAccessToken,
  };
};

// Shares states across invocations.
export const useAuthStore = createSharedComposable(authStore);
