import { version } from '@/../package.json';
import { createApp, defineAsyncComponent, type App as VueApp } from 'vue';
import './style.css';
import axios, { AxiosError } from 'axios';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import * as Sentry from '@sentry/vue';
import {
  faArrowLeft,
  faArrowRight,
  faBars,
  faBriefcase,
  faCalendar,
  faCamera,
  faCaretDown,
  faCaretLeft,
  faCaretRight,
  faCaretUp,
  faChartLine,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faClock,
  faCloudUploadAlt,
  faCommentSms,
  faCopy as faCopySolid,
  faDashboard,
  faDownLeftAndUpRightToCenter,
  faDownload,
  faDrawPolygon,
  faEdit,
  faEnvelope,
  faExclamationCircle,
  faExclamationTriangle,
  faExternalLink,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faFile,
  faFilePdf,
  faFlagUsa,
  faFolder,
  faGlobe,
  faHammer,
  faHeart,
  faImage,
  faMap,
  faMinus,
  faMobileScreen,
  faPaintBrush,
  faPause,
  faPen,
  faPhone,
  faPlane,
  faPlay,
  faPlus,
  faPrint,
  faQrcode,
  faReply,
  faScroll,
  faSearch,
  faSearchMinus,
  faShare,
  faSort,
  faSpinner,
  faStar,
  faStreetView,
  faSync,
  faTable,
  faTimes,
  faTrash,
  faTree,
  faUpRightAndDownLeftFromCenter,
  faUser,
  faUserGroup,
  faWrench,
} from '@fortawesome/free-solid-svg-icons';
import {
  faCopy as faCopyRegular,
  faStar as faStarRegular,
} from '@fortawesome/free-regular-svg-icons';
import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faXTwitter,
} from '@fortawesome/free-brands-svg-icons';
import Toast, {
  type PluginOptions as VueToastificationPluginOptions,
} from 'vue-toastification';
import { i18n } from '@/modules/i18n';

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

// Icons

import BaseIcon from './components/BaseIcon.vue';
import { store } from './store';

// Toast
import 'vue-toastification/dist/index.css';

// Responsive
import { Vue3Mq } from 'vue3-mq';

// Popover
import { Dropdown, VTooltip, Menu } from 'floating-vue';
import 'floating-vue/dist/style.css';

import BaseSelect from './components/BaseSelect.vue';
import Spinner from './components/Spinner.vue';
import BaseCheckbox from './components/BaseCheckbox.vue';
import Tab from './components/tabs/Tab.vue';
import Tabs from './components/tabs/Tabs.vue';
import BaseRadio from './components/BaseRadio.vue';
import Unauthenticated from './layouts/Unauthenticated.vue';
import BaseLink from './components/BaseLink.vue';
import TreeMenu from '@/components/TreeMenu.vue';
import {
  getAndToastWarningMessage,
  shouldReportToSentry,
} from '@/utils/errors';

const Datepicker = defineAsyncComponent(async () => {
  await import('@vuepic/vue-datepicker/dist/main.css');
  const mod = await import('@vuepic/vue-datepicker');
  return mod.default;
});

const VueTagsInput = defineAsyncComponent(async () => {
  const mod = await import('@sipec/vue3-tags-input');
  return mod.default;
});

const FormTree = defineAsyncComponent(
  () => import('./components/form/FormTree.vue'),
);

const CHUNK_LOAD_ERROR_PATTERN =
  /preloaderror|failed to fetch dynamically imported module|importing a module script failed|is not a valid javascript mime type|unable to preload css/i;

const CHUNK_RELOAD_KEY = 'ccu:chunk-reload';

function reloadForStaleChunk() {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  window.location.reload();
}

window.addEventListener('vite:preloadError', reloadForStaleChunk);

library.add(
  faArrowLeft,
  faArrowRight,
  faBars,
  faBriefcase,
  faCalendar,
  faCamera,
  faCaretDown,
  faCaretLeft,
  faCaretRight,
  faCaretUp,
  faChartLine,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faClock,
  faCloudUploadAlt,
  faCommentSms,
  faCopySolid,
  faDashboard,
  faDownLeftAndUpRightToCenter,
  faDownload,
  faDrawPolygon,
  faEdit,
  faEnvelope,
  faExclamationCircle,
  faExclamationTriangle,
  faExternalLink,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faFile,
  faFilePdf,
  faFlagUsa,
  faFolder,
  faGlobe,
  faHammer,
  faHeart,
  faImage,
  faMap,
  faMinus,
  faMobileScreen,
  faPaintBrush,
  faPause,
  faPen,
  faPhone,
  faPlane,
  faPlay,
  faPlus,
  faPrint,
  faQrcode,
  faReply,
  faScroll,
  faSearch,
  faSearchMinus,
  faShare,
  faSort,
  faSpinner,
  faStar,
  faStreetView,
  faSync,
  faTable,
  faTimes,
  faTrash,
  faTree,
  faUpRightAndDownLeftFromCenter,
  faUser,
  faUserGroup,
  faWrench,
  faCopyRegular,
  faStarRegular,
  faFacebook,
  faInstagram,
  faLinkedin,
  faXTwitter,
);

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API_BASE_URL;
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error instanceof AxiosError &&
      [400, 403, 404, 408, 409, 422, 502].includes(
        error.response?.status as number,
      )
    ) {
      getAndToastWarningMessage(error);
    }
    throw error;
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
    .use(router)
    .use(i18n)
    .use(Toast, {
      timeout: 10_000,
      shareAppContext: true,
    } as VueToastificationPluginOptions);

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
    beforeSend(event, hint) {
      const original = hint?.originalException as any;
      if (original && !shouldReportToSentry(original)) return null;
      const message =
        (typeof original?.message === 'string' && original.message) ||
        event.exception?.values?.[0]?.value ||
        '';
      if (message && CHUNK_LOAD_ERROR_PATTERN.test(message)) return null;
      return event;
    },
  });

const entrypoint =
  import.meta.env.VITE_APP_ENTRY === 'maintenance' ? MaintenanceApp : App;
const app = buildApp(createApp(entrypoint));

if (import.meta.env.PROD) {
  initSentry(app);
}

app.mount('#app');
