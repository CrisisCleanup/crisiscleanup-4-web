import path from 'node:path';
import { inject } from 'vue';
import type { AxiosRequestConfig, AxiosInstance, AxiosResponse } from 'axios';
import {
  useAxios,
  type UseAxiosOptions,
  type UseAxiosReturn,
} from '@vueuse/integrations/useAxios';

export type UseApiOptions<D = any> = Omit<AxiosRequestConfig<D>, 'baseURL'>;

export interface WrappedUseAxiosReturn<
  T,
  R = AxiosResponse<T>,
  D = any,
  E extends UseAxiosReturn<T, R, D> = UseAxiosReturn<T, R, D>,
> {
  response: E['response'];
  data: E['data'];
  isFinished: E['isFinished'];
  isLoading: E['isLoading'];
  isAborted: E['isAborted'];
  error: E['error'];
  abort: E['abort'];
  // success: E[''];
}

export type UseApiReturn = <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  options: UseApiOptions,
) => WrappedUseAxiosReturn<T, R, D>;

export interface UseApiProps {
  basePath?: string;
  baseUrl?: string;
  instance?: AxiosInstance;
}

/**
 * A wrapper around vueuse/integrations/useAxios hook
 *
 *
 * @example
 * ```ts
 * /////////////////////////////////////////////////////////////
 * // Usage without async/await
 * /////////////////////////////////////////////////////////////
 *
 * const ccuApi = useApi();
 * const {
 *   response: phoneResponse, // Reactive AxiosResponse
 *   data: phoneData, // Reactive AxiosResponse.data
 *   isFinished: phoneIsFinished,
 *   isLoading: phoneIsLoading,
 *   isAborted: phoneIsAborted,
 *   error: phoneError,
 *   abort: phoneAbort, // Method to abort the request
 * } = ccuApi<
 *   PhoneResponse, // AxiosResponse.data type
 * >('/phone/info', { method: 'GET', params: { phone_number: '555-555-5555' } });
 *
 * whenever(phoneIsFinished, () => {
 *   if (phoneIsFinished.value) {
 *     console.log(phoneData.value);
 *   }
 *   if (phoneError.value) {
 *     console.error(phoneError.value);
 *   }
 *   // do something with the response / data
 *   console.log(phoneResponse.value);
 *   console.log(phoneData.value);
 * });
 *
 * /////////////////////////////////////////////////////////////
 * // Usage with async/await using the success method
 * /////////////////////////////////////////////////////////////
 *
 * const ccuApi = useApi();
 * const { success } = ccuApi('/todos/1', {
 *    method: 'GET',
 * });
 * const {
 *   response: todoResponse, // Reactive AxiosResponse
 *   data: todoData, // Reactive AxiosResponse.data
 *   isFinished: todoIsFinished,
 *   isLoading: todoIsLoading,
 *   isAborted: todoIsAborted,
 *   error: todoError,
 *   abort: todoAbort, // Method to abort the request
 * } = await success();
 *
 * // do something with data
 * console.log(todoData.value);
 * ```
 *
 * @see https://vueuse.org/integrations/useAxios/
 * @param props Api options.
 */
export function useApi(props?: UseApiProps) {
  const { basePath, baseUrl = import.meta.env.VITE_APP_API_BASE_URL } =
    props ?? {};
  const axios = inject<AxiosInstance>('axios');
  if (!axios) {
    throw new Error('Cannot inject axios');
  }
  const baseApiUrl = new URL(baseUrl);
  const apiUrl = basePath ? new URL(basePath, baseApiUrl) : baseApiUrl;

  return <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    options?: UseApiOptions,
  ): WrappedUseAxiosReturn<T, R, D> => {
    const axiosConfig = {
        baseURL: apiUrl.toString(),
        ...(options as AxiosRequestConfig),
      },
      r = useAxios<T, R, D>(url, axiosConfig, props?.instance ?? axios);
    return {
      response: r.response,
      data: r.data,
      isFinished: r.isFinished,
      isLoading: r.isLoading,
      isAborted: r.isAborted,
      error: r.error,
      abort: r.abort,
      success: r.then,
    };
  };
}

export default useApi;
