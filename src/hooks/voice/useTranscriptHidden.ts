/** Whether the reviewer hid the raw transcript on the Review tab. */
const KEY = 'voiceReviewTranscriptHidden';

function read() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function useTranscriptHidden() {
  const hidden = ref(read());
  watch(hidden, (value: boolean) => {
    try {
      if (value) localStorage.setItem(KEY, '1');
      else localStorage.removeItem(KEY);
    } catch {
      // The choice still holds until the page closes.
    }
  });
  return hidden;
}
