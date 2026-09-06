import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { useToast } from 'vue-toastification';
import { i18n } from '@/modules/i18n';
import {
  CONNECTIVITY_ERROR_KEY,
  getAndToastWarningMessage,
  isCancelledRequest,
} from '@/utils/errors';

/** Statuses whose response body carries a message worth showing inline. */
const WARNING_TOAST_STATUSES = new Set([400, 408, 409, 422, 502]);

/** Shared id, so a burst of failures replaces one toast instead of stacking N. */
export const CONNECTIVITY_TOAST_ID = 'ccu:connectivity-lost';

/** A request that never got a response: offline, DNS failure, CORS or timeout. */
export function isConnectivityError(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false;
  if (isCancelledRequest(error)) return false;
  return !error.response;
}

/**
 * Initialize the shared response interceptor: server messages for
 * {@link WARNING_TOAST_STATUSES}, plus a self-clearing notice when the network
 * is down. Always rethrows — returning would resolve the promise and make
 * callers think a failed request succeeded (issue #1164).
 *
 * @returns the interceptor id, so callers and tests can eject it.
 */
export function initializeErrorInterceptor(
  instance: AxiosInstance = axios,
): number {
  // Per install, so each instance (and each test) tracks its own notice.
  let connectivityNoticeVisible = false;

  return instance.interceptors.response.use(
    (response) => {
      // If the connectivity notice is visible, dismiss it
      // because a request has succeeded.
      if (connectivityNoticeVisible) {
        connectivityNoticeVisible = false;
        useToast().dismiss(CONNECTIVITY_TOAST_ID);
      }
      return response;
    },
    (error) => {
      if (
        error instanceof AxiosError &&
        WARNING_TOAST_STATUSES.has(error.response?.status as number)
      ) {
        getAndToastWarningMessage(error);
      } else if (isConnectivityError(error)) {
        connectivityNoticeVisible = true;
        // Not via `getErrorMessage`: that reports to Sentry, and timeouts
        // aren't filtered there, so slow networks would flood it.
        useToast().error(i18n.global.t(CONNECTIVITY_ERROR_KEY), {
          id: CONNECTIVITY_TOAST_ID,
          // Sticky: an outage is a standing condition. Cleared above on the
          // first request that gets through.
          timeout: false,
        });
      }

      throw error;
    },
  );
}
