import * as Sentry from '@sentry/vue';
import { i18n } from '@/modules/i18n';
import { useToast } from 'vue-toastification';
import { AxiosError } from 'axios';
import createDebug from 'debug';

const debug = createDebug('@ccu:utils:errors');

export function getErrorMessage(error: any): string {
  debug('getErrorMessage %o', error);

  // Capture all errors with Sentry
  Sentry.captureException(error);
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
    } else {
      // Error related to setting up the request
      debug('Fallback network error %o', error);
      return error.message ?? t('info.network_error');
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
