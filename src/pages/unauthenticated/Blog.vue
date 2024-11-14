<template>
  <Home no-hotline>
    <div class="blog-list bg-crisiscleanup-light-smoke h-full">
      <div class="h-84 bg-crisiscleanup-dark-500 mb-6 relative">
        <div class="w-full text-center text-white text-4xl py-3">
          {{ $t('blog.crisis_cleanup_blog') }}
        </div>
        <div class="text-white">
          <div
            v-if="
              incidentsWithActiveHotline &&
              incidentsWithActiveHotline.length > 0
            "
            class="grid md:grid-cols-2"
          >
            <router-link
              v-for="incident in incidentsWithActiveHotline"
              :key="incident.id"
              data-testid="testIncidentPhoneDiv"
              class="ml-2 my-2 w-120"
              :to="`/disasters/${incident.id}`"
            >
              <div
                class="bg-primary-light text-black p-3 flex justify-between items-center"
              >
                <div>
                  <span class="font-bold">{{ incident.short_name }}</span
                  >:
                  <span>{{ getIncidentPhoneNumbers(incident) }}</span>
                </div>
                <font-awesome-icon icon="chevron-right" />
              </div>
            </router-link>
          </div>
          <div v-else-if="isLoading">
            <spinner data-testid="testSpinnerLoadingIcon" />
          </div>
        </div>
        <SocialLinks
          class="m-2 p-2 absolute bottom-0 right-0 rounded-md bg-crisiscleanup-smoke opacity-75"
        />
      </div>
      <div v-if="!loading" class="flex mx-auto p-4 justify-evenly gap-5">
        <div class="md:w-2/3 w-full">
          <span class="text-xl opacity-60">{{ $t('blog.latest_posts') }}</span>
          <BlogPosts
            :cms-items="posts"
            item-classes="py-6 cursor-pointer"
            hide-thumbnails
            @on-click="navigateToPost"
          />

          <Pagination
            v-if="totalPages > 1"
            :current-page="currentPage"
            :total-pages="totalPages"
            @page-changed="fetchPosts"
          />
        </div>
        <div class="md:w-1/3 hidden md:block">
          <base-input
            :model-value="searchTerm"
            :placeholder="$t('blog.search_posts')"
            @update:model-value="updateSearchDebounced"
          />

          <div class="sidebar mt-4">
            <div>
              <div class="tags p-3 mb-4 shadow-crisiscleanup-card bg-white">
                <div class="text-lg opacity-50">{{ $t('blog.tags') }}</div>
                <div class="flex gap-2">
                  <tag
                    v-for="tag in availableTags"
                    :key="tag"
                    class="p-1 px-2 text-base cursor-pointer"
                    :class="selectedTags === tag ? 'underline' : ''"
                    @click="
                      () => {
                        if (selectedTags === tag) {
                          $router.push({ query: { tags: undefined } });
                        } else {
                          $router.push({ query: { tags: tag } });
                        }
                      }
                    "
                  >
                    {{ tag }}
                  </tag>
                </div>
              </div>
              <div class="posts-by-date shadow-crisiscleanup-card p-3 bg-white">
                <div class="text-lg opacity-50">
                  {{ $t('blog.posts_by_date') }}
                </div>
                <ul>
                  <li v-for="year in Object.keys(availableYears)" :key="year">
                    <div class="">
                      <font-awesome-icon
                        :icon="
                          yearsExpanded.includes(year)
                            ? 'chevron-down'
                            : 'chevron-right'
                        "
                        :alt="
                          yearsExpanded.includes(year)
                            ? $t('actions.show_options')
                            : $t('actions.hide_options')
                        "
                        size="sm"
                        class="mr-1.5 cursor-pointer"
                        @click="
                          () => {
                            if (yearsExpanded.includes(year)) {
                              yearsExpanded = yearsExpanded.filter(
                                (y) => y !== year,
                              );
                            } else {
                              yearsExpanded.push(year);
                            }
                          }
                        "
                      />
                      <button
                        class="text-base font-bold text-gray-900 dark:text-white"
                        :class="
                          year === selectedYear.toString() ? 'underline' : ''
                        "
                        @click="
                          () => {
                            $router.push({ query: { year } });
                          }
                        "
                      >
                        {{ year }}
                      </button>
                      <div
                        v-if="yearsExpanded.includes(year)"
                        class="gap-2 ml-3"
                      >
                        <router-link
                          v-for="month in Object.keys(availableYears[year])"
                          :key="month"
                          class="block"
                          :to="{
                            query: { year, month },
                          }"
                        >
                          {{ formatMonth(month) }} ({{
                            availableYears[year][month]
                          }})
                        </router-link>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <spinner show-quote />
      </div>
    </div>
  </Home>
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
import Home from '@/layouts/Home.vue';
import moment from 'moment';
import BlogPosts from '@/components/blog/BlogPosts.vue';
import CcuIcon from '@/components/BaseIcon.vue';
import { useActiveHotlines } from '@/hooks/useActiveHotlines';
import { getIncidentPhoneNumbers } from '@/filters';
import SocialLinks from '@/components/SocialLinks.vue';

const POSTS_PER_PAGE = 5;

export default {
  components: {
    SocialLinks,
    CcuIcon,
    BlogPosts,
    Home,
    Spinner,
    BaseInput,
    BlogPost,
    Pagination,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { isLoading, incidentsWithActiveHotline } = useActiveHotlines();
    const posts = ref([]);
    const currentPage = ref(1);
    const totalPages = ref(0);
    const selectedYear = ref(Number(route.query.year));
    const selectedMonth = ref(route.query.month);
    const searchTerm = ref(route.query.search);
    const selectedTags = ref(route.query.tags);
    const availableYears = ref([]);
    const availableTags = ref([]);
    const yearsExpanded = ref([]);
    const loading = ref(false);
    async function loadYears() {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/cms/blog_years_months`,
      );
      availableYears.value = response.data;
    }

    async function loadTags() {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/cms/blog_tags`,
      );
      availableTags.value = response.data.map((t) => t.replaceAll('"', ''));
    }

    function formatMonth(month) {
      return moment().month(month).format('MMMM');
    }

    async function getUsers() {
      await User.api().get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/cms/blog_authors`,
      );
    }

    function navigateToPost(post) {
      router.replace(`/blog/post/${post.slug}`);
    }

    async function fetchPosts(page = 1) {
      loading.value = true;
      let query = `/cms?tags=blog&limit=${POSTS_PER_PAGE}&offset=${
        (page - 1) * POSTS_PER_PAGE
      }`;

      if (selectedYear.value && selectedMonth.value) {
        const startDate = `${selectedYear.value}-${selectedMonth.value}-01`;
        const endDate = `${selectedYear.value}-${selectedMonth.value}-31`;
        query += `&publish_at__gte=${startDate}&publish_at__lte=${endDate}`;
      } else if (selectedYear.value) {
        const startDate = `${selectedYear.value}-01-01`;
        const endDate = `${selectedYear.value}-12-31`;
        query += `&publish_at__gte=${startDate}&publish_at__lte=${endDate}`;
      }

      if (searchTerm.value) {
        query += `&search=${searchTerm.value}`;
      }

      if (selectedTags.value) {
        query += `&tags=${selectedTags.value}`;
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
      () => route.query.month,
      (month) => {
        selectedMonth.value = month;
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

    watch(
      () => route.query.tags,
      (tags) => {
        selectedTags.value = tags;
        fetchPosts();
      },
    );

    onMounted(async () => {
      loading.value = true;
      await loadYears();
      await loadTags();
      await fetchPosts();
      loading.value = false;
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
      formatMonth,
      availableTags,
      navigateToPost,
      yearsExpanded,
      selectedTags,
      isLoading,
      incidentsWithActiveHotline,
    };
  },
  methods: { getIncidentPhoneNumbers },
};
</script>

<style scoped></style>
