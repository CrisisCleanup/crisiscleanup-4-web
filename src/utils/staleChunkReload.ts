const CHUNK_RELOAD_KEY = 'ccu:chunk-reload';
// A chunk that keeps failing after a reload must not reload the page forever.
const MIN_RELOAD_INTERVAL_MS = 60_000;

/**
 * Reload the page to get the chunks of a new deploy, at most once a minute.
 */
export function reloadForStaleChunk(): void {
  const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY));
  if (Date.now() - lastReloadAt < MIN_RELOAD_INTERVAL_MS) return;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  window.location.reload();
}
