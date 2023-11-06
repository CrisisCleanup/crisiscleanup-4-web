<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import BlogPostDetail from '@/components/blog/BlogPostDetail.vue';
import User from '@/models/User';
import axios from 'axios';

export default defineComponent({
  name: 'BlogPost',
  components: { BlogPostDetail },
  setup() {
    const route = useRoute();
    const post = ref({});
    const postId = computed(() => route.params.id);

    async function fetchPost() {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/cms/${postId.value}`,
      );
      post.value = response.data;
    }

    async function getUser() {
      await User.api().get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/cms/blog_authors`,
      );
    }

    onMounted(async () => {
      await fetchPost();
      await getUser();
      document.title = post.value?.title || document.title;
    });

    return {
      post,
    };
  },
});
</script>

<template>
  <BlogPostDetail :post="post" />
  <div id="commento"></div>
</template>

<style scoped></style>
