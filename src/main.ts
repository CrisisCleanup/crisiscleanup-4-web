import { version } from '@/../package.json';
import { createApp, type App as VueApp } from 'vue';
import './style.css';
import axios, { AxiosError } from 'axios';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VueTagsInput from '@sipec/vue3-tags-input';
// eslint-disable-next-line import/default
import Datepicker from '@vuepic/vue-datepicker';
import * as Sentry from '@sentry/vue';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import Toast, {
  type PluginOptions as VueToastificationPluginOptions,
} from 'vue-toastification';
import { i18n } from '@/modules/i18n';
// eslint-disable-next-line import/default
import vSelect from 'vue-select';
import App from './App.vue';
import MaintenanceApp from './maintenance/App.vue';
import router from './router';
import BaseButton from './components/BaseButton.vue';
import BaseInput from './components/BaseInput.vue';
import BaseText from './components/BaseText.vue';
import Badge from './components/Badge.vue';
import Tag from './components/Tag.vue';
import Modal from './components/Modal.vue';
import Authenticated from './layouts/Authenticated.vue';
import VueApexCharts from 'vue3-apexcharts';

// Icons

import BaseIcon from './components/BaseIcon.vue';
import { store } from './store';

// Toast
import 'vue-toastification/dist/index.css';
import 'vue-select/dist/vue-select.css';

// Responsive
import { Vue3Mq } from 'vue3-mq';

// Popover
import { Dropdown, VTooltip, Menu } from 'floating-vue';
import 'floating-vue/dist/style.css';

// JSON
import JsonViewer from 'vue-json-viewer';
import BaseSelect from './components/BaseSelect.vue';
import Spinner from './components/Spinner.vue';
import BaseCheckbox from './components/BaseCheckbox.vue';
import FormTree from './components/form/FormTree.vue';
import Tab from './components/tabs/Tab.vue';
import Tabs from './components/tabs/Tabs.vue';
import BaseRadio from './components/BaseRadio.vue';
import Unauthenticated from './layouts/Unauthenticated.vue';
import BaseLink from './components/BaseLink.vue';
import TreeMenu from '@/components/TreeMenu.vue';
import { getAndToastWarningMessage } from '@/utils/errors';

library.add(fas);
library.add(far);
library.add(fab);

axios.defaults.withCredentials = true;
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error instanceof AxiosError &&
      [400, 408, 409, 422, 502].includes(error.response?.status as number)
    ) {
      return getAndToastWarningMessage(error);
    }
  },
);
const buildApp = (app: VueApp) =>
  app
    .component('FontAwesomeIcon', FontAwesomeIcon as any)
    .component('CcuIcon', BaseIcon)
    .component('BaseButton', BaseButton)
    .component('BaseInput', BaseInput)
    .component('BaseText', BaseText)
    .component('BaseLink', BaseLink)
    .component('BaseRadio', BaseRadio)
    .component('Badge', Badge)
    .component('Tag', Tag)
    .component('TagInput', VueTagsInput)
    .component('VSelect', vSelect)
    .component('AuthenticatedLayout', Authenticated)
    .component('UnauthenticatedLayout', Unauthenticated)
    .component('BaseSelect', BaseSelect)
    .component('BaseCheckbox', BaseCheckbox)
    .component('Modal', Modal)
    .component('VPopover', Dropdown)
    .component('VMenu', Menu)
    .component('Spinner', Spinner)
    .component('FormTree', FormTree)
    .component('TreeMenu', TreeMenu)
    .component('Tabs', Tabs)
    .component('Tab', Tab)
    .component('Datepicker', Datepicker)
    .directive('tooltip', VTooltip)
    .use(store)
    // provide axios globally
    .provide('axios', axios)
    .use(Vue3Mq)
    .use(VueApexCharts)
    .use(router)
    .use(i18n)
    .use(Toast, {
      timeout: 10_000,
      shareAppContext: true,
    } as VueToastificationPluginOptions)
    .use(JsonViewer);

const initSentry = (vueApp: VueApp) =>
  Sentry.init({
    app: vueApp,
    dsn: 'https://33b5cc9258d64b5cb2a8084af5df4051@o317954.ingest.sentry.io/4504774609141760',
    release: `crisiscleanup-4-web@v${version}`,
    environment: import.meta.env.VITE_APP_STAGE,
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/(api\.|app\.|)(dev\.|staging\.|)crisiscleanup\.(org|io)/,
      /^\//,
    ],
    tracesSampleRate: 0.15,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 0.2,
    trackComponents: true,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration(),
    ],
  });

const entrypoint =
  import.meta.env.VITE_APP_ENTRY === 'maintenance' ? MaintenanceApp : App;
const app = buildApp(createApp(entrypoint));

if (import.meta.env.PROD) {
  initSentry(app);
}

app.mount('#app');
