const More = () => import('./More.vue');
const InvitationSignup = () => import('./InvitationSignup.vue');
const MobileAppUserInvite = () => import('./MobileAppUserInvite.vue');
const PrintToken = () => import('./PrintToken.vue');
const Survivors = () => import('./Survivors.vue');
const ResetPassword = () => import('./ResetPassword.vue');
const MagicLink = () => import('./MagicLink.vue');
const PewPew = () => import('./PewPew.vue');
const OauthRedirect = () => import('@/pages/OauthRedirect.vue');
const Disasters = () =>
  import('@/pages/unauthenticated/disasters/Disasters.vue');

const DisasterDetail = () =>
  import('@/pages/unauthenticated/disasters/DisasterDetail.vue');

const DisastersArchived = () =>
  import('@/pages/unauthenticated/disasters/DisastersArchived.vue');
const Blog = () => import('@/pages/unauthenticated/Blog.vue');
const BlogPost = () => import('@/pages/unauthenticated/BlogPost.vue');

const MagicLinkLogin = () =>
  import('@/pages/unauthenticated/MagicLinkLogin.vue');
const OtpLogin = () => import('@/pages/unauthenticated/OtpLogin.vue');

const routes = [
  {
    path: '/more',
    component: More,
    name: 'nav.more',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/invitation_token/:token',
    component: InvitationSignup,
    name: 'nav.invitation_token',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/mobile_app_user_invite',
    component: MobileAppUserInvite,
    name: 'nav.mobile_app_user_invite',
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
    path: '/l/:token',
    component: MagicLinkLogin,
    name: 'nav.magic_link_login',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/otp-login',
    component: OtpLogin,
    name: 'nav.otp_login',
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
    path: '/survivor',
    component: Disasters,
    name: 'nav.survivor',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/disasters/:id',
    component: DisasterDetail,
    name: 'nav.disaster_detail',
    meta: { layout: 'unauthenticated', noAuth: true },
    children: [
      {
        path: 'resources',
        component: DisasterDetail,
        meta: { tabIndex: 0 },
      },
      {
        path: 'latest',
        component: DisasterDetail,
        meta: { tabIndex: 1 },
      },
      {
        path: 'reports',
        component: DisasterDetail,
        meta: { tabIndex: 2 },
      },
    ],
  },
  {
    path: '/disasters/archived',
    component: DisastersArchived,
    name: 'nav.disasters_archived',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/blog',
    component: Blog,
    name: 'nav.blog',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/blog/post/:id',
    component: BlogPost,
    name: 'nav.blog_post',
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
