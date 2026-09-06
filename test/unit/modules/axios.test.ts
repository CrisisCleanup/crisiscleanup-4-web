import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios, {
  AxiosError,
  CanceledError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  CONNECTIVITY_TOAST_ID,
  initializeErrorInterceptor,
  isConnectivityError,
} from '@/modules/axios';
import {
  CANCELLED_REQUEST_KEY,
  CONNECTIVITY_ERROR_KEY,
  getErrorMessage,
  isCancelledRequest,
} from '@/utils/errors';

const { errorSpy, warningSpy, dismissSpy } = vi.hoisted(() => ({
  errorSpy: vi.fn(),
  warningSpy: vi.fn(),
  dismissSpy: vi.fn(),
}));

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    error: errorSpy,
    warning: warningSpy,
    success: vi.fn(),
    info: vi.fn(),
    dismiss: dismissSpy,
  }),
}));

/** Reject with an AxiosError carrying a real response (an HTTP error). */
function statusAdapter(status: number) {
  return (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const response = {
      data: { error: 'boom' },
      status,
      statusText: String(status),
      headers: {},
      config,
    } as AxiosResponse;
    return Promise.reject(
      new AxiosError(
        `Request failed with status code ${status}`,
        AxiosError.ERR_BAD_RESPONSE,
        config,
        undefined,
        response,
      ),
    );
  };
}

/** Reject the way axios does when the request never reaches the server. */
function networkAdapter(
  code: string = AxiosError.ERR_NETWORK,
  message = 'Network Error',
) {
  return (config: InternalAxiosRequestConfig): Promise<AxiosResponse> =>
    Promise.reject(new AxiosError(message, code, config, {}));
}

function okAdapter() {
  return (config: InternalAxiosRequestConfig): Promise<AxiosResponse> =>
    Promise.resolve({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    } as AxiosResponse);
}

function makeClient(adapter: AxiosAdapter) {
  const instance = axios.create({ adapter });
  initializeErrorInterceptor(instance);
  return instance;
}

describe('modules > axios > error classification', () => {
  it('treats a cancellation as cancelled, not a connectivity failure', () => {
    const cancelled = new CanceledError('canceled');
    expect(isCancelledRequest(cancelled)).toBe(true);
    expect(isConnectivityError(cancelled)).toBe(false);
  });

  it('treats a response-less axios error as a connectivity failure', () => {
    const offline = new AxiosError('Network Error', AxiosError.ERR_NETWORK);
    expect(isConnectivityError(offline)).toBe(true);
  });

  it('treats a timeout as a connectivity failure', () => {
    const timedOut = new AxiosError(
      'timeout of 5000ms exceeded',
      AxiosError.ECONNABORTED,
    );
    expect(isConnectivityError(timedOut)).toBe(true);
  });

  it('does not treat an HTTP error as a connectivity failure', () => {
    const notFound = new AxiosError(
      'Request failed with status code 404',
      AxiosError.ERR_BAD_RESPONSE,
      undefined,
      undefined,
      { status: 404 } as AxiosResponse,
    );
    expect(isConnectivityError(notFound)).toBe(false);
  });

  it('does not treat a non-axios error as a connectivity failure', () => {
    expect(isConnectivityError(new Error('nope'))).toBe(false);
  });
});

describe('modules > axios > installErrorInterceptor', () => {
  beforeEach(() => {
    errorSpy.mockClear();
    warningSpy.mockClear();
    dismissSpy.mockClear();
  });

  it('shows one sticky, id-stable toast when the request never reaches the server', async () => {
    const client = makeClient(networkAdapter());

    await expect(client.get('/anything')).rejects.toThrow();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(CONNECTIVITY_ERROR_KEY, {
      id: CONNECTIVITY_TOAST_ID,
      timeout: false,
    });
  });

  it('reuses the same toast id across a burst rather than stacking', async () => {
    const client = makeClient(networkAdapter());

    await Promise.allSettled([
      client.get('/a'),
      client.get('/b'),
      client.get('/c'),
    ]);

    const ids = errorSpy.mock.calls.map(
      (call) => (call[1] as { id: string }).id,
    );
    expect(new Set(ids).size).toBe(1);
  });

  it('stays silent for a cancelled request', async () => {
    const client = makeClient(() =>
      Promise.reject(new CanceledError('canceled')),
    );

    await expect(client.get('/aborted')).rejects.toThrow();

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warningSpy).not.toHaveBeenCalled();
  });

  it('warns with the server message for an allowlisted status', async () => {
    const client = makeClient(statusAdapter(400));

    await expect(client.get('/bad-request')).rejects.toThrow();

    expect(warningSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('stays silent for a status the call site owns', async () => {
    const client = makeClient(statusAdapter(404));

    await expect(client.get('/missing')).rejects.toThrow();

    expect(warningSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('rethrows the ORIGINAL AxiosError so callers still reject (issue #1164)', async () => {
    // Two regressions: returning instead of throwing resolves a failed
    // request (#1164), and re-wrapping the error destroys `error.response`,
    // which useAxiosRetry and ~128 catch blocks branch on.
    const cases: Array<[() => AxiosAdapter, number | undefined]> = [
      [networkAdapter, undefined],
      [() => statusAdapter(400), 400],
      [() => statusAdapter(500), 500],
    ];

    for (const [makeAdapter, expectedStatus] of cases) {
      const client = makeClient(makeAdapter());
      const caught: unknown = await client.get('/x').then(
        () => 'DID NOT REJECT',
        (error: unknown) => error,
      );

      expect(caught).toBeInstanceOf(AxiosError);
      expect((caught as AxiosError).response?.status).toBe(expectedStatus);
    }
  });

  it('clears the connectivity notice once a request gets through', async () => {
    let offline = true;
    const client = makeClient((config: InternalAxiosRequestConfig) =>
      offline ? networkAdapter()(config) : okAdapter()(config),
    );

    await expect(client.get('/first')).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledTimes(1);

    offline = false;
    await client.get('/second');

    expect(dismissSpy).toHaveBeenCalledWith(CONNECTIVITY_TOAST_ID);
  });

  it('does not dismiss on success when no notice is standing', async () => {
    const client = makeClient(okAdapter());

    await client.get('/healthy');

    expect(dismissSpy).not.toHaveBeenCalled();
  });
});

describe('utils > errors > response-less messages', () => {
  it('reports a connectivity problem when the request never reached the server', () => {
    const offline = new AxiosError('Network Error', AxiosError.ERR_NETWORK);
    expect(getErrorMessage(offline)).toBe(CONNECTIVITY_ERROR_KEY);
  });

  it('does NOT blame the network for a cancelled request', () => {
    // A CanceledError has no `response` either, so without a guard every
    // unmount would tell the user their internet is down.
    const cancelled = new CanceledError('canceled');
    expect(isCancelledRequest(cancelled)).toBe(true);
    expect(getErrorMessage(cancelled)).toBe(CANCELLED_REQUEST_KEY);
  });
});
