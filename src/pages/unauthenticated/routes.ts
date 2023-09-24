const InvitationSignup = () => import('./InvitationSignup.vue');
const PrintToken = () => import('./PrintToken.vue');
const Survivors = () => import('./Survivors.vue');
const ResetPassword = () => import('./ResetPassword.vue');
const MagicLink = () => import('./MagicLink.vue');
const PewPew = () => import('./PewPew.vue');
const OauthRedirect = () => import('@/pages/OauthRedirect.vue');
const Disasters = () => import('@/pages/unauthenticated/Disasters.vue');

const routes = [
  {
    path: '/invitation_token/:token',
    component: InvitationSignup,
    name: 'nav.invitation_token',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/print_token/:token',
    component: PrintToken,
    name: 'nav.print_token',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/s/:token',
    component: Survivors,
    name: 'nav.survivors',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/o/callback',
    component: OauthRedirect,
    name: 'nav.token',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  // {
  //   path: '/assessment/:incident_id',
  //   component: PreliminaryAssessment,
  //   name: 'nav.assessment',
  //   meta: { layout: 'unauthenticated', noAuth: true },
  // },
  // {
  //   path: '/map/embed/:incident_id',
  //   component: EmbedMap,
  //   name: 'nav.map_embed',
  //   meta: { layout: 'unauthenticated', noAuth: true },
  // },
  {
    path: '/password/reset/:token',
    component: ResetPassword,
    name: 'nav.reset_password',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/magic-link',
    component: MagicLink,
    name: 'nav.magic_link',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/pew-pew',
    component: PewPew,
    name: 'nav.pew',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/live',
    component: PewPew,
    name: 'nav.live',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/disasters',
    component: Disasters,
    name: 'nav.disasters',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/donate',
    redirect() {
      window.location.href = 'https://www.paypal.com/paypalme/crisiscleanup';
    },
    meta: { layout: 'unauthenticated', noAuth: true },
  },
];

export default routes;
