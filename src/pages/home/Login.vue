<template>
  <div class="h-screen flex items-center justify-center">
    <spinner show-quote />
  </div>
</template>

<script lang="ts">
import { onBeforeRouteUpdate, useRouter } from 'vue-router';
import { useAuthStore } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner.vue';

export default defineComponent({
  name: 'Login',
  components: { Spinner },
  setup() {
    // todo: handle as route guard
    const router = useRouter();

    const authStore = useAuthStore();

    const onAuthStateChange = async () => {
      if (authStore.isAuthenticated.value) {
        await router.push({
          name: 'nav.dashboard_no_incident',
        });
      } else if (!authStore.isLoadingMe.value) {
        await router.replace({ path: '/' });
      }
    };

    watchEffect(onAuthStateChange);
    onBeforeRouteUpdate(onAuthStateChange);
  },
});
</script>

<style scoped></style>
