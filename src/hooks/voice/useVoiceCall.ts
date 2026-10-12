/**
 * One call for its page: the console session and, when the call has one,
 * its review. The review id is in the session, so the review loads right
 * after it.
 */
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { getErrorMessage } from '@/utils/errors';
import { voiceReviewUrl, type VoiceReviewWithTranscript } from './voiceReviews';
import { sessionsUrl, type SessionDetail } from './voiceSessions';
import { parseSpeechTurns } from './voiceTranscript';

export function useVoiceCall(sessionId: Ref<number | undefined>) {
  const $toasted = useToast();
  const session = ref<SessionDetail>();
  const review = ref<VoiceReviewWithTranscript>();
  /** The call has a review that did not load. */
  const reviewFailed = ref(false);
  // The call that is shown now; a late answer for another call is dropped.
  let current: number | undefined;

  async function load() {
    const id = sessionId.value;
    if (!id) return;
    if (id !== current) {
      session.value = undefined;
      review.value = undefined;
      reviewFailed.value = false;
      current = id;
    }
    try {
      const { data } = await axios.get<SessionDetail>(sessionsUrl(String(id)));
      if (id !== current) return;
      session.value = data;
      reviewFailed.value = false;
      if (data.review_id) {
        try {
          const found = await axios.get<VoiceReviewWithTranscript>(
            voiceReviewUrl(String(data.review_id)),
          );
          if (id === current) review.value = found.data;
        } catch (error) {
          if (id === current) {
            reviewFailed.value = true;
            $toasted.error(getErrorMessage(error));
          }
        }
      } else {
        review.value = undefined;
      }
    } catch (error) {
      if (id === current) $toasted.error(getErrorMessage(error));
    }
  }

  // The words of the call, with their time in the recording when known.
  const turns = computed(() => {
    const fromSession = session.value?.speech_turns ?? [];
    if (fromSession.length > 0) return fromSession;
    const fromReview = review.value?.speech_turns ?? [];
    if (fromReview.length > 0) return fromReview;
    return parseSpeechTurns(
      session.value?.transcript || review.value?.transcript || '',
    );
  });

  watch(sessionId, load, { immediate: true });

  return { session, review, reviewFailed, turns, load };
}
