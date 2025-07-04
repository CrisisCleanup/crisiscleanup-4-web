<template>
  <Home no-hotline>
    <div
      class="bg-[#232323] text-white py-8 flex flex-col md:flex-row items-center justify-between md:items-start"
    >
      <div class="flex items-start gap-4">
        <div class="h-16 w-16 bg-primary-light"></div>
        <div class="flex flex-col gap-2">
          <h1 class="text-4xl font-bold flex gap-4 items-center">
            <div>
              {{ $t('magazine.title_crisis') }} <br />
              {{ $t('magazine.title_cleanup') }}
            </div>
            <div class="font-normal text-3xl flex items-center gap-4">
              <span class="text-primary-light">|</span>
              <span v-html="$t('magazine.title_magazine')"></span>
              <div class="bg-blue-700 p-2 text-center text-sm">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfBt0P6KFnmhacpEmehJH4ichsB9YhuwJ9azMMdeviIE0suGA/viewform?usp=dialog"
                  class="text-white font-semibold px-3 py-1 rounded flex items-center gap-2 w-fit"
                  target="_blank"
                >
                  {{ $t('magazine.subscribe') }}
                </a>
              </div>
            </div>
          </h1>
          <p class="mb-2 max-w-xl">
            <span v-html="$t('magazine.magazine_intro_text')"></span
            ><br /><br />
            <span
              class="font-semibold"
              v-html="$t('magazine.download_issues_below')"
            ></span>
          </p>
        </div>
      </div>
      <!-- Search Bar -->
      <div class="w-full max-w-md m-5">
        <BaseInput
          v-model="searchQuery"
          :placeholder="$t('actions.search')"
          type="search"
          fa-icon="search"
          class="bg-white/10 text-white placeholder-white/60"
          size="medium"
          @input="handleSearch"
        />
      </div>
    </div>
    <!-- two tone bar -->
    <div class="h-3 flex">
      <div class="bg-primary-light w-1/2 h-full"></div>
      <div class="bg-primary-dark w-1/2 h-full"></div>
    </div>

    <div class="bg-white py-10">
      <MagazineList :show-latest-issue="!searchQuery" />
    </div>
  </Home>
</template>

<script setup lang="ts">
import Home from '@/layouts/Home.vue';
import MagazineList from '@/components/magazine/MagazineList.vue';
import BaseInput from '@/components/BaseInput.vue';
import { useRoute, useRouter } from 'vue-router';
import { useDebounceFn } from '@vueuse/core';

const route = useRoute();
const router = useRouter();
const searchQuery = ref('');

// Initialize search from URL parameter
onMounted(() => {
  const searchParam = route.query.s as string;
  if (searchParam) {
    searchQuery.value = searchParam;
  }
});

// Handle search input with debounce
const debouncedSearch = useDebounceFn(() => {
  const query = { ...route.query };
  if (searchQuery.value) {
    query.s = searchQuery.value;
  } else {
    delete query.s;
  }
  router.replace({ query });
}, 300);

function handleSearch() {
  debouncedSearch();
}

// Watch for URL changes
watch(
  () => route.query.s,
  (newSearch: string | undefined) => {
    if (newSearch !== searchQuery.value) {
      searchQuery.value = newSearch || '';
    }
  },
);
</script>
