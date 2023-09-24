const routes = [
  {
    path: '/phone',
    component: import('./PhoneSystem.vue'),
    name: 'nav.phone',
    meta: {
      layout: 'authenticated',
    },
  },
];

export default routes;
