import { TYPE, useToast } from 'vue-toastification';
import type { PluginOptions } from 'vue-toastification';
import { CONNECTIVITY_TOAST_ID } from '@/modules/axios';

type FilterBeforeCreate = NonNullable<PluginOptions['filterBeforeCreate']>;

/**
 * Collapse byte-identical error/warning toasts — one outage fails many
 * requests and ~128 call sites each toast the same message. Errors and
 * warnings only, so repeated confirmations still get their own toast.
 */
export const dedupeErrorToasts: FilterBeforeCreate = (incoming, queued) => {
  const isDedupable =
    incoming.type === TYPE.ERROR || incoming.type === TYPE.WARNING;
  if (!isDedupable || typeof incoming.content !== 'string') return incoming;

  // The connectivity notice dedupes by id already. Suppressing it on content
  // would let a copy from an interceptor-less instance block the sticky
  // notice, leaving the user offline with no indication.
  if (incoming.id === CONNECTIVITY_TOAST_ID) return incoming;

  const existing = queued.find(
    (candidate) =>
      candidate.type === incoming.type &&
      candidate.content === incoming.content,
  );
  if (!existing) return incoming;

  // Restart the survivor's timer so a repeated action reads as fresh feedback.
  // Bumping `timeout` resets the progress bar, as vue-toastification's own
  // updateToast does. Sticky toasts have no timer to refresh.
  if (typeof existing.timeout === 'number') {
    useToast().update(existing.id, {
      options: { timeout: existing.timeout + 1 },
    });
  }

  return false;
};

/** Typed rather than cast, so a misspelled option is a compile error. */
export const toastOptions: PluginOptions = {
  timeout: 10_000,
  shareAppContext: true,
  filterBeforeCreate: dedupeErrorToasts,
};
