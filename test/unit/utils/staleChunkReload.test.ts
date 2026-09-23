import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { reloadForStaleChunk } from '@/utils/staleChunkReload';

describe('staleChunkReload >> reloadForStaleChunk', () => {
  const reload = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    reload.mockReset();
    vi.useFakeTimers();
    vi.stubGlobal('location', { ...window.location, reload });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('reloads the page once', () => {
    reloadForStaleChunk();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  test('does not reload again within a minute', () => {
    reloadForStaleChunk();
    vi.advanceTimersByTime(30_000);
    reloadForStaleChunk();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  test('reloads again after a minute', () => {
    reloadForStaleChunk();
    vi.advanceTimersByTime(61_000);
    reloadForStaleChunk();
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
