<template>
  <div class="main-grid md:h-screen" :class="noHotline ? 'no-hotline' : ''">
    <div class="logo m-8 flex items-center justify-center md:block">
      <div class="w-40 md:w-52">
        <a href="/live">
          <img
            src="@/assets/ccu-logo-black-500w.png"
            data-testid="testLogoIcon"
            alt="Crisis Cleanup"
          />
        </a>
      </div>
    </div>
    <IncidentContact v-if="!noHotline" class="w-full md:w-max hotline m-8" />
    <div class="main">
      <slot />
    </div>
    <slot name="register">
      <div class="register m-8">
        <div class="flex flex-col w-full">
          <div class="text-crisiscleanup-dark-500 w-full text-center self-end">
            {{ $t('publicNav.relief_orgs_only') }}
          </div>
          <a
            href="/register"
            class="cursor-pointer bg-yellow-400 p-4 mt-3 flex items-center justify-center"
            type="submit"
            >{{ $t('actions.register') }}</a
          >
        </div>
      </div>
    </slot>
    <div class="nav flex flex-col gap-3 m-8 md:text-left text-center">
      <template v-if="isAuthenticated">
        <span v-for="route in authenticatedRoutes" :key="route.key">
          <router-link
            :to="route.to || '#'"
            class="text-2xl text-crisiscleanup-dark-500"
          >
            {{ route.text || $t(`nav.${route.key}`) }}
          </router-link>
        </span>
      </template>
      <template v-else>
        <span v-for="item in routes" :key="item.key">
          <a
            v-if="item.external"
            :data-testid="`testNavRoute${item.key}Link`"
            :href="item.route"
            class="text-2xl text-crisiscleanup-dark-500"
            target="_blank"
          >
            {{ item.label }}
          </a>
          <router-link
            v-if="!item.external"
            :to="item.route || '#'"
            class="text-2xl text-crisiscleanup-dark-500"
          >
            {{ item.label }}
          </router-link>
        </span>
      </template>
    </div>
    <div v-if="!noHotline" class="footer grid">
      <div class="flex flex-col gap-2 m-4 self-end items-center md:items-end">
        <a
          class="w-40 block md:self-end"
          data-testid="testAwsLink"
          target="_blank"
          href="https://aws.amazon.com/government-education/nonprofits/disaster-response/"
        >
          <img src="@/assets/powered_by_aws.png" data-testid="testAwsImgIcon" />
        </a>
        <div class="flex items-center justify-center md:justify-end gap-5">
          <span v-for="item in footerRoutes" :key="item.key">
            <a
              v-if="item.external"
              :href="item.route"
              class="font-body text-h2 text-crisiscleanup-dark-300"
              target="_blank"
            >
              {{ item.label }}
            </a>
            <router-link
              v-if="!item.external"
              :to="item.route || '#'"
              class="font-body text-h2 text-crisiscleanup-dark-300"
            >
              {{ item.label }}
            </router-link>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import IncidentContact from '@/components/IncidentContact.vue';
import { useAuthStore } from '@/hooks';
import { useAuthenticatedRoutes } from '@/hooks/useAuthenticatedRoutes';

export default defineComponent({
  name: 'Home',
  components: { IncidentContact },
  props: {
    noHotline: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const { t } = useI18n();
    const { isAuthenticated } = useAuthStore();

    const { routes: authenticatedRoutes } = useAuthenticatedRoutes();

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
      // {
      //   key: 'blog',
      //   route: '/blog',
      //   label: t('publicNav.blog'),
      // },
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
        key: 'disasters',
        route: '/disasters',
        label: t('publicNav.disasters'),
      },
      {
        key: 'contact',
        label: t('publicNav.contact'),
        route: 'https://crisiscleanup.zendesk.com/hc/en-us/requests/new',
        external: true,
      },
      {
        key: 'more',
        label: t('more.more_title'),
        route: '/more',
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
          // 'blog',
          'map',
          'training',
          'disasters',
          'contact',
          'more',
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
      authenticatedRoutes,
      isAuthenticated,
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
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  grid-template-areas:
    'logo . . . hotline'
    'nav main main main main'
    'register main main main main'
    '. . . footer footer';
}

.main-grid.no-hotline {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  grid-template-areas:
    'logo main main main main'
    'nav main main main main'
    'register main main main main'
    '. main main main main';
}

.logo {
  grid-area: logo;
}
.hotline {
  grid-area: hotline;
}
.main {
  grid-area: main;
}
.register {
  grid-area: register;
}
.nav {
  grid-area: nav;
}
.footer {
  grid-area: footer;
}
.globe {
  grid-area: globe;
}
@media screen and (max-width: 768px) {
  .main-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    grid-template-areas:
      'logo logo logo logo logo'
      'hotline hotline hotline hotline hotline'
      'main main main main main'
      'register register register register register'
      'nav nav nav nav nav'
      'footer footer footer footer footer';
  }
  .main-grid.no-hotline {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    grid-template-areas:
      'logo logo logo logo logo'
      'main main main main main'
      'main main main main main'
      'register register register register register'
      'nav nav nav nav nav'
      'footer footer footer footer footer';
  }
}
</style>
