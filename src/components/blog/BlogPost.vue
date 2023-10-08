<template>
  <div className="blog-post p-4 border rounded shadow-md">
    <img
      v-if="post.thumbnail_file"
      :src="post.thumbnail_file.blog_url"
      alt="Blog Thumbnail"
      class="mb-4"
    />
    <h2 className="text-2xl mb-2">{{ post.title }}</h2>

    <!-- Displaying the publish date and time using moment -->
    <div className="text-gray-600 mb-4">Published on {{ formattedDate }}</div>

    <div v-html="post.content"></div>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  props: {
    post: {
      type: Object,
      required: true,
    },
  },
  computed: {
    formattedDate() {
      return moment(this.post.publish_at).format('MMMM D, YYYY [at] h:mm a');
      // Adjust the format string according to your preference
    },
  },
};
</script>

<style scoped>
/* ... */
</style>
