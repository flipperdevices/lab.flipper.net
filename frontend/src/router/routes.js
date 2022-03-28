
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/', component: () => import('pages/Device.vue') }
    ]
  },
  {
    path: '/archive',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/archive', component: () => import('pages/Archive.vue') }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
