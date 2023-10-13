<template>
  <main
    v-if="author"
    class="pt-8 pb-16 lg:pt-16 lg:pb-24 bg-white dark:bg-gray-900 antialiased"
  >
    <div class="flex justify-between px-4 mx-auto max-w-screen-xl">
      <article
        class="mx-auto w-full max-w-3xl format format-sm sm:format-base lg:format-lg format-blue dark:format-invert"
      >
        <header class="mb-4 lg:mb-6 not-format">
          <address class="flex items-center mb-6 not-italic">
            <div
              class="inline-flex items-center mr-3 text-sm text-gray-900 dark:text-white"
            >
              <!-- Replace with actual image URL or use default if not present -->
              <img
                class="mr-4 w-16 h-16 rounded-full"
                :src="author.profilePictureUrl"
                alt="Author Image"
              />
              <div>
                <a
                  href="#"
                  rel="author"
                  class="text-xl font-bold text-gray-900 dark:text-white"
                  >{{ author.full_name }}</a
                >
                <p class="text-base text-gray-500 dark:text-gray-400">
                  <time :datetime="formattedDate" :title="formattedDate">{{
                    formattedDate
                  }}</time>
                </p>
              </div>
            </div>
          </address>
          <router-link
            class="mb-4 text-3xl font-extrabold leading-tight text-gray-900 lg:mb-6 lg:text-4xl dark:text-white"
            :to="`/blog/post/${post.id}`"
          >
            {{ formatCmsItem(post.title) }}
          </router-link>
        </header>
        <div v-html="formatCmsItem(post.content)"></div>
      </article>
    </div>
  </main>
</template>

<script lang="ts">
import moment from 'moment';
import User from '@/models/User';
import type { PropType } from 'vue';
import type { CmsItem } from '@/models/types';
import { formatCmsItem } from '@/utils/helpers';

export default {
  props: {
    post: {
      type: Object as PropType<CmsItem>,
      required: true,
    },
  },
  setup(props) {
    const getUser = (id: number) => {
      return User.find(id);
    };

    const formattedDate = computed(() => {
      return moment(props.post.publish_at).format('MMM. D, YYYY');
    });

    const author = computed(() => {
      return getUser(props.post.created_by);
    });

    return {
      getUser,
      formattedDate,
      author,
      formatCmsItem,
    };
  },
};
</script>

<style scoped></style>
