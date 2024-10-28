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
      <div class="flex flex-col m-8 self-end items-center md:items-end">
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
        <a
          class="w-40 block md:self-end mt-3"
          data-testid="testAwsLink"
          target="_blank"
          href="https://aws.amazon.com/government-education/nonprofits/disaster-response/"
        >
          <img
            src="data:image/png;base64,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"
            data-testid="testAwsImgIcon"
          />
        </a>
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
