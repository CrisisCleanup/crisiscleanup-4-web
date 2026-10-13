import { AxiosError } from 'axios';

/**
 * Create a case, optionally letting the API check for duplicates first.
 *
 * With `checkDuplicates`, the first request asks the API to check. On a 409
 * (possible duplicate), returned or thrown, the user confirms, and only then
 * is the case created without the check. Returns null when the user cancels.
 */
export async function createWithDuplicateCheck<
  T extends { response?: unknown },
>(
  create: (skipDuplicateCheck: boolean) => Promise<T>,
  checkDuplicates: boolean,
  confirmDuplicate: (error: AxiosError) => Promise<boolean>,
): Promise<T | null> {
  let error: AxiosError;
  try {
    const response = await create(!checkDuplicates);
    if (
      !checkDuplicates ||
      !(response.response instanceof AxiosError) ||
      response.response.response?.status !== 409
    ) {
      return response;
    }
    error = response.response;
  } catch (error_) {
    // The API client throws a 409 rather than returning it.
    if (
      !checkDuplicates ||
      !(error_ instanceof AxiosError) ||
      error_.response?.status !== 409
    ) {
      throw error_;
    }
    error = error_;
  }
  if (!(await confirmDuplicate(error))) {
    return null;
  }
  return create(true);
}
