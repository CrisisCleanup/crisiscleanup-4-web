import axios, { type AxiosError } from 'axios';
import { reactive, type Ref } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import {
  createEventHook,
  createSharedComposable,
  until,
  useStorage,
} from '@vueuse/core';
import { logicAnd, logicNot, logicOr } from '@vueuse/math';
import { useAxios } from '@vueuse/integrations/useAxios';
import createDebug from 'debug';
import moment from 'moment';
import { generateRandomString, pkceChallengeFromVerifier } from '@/utils/oauth';
import { getErrorMessage } from '@/utils/errors';
import { useAxiosRetry } from '@/hooks/useAxiosRetry';
import { useToast } from 'vue-toastification';
import { i18n } from '@/modules/i18n';

const debug = createDebug('@ccu:hooks:useAuth');

export enum AuthStatus {
  INIT = 'INIT',
  ANONYMOUS = 'ANONYMOUS',
  AUTHENTICATED = 'AUTHENTICATED',
  REFRESHING = 'REFRESHING',
  INVALID_MAGIC_LINK = 'INVALID_MAGIC_LINK',
  LOGOUT = 'LOGOUT',
}

export interface AuthState {
  accessToken?: string;
  accessTokenExpiry?: moment.Moment;
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

export interface CodeResponse {
  authorization_code: string;
  expires_in: number;
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
  access_token_expiry: moment.Moment;
  refresh_token: string;
  updated: string;
  created: string;
  user: number;
  application: number;
}

interface OtpRequestResponse {
  message: string;
}

interface OtpVerificationResponse {
  accounts: Array<{
    id: number;
    email: string;
    organization: string;
  }>;
  otp_id: number;
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
  const tokenInstance = axios.create({
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
    tokenInstance,
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
      params: {
        client_id: import.meta.env.VITE_APP_CRISISCLEANUP_WEB_CLIENT_ID,
      },
    },
    tokenInstance,
    {
      immediate: true,
      resetOnExecute: false,
    },
  );

  const magicLinkState = useAxios<TokenResponse>(
    '/magic_link/login',
    {
      method: 'POST',
      withCredentials: true,
      baseURL: import.meta.env.VITE_APP_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    },
    tokenInstance,
    {
      immediate: false,
      resetOnExecute: false,
    },
  );

  // Token expiry retry handler.
  useAxiosRetry({
    instance: axios,
    responsePredicate: (error) =>
      error.isAxiosError && error.response?.status === 401,
    retryHandler: () => {
      authState.status = AuthStatus.REFRESHING;
      return until(isAuthenticated)
        .toBe(true)
        .then(() => ({
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        }));
    },
  });

  // Code verifier state.
  const verifierStorage = useStorage('code-verifier', '', localStorage, {
    writeDefaults: false,
    deep: false,
  });

  const route = useRoute();
  const router = useRouter();
  const store = useStore();

  // Initialize auth state.
  const authState = reactive<AuthState>({
    userId: undefined,
    accessToken: undefined,
    refreshToken: undefined,
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
  watch(usersMeState.data, async (response) => {
    debug('user me state data: %O', usersMeState.data.value);
    if (response?.id) {
      await onCurrentUserHook.trigger(response);
      authState.userId = response.id;
    } else {
      authState.userId = undefined;
    }
  });

  // Failure to fetch current user.
  whenever(usersMeState.error as Ref<AxiosError>, async (err: AxiosError) => {
    debug('error state: (state: %O) %O', authState, err);

    await router.isReady();
    const isAuthLayout = route?.meta?.layout === 'authenticated';
    const shouldForce = ['nav.login', 'nav.dashboard_home'].includes(
      route?.name as string,
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
      debug(`Auth changed from %s to %s.`, oldStatus, newStatus);

      const invalidMagicLink = newStatus === AuthStatus.INVALID_MAGIC_LINK;

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

      if (invalidMagicLink) {
        const $toasted = useToast();
        $toasted.error(i18n.global.t('magicLink.invalid_expired_magic_link'));
        return router.push('/magic-link');
      }

      // LOGOUT -> ANONYMOUS
      if (logoutToAnon) {
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
        oldStatus !== AuthStatus.REFRESHING
      ) {
        authState.accessToken = undefined;
        authState.accessTokenExpiry = undefined;
        debug('refreshing token: %O', { ...authState });
        await doRefreshToken().catch((error) =>
          debug('failed to refresh token: %O', error),
        );
        return;
      }
    },
  );

  // React to token response from exchange.
  watch(exchangeState.data, async (response) => {
    debug('got token response from exchange: %O', toValue(response));
    if (response?.access_token) {
      authState.accessToken = response.access_token;
      authState.accessTokenExpiry = moment().add(
        response.expires_in - 100,
        'seconds',
      );
      authState.refreshToken = response.refresh_token;
      debug('set auth state from exchange: %O', { ...authState });
    }
  });

  // React to token response from magic link.
  watch(magicLinkState.data, async (response) => {
    debug('got token response from magic link: %O', toValue(response));
    if (response?.access_token) {
      authState.accessToken = response.access_token;
      authState.accessTokenExpiry = moment().add(
        response.expires_in - 100,
        'seconds',
      );
      authState.refreshToken = response.refresh_token;
      debug('set auth state from magic link: %O', { ...authState });
    }
  });

  // Logout on exchange error.
  whenever(exchangeState.error, async (exchangeError) => {
    debug('exchange failed; logging out. Error: %O', exchangeError);
    authState.status = AuthStatus.LOGOUT;
  });

  whenever(magicLinkState.error, async (exchangeError) => {
    debug('magic link failed;. Error: %O', exchangeError);
    authState.status = AuthStatus.INVALID_MAGIC_LINK;
  });

  // React to token response via session.
  watch(tokensState.data, async (response) => {
    debug('got token response from session: %O', response);
    const token = response?.results?.[0];
    if (token && moment(token.access_token_expiry).isAfter(moment())) {
      authState.refreshToken = token.refresh_token;
      authState.accessTokenExpiry = moment(token.access_token_expiry);
      authState.accessToken = token.access_token;
      debug('set auth state from session: %O', { ...authState });
    }
  });

  // Token states.
  const hasAccessToken = computed(() => Boolean(authState.accessToken));
  const isAccessTokenExpired = computed(() =>
    authState.accessTokenExpiry?.isBefore?.(moment()),
  );

  const hasValidAccessToken = logicAnd(
    hasAccessToken,
    logicNot(isAccessTokenExpired),
  );

  // Current route expects authentication.
  const isAuthenticatedRoute = computed(
    () => router.currentRoute.value?.meta?.layout === 'authenticated',
  );

  // Fetched authorized tokens, but no results found.
  const hasNoAuthorizedTokens = computed(
    () =>
      tokensState.data.value && tokensState.data.value?.results?.length === 0,
  );

  // Current session is not authenticated.
  const isMissingSession = computed(
    () =>
      tokensState.error.value &&
      (tokensState.error as Ref<AxiosError>).value.response?.status === 401,
  );

  // Current state requires authorization.
  const requiresAuthorization = logicAnd(
    isAuthenticatedRoute,
    logicOr(isMissingSession, hasNoAuthorizedTokens),
    logicNot(hasValidAccessToken),
    logicNot(exchangeState.isLoading),
    logicNot(magicLinkState.isLoading),
  );

  /**
   * When:
   *  1.) Current route is using authenticated layout.
   *  2.) Session is either not authorized or has no existing/valid authorized tokens
   *  3.) No current valid access token is known.
   *  4.) Not currently exchanging token.
   *
   *  Then force reauthorize.
   */
  whenever(requiresAuthorization, async () => {
    debug('requires authorization; redirecting to login.');
    await authorize(route?.path, true);
  });

  // Transition to authenticated when we have valid tokens.
  whenever(hasValidAccessToken, () => {
    debug('has valid access token, transitioning to authenticated...');
    authState.status = AuthStatus.AUTHENTICATED;
  });

  // Sync access token to axios header.
  watch(
    () => authState.accessToken,
    async (newToken) => {
      if (newToken) {
        debug('updating axios header with new token: %O', toValue(authState));
        axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        authInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      } else {
        debug('removing axios header token: %O', toValue(authState));
        delete axios.defaults.headers.common.Authorization;
        delete authInstance.defaults.headers.common.Authorization;
      }
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
  const getMe = async () => {
    if (usersMeState.isLoading.value) {
      debug('already fetching current user, skipping request...');
      return;
    }
    await usersMeState
      .execute()
      .catch((error) => debug('failed to getMe: %O', error));
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
      await authInstance.post('/logout/', undefined, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
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

  // Refresh token.
  const doRefreshToken = () => {
    if (!authState.refreshToken) {
      throw new Error('Missing refresh token!');
    }
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_APP_CRISISCLEANUP_WEB_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: authState.refreshToken,
    });
    return exchangeState.execute('/o/token/', {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: params.toString(),
    });
  };

  // Move to log out.
  const logout = () => {
    authState.status = AuthStatus.LOGOUT;
  };

  const requestOtp = async (phoneNumber: string) => {
    const response = await authInstance.post('/otp', {
      phone_number: phoneNumber,
    });
    return response.data as OtpRequestResponse;
  };

  const verifyOtp = async (phoneNumber: string, otp: string) => {
    const response = await authInstance.post('/otp/verify', {
      phone_number: phoneNumber,
      otp: otp,
    });
    return response.data as OtpVerificationResponse;
  };

  const generateAuthCodeWithOtp = async (userId: number, otpId: number) => {
    const response = await authInstance.post('/otp/generate_code', {
      user: userId,
      otp_id: otpId,
    });
    return response.data as CodeResponse;
  };

  const loginWithOtp = async (phoneNumber: string, otp: string) => {
    const verifyResponse = await verifyOtp(phoneNumber, otp);
    if (!verifyResponse.otp_id) {
      throw new Error('OTP verification failed.');
    }
    const codeResponse = await generateAuthCodeWithOtp(
      verifyResponse.accounts[0].id,
      verifyResponse.otp_id,
    );
    if (!codeResponse.authorization_code) {
      throw new Error('Failed to generate code with OTP.');
    }
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_APP_CRISISCLEANUP_WEB_CLIENT_ID,
      grant_type: 'authorization_code',
      code: codeResponse.authorization_code,
      redirect_uri: `${window.location.origin}/o/callback`,
      // code_verifier: verifierStorage.value,
    });

    await exchangeState.execute('/o/token/', {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: params.toString(),
    });
  };

  const loginWithMagicLinkToken = async (token: string, logout = false) => {
    if (logout) {
      await authInstance.post('/logout/', undefined, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    }
    return magicLinkState.execute(`/magic_link/${token}/login`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  return {
    getMe,
    isLoadingMe: usersMeState.isLoading,
    isAuthenticated,
    isRefreshing,
    authorize,
    exchange,
    logout,
    onCurrentUserHook,
    currentUserId,
    currentAccessToken,
    loginWithMagicLinkToken,
    requestOtp,
    loginWithOtp,
  };
};

// Shares states across invocations.
export const useAuthStore = createSharedComposable(authStore);
