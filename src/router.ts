import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';
import HomeRoutes from './pages/home/routes';
import PhoneRoutes from './pages/phone/routes';
import AdminRoutes from './pages/admin/routes';
import OrganizationRoutes from './pages/organization/routes';
import UnauthenticatedRoutes from './pages/unauthenticated/routes';

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

const Dashboard = () => import('./pages/Dashboard.vue');

const DashboardPage = () => import('./pages/dashboards/DashboardPage.vue');
const DashboardSelector = () =>
  import('./pages/dashboards/DashboardSelector.vue');
const DefaultDashboard = () =>
  import('./pages/dashboards/DefaultDashboard.vue');

const PhoneVolunteerDashboard = () =>
  import('./pages/dashboards/PhoneVolunteerDashboard.vue');
const CommandCenterDashboard = () =>
  import('./pages/dashboards/CommandCenterDashboard.vue');
const Work = () => import('./pages/Work.vue');
const Calendar = () => import('./pages/Calendar.vue');
const AppDownload = () => import('./pages/AppDownload.vue');
const OtherOrganizations = () => import('@/pages/OtherOrganizations.vue');
const Reports = () => import('@/pages/admin/Reports.vue');
const Report = () => import('@/pages/admin/Report.vue');
const NotFound = () => import('@/pages/NotFound.vue');
const Location = () => import('@/pages/Location.vue');
const Profile = () => import('@/pages/UserProfile.vue');
const Downloads = () => import('@/pages/Downloads.vue');

const Lists = () => import('@/pages/lists/Lists.vue');
const List = () => import('@/pages/lists/List.vue');

const routes = [
  {
    path: '/',
    component: DashboardSelector,
    name: 'nav.dashboard_home',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/dashboard',
    component: DashboardSelector,
    name: 'nav.dashboard_no_incident',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/incident/:incident_id/dashboard',
    component: DashboardSelector,
    name: 'nav.dashboard',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/incident/:incident_id/dashboard',
    component: DashboardPage,
    name: 'nav.dashboard_page',
    meta: { layout: 'authenticated' },
    children: [
      {
        path: 'default',
        name: 'nav.dashboard_default',
        component: DefaultDashboard,
      },
      {
        path: 'phone_volunteer',
        name: 'nav.dashboard_phone_volunteer',
        component: PhoneVolunteerDashboard,
      },
      {
        path: 'command_center',
        name: 'nav.dashboard_command_center',
        component: CommandCenterDashboard,
      },
    ],
  },
  {
    path: '/select_dashboard',
    component: DashboardSelector,
    name: 'nav.dashboard_selector',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/profile',
    component: Profile,
    name: 'nav.profile',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/lists',
    component: Lists,
    name: 'nav.lists',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/lists/:id',
    component: List,
    name: 'nav.list',
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
    path: '/incident/:incident_id/reports',
    component: Reports,
    name: 'nav.reports',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/incident/:incident_id/report/:id',
    component: Report,
    name: 'nav.report',
    meta: { layout: 'authenticated' },
  },
  {
    path: '/incident/:incident_id/other_organizations',
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
  {
    path: '/incident/:incident_id/calendar',
    component: Calendar,
    name: 'nav.calendar',
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
