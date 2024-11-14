<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import BlogPostDetail from '@/components/blog/BlogPostDetail.vue';
import User from '@/models/User';
import axios from 'axios';
import type { CmsItem } from '@/models/types';
import Spinner from '@/components/Spinner.vue';

export default defineComponent({
  name: 'BlogPost',
  components: { Spinner, BlogPostDetail },
  setup() {
    const route = useRoute();
    const post = ref<CmsItem | undefined>(undefined);
    const postId = computed(() => route.params.id);
    const nextPost = ref<CmsItem | undefined>(undefined);
    const previousPost = ref<CmsItem | undefined>(undefined);

    async function fetchPost() {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/cms/${postId.value}`,
      );
      post.value = response.data;
    }

    async function fetchPreviousAndNextPosts() {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/cms/${post?.value?.id}/get_next_and_previous_blog_posts`,
      );
      nextPost.value = response.data.next;
      previousPost.value = response.data.previous;
    }

    async function getUser() {
      await User.api().get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/cms/blog_authors`,
      );
    }

    async function loadPost() {
      await fetchPost();
      await fetchPreviousAndNextPosts();
      await getUser();
      document.title = post.value?.title || document.title;
    }

    onMounted(async () => {
      await loadPost();
    });

    watch(
      () => route.params.id,
      () => {
        loadPost();
      },
    );

    return {
      post,
      nextPost,
      previousPost,
    };
  },
});
</script>

<template>
  <BlogPostDetail
    v-if="post"
    :key="post.id"
    :post="post"
    :next-post="nextPost"
    :previous-post="previousPost"
  />
  <Spinner v-else />
</template>

<style scoped></style>
