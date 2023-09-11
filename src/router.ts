import {
  createRouter,
  createWebHistory,
  type RouteLocationRaw,
  type RouteRecordRaw,
} from 'vue-router';
import moment from 'moment';
import Dashboard from './pages/Dashboard.vue';
import Work from './pages/Work.vue';
import HomeRoutes from './pages/home/routes';
import PhoneRoutes from './pages/phone/routes';
import { store } from './store';
import AdminRoutes from './pages/admin/routes';
import OrganizationRoutes from './pages/organization/routes';
import UnauthenticatedRoutes from './pages/unauthenticated/routes';
import AppDownload from './pages/AppDownload.vue';
import useSetupLanguage from '@/hooks/useSetupLanguage';
import OtherOrganizations from '@/pages/OtherOrganizations.vue';
import Reports from '@/pages/admin/Reports.vue';
import Report from '@/pages/admin/Report.vue';
import NotFound from '@/pages/NotFound.vue';
import Location from '@/pages/Location.vue';
import Profile from '@/pages/Profile.vue';
import Downloads from '@/pages/Downloads.vue';

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * The id of the route.
     */
    id?: string;
    /**
     * The layout to use for this route.
     */
    layout?: string;
    /**
     * Does this route require authentication?
     */
    noAuth?: boolean;
    /**
     * The scroll behavior for this route.
     */
    noscroll?: boolean;
  }
}

const routes = [
  {
    path: '/',
    component: Dashboard,
    name: 'nav.dashboard_home',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/dashboard',
    component: Dashboard,
    name: 'nav.dashboard_no_incident',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/incident/:incident_id/dashboard',
    component: Dashboard,
    name: 'nav.dashboard',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/profile',
    component: Profile,
    name: 'nav.profile',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/downloads',
    component: Downloads,
    name: 'nav.downloads',
    meta: { layout: 'authenticated' },
  },
  {
    // For app download links
    path: '/apps',
    component: AppDownload,
    name: 'nav.mobile',
    meta: { layout: 'unauthenticated', noAuth: true },
  },
  {
    path: '/incident/:incident_id/work',
    component: Work,
    name: 'nav.work',
    meta: { id: 'work', layout: 'authenticated', noscroll: true },
    children: [
      {
        path: ':id',
        name: 'nav.work_view_case',
        meta: { id: 'work_case_view', noscroll: true },
      },
      {
        path: ':id/edit',
        name: 'nav.work_edit_case',
        meta: { id: 'work_case_edit', noscroll: true },
      },
    ],
  },
  {
    path: '/reports',
    component: Reports,
    name: 'nav.reports',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/report/:id',
    component: Report,
    name: 'nav.report',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/other_organizations',
    component: OtherOrganizations,
    name: 'nav.other_organizations',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/locations/new',
    component: Location,
    name: 'nav.new_location',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/locations/:location_id/edit',
    component: Location,
    name: 'nav.edit_location',
    meta: { layout: 'authenticated' },
  },
  ...HomeRoutes,
  ...PhoneRoutes,
  ...AdminRoutes,
  ...OrganizationRoutes,
  ...UnauthenticatedRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { layout: 'unauthenticated', noAuth: true },
  },
] as RouteRecordRaw[];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
