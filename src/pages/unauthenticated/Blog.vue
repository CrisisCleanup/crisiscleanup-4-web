<template>
  <div class="blog-list p-3">
    <div class="text-4xl text-center">{{ '~~Crisiscleanup Blog' }}</div>

    <div class="mb-4 flex gap-2 mt-6 items-center justify-center">
      <button
        class="text-xl font-bold text-gray-900 dark:text-white"
        :class="!selectedYear ? 'underline' : ''"
        @click="
          () => {
            $router.push({ query: { year: null } });
          }
        "
      >
        {{ '~~All' }}
      </button>
      <button
        v-for="year in availableYears"
        :key="year"
        class="text-xl font-bold text-gray-900 dark:text-white"
        :class="year === selectedYear ? 'underline' : ''"
        @click="
          () => {
            $router.push({ query: { year } });
          }
        "
      >
        {{ year }}
      </button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar mb-4 mx-auto max-w-3xl">
      <base-input
        :model-value="searchTerm"
        :placeholder="$t('~~Search Posts')"
        @update:model-value="updateSearchDebounced"
      />
    </div>

    <template v-if="!loading">
      <div v-for="post in posts" :key="post.id" class="mb-8">
        <BlogPost :post="post" />
      </div>

      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-changed="fetchPosts"
      />
    </template>
    <template v-else>
      <spinner show-quote />
    </template>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import BlogPost from '../../components/blog/BlogPostDetail.vue';
import Pagination from '../../components/blog/Pagination.vue';
import User from '@/models/User';
import BaseInput from '@/components/BaseInput.vue';
import debounce from 'lodash/debounce';
import Spinner from '@/components/Spinner.vue';

const POSTS_PER_PAGE = 20;

export default {
  components: {
    Spinner,
    BaseInput,
    BlogPost,
    Pagination,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const posts = ref([]);
    const currentPage = ref(1);
    const totalPages = ref(0);
    const selectedYear = ref(Number(route.query.year));
    const searchTerm = ref(route.query.search);
    const availableYears = ref([]);
    const loading = ref(false);
    async function loadYears() {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/cms/blog_years`,
      );
      availableYears.value = response.data;
    }

    async function getUsers() {
      const userIds = posts.value.map((post) => post.created_by);
      await User.api().get(`/users?id__in=${userIds.join(',')}`, {
        dataKey: 'results',
      });
    }

    async function fetchPosts(page = 1) {
      loading.value = true;
      let query = `/cms?tags=blog&limit=${POSTS_PER_PAGE}&offset=${
        (page - 1) * POSTS_PER_PAGE
      }`;

      if (selectedYear.value) {
        const startDate = `${selectedYear.value}-01-01`;
        const endDate = `${selectedYear.value}-12-31`;
        query += `&publish_at__gte=${startDate}&publish_at__lte=${endDate}`;
      }

      if (searchTerm.value) {
        query += `&search=${searchTerm.value}`;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}${query}`,
      );
      posts.value = response.data.results;
      totalPages.value = Math.ceil(response.data.count / POSTS_PER_PAGE);
      currentPage.value = page;

      await getUsers();
      loading.value = false;
    }

    const updateSearch = async (value) => {
      searchTerm.value = value;
      await fetchPosts();
    };

    const updateSearchDebounced = debounce(updateSearch, 300);

    watch(
      () => route.query.year,
      (year) => {
        selectedYear.value = Number(year);
        fetchPosts();
      },
    );

    watch(
      () => route.query.search,
      (search) => {
        searchTerm.value = search;
        fetchPosts();
      },
    );

    onMounted(async () => {
      await loadYears();
      return fetchPosts();
    });

    return {
      posts,
      currentPage,
      totalPages,
      fetchPosts,
      selectedYear,
      searchTerm,
      availableYears,
      updateSearchDebounced,
      loading,
    };
  },
};
</script>

<style scoped></style>
