const Affiliates = () => import('@/pages/organization/Affiliates.vue');
const Organization = () => import('@/pages/organization/Index.vue');
const Invitations = () => import('@/pages/organization/Invitations.vue');
const Layers = () => import('@/pages/organization/Layers.vue');
const OrganizationProfile = () => import('@/pages/organization/Profile.vue');
const Users = () => import('@/pages/organization/Users.vue');
const UserView = () => import('@/pages/organization/UserView.vue');
const Teams = () => import('@/pages/organization/Teams.vue');
const TeamDetail = () => import('@/pages/organization/TeamDetail.vue');
const TeamUnassigned = () => import('@/pages/organization/TeamUnassigned.vue');

export const routes = [
  {
    path: '/organization',
    component: Organization,
    name: 'nav.organization',
    children: [
      {
        path: '',
        component: Invitations,
        name: 'nav.organization_invitations',
        meta: { id: 'invitations' },
      },
      {
        path: 'invitations',
        component: Invitations,
        name: 'nav.organization_invitations',
        meta: { id: 'invitations' },
      },
      {
        path: 'users',
        component: Users,
        name: 'nav.organization_users',
        children: [
          {
            path: ':user_id',
            component: UserView,
            name: 'nav.organization_user_detail',
            meta: { id: 'user_detail' },
          },
        ],
      },
      {
        path: 'affiliates',
        component: Affiliates,
        name: 'nav.organization_affiliates',
        meta: { id: 'affiliates' },
      },
      {
        path: 'profile',
        component: OrganizationProfile,
        name: 'nav.organization_profile',
      },
      {
        path: 'teams',
        component: Teams,
        name: 'nav.organization_teams',
        children: [
          {
            path: 'unassigned',
            component: TeamUnassigned,
            name: 'nav.organization_team_unassigned',
            meta: { id: 'team_unassigned' },
          },
          {
            path: ':team_id',
            component: TeamDetail,
            name: 'nav.organization_team_detail',
            meta: { id: 'team_detail' },
          },
        ],
      },
      {
        path: 'layers',
        component: Layers,
        name: 'nav.organization_layers',
      },
    ],
    meta: { layout: 'authenticated' },
  },
];

export default routes;
