import { RouterLinkStub, mount } from '@vue/test-utils';
import BaseButton from '@/components/BaseButton.vue';
import VoiceReviewDetail from '@/components/admin/voice/VoiceReviewDetail.vue';
import type { VoiceReviewWithTranscript } from '@/hooks/voice/voiceReviews';

export const reviewPaneGlobal = {
  components: { BaseButton },
  stubs: {
    Spinner: true,
    RouterLink: RouterLinkStub,
    VoiceReviewCaseForm: true,
  },
};

/**
 * The review tab of the call page, with the page's part played by the test:
 * a new review from the API replaces the shown one.
 */
export function mountReviewPane(
  review: object,
  listeners: {
    onReload?: () => void;
    onEvidence?: (text?: string) => void;
  } = {},
  /** A stand-in for the case form, which needs the map and the store. */
  caseForm: unknown = true,
) {
  const wrapper = mount(VoiceReviewDetail, {
    props: {
      review: review as VoiceReviewWithTranscript,
      'onUpdate:review': (next: VoiceReviewWithTranscript) =>
        void wrapper.setProps({ review: next }),
      ...listeners,
    },
    global: {
      ...reviewPaneGlobal,
      stubs: {
        ...reviewPaneGlobal.stubs,
        VoiceReviewCaseForm: caseForm as never,
      },
    },
    attachTo: document.body,
  });
  return wrapper;
}
