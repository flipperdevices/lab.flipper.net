
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
    path: '/cli',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/cli', component: () => import('pages/Cli.vue') }
    ]
  },
  {
    path: '/remote-cli',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/remote-cli', component: () => import('pages/RemoteCli.vue') }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
