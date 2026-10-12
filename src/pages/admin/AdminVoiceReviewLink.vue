<template>
  <Spinner data-testid="testAdminVoiceReviewLink" />
</template>

<script setup lang="ts">
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { callRoute } from '@/hooks/voice/voiceSessions';
import { voiceReviewUrl, type VoiceReview } from '@/hooks/voice/voiceReviews';
import { getErrorMessage } from '@/utils/errors';

// An old link with a review id (/admin/voice_reviews/<id>): find the call of
// the review, then go to its page.
const route = useRoute();
const router = useRouter();
const $toasted = useToast();

onMounted(async () => {
  try {
    const { data } = await axios.get<VoiceReview>(
      voiceReviewUrl(String(route.params.reviewId)),
    );
    await router.replace(callRoute(data.session.id, 'review', 'auditor'));
  } catch (error) {
    $toasted.error(getErrorMessage(error));
    await router.replace({
      name: 'nav.voice_console',
      query: { view: 'auditor' },
    });
  }
});
</script>
