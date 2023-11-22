<template>
  <q-layout
    view="hHr LpR lFf"
    class="column items-center q-py-lg full-width"
    :style="$q.screen.width >= 404 ? 'padding: 24px 26px; max-width: 1284px' : 'padding: 24px 6px'"
  >
    <q-page-container
      class="full-width"
    >
      <div
        class="apps-navbar row justify-end items-center full-width q-mb-xl"
      >
        <q-icon
          v-if="currentApp || flags.installedPage"
          name="mdi-chevron-left"
          size="56px"
          class="cursor-pointer q-mr-md"
          @click="appsStore.toggleFlag('installedPage', false); router.push({ name: 'Apps' })"
        ></q-icon>
        <q-icon
          v-else
          name="svguse:common-icons.svg#apps"
          size="56px"
          class="q-mr-md"
        ></q-icon>
        <div class="text-h4 q-mr-lg">Apps</div>
        <q-space />
        <div
          class="col-grow"
          :style="$q.screen.width <= 353 ? 'margin-top: 16px; width: 100%' : 'max-width: 300px; min-width: 140px; width: 100%; margin: 0.6rem 0;'"
        >
          <SearchBar/>
        </div>
        <div class="q-ml-md" :style="$q.screen.width <= 365 ? 'margin-top: 16px' : ''">
          <div>
            <q-btn
              flat
              rounded
              no-caps
              :color="flags.installedPage ? 'primary' : 'black'"
              style="font-weight: 400"
              icon="svguse:common-icons.svg#installed"
              :stack="$q.screen.width <= 365"
              @click="toggleInstalled"
              label="Installed"
            >
              <q-badge
                v-if="$q.screen.width > 365 && updatableAppsAmount > 0"
                color="positive"
                floating
                class="outdated-badge"
              >{{ updatableAppsAmount }}</q-badge>
            </q-btn>
          </div>
          <div class="q-ml-md">
            <q-btn
              flat
              rounded
              no-caps
              color="black"
              style="font-weight: 400"
              icon="mdi-github"
              label="Contribute"
              :stack="$q.screen.width <= 365"
              href="https://github.com/flipperdevices/flipper-application-catalog"
            />
          </div>
        </div>
      </div>
      <router-view
        @showDialog="$event => appsStore.toggleFlag($event, true)"
      />
      <q-dialog v-model="flags.outdatedFirmwareDialogPersistent" persistent>
        <q-card class="dialog">
          <!--<q-btn icon="close" flat round dense v-close-popup class="dialog-close-btn"/>-->

          <q-card-section class="q-pa-none q-ma-md" align="center">
            <q-icon name="mdi-alert-circle" color="negative" size="64px" />
            <div class="text-h6 q-my-sm">Outdated Firmware Version</div>
            <p>Firmware version on your Flipper is not supported.<br />Click the button below to update your device.</p>
          </q-card-section>

          <q-card-section class="q-pt-none" align="center">
            <q-btn
              outline
              color="primary"
              label="Update"
              @click="$router.push('/')"
            ></q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>
      <q-dialog v-model="flags.outdatedFirmwareDialog">
        <q-card class="dialog">
          <q-btn icon="close" flat round dense v-close-popup class="dialog-close-btn"/>

          <q-card-section class="q-pa-none q-ma-md" align="center">
            <q-icon name="mdi-alert-circle" color="negative" size="64px" />
            <div class="text-h6 q-my-sm">Outdated Firmware Version</div>
            <p>Firmware version on your Flipper does not support this app.<br />Click the button below to update your device.</p>
          </q-card-section>

          <q-card-section class="q-pt-none" align="center">
            <q-btn
              outline
              color="primary"
              label="Update"
              @click="$router.push('/')"
            ></q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>
      <q-dialog v-model="flags.outdatedAppDialog">
        <q-card class="dialog">
          <q-btn icon="close" flat round dense v-close-popup class="dialog-close-btn"/>

          <q-card-section class="q-pa-none q-ma-md" align="center">
            <q-icon name="mdi-alert-circle" color="negative" size="64px" />
            <div class="text-h6 q-my-sm">Outdated app</div>
            <p>Contact the developer to request further app support.</p>
          </q-card-section>

          <q-card-section class="q-pt-none" align="center">
            <q-btn
              outline
              color="primary"
              label="View on GitHub"
              :href="currentApp.currentVersion.links.manifestUri"
            ></q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>
      <q-dialog v-model="flags.connectFlipperDialog">
        <q-card class="dialog">
          <q-btn icon="close" flat round dense v-close-popup class="dialog-close-btn"/>

          <q-card-section class="q-pa-none q-ma-md" align="center">
            <q-icon name="mdi-alert-circle" color="primary" size="64px" />
            <div class="text-h6 q-my-sm">Flipper disconnected</div>
            <p>Plug in your Flipper and click the button below.</p>
          </q-card-section>

          <q-card-section class="q-pt-none" align="center">
            <q-btn
              outline
              color="primary"
              label="Connect"
              @click="mainStore.start()"
            ></q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>
      <q-dialog v-model="flags.mobileAppDialog">
        <q-card class="dialog">
          <q-btn icon="close" flat round dense v-close-popup class="dialog-close-btn"/>

          <q-card-section class="q-pa-none q-ma-md" align="center">
            <q-icon name="mdi-alert-circle" color="primary" size="64px" />
            <div class="text-h6 q-my-sm">Apps don't work in mobile browsers</div>
            <p>Mobile browsers can't connect to Flipper, meaning you won't be able to install apps.</p>
            <p>Get the official mobile app – it has the same features!</p>
          </q-card-section>

          <q-card-section class="q-pt-none" align="center">
            <q-btn
              outline
              color="primary"
              label="Download app"
              href="https://flpr.app"
            ></q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { fetchCategories, fetchAppsShort, fetchAppById } from 'util/fetch'
import SearchBar from 'components/SearchBar.vue'
import { log } from 'composables/useLog'
import { rpcErrorHandler } from 'composables/useRpcUtils'

import { useMainStore } from 'src/stores/main'
const mainStore = useMainStore()

const mainFlags = computed(() => mainStore.flags)
const flipper = computed(() => mainStore.flipper)
const info = computed(() => mainStore.info)

import { useAppsStore } from 'stores/apps'
const appsStore = useAppsStore()

const flags = computed(() => appsStore.flags)
const flipperReady = computed(() => appsStore.flipperReady)
const sdk = computed(() => appsStore.sdk)
const currentApp = computed(() => appsStore.currentApp)
const apps = computed(() => appsStore.apps)
const installedApps = computed(() => appsStore.installedApps)
const categories = computed(() => appsStore.categories)

const router = useRouter()
const route = useRoute()

const $q = useQuasar()
const componentName = 'Apps'

onMounted(() => {
  start()
  if ($q.platform.is.mobile) {
    appsStore.toggleFlag('mobileAppDialog', true)
  }
})

const updatableAppsAmount = computed(() => {
  return apps.value.filter(app => {
    if (app.isInstalled === true && app.installedVersion && app.currentVersion.status === 'READY') {
      if (sdk.value.api && app.installedVersion.api !== sdk.value.api) {
        return true
      }
      if (app.installedVersion.isOutdated) {
        return true
      }
    }
    return false
  }).length
})

const startRpc = async () => {
  appsStore.toggleFlag('rpcToggling', true)

  await flipper.value.startRPCSession()
    .catch(error => {
      console.error(error)
      log({
        level: 'error',
        message: `${componentName}: Error while starting RPC: ${error.toString()}`
      })
    })
  appsStore.toggleFlag('rpcActive', true)
  mainStore.setRpcStatus(true)

  appsStore.toggleFlag('rpcToggling', false)

  log({
    level: 'info',
    message: `${componentName}: RPC started`
  })
}

const toggleInstalled = () => {
  if (!mainFlags.value.connected) {
    appsStore.toggleFlag('connectFlipperDialog', true)
    return
  }

  router.push({ name: 'InstalledApps' })
}

const ensureCommonPaths = async () => {
  if (flipperReady.value) {
    let dir = await flipper.value.RPC('storageStat', { path: '/ext/apps_manifests' })
      .catch(error => rpcErrorHandler(componentName, error, 'storageStat'))
    if (!dir) {
      await flipper.value.RPC('storageMkdir', { path: '/ext/apps_manifests' })
        .catch(error => rpcErrorHandler(componentName, error, 'storageMkdir'))
    }

    dir = await flipper.value.RPC('storageStat', { path: '/ext/.tmp' })
      .catch(error => rpcErrorHandler(componentName, error, 'storageStat'))
    if (!dir) {
      await flipper.value.RPC('storageMkdir', { path: '/ext/.tmp' })
        .catch(error => rpcErrorHandler(componentName, error, 'storageMkdir'))
    }

    dir = await flipper.value.RPC('storageStat', { path: '/ext/.tmp/lab' })
      .catch(error => rpcErrorHandler(componentName, error, 'storageStat'))
    if (!dir) {
      await flipper.value.RPC('storageMkdir', { path: '/ext/.tmp/lab' })
        .catch(error => rpcErrorHandler(componentName, error, 'storageMkdir'))
    }
  }
}

const watchParams = async () => {
  const path = route.params.path
  appsStore.setInitalCategory(null)

  if (route.name === 'InstalledApps') {
    appsStore.toggleFlag('installedPage', true)
    return
  } else {
    appsStore.toggleFlag('installedPage', false)
  }
  if (!path) {
    return
  }

  const normalize = (string) => string.toLowerCase().replaceAll(' ', '-')
  const category = categories.value.find(e => normalize(e.name) === normalize(path))
  if (category) {
    appsStore.setInitalCategory(category)
  } else {
    try {
      const appFull = await fetchAppById(path, sdk.value)
      if (appFull.detail && appFull.detail.status === 'error') {
        router.push({ name: 'Apps' })
        return
      }
      appsStore.setCurrentApp(appFull)

      const installed = installedApps.value.find(e => e.id === appsStore.currentApp.id)

      const newCurrentApp = currentApp.value
      if (installed) {
        newCurrentApp.isInstalled = true
        newCurrentApp.installedVersion = installed.installedVersion

        newCurrentApp.installedVersion.isOutdated = currentApp.value.currentVersion.id !== currentApp.value.installedVersion.id
      }
      newCurrentApp.actionButton = appsStore.actionButton(newCurrentApp)

      appsStore.setCurrentApp(newCurrentApp)
      appsStore.setInitalCategory(categories.value.find(e => e.id === appFull.categoryId))
    } catch (error) {
      console.error(error)
    }
  }
}

const start = async () => {
  appsStore.toggleFlag('rpcActive', mainFlags.value.rpcActive)
  appsStore.toggleFlag('loadingInitial', true)

  const params = {
    limit: 500,
    offset: 0,
    sort_by: 'updated_at',
    sort_order: -1,
    is_latest_release_version: true
  }
  const categoryParams = {
    limit: 500
  }

  if (mainFlags.value.connected) {
    if (!flags.value.rpcActive) {
      // if flipper is connected without active RPC session (e.g. came from CLI app)
      await startRpc()
      return
    }
    if (flipperReady.value) {
      // when RPC session is up and device info retreived, get firmware API version and device target
      try {
        const api = `${info.value.firmware.api.major}.${info.value.firmware.api.minor}`
        const target = `f${info.value.firmware.target}`

        appsStore.setPropertySdk({ api })
        appsStore.setPropertySdk({ target })

        params.api = api
        params.target = target
        delete params.is_latest_release_version

        categoryParams.target = params.target
        categoryParams.api = params.api
      } catch (error) {
        appsStore.toggleFlag('outdatedFirmwareDialogPersistent', true)
      }

      await ensureCommonPaths()
      await appsStore.getInstalledApps()
    } else {
      return
    }
  } else {
    appsStore.setInstalledApps([])
    mainStore.start()
  }

  appsStore.setCategories(await fetchCategories(categoryParams))

  await watchParams()
  appsStore.toggleFlag('loadingInitial', false)

  let newApps = [], allApps = []
  do {
    newApps = await fetchAppsShort(params)
    allApps = allApps.concat(newApps)
    if (newApps.length === params.limit) {
      params.offset += params.limit
    }
  } while (newApps.length === params.limit)
  appsStore.setApps(allApps)

  await appsStore.updateInstalledApps(installedApps.value)
}

watch(flipperReady, () => {
  appsStore.toggleFlag('connectFlipperDialog', false)
  start()
})

watch(route, async () => {
  await watchParams()
})
</script>

<style lang="sass" scoped>
.apps-navbar
  div
    display: flex
    align-items: center
    height: 40px

.outdated-badge
  height: 17px !important
  position: relative
  top: -11px
  left: -72px
  font-size: 10px
  border: 1px #ffffff solid
  border-radius: 17px
</style>
src/composables/useLog
