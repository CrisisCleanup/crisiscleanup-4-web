import { AxiosError } from 'axios';
import { describe, expect, test } from 'vitest';
import { shouldReportToSentry } from '@/utils/errors';

function axiosError(message: string, status?: number) {
  return new AxiosError(
    message,
    undefined,
    {} as any,
    undefined,
    status
      ? ({
          status,
          data: {},
          statusText: '',
          headers: {},
          config: {} as any,
        } as any)
      : undefined,
  );
}

describe('utils > errors', () => {
  test('does not report expected axios client noise', () => {
    expect(shouldReportToSentry(axiosError('Network Error'))).toBe(false);
    expect(shouldReportToSentry(axiosError('Request aborted'))).toBe(false);
    expect(shouldReportToSentry(axiosError('not found', 404))).toBe(false);
  });

  test('reports server errors', () => {
    expect(shouldReportToSentry(axiosError('server failed', 500))).toBe(true);
  });

  test('does not report stale asset and third-party snippet errors', () => {
    expect(
      shouldReportToSentry(
        new Error('Unable to preload CSS for /assets/DashboardFooter.css'),
      ),
    ).toBe(false);
    expect(
      shouldReportToSentry(
        new Error('Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON'),
      ),
    ).toBe(false);
    expect(
      shouldReportToSentry(
        new Error(
          "undefined is not an object (evaluating 'new i.InboundFilters')",
        ),
      ),
    ).toBe(false);
  });
});
