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
.homegrid {
  &.grid-container {
    grid:
      [r1] 'logo . main main main main survivors' 20% [r1end]
      [r2] 'nav . main main main main main' [r2end]
      [r3] 'actions . main main main main main' [r3end]
      [r4] '. . . . footer footer .' [r4end]
      / auto;

    .grid {
      &--main {
        align-self: center;
        @apply sm:mx-10 h-full;
        overflow: auto;
        grid-row: main-start / span actions-end;
      }
      &--overlay {
        grid-column: 1 / span 5;
      }
      &--footer {
        height: auto;
        display: flex;
        justify-content: space-evenly;
        @apply my-1;
      }
    }
  }
}
@media only screen and (max-width: 640px) {
  .homegrid {
    height: 100vh;
    &.grid-container {
      grid:
        [r1] 'logo survivors' [r1end]
        [r4] 'nav nav' [r4end]
        [r2] 'main main' [r2end]
        [r3] 'actions actions' [r3end]
        / auto;
      grid-template-rows: 0.5fr 0.5fr 4fr 1fr;
    }
  }
}
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
