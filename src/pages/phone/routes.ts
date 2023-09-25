const PhoneSystem = () => import('./PhoneSystem.vue');

const routes = [
  {
    path: '/incident/:incident_id/phone',
    component: PhoneSystem,
    name: 'nav.phone',
    meta: {
      id: 'phone',
      layout: 'authenticated',
      noscroll: true,
    },
    // TODO: add children routes to handle currently viewing/editing worksite id. To be done on work & phone page refactor/unification
    // children: [],
  },
  {
    path: '/phone',
    component: PhoneSystem,
    name: 'nav.phone_no_incident',
    meta: {
      layout: 'authenticated',
    },
  },
];

export default routes;
