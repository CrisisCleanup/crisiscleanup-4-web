import * as Sentry from '@sentry/vue';
import { i18n } from '@/modules/i18n';
import { useToast } from 'vue-toastification';
import axios, { AxiosError } from 'axios';
import createDebug from 'debug';

const debug = createDebug('@ccu:utils:errors');

const EXPECTED_AXIOS_STATUSES = new Set([400, 403, 404, 409, 422]);

/**
 * Shared with the interceptor in `@/modules/axios`, so a local catch and the
 * global notice produce identical text and dedupe into one toast.
 */
export const CONNECTIVITY_ERROR_KEY =
  '~~Connection problem. Check your internet connection and try again.';

/** Message for a request the caller deliberately aborted. */
export const CANCELLED_REQUEST_KEY = '~~Request cancelled.';

/**
 * A request the caller aborted (unmount, superseded query). `CanceledError`
 * extends `AxiosError` and carries no `response`, so check this before any
 * `!error.response` test or every unmount looks like an outage.
 *
 * Lives here, not in `@/modules/axios`: that module imports this one, and the
 * reverse would be an import cycle.
 */
export function isCancelledRequest(error: unknown): boolean {
  return (
    axios.isCancel(error) ||
    (error instanceof AxiosError && error.code === AxiosError.ERR_CANCELED)
  );
}
const STALE_ASSET_ERROR_PATTERN =
  /preloaderror|failed to fetch dynamically imported module|importing a module script failed|is not a valid javascript mime type|unable to preload css|unexpected token '<'.*<!doctype/i;
const EXPECTED_AXIOS_MESSAGE_PATTERN = /network error|request aborted/i;
const THIRD_PARTY_SNIPPET_ERROR_PATTERN =
  /new .*InboundFilters|InboundFilters|i is undefined/;

export function shouldReportToSentry(error: any): boolean {
  const message = String(error?.message ?? error ?? '');
  if (STALE_ASSET_ERROR_PATTERN.test(message)) return false;
  if (THIRD_PARTY_SNIPPET_ERROR_PATTERN.test(message)) return false;
  if (error instanceof AxiosError) {
    if (error.code === 'ERR_CANCELED') return false;
    if (!error.response && EXPECTED_AXIOS_MESSAGE_PATTERN.test(error.message)) {
      return false;
    }
    const status = error.response?.status;
    if (status && EXPECTED_AXIOS_STATUSES.has(status)) return false;
  }
  return true;
}

export function getErrorMessage(error: any): string {
  debug('getErrorMessage %o', error);

  if (shouldReportToSentry(error)) {
    if (error instanceof AxiosError) {
      Sentry.withScope((scope) => {
        scope.setContext('axios', {
          method: error.config?.method,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          status: error.response?.status,
          responseURL: error.request?.responseURL,
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  }
  const t = i18n.global.t;
  // Handle Axios errors
  if (error instanceof AxiosError) {
    if (error.response) {
      const { data, status } = error.response;
      // Handle specific status codes
      switch (status) {
        case 400: {
          debug('Handling bad request %o', { data, status });
          return handleBadRequest(data);
        }
        case 409: {
          return handleBadRequest(data);
        }
        case 404: {
          return t('info.error_404');
        }
        case 500: {
          return t('info.error_500');
        }
        default: {
          debug('Handling default case %o', { data, status });
          return (
            data?.error ??
            data?.message ??
            error.message ??
            t('info.unknown_error')
          );
        }
      }
    } else if (isCancelledRequest(error)) {
      // An abort, not an outage — don't blame the user's connection.
      debug('Cancelled request %o', error);
      return t(CANCELLED_REQUEST_KEY);
    } else {
      // No response: offline, DNS failure, CORS or timeout. The old
      // `error.message ?? t(...)` never reached its fallback (AxiosError
      // always has a message), so it leaked raw strings like "Network Error".
      debug('Fallback network error %o', error);
      return t(CONNECTIVITY_ERROR_KEY);
    }
  }
  // Fallback for non-Axios errors
  debug('Fallback %o', error);
  return error.message ?? t('info.unknown_error');
}

function handleBadRequest(data: any): string {
  // Assuming 'data.errors' is an array of error objects
  if (data.errors && Array.isArray(data.errors)) {
    return data.errors
      .map((e: any) => {
        const field = e.field === 'non_field_errors' ? '' : `${e.field}: `;
        return `${field}${e.message}`;
      })
      .join('\n');
  }
  if (typeof data === 'string') {
    return data;
  }
  debug('Fallback bad request %o', data);
  return data.error ?? data.message ?? i18n.global.t('info.error_400');
}

export function getAndToastErrorMessage(error: any) {
  const toast = useToast();
  const message = getErrorMessage(error);
  toast.error(message);
  return message;
}

export function getAndToastWarningMessage(error: any) {
  const toast = useToast();
  const message = getErrorMessage(error);
  toast.warning(message);
  return message;
}
