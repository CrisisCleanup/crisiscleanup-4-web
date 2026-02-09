import { ref, readonly } from 'vue';
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import defu from 'defu';
import createDebug from 'debug';
import { getErrorMessage } from '@/utils/errors';

const debug = createDebug('@ccu:hooks:useAxiosRetry');

/**
 * Axios retry hook props.
 */
export interface AxiosRetryProps<T = unknown> {
  /**
   * Optional axios instance.
   * @default axios
   */
  instance?: AxiosInstance;
  /**
   * Predicate for response interceptor.
   * @param error interceptor response.
   */
  responsePredicate: (error: AxiosError<T>) => boolean;
  /**
   * Handler for processing retries.
   *
   * @remarks
   * This handler is guaranteed to only be executed for the first response that passes the predicate.
   * All subsequent responses will be subscribed to the resolution of the first execution.
   * Once resolved, the subscribers queue will be flushed and have the resolved partial axios request config
   * deeply merged with its original config.
   *
   * @param error interceptor response.
   */
  retryHandler: (error: AxiosError<T>) => Promise<Partial<AxiosRequestConfig>>;
}

/**
 * Hook to enqueue and retry modified axios requests.
 * @param props retry options.
 */
export const useAxiosRetry = <T = unknown>(props: AxiosRetryProps<T>) => {
  const { instance = axios, responsePredicate, retryHandler } = props;
  const processing = ref(false);
  const subscribers = ref<
    Array<(retryConfig?: Partial<AxiosRequestConfig>) => unknown>
  >([]);

  const interceptorId = instance.interceptors.response.use(
    undefined,
    (error: AxiosError<T>) => {
      if (!responsePredicate(error)) throw error;
      debug('intercepted response: %O', error);
      // if not processing yet, invoke handler
      if (!processing.value) {
        processing.value = true;
        // Not sure what eslints deal is here, it's cleary being caught.
        // eslint-disable-next-line promise/catch-or-return
        retryHandler(error)
          .then(async (retryConfig) =>
            Promise.allSettled(
              subscribers.value.map((cb) => cb(retryConfig)),
            ).catch((error_) => getErrorMessage(error_)),
          )
          .catch((error) => {
            console.error(error);
            getErrorMessage(error);
          })
          .finally(() => {
            debug('finalizing retry subscribers:', subscribers.value);
            processing.value = false;
            subscribers.value = [];
          });
      }
      // add retry subscriber
      return new Promise((resolve) => {
        subscribers.value.push((retryConfig?: Partial<AxiosRequestConfig>) =>
          resolve(
            instance(defu(retryConfig, error.config!) as AxiosRequestConfig),
          ),
        );
      });
    },
    { synchronous: true },
  );

  return {
    interceptorId,
    processing: readonly(processing),
    subscribers: readonly(subscribers),
  };
};
