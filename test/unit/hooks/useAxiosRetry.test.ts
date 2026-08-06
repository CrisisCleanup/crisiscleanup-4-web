import { describe, expect, it, vi } from 'vitest';
import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAxiosRetry } from '@/hooks/useAxiosRetry';

/**
 * Build an axios adapter that rejects with a 401 for the first
 * `failures` calls, then resolves with a 200.
 */
function makeAdapter(failures: number) {
  const calls: InternalAxiosRequestConfig[] = [];
  const adapter = (
    config: InternalAxiosRequestConfig,
  ): Promise<AxiosResponse> => {
    calls.push(config);
    if (calls.length <= failures) {
      const response = {
        data: { error: 'unauthorized' },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      } as AxiosResponse;
      return Promise.reject(
        new AxiosError(
          'Request failed with status code 401',
          AxiosError.ERR_BAD_REQUEST,
          config,
          undefined,
          response,
        ),
      );
    }
    return Promise.resolve({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    } as AxiosResponse);
  };
  return { adapter, calls };
}

const is401 = (error: AxiosError) => error.response?.status === 401;

describe('useAxiosRetry', () => {
  it('retries a failed request with the handler config and succeeds', async () => {
    const { adapter, calls } = makeAdapter(1);
    const instance = axios.create({ adapter });
    const retryHandler = vi
      .fn()
      .mockResolvedValue({ headers: { Authorization: 'Bearer fresh' } });
    useAxiosRetry({ instance, responsePredicate: is401, retryHandler });

    const response = await instance.get('/zendesk/search/count.json');

    expect(response.status).toBe(200);
    expect(retryHandler).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(2);
    expect(calls[1].headers.Authorization).toBe('Bearer fresh');
  });

  it('stops after one retry by default when the request keeps failing', async () => {
    const { adapter, calls } = makeAdapter(Number.POSITIVE_INFINITY);
    const instance = axios.create({ adapter });
    const retryHandler = vi.fn().mockResolvedValue({});
    useAxiosRetry({ instance, responsePredicate: is401, retryHandler });

    await expect(instance.get('/zendesk/search/count.json')).rejects.toThrow(
      'Request failed with status code 401',
    );
    expect(retryHandler).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(2);
  });

  it('honors a custom maxRetries', async () => {
    const { adapter, calls } = makeAdapter(Number.POSITIVE_INFINITY);
    const instance = axios.create({ adapter });
    const retryHandler = vi.fn().mockResolvedValue({});
    useAxiosRetry({
      instance,
      responsePredicate: is401,
      retryHandler,
      maxRetries: 3,
    });

    await expect(instance.get('/x')).rejects.toThrow(
      'Request failed with status code 401',
    );
    expect(calls).toHaveLength(4);
  });

  it('settles queued requests when the retry handler fails', async () => {
    const { adapter, calls } = makeAdapter(Number.POSITIVE_INFINITY);
    const instance = axios.create({ adapter });
    const retryHandler = vi.fn().mockRejectedValue(new Error('refresh failed'));
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    useAxiosRetry({ instance, responsePredicate: is401, retryHandler });

    await expect(instance.get('/x')).rejects.toThrow(
      'Request failed with status code 401',
    );
    expect(retryHandler).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(2);
    consoleError.mockRestore();
  });

  it('rethrows errors that do not match the predicate without retrying', async () => {
    const { adapter, calls } = makeAdapter(Number.POSITIVE_INFINITY);
    const instance = axios.create({ adapter });
    const retryHandler = vi.fn().mockResolvedValue({});
    useAxiosRetry({
      instance,
      responsePredicate: (error) => error.response?.status === 503,
      retryHandler,
    });

    await expect(instance.get('/x')).rejects.toThrow(
      'Request failed with status code 401',
    );
    expect(retryHandler).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
  });
});
