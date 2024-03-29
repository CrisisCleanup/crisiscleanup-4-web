import * as Sentry from '@sentry/vue';
import { i18n } from '@/modules/i18n';
import { useToast } from 'vue-toastification';

export function getErrorMessage(error: any) {
  Sentry.captureException(error);
  const t = i18n.global.t;
  if (!error.response || !error.response.status) {
    return t('info.unknown_error');
  }
  if (error.response.status === 404) {
    return t('info.error_404');
  }
  if (error.response.status === 500) {
    // capture 500s
    Sentry.captureException(error);
    return t('info.error_500');
  }

  const _errors = error.response.data.errors as Array<Record<string, string>>;
  const message = Array.isArray(_errors[0])
    ? _errors[0].message[0]
    : _errors[0].message;

  if (error.response.status === 400) {
    // Show the error field, unless it is 'non_field_errors'
    let response = '';
    for (const e of _errors) {
      let { field } = e;
      field = field === 'non_field_errors' ? '' : `${field}: `;
      response = `${response}${field}${e.message}`;
    }

    return response;
  }

  return message;
}

export function getAndToastErrorMessage(error: any) {
  const toast = useToast();
  const message = getErrorMessage(error);
  toast.error(message);
  return message;
}
