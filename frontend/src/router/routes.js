
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'Device', path: '', component: () => import('pages/Device.vue') }
    ]
  },
  {
    path: '/apps',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'Apps', path: '', component: () => import('pages/Apps.vue') },
      { name: 'AppsPath', path: ':path', component: () => import('pages/Apps.vue') }
    ]
  },
  {
    path: '/archive',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'Archive', path: '', component: () => import('pages/Archive.vue') }
    ]
  },
  {
    path: '/cli',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'CLI', path: '', component: () => import('pages/Cli.vue') }
    ]
  },
  {
    path: '/paint',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'Paint', path: '', component: () => import('pages/Paint.vue') }
    ]
  },
  {
    path: '/pulse-plotter',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'PulsePlotter', path: '', component: () => import('pages/Pulseplot.vue') }
    ]
  },
  {
    path: '/nfc-tools',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'NFCTools', path: '', component: () => import('pages/NfcTools.vue') }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
