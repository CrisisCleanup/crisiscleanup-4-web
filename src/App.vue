<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { whenever } from '@vueuse/core';
import { useStore } from 'vuex';
import { DialogWrapper } from 'vue3-promise-dialog';
import axios from 'axios';
import { hash } from './utils/promise';
import { useProvideZendesk, useAuthStore } from '@/hooks';
import useSetupLanguage from '@/hooks/useSetupLanguage';

export default defineComponent({
  name: 'App',
  components: {
    DialogWrapper,
  },
  setup() {
    const route = useRoute();
    const { setupLanguage } = useSetupLanguage();

    const authStore = useAuthStore();

    const defaultLayout = 'authenticated';
    const layout = computed(
      () => `${route.meta?.layout || defaultLayout}-layout`,
    );
    const { t } = useI18n();
    const store = useStore();

    const eventsInterval = ref<ReturnType<typeof setInterval> | null>(null);

    const pageTitle = computed(
      () => `${t(route.name?.toString() || '')}: Crisis Cleanup`,
    );
    useTitle(pageTitle);

    async function pushCurrentEvents(): Promise<void> {
      if (authStore.isAuthenticated.value) {
        await store.dispatch('events/pushEvents');
      }
    }

    async function getEnums(): Promise<void> {
      const enums = await hash({
        statuses: axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/statuses`,
          {
            headers: {
              Authorization: null,
            },
          },
          // `statuses:${locale.value}`,
        ),
        workTypes: axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/work_types`,
          {
            headers: {
              Authorization: null,
            },
          },
        ),
        phases: axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/incidents_phases`,
          {
            headers: {
              Authorization: null,
            },
          },
          // `incidents_phases:${locale.value}`,
        ),
        locationTypes: axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/location_types`,
          {
            headers: {
              Authorization: null,
            },
          },
          // `location_types:${locale.value}`,
        ),
        portal: axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/portals/current`,
          {
            headers: {
              Authorization: null,
            },
          },
          // `portal:${locale.value}`,
        ),
      });
      store.commit('enums/setStatuses', enums?.statuses?.data?.results);
      store.commit('enums/setWorkTypes', enums?.workTypes?.data?.results);
      store.commit(
        'enums/setLocationTypes',
        enums?.locationTypes?.data?.results,
      );
      store.commit('enums/setPhases', enums?.phases?.data?.results);
      store.commit('enums/setPortal', enums?.portal?.data);
    }

    axios.defaults.headers.CCU_PORTAL_KEY = import.meta.env.VITE_APP_PORTAL_KEY;
    axios.defaults.headers.CCU_WEB_URL = window.location.href;

    onMounted(async () => {
      if (import.meta.env.NODE_ENV === 'development') {
        eventsInterval.value = setInterval(pushCurrentEvents, 2000);
      }

      await setupLanguage();
      await getEnums();
    });

    // 360042012811
    // Setup zendesk.
    const zendesk = useProvideZendesk({
      webWidget: {
        color: { theme: '#fece09' },
        position: { horizontal: 'left', vertical: 'bottom' },
        offset: { horizontal: '-0.5rem' },
        contactForm: {
          fields: [
            { id: '16781124470797', hidden: true, prefill: { '*': '' } },
            { id: '17295140815757', hidden: true, prefill: { '*': '' } },
          ],
        },
      },
    });

    // Suppress help form on certain routes.
    const suppressContactForm = computed(
      () => /\/s\/(.*)/gm.exec(route.fullPath) !== null,
    );
    watch(
      suppressContactForm,
      (newValue) => {
        if (
          zendesk.config.webWidget?.contactForm &&
          zendesk.config?.webWidget?.contactForm?.suppress !== newValue
        ) {
          zendesk.config.webWidget.contactForm.suppress = newValue;
        }
      },
      { immediate: true },
    );

    return {
      layout,
    };
  },
});
</script>

<template>
  <component :is="layout">
    <router-view />
    <DialogWrapper :transition-attrs="{ name: 'dialog' }" />
  </component>
</template>

<style lang="scss">
$dp__input_padding: 11px 12px !default;
@import '@vuepic/vue-datepicker/src/VueDatePicker/style/main.scss';

.crisiscleanup-map-marker svg {
  width: 40px;
  height: 40px;
}

.svg-container svg {
  width: 18px !important;
  height: 18px !important;
}

.pulse {
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}

.filter-gray {
  filter: brightness(0) saturate(100%) invert(83%) sepia(0%) saturate(0%)
    hue-rotate(232deg) brightness(90%) contrast(90%);
}
.filter-yellow {
  filter: invert(92%) sepia(21%) saturate(3995%) hue-rotate(346deg)
    brightness(98%) contrast(106%);
}
.filter-black {
  filter: invert(100%) saturate(0%);
}

/*
 * Converts white icon to ccu primary color
 * ccu primary color match with 0.0 loss
 *
 * @see https://codepen.io/sosuke/pen/Pjoqqp
 * @see https://angel-rs.github.io/css-color-filter-generator/
 */
.filter-primary {
  filter: brightness(0) saturate(100%) invert(91%) sepia(25%) saturate(5576%)
    hue-rotate(353deg) brightness(105%) contrast(99%);
}
</style>
