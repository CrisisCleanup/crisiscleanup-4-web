<template>
  <div class="blog-list p-3">
    <div class="text-4xl mb-6 text-center">{{ '~Crisiscleanup Blog' }}</div>
    <div v-for="post in posts" :key="post.id" class="mb-8">
      <BlogPost :post="post" />
    </div>

    <Pagination
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-changed="fetchPosts"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BlogPost from './BlogPost.vue';
import Pagination from './Pagination.vue';

const POSTS_PER_PAGE = 5;

export default {
  components: {
    BlogPost,
    Pagination,
  },
  setup() {
    const posts = ref([]);
    const currentPage = ref(1);
    const totalPages = ref(0);

    async function fetchPosts(page = 1) {
      const offset = (page - 1) * POSTS_PER_PAGE;
      const response = await axios.get(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/cms?tags=blog&limit=${POSTS_PER_PAGE}&offset=${offset}`,
      );
      posts.value = response.data.results;
      // Assuming the API returns a total count of posts
      totalPages.value = Math.ceil(response.data.count / POSTS_PER_PAGE);
      currentPage.value = page;
    }

    onMounted(() => fetchPosts());

    return {
      posts,
      currentPage,
      totalPages,
      fetchPosts,
    };
  },
};
</script>

<style scoped>
/* ... */
</style>
