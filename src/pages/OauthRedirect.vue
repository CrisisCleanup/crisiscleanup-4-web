<template>
  <div class="h-screen flex items-center justify-center">
    <spinner show-quote />
  </div>
</template>

<script>
import { useRoute } from 'vue-router';
import Spinner from '@/components/Spinner.vue';
import { useAuthStore } from '@/hooks/useAuth';

export default {
  name: 'OauthRedirect',
  components: { Spinner },
  setup() {
    // todo: handle as route guard
    const router = useRouter();
    const route = useRoute();
    const authStore = useAuthStore();

    if (authStore.isAuthenticated.value) {
      // todo: grab redirect url
      router.push({ name: 'nav.dashboard_no_incident' });
    }

    // authenticated
    watch(
      authStore.isAuthenticated,
      (isAuthed) => {
        console.log('redir is authed watch:', isAuthed);
        if (isAuthed) {
          router.push({
            name: 'nav.dashboard_no_incident',
          });
        }
      },
      { immediate: true, flush: 'sync' },
    );

    const authorizationCode = computedEager(() => route.query.code);

    // exchange
    watch(
      authorizationCode,
      async (code) => {
        console.log('watch code:', code);
        if (!code) return;
        try {
          await authStore.exchange(code);
        } catch (error) {
          const message = error?.message ?? '';
          if (typeof message === 'string' && message.includes('verifier')) {
            // User opened the callback in a different browser/session than
            // the one that started the OAuth flow. Send them back to login.
            router.push({ name: 'nav.login' });
            return;
          }
          throw error;
        }
      },
      { immediate: true, flush: 'sync' },
    );
  },
};
</script>

<style scoped>
.oauth-redirect {
  margin: 20px;
  text-align: center;
}
</style>
