<template>
  <BlogPosts :cms-items="news" class="max-h-168" @on-click="showDetails" />
</template>

<script lang="ts">
import { onBeforeMount, onBeforeUnmount, ref, onMounted } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { formatCmsItem } from '../../utils/helpers';
import useDialogs from '../../hooks/useDialogs';
import CmsViewer from '../cms/CmsViewer.vue';
import useCurrentUser from '../../hooks/useCurrentUser';
import BlogPosts from '@/components/blog/BlogPosts.vue';

export default defineComponent({
  name: 'PhoneCmsItems',
  components: { BlogPosts },
  props: {
    cmsTag: {
      type: String,
      default: 'phone-news',
    },
    stateKey: {
      type: String,
      default: 'news_last_seen',
    },
  },
  setup(props, { emit }) {
    const { component } = useDialogs();
    const { userStates } = useCurrentUser();

    const newsInterval = ref(undefined);
    const news = ref([]);
    const unreadCount = ref(0);

    async function getNews() {
      try {
        if (userStates.value?.[props.stateKey]) {
          const response = await axios.get(
            `${import.meta.env.VITE_APP_API_BASE_URL}/cms?tags=${
              props.cmsTag
            }&publish_at__gt=${
              userStates.value[props.stateKey]
            }&publish_at__lt=${moment().toISOString()}&limit=1`,
          );
          unreadCount.value = response?.data?.count || 0;
          emit('unreadCount', response?.data?.count || 0);
        }

        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/cms?tags=${
            props.cmsTag
          }&sort=-publish_at&limit=10`,
        );
        news.value = response.data.results;
      } catch (error) {
        console.error(error);
      }
    }

    async function showDetails(newItem) {
      await component({
        title: formatCmsItem(newItem.title),
        component: CmsViewer,
        classes: 'w-full h-96 overflow-auto p-3',
        modalClasses: 'bg-white max-w-3xl shadow',
        props: {
          title: formatCmsItem(newItem.title),
          content: formatCmsItem(newItem.content),
          image: newItem.thumbnail_file?.blog_url,
        },
      });
    }

    onBeforeMount(() => {
      newsInterval.value = setInterval(getNews, 300_000);
    });

    onBeforeUnmount(() => {
      if (newsInterval.value) {
        clearInterval(newsInterval.value);
        newsInterval.value = undefined;
      }
    });

    onMounted(() => {
      getNews();
    });

    return {
      news,
      unreadCount,
      newsInterval,
      formatCmsItem,
      showDetails,
    };
  },
});
</script>

<style scoped>
p {
  max-width: 400px;
}
</style>
