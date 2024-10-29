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
    children: [
      {
        path: ':id',
        redirect: (to) => {
          return {
            path: `/incident/${to.params.incident_id}/phone/${to.params.id}/edit`,
          };
        },
      },
      {
        path: ':id/edit',
        name: 'nav.phone_edit_case',
        meta: { id: 'phone_case_edit', noscroll: true },
      },
    ],
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
