<template>
  <div class="home-grid">
    <div
      class="top p-4 flex items-center justify-center flex-col md:flex-row md:justify-between w-[calc(100vw-0px)] min-w-0"
    >
      <div class="grid--logo logo w-24 md:w-52">
        <a href="/">
          <img
            src="../assets/ccu-logo-black-500w.png"
            data-testid="testLogoIcon"
            alt="Crisis Cleanup"
          />
        </a>
      </div>
      <IncidentContact class="w-full md:w-max" />
    </div>
    <div class="side m-8 flex flex-col justify-center">
      <div class="grid--nav flex flex-col gap-2">
        <span v-for="item in routes" :key="item.key">
          <a
            v-if="item.external"
            :data-testid="`testNavRoute${item.key}Link`"
            :href="item.route"
            class="font-h1 font-display text-h1 text-crisiscleanup-dark-500"
            target="_blank"
          >
            {{ item.label }}
          </a>
          <router-link
            v-if="!item.external"
            :to="item.route || '#'"
            class="font-h1 font-display text-h1 text-crisiscleanup-dark-500"
          >
            {{ item.label }}
          </router-link>
        </span>
      </div>
    </div>
    <div class="register flex items-center justify-center m-8 w-max">
      <slot name="register">
        <div class="grid--actions mb-4 flex flex-col w-full">
          <base-text
            font="display"
            variant="h2"
            :weight="300"
            class="text-crisiscleanup-dark-500 w-full"
            >{{ $t('publicNav.relief_orgs_only') }}</base-text
          >
          <base-button
            variant="solid"
            data-testid="testRegisterButton"
            size="large"
            class="w-full"
            :alt="$t('actions.register')"
            :action="() => $router.push('/register')"
          >
            {{ $t('actions.register') }}
          </base-button>
        </div>
      </slot>
    </div>
    <div class="main w-screen md:w-auto sm:m-10 z-50">
      <slot />
    </div>
    <div class="bottom" data-testid="testBottomSectionDiv">
      <div v-if="$route.name === 'nav.login'" class="flex flex-col m-8">
        <div class="flex items-end md:justify-end gap-5">
          <span v-for="item in footerRoutes" :key="item.key">
            <a
              v-if="item.external"
              :href="item.route"
              class="font-body font-display text-h2 text-crisiscleanup-dark-300"
              target="_blank"
            >
              {{ item.label }}
            </a>
            <router-link
              v-if="!item.external"
              :to="item.route || '#'"
              class="font-body font-display text-h2 text-crisiscleanup-dark-300"
            >
              {{ item.label }}
            </router-link>
          </span>
        </div>
        <a
          class="w-40 block md:self-end mt-3"
          data-testid="testAwsLink"
          target="_blank"
          href="https://aws.amazon.com/government-education/nonprofits/disaster-response/"
          ><img src="@/assets/powered_by_aws.png" data-testid="testAwsImgIcon"
        /></a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import IncidentContact from '@/components/IncidentContact.vue';

export default defineComponent({
  name: 'Home',
  components: { IncidentContact },
  setup() {
    const { t } = useI18n();
    const allRoutes = computed(() => [
      {
        key: 'home',
        route: '/login',
        label: t('publicNav.home'),
      },
      {
        key: 'aboutUs',
        route: '/about',
        label: t('publicNav.about_us'),
      },
      {
        key: 'blog',
        route: 'http://blog.crisiscleanup.org',
        external: true,
        label: t('publicNav.blog'),
      },
      {
        key: 'map',
        route: '/map',
        label: t('publicNav.map'),
      },
      {
        key: 'training',
        route: '/training',
        label: t('publicNav.training'),
      },
      {
        key: 'survivor',
        route: '/survivor',
        label: t('publicNav.survivor'),
      },
      {
        key: 'contact',
        label: t('publicNav.contact'),
        route: 'https://crisiscleanup.zendesk.com/hc/en-us/requests/new',
        external: true,
      },
      {
        key: 'terms',
        route: '/terms',
        label: t('publicNav.terms'),
      },
      {
        key: 'privacy',
        route: '/privacy',
        label: t('publicNav.privacy'),
      },
    ]);

    const defaultRoutes = computed(() => {
      return allRoutes.value.filter((r) =>
        [
          'home',
          'aboutUs',
          'blog',
          'map',
          'training',
          'survivor',
          'contact',
        ].includes(r.key),
      );
    });

    const footerRoutes = computed(() =>
      allRoutes.value.filter((r) =>
        ['contact', 'terms', 'privacy'].includes(r.key),
      ),
    );

    return {
      routes: defaultRoutes,
      footerRoutes,
    };
  },
});
</script>

<style lang="scss">
.grid--main {
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

ol.outline {
  list-style-type: none;
  margin-left: 0;
  counter-reset: item;
  outline-style: none;
}
ol.outline > li {
  counter-increment: customlistcounter;
  display: block;
}
ol.outline:first-child,
ol.outline:second-child {
  counter-reset: customlistcounter;
}
ol.outline > li:before {
  counter-increment: item;
  /*content: "#" counter(customlistcounter);*/
  font-weight: bold;
  float: left;
  width: 3em;
}
ol.one > li:before {
  content: '1.' counters(item, '.') ' ';
}
ol.two > li:before {
  content: '2.' counters(item, '.') ' ';
}
ol.three > li:before {
  content: '3.' counters(item, '.') ' ';
}
ol.four > li:before {
  content: '4.' counters(item, '.') ' ';
}
ol.five > li:before {
  content: '5.' counters(item, '.') ' ';
}
ol.six > li:before {
  content: '6.' counters(item, '.') ' ';
}
ol.seven > li:before {
  content: '7.' counters(item, '.') ' ';
}
ol.eight > li:before {
  content: '8.' counters(item, '.') ' ';
}
ol.nine > li:before {
  content: '9.' counters(item, '.') ' ';
}
ol.ten > li:before {
  content: '10.' counters(item, '.') ' ';
}
ol.eleven > li:before {
  content: '11.' counters(item, '.') ' ';
}
ol.twelve > li:before {
  content: '12.' counters(item, '.') ' ';
}
ol.thirteen > li:before {
  content: '13.' counters(item, '.') ' ';
}
ol.fourteen > li:before {
  content: '14.' counters(item, '.') ' ';
}
ol.fifteen > li:before {
  content: '15.' counters(item, '.') ' ';
}
</style>

<style scoped>
.side {
  grid-area: side;
}

.top {
  grid-area: top;
}

.main {
  grid-area: main;
}

.bottom {
  grid-area: bottom;
}

.home-grid {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-rows: 200px 1fr 1fr 150px;
  grid-auto-columns: 350px 1fr 1fr;
  /*grid-auto-rows: 1fr;*/
  /*grid-auto-flow: row;*/
  grid-template-areas:
    'top top top'
    'side main main'
    'side main main'
    'register . bottom';
  padding-bottom: env(safe-area-inset-bottom);
}

.grid--survivors {
  @apply bg-crisiscleanup-yellow-700 my-4 text-center p-4;
  /*min-width: 205px;*/

  p {
    letter-spacing: 0.35px;

    &:first-child {
      font-weight: 700;
      @apply text-2xl;
    }

    &:last-child {
      font-weight: 600;
    }
  }

  a {
    @apply underline;
  }
}

@media only screen and (max-width: 768px) {
  .home-grid {
    display: grid;
    align-items: center;
    grid-auto-flow: row;
    grid-template-columns: 1fr 1fr;
    /* do not set template columns and rows */
    grid-template-rows: unset;
    overflow-y: auto;
    /* grid-template-columns: 1fr 1fr;*/
    /* grid-template-rows: repeat(auto-fit, 1fr);*/
    grid-template-areas:
      'top top'
      'main main'
      'main main'
      'main main'
      'main main'
      'register register'
      'side side'
      'bottom bottom';
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
