<template>
  <div class="h-screen flex items-center justify-center">
    <spinner show-quote />
  </div>
</template>

<script lang="ts">
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner.vue';

export default defineComponent({
  name: 'Login',
  components: { Spinner },
  setup() {
    // todo: handle as route guard
    const router = useRouter();

    const authStore = useAuthStore();
    authStore.getMe();

    if (authStore.currentUser.value) {
      router.push({ name: 'nav.dashboard_no_incident' });
    }

    // authenticated
    watch(
      () => authStore.currentUser,
      async (newUser) => {
        console.log(authStore.currentUser.value);
        console.log(newUser);
        if (newUser) {
          await router.push({
            name: 'nav.dashboard_no_incident',
          });
        }
      },
      {
        immediate: true,
        flush: 'sync',
      },
    );

  },
});
</script>

<style scoped></style>
