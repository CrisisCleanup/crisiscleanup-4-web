<template>
  <div class="login-with-link-container">
    <div v-if="loading" class="loading"></div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/hooks';

export default defineComponent({
  name: 'MagicLinkLogin',
  setup() {
    const route = useRoute();
    const router = useRouter();

    const loading = ref(true);
    const { loginWithMagicLinkToken } = useAuthStore();

    onMounted(async () => {
      await loginWithMagicLinkToken(route.params.token);
      await router.push('/dashboard');
    });

    return {
      loading,
    };
  },
});
</script>

<style scoped lang="scss">
.login-with-link-container {
  // Your styles here

  .loading {
    // Loading styles
  }

  .error {
    color: red;
  }
}
</style>
