<template>
  <div class="pagination flex justify-center items-center mt-8">
    <button
      :disabled="currentPage <= 1"
      class="px-4 py-2 mx-1"
      @click="changePage(currentPage - 1)"
    >
      Previous
    </button>
    <div v-for="page in totalPages" :key="page" class="mx-1">
      <button
        :class="page === currentPage ? 'text-blue-500' : ''"
        @click="changePage(page)"
      >
        {{ page }}
      </button>
    </div>
    <button
      :disabled="currentPage >= totalPages"
      class="px-4 py-2 mx-1"
      @click="changePage(currentPage + 1)"
    >
      Next
    </button>
  </div>
</template>

<script>
export default {
  props: {
    currentPage: {
      type: Number,
      required: true,
    },
    totalPages: {
      type: Number,
      required: true,
    },
  },
  methods: {
    changePage(page) {
      // Don't emit if the page is the current page
      if (page === this.currentPage) {
        return;
      }

      // Don't emit if the button should be disabled
      if (page < 1 || page > this.totalPages) {
        return;
      }

      this.$emit('page-changed', page);
    },
  },
};
</script>

<style scoped>
/* Add Tailwind or standard CSS for pagination styles as required. */
button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
