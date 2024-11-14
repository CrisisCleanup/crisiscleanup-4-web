import type { RouteRecordRaw } from 'vue-router';

const Login = () => import('./Login.vue');
const RequestAccess = () => import('@/pages/home/RequestAccess.vue');
const About = () => import('@/pages/home/About.vue');
const Training = () => import('@/pages/home/Training.vue');
const Map = () => import('@/pages/home/Map.vue');
const RequestPasswordReset = () =>
  import('@/pages/home/RequestPasswordReset.vue');
const Contributions = () => import('@/pages/home/Contributions.vue');
const Privacy = () => import('@/pages/home/Privacy.vue');
const Terms = () => import('@/pages/home/Terms.vue');
const RegisterOrganization = () =>
  import('@/pages/home/RegisterOrganization.vue');
const PersistentInvitationSignup = () =>
  import('@/pages/home/PersistentInvitationSignup.vue');

export default [
  {
    path: '/login',
    component: Login,
    name: 'nav.login',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/request_access',
    component: RequestAccess,
    name: 'nav.request_access',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/i/:token',
    component: PersistentInvitationSignup,
    name: 'nav.persistent_invitation_signup',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/about',
    component: About,
    name: 'nav.about',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/training',
    component: Training,
    name: 'nav.training',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/map',
    component: Map,
    name: 'nav.map',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/password/new',
    component: RequestPasswordReset,
    name: 'nav.request_password_reset',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/contributions',
    component: Contributions,
    name: 'nav.contributions',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/privacy',
    component: Privacy,
    name: 'nav.privacy',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/terms',
    component: Terms,
    name: 'nav.terms',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/register',
    component: RegisterOrganization,
    name: 'nav.register',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
] as RouteRecordRaw[];
