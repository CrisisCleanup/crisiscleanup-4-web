import { describe, expect, it, vi, beforeEach } from 'vitest';
import { rest } from 'msw';
import { server } from '../../setupTests';

/**
 * Regression probe for issue #1164: `update_phone_number_completion` failed
 * with a CORS error, but the UI still showed the green "Phone number removed
 * from queue." banner. `removeNumberFromQueue` awaits the POST and toasts
 * success with no try/catch, so these specs pin down whether a failed request
 * can reach the success toast.
 */

const { successSpy, errorSpy, warningSpy, infoSpy } = vi.hoisted(() => ({
  successSpy: vi.fn(),
  errorSpy: vi.fn(),
  warningSpy: vi.fn(),
  infoSpy: vi.fn(),
}));

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: successSpy,
    error: errorSpy,
    warning: warningSpy,
    info: infoSpy,
  }),
}));

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('vue-i18n');
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key }),
  };
});

// Plain `{ value }` rather than `ref()`: vi.mock factories hoist above the
// imports. The hook only reads `currentUser?.value?.*`.
vi.mock('@/hooks/useCurrentUser', () => ({
  default: () => ({
    currentUser: { value: { id: 1, languages: [], primary_language: 2 } },
    updateUserStates: vi.fn(),
    userStates: { value: {} },
    userPreferences: { value: {} },
  }),
}));

vi.mock('@/hooks/phone/usePhoneService', () => ({
  default: () => ({
    apiCall: vi.fn(),
    getAgent: vi.fn(),
    changeState: vi.fn(),
  }),
}));

const { default: useConnectFirst } = await import('@/hooks/useConnectFirst');

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
const ENDPOINT = `${BASE_URL}/phone_outbound/update_phone_number_completion`;
const SUCCESS_KEY = 'info.dnis_removed_from_queue';
const PHONE_NUMBER = '5551234567';

describe('hooks > useConnectFirst > removeNumberFromQueue (issue #1164)', () => {
  beforeEach(() => {
    successSpy.mockClear();
    errorSpy.mockClear();
  });

  it('shows the success toast when the request succeeds', async () => {
    server.use(
      rest.post(ENDPOINT, async (req, res, ctx) =>
        res(ctx.status(200), ctx.json({})),
      ),
    );

    const { removeNumberFromQueue } = useConnectFirst({ emit: vi.fn() });
    await removeNumberFromQueue(PHONE_NUMBER);

    expect(successSpy).toHaveBeenCalledWith(SUCCESS_KEY);
  });

  it('does not show the success toast when the request returns a 500', async () => {
    server.use(
      rest.post(ENDPOINT, async (req, res, ctx) => res(ctx.status(500))),
    );

    const { removeNumberFromQueue } = useConnectFirst({ emit: vi.fn() });
    // Swallow rather than assert on rejection: the symptom is the banner, so
    // that check must run either way. Asserting `.rejects` first would mask a
    // regression that both resolves *and* toasts success.
    const outcome = await removeNumberFromQueue(PHONE_NUMBER).then(
      () => 'resolved',
      () => 'rejected',
    );

    expect(successSpy).not.toHaveBeenCalled();
    expect(outcome).toBe('rejected');
  });

  it('does not show the success toast when the request fails at the network layer (CORS)', async () => {
    // res.networkError models a CORS block: no status, rejected promise.
    server.use(
      rest.post(ENDPOINT, (req, res) =>
        res.networkError('Blocked by CORS policy'),
      ),
    );

    const { removeNumberFromQueue } = useConnectFirst({ emit: vi.fn() });
    const outcome = await removeNumberFromQueue(PHONE_NUMBER).then(
      () => 'resolved',
      () => 'rejected',
    );

    expect(successSpy).not.toHaveBeenCalled();
    expect(outcome).toBe('rejected');
  });
});
