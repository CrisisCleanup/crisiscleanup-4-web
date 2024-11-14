<template>
  <main
    v-if="author"
    class="bg-crisiscleanup-light-smoke antialiased flex flex-col h-max min-h-screen"
  >
    <div class="mx-auto bg-crisiscleanup-light-smoke flex-grow">
      <article
        class="pt-8 px-4 mx-auto w-full max-w-4xl format format-sm sm:format-base lg:format-lg format-blue dark:format-invert"
      >
        <router-link
          to="/blog"
          class="underline text-crisiscleanup-dark-blue text-lg font-semibold block mb-3"
        >
          {{ $t('blog.back_to_home') }}
        </router-link>
        <div class="mb-4 mb-6 not-format bg-auto">
          <router-link
            class="mb-6 text-3xl font-extrabold leading-tight text-gray-900 lg:mb-6 lg:text-4xl dark:text-white"
            :to="`/blog/post/${post.slug}`"
          >
            {{ formatCmsItem(post.title) }}
          </router-link>
          <div class="flex items-center mb-6 not-italic">
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
          </div>
        </div>
        <div class="blog-post" v-html="formatCmsItem(post.content)"></div>
      </article>
    </div>
    <footer class="w-full bg-white min-h-16 p-4">
      <div
        class="grid grid-cols-2 justify-between max-w-180 w-auto mx-auto gap-3"
      >
        <div v-if="previousPost" class="text-right">
          <router-link :to="`/blog/post/${previousPost.slug}`">
            <div class="my-2">{{ $t('blog.previous_post') }}</div>
          </router-link>
          <span class="font-semibold">{{ previousPost.title }}</span>
        </div>
        <div v-if="nextPost">
          <router-link :to="`/blog/post/${nextPost.slug}`">
            <div class="my-2">{{ $t('blog.next_post') }}</div>
          </router-link>
          <span class="font-semibold">{{ nextPost.title }}</span>
        </div>
      </div>
    </footer>
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
    previousPost: {
      type: Object as PropType<CmsItem>,
      default: null,
    },
    nextPost: {
      type: Object as PropType<CmsItem>,
      default: null,
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

<style>
.blog-post {
  h1 {
    @apply text-2xl font-bold mt-3;
  }

  h2 {
    @apply text-xl font-bold mt-3;
  }

  h3 {
    @apply text-lg font-semibold mt-3;
  }

  h4 {
    @apply text-base mt-3;
  }

  h5 {
    @apply text-sm mt-3;
  }

  h6 {
    @apply text-xs mt-3;
  }

  p {
    @apply my-2;
  }

  ul {
    @apply mt-3 list-disc;
    list-style-position: inside;
  }

  ol {
    @apply mt-3 list-decimal;
    list-style-position: inside;
  }

  strong {
    @apply font-bold;
  }

  u {
    @apply underline;
  }

  em {
    @apply italic;
  }

  a {
    @apply text-primary-dark underline;

    &:hover {
      text-decoration: none;
    }
  }
}
</style>
