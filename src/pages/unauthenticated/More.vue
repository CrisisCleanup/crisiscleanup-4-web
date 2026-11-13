+
<template>
  <Home>
    <div class="grid--main mb-60 sm:mb-0" data-testid="testMoreDiv">
      <!--- Title --->
      <div class="flex flex-col m-5 pb-8">
        <h1 class="text-5xl px-0.5 text-crisiscleanup-dark-500 font-bold">
          {{ $t('more.more_title') }}
        </h1>
        <!--- Description --->
        <p class="text-xl px-0.5">
          {{ $t('more.more_description') }}
        </p>
      </div>
      <!--- Content --->
      <div
        class="flex flex-col sm:flex-row justify-between sm:m-5"
        v-html="$t('more.links')"
      ></div>
      <!--- /Content --->

      <home-footer />
    </div>
  </Home>
</template>

<script lang="ts">
import Home from '@/layouts/Home.vue';

export default defineComponent({
  name: 'TrainingPage',
  components: {
    Home,
  },
});
</script>

<style scoped lang="scss">
.resp-video {
  position: absolute;
  top: 0;
  left: 0;
  border: 0;
  width: 100%;
  height: 100%;
}
.video-container {
  position: relative;
  overflow: hidden;
  padding-top: 56.25%;
}
</style>
