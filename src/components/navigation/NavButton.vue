<template>
  <router-link
    v-if="!route.disabled"
    :to="route.to"
    class="menu-item router-link"
    :class="isActive ? 'menu-item--active' : ''"
    :data-testid="`test${route.key}Link`"
  >
    <div :key="route.key" class="flex flex-col items-center relative">
      <badge
        v-if="route.newBadge"
        data-testid="testNewBadgeIcon"
        width="2rem"
        height="1rem"
        class="text-white bg-crisiscleanup-red-700 mx-1 absolute -top-0.5 -right-8 p-3"
        :title="$t('info.new_badge')"
        >{{ $t('info.new') }}</badge
      >
      <ccu-icon
        :alt="$t(`nav.${route.key}`)"
        :data-testid="$t(`test${route.key}Icon`)"
        :class="isActive ? 'filter-primary' : ''"
        size="xl"
        v-bind="iconProps"
        :linked="true"
      />
      <div class="menu-text mt-1 text-center">
        {{ route.text || $t(`nav.${route.key}`) }}
      </div>
    </div>
  </router-link>
</template>

<script lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

export default defineComponent({
  name: 'NavButton',
  props: {
    route: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    const { t } = useI18n();

    const iconProps = computed(() => {
      return typeof props.route.icon === 'object'
        ? props.route.icon
        : {
            type: props.route.icon || props.route.key,
            size: 'xl',
          };
    });

    const route = useRoute();
    const isActive = computed(() => {
      const routeName = route.name as string;
      const propRouteName = (props.route?.name ?? '') as string;
      return routeName?.toLowerCase().includes(propRouteName.toLowerCase());
    });

    return {
      isActive,
      iconProps,
    };
  },
});
</script>

<style lang="postcss" scoped>
a:hover,
a:active,
a:focus {
  outline: 0;
}
.menu-item {
  @apply px-2 py-2.5 border-b border-crisiscleanup-dark-400;
}

.menu-item:hover {
  @apply bg-crisiscleanup-dark-500 transition;
}

.menu-item {
  background-color: transparent;
  position: relative;
}

.menu-item--active {
  background-color: theme('colors.crisiscleanup-dark.500');
}

.menu-item--active::before {
  content: '';
  width: 5px;
  height: 100%;
  right: 0;
  top: 0;
  display: block;
  position: absolute;
  background-color: theme('colors.primary.light');
}

.menu-text {
  line-height: 15px;
  color: white;
  text-decoration: none !important;
}
</style>
