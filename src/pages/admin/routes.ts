// import AdminEvents from '@/pages/admin/AdminEvents.vue';
// import AdminCosts from '@/pages/admin/AdminCosts.vue';

const AdminPage = () => import('./Index.vue');
const AdminDashboard = () => import('./AdminDashboard.vue');
const AdminOrganization = () => import('./AdminOrganization.vue');
const AdminEventStream = () =>
  import('../../components/admin/AdminEventStream.vue');
const ZendeskTicketDashboard = () =>
  import('@/pages/admin/ZendeskTicketDashboard.vue');
const AdminBugs = () => import('@/pages/admin/AdminBugs.vue');
const AdminCms = () => import('./AdminCms.vue');
const AdminLocalizations = () => import('@/pages/admin/AdminLocalizations.vue');
const AdminIncidentWizard = () => import('./AdminIncidentWizard.vue');
const AdminRAG = () => import('./AdminRAG.vue');
const AdminReportGenerator = () => import('./AdminReportGenerator.vue');
const AdminGodMode = () => import('./AdminGodMode.vue');
const AdminSendBulkSms = () => import('./AdminSendBulkSms.vue');
const AdminSendBulkEmail = () => import('./AdminSendBulkEmail.vue');
const AdminMagazine = () => import('./AdminMagazine.vue');

const routes = [
  {
    path: '/admin',
    component: AdminPage,
    name: 'nav.admin',
    meta: {
      layout: 'authenticated',
      admin: true,
    },
    children: [
      {
        path: 'home',
        name: 'nav.admin_dashboard',
        component: AdminDashboard,
        alias: '',
      },
      {
        path: 'organization/:organization_id',
        name: 'nav.admin_organization',
        component: AdminOrganization,
      },
      // {
      //   path: 'events',
      //   name: 'nav.admin_events',
      //   component: AdminEvents,
      // },
      {
        path: 'event_stream',
        name: 'nav.admin_event_stream',
        component: AdminEventStream,
      },
      {
        path: 'tickets',
        name: 'nav.admin_tickets',
        component: ZendeskTicketDashboard,
      },
      {
        path: 'bugs',
        name: 'nav.bugs',
        component: AdminBugs,
      },
      // {
      //   path: 'costs',
      //   name: 'nav.costs',
      //   component: AdminCosts,
      // },
      {
        path: 'cms',
        name: 'nav.cms',
        component: AdminCms,
      },
      {
        path: 'localizations',
        name: 'nav.localizations',
        component: AdminLocalizations,
      },
      {
        path: 'incident_wizard',
        name: 'nav.incident_wizard',
        component: AdminIncidentWizard,
      },
      {
        path: 'incident_wizard/:incident_id',
        name: 'nav.incident_wizard_detail',
        component: AdminIncidentWizard,
      },
      {
        path: 'rag',
        name: 'nav.rag',
        component: AdminRAG,
      },
      {
        path: 'reports',
        name: 'nav.reports',
        component: AdminReportGenerator,
      },
      {
        path: 'god_mode',
        name: 'nav.god_mode',
        component: AdminGodMode,
      },
      {
        path: 'send_bulk_sms',
        name: 'nav.send_bulk_sms',
        component: AdminSendBulkSms,
      },
      {
        path: 'send_bulk_email',
        name: 'nav.send_bulk_email',
        component: AdminSendBulkEmail,
      },
      {
        path: 'magazine',
        name: 'nav.admin_magazine',
        component: AdminMagazine,
      },
    ],
  },
];

export default routes;
