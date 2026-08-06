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
  /**
   * Max times a single request is retried before its error is rethrown.
   *
   * @remarks
   * Guards against retry loops when a response passes the predicate for
   * reasons the retry handler cannot fix (e.g. an upstream service
   * returning 401 regardless of our credentials).
   * @default 1
   */
  maxRetries?: number;
}

interface RetryableRequestConfig extends AxiosRequestConfig {
  /** Number of times this request has already been retried. */
  __retryCount?: number;
}

/**
 * Hook to enqueue and retry modified axios requests.
 * @param props retry options.
 */
export const useAxiosRetry = <T = unknown>(props: AxiosRetryProps<T>) => {
  const {
    instance = axios,
    responsePredicate,
    retryHandler,
    maxRetries = 1,
  } = props;
  const processing = ref(false);
  const subscribers = ref<
    Array<(retryConfig?: Partial<AxiosRequestConfig>) => unknown>
  >([]);

  const interceptorId = instance.interceptors.response.use(
    undefined,
    (error: AxiosError<T>) => {
      if (!responsePredicate(error)) throw error;
      const retryCount =
        (error.config as RetryableRequestConfig)?.__retryCount ?? 0;
      if (retryCount >= maxRetries) {
        debug('retry limit reached (%d); rethrowing: %O', retryCount, error);
        throw error;
      }
      debug('intercepted response: %O', error);
      // if not processing yet, invoke handler
      if (!processing.value) {
        processing.value = true;
        const flush = (retryConfig?: Partial<AxiosRequestConfig>) => {
          // Snapshot and reset synchronously, before dispatching retries:
          // a retry that fails re-enters this interceptor, and must start a
          // new cycle rather than be queued and dropped by the reset.
          const pending = subscribers.value;
          subscribers.value = [];
          processing.value = false;
          debug('flushing %d retry subscribers', pending.length);
          for (const cb of pending) cb(retryConfig);
        };
        retryHandler(error)
          .then((retryConfig) => flush(retryConfig))
          .catch((handlerError) => {
            console.error(handlerError);
            getErrorMessage(handlerError);
            // Still flush so queued requests settle (bounded by maxRetries)
            // instead of hanging forever.
            flush();
          });
      }
      // add retry subscriber
      return new Promise((resolve) => {
        subscribers.value.push((retryConfig?: Partial<AxiosRequestConfig>) => {
          const config = defu(
            retryConfig,
            error.config!,
          ) as RetryableRequestConfig;
          config.__retryCount = retryCount + 1;
          resolve(instance(config));
        });
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
