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
              {{ $t('~~CRISIS') }} <br />
              {{ $t('~~CLEANUP') }}
            </div>
            <div class="font-normal text-3xl">
              <span class="text-primary-light">|</span> {{ $t('~~MAGAZINE') }}
            </div>
          </h1>
          <p class="mb-2 max-w-xl">
            {{
              $t(
                '~~We created Crisis Cleanup Magazine to highlight the important work happening on the ground by volunteer organizations helping communities hit by disaster.',
              )
            }}<br /><br /><span class="font-semibold">{{
              $t('~~Download issues below ↓↓↓')
            }}</span>
          </p>
        </div>
      </div>
      <div class="h-full">
        <div class="bg-blue-700 p-4 text-center h-full mr-4">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfBt0P6KFnmhacpEmehJH4ichsB9YhuwJ9azMMdeviIE0suGA/viewform?usp=dialog"
            class="text-white font-semibold px-3 py-1 rounded flex items-center gap-2 w-fit"
            target="_blank"
          >
            {{ $t('~~Subscribe') }}
          </a>
        </div>
      </div>
    </div>
    <!-- two tone bar -->
    <div class="h-3 flex">
      <div class="bg-primary-light w-1/2 h-full"></div>
      <div class="bg-primary-dark w-1/2 h-full"></div>
    </div>

    <div class="bg-white py-10">
      <MagazineList show-latest-issue />
    </div>
  </Home>
</template>

<script setup lang="ts">
import Home from '@/layouts/Home.vue';
import MagazineList from '@/components/magazine/MagazineList.vue';
</script>
