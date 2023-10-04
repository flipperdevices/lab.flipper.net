<template>
  <q-page
    class="column items-center q-py-lg full-width"
    :style="$q.screen.width >= 404 ? 'padding: 24px 26px; max-width: 1284px' : 'padding: 24px 6px'"
  >
    <div
      class="apps-navbar row justify-end items-center full-width q-mb-xl"
      :class="action.type ? 'disabled' : ''"
    >
      <q-icon
        v-if="currentApp || flags.installedPage"
        name="mdi-chevron-left"
        size="56px"
        class="cursor-pointer q-mr-md"
        @click="flags.installedPage = false; router.push('/apps')"
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
        <SearchBar
          :sdk="sdk"
          @setCategory="setCategory"
          @openApp="openApp"
        />
      </div>
      <div class="q-ml-md" :style="$q.screen.width <= 365 ? 'margin-top: 16px' : ''">
        <div>
          <q-btn
            flat
            no-caps
            dense
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
            no-caps
            dense
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
    <template v-if="flags.installedPage">
      <InstalledApps
        :apps="apps"
        :flipper="flipper"
        :action="action"
        :batch="batch"
        :installedApps="installedApps"
        :sdk="sdk"
        @showNotif="passNotif"
        @openApp="openApp"
        @action="handleAction"
        @batchUpdate="batchUpdate"
      />
    </template>
    <template v-else-if="!currentApp">
      <AppList
        :categories="categories"
        :apps="apps"
        :initialCategory="initialCategory"
        :flipper="flipper"
        :connected="connected"
        :rpcActive="rpcActive"
        :action="action"
        @showNotif="passNotif"
        @openApp="openApp"
        @action="handleAction"
        @batchUpdate="batchUpdate"
      />
    </template>
    <template v-else>
      <AppPage
        :categories="categories"
        :app="currentApp"
        :flipper="flipper"
        :connected="connected"
        :rpcActive="rpcActive"
        :action="action"
        @showNotif="passNotif"
        @action="handleAction"
        @showDialog="$event => flags[$event] = true"
      />
    </template>

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
            @click="$emit('connect')"
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
    <!--<q-dialog v-model="flags.TOSDialog">
      <q-card class="dialog">
        <q-card-section>
          <div class="text-h6">Terms of Service</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p>You accept our full Terms of Service by pressing Agree button.</p>
        </q-card-section>

        <q-card-section class="q-pt-none text-center">
          <a href="" class="text-dark" style="text-decoration: none">
            <q-icon name="svguse:common-icons.svg#link" style="position: relative; top: -2px; left: -2px"/>
            Open Full Terms of Service
          </a>
        </q-card-section>

        <q-card-section class="q-pt-none flex justify-between">
          <q-btn
            outline
            color="primary"
            label="Reject"
            v-close-popup
          ></q-btn>
          <q-btn
            unelevated
            color="primary"
            label="Agree"
            v-close-popup
          ></q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>-->
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchBar from 'components/SearchBar.vue'
import AppList from 'components/AppList.vue'
import AppPage from 'components/AppPage.vue'
import InstalledApps from 'components/InstalledApps.vue'
import { fetchCategories, fetchAppsShort, fetchAppById, fetchAppFap, fetchAppsVersions } from '../util/util'
import asyncSleep from 'simple-async-sleep'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'Apps',

  props: {
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean,
    info: Object
  },

  components: {
    SearchBar,
    AppList,
    AppPage,
    InstalledApps
  },

  setup (props, { emit }) {
    const $q = useQuasar()
    const componentName = 'Apps'

    onMounted(() => {
      start()
      if ($q.platform.is.mobile) {
        flags.value.mobileAppDialog = true
      }
    })

    const router = useRouter()
    const route = useRoute()

    const flags = ref({
      restarting: false,
      rpcActive: false,
      rpcToggling: false,
      installedPage: false,
      outdatedFirmwareDialogPersistent: false,
      outdatedFirmwareDialog: false,
      outdatedAppDialog: false,
      connectFlipperDialog: false,
      mobileAppDialog: false,
      loadingInitial: true
    })

    const initialCategory = ref(null)
    const currentApp = ref(null)
    const apps = ref([])
    const installedApps = ref([])
    const categories = ref([])
    const action = ref({
      type: '',
      progress: 0,
      id: ''
    })
    const batch = ref({
      totalCount: 0,
      doneCount: 0,
      failed: []
    })
    const sdk = ref({
      target: null,
      api: null
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

    const flipperReady = computed(() => flags.value.rpcActive && props.info !== null && props.info.doneReading)

    const handleAction = (app, actionType) => {
      if (!props.connected) {
        action.value.type = actionType
        flags.value.connectFlipperDialog = true
        setTimeout(() => {
          action.value.type = ''
        }, 300)
        return
      }
      if (!actionType) {
        return
      }
      action.value.type = actionType
      action.value.progress = 0
      action.value.id = app.id

      switch (action.value.type) {
        case 'install':
          return installApp(app)
        case 'update':
          return updateApp(app)
        case 'delete':
          return deleteApp(app)
      }
    }

    const installApp = async (app) => {
      const paths = {
        appDir: `/ext/apps/${categories.value.find(e => e.id === app.categoryId).name}`,
        manifestDir: '/ext/apps_manifests',
        tempDir: '/ext/.tmp/lab/'
      }
      await ensureCategoryPaths()

      // fetch fap
      const fap = await fetchAppFap({
        versionId: app.currentVersion.id,
        target: `f${props.info.firmware.target}`,
        api: `${props.info.firmware.api.major}.${props.info.firmware.api.minor}`
      }).catch(error => {
        emit('showNotif', {
          message: error.toString(),
          color: 'negative'
        })
        emit('log', {
          level: 'error',
          message: `${componentName}: Installing app '${app.name}' (${app.alias}): ${error}`
        })
      })
      if (!fap) {
        action.value.type = ''
        action.value.progress = 0
        return
      }
      action.value.progress = 0.33
      await asyncSleep(300)
      emit('log', {
        level: 'debug',
        message: `${componentName}: Installing app '${app.name}' (${app.alias}): fetched .fap`
      })

      // generate manifest
      function urlContentToDataUri (url) {
        return fetch(url)
          .then(response => response.blob())
          .then(blob => new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = function () { resolve(this.result) }
            reader.readAsDataURL(blob)
          }))
      }
      const dataUri = await urlContentToDataUri(app.currentVersion.iconUri)
      const base64Icon = dataUri.split(',')[1]
      const manifestText = `Filetype: Flipper Application Installation Manifest\r\nVersion: 1\r\nFull Name: ${app.currentVersion.name}\r\nIcon: ${base64Icon}\r\nVersion Build API: ${props.info.firmware.api.major}.${props.info.firmware.api.minor}\r\nUID: ${app.id}\r\nVersion UID: ${app.currentVersion.id}\r\nPath: ${paths.appDir}/${app.alias}.fap`
      const manifestFile = new TextEncoder().encode(manifestText)
      action.value.progress = 0.45
      await asyncSleep(300)

      // upload manifest to temp
      await props.flipper.RPC('storageWrite', { path: `${paths.tempDir}/${app.id}.fim`, buffer: manifestFile })
        .then(() => {
          emit('log', {
            level: 'debug',
            message: `${componentName}: Installing app '${app.name}' (${app.alias}): uploaded manifest (temp)`
          })
        })
        .catch(error => rpcErrorHandler(error, 'storageWrite'))
      action.value.progress = 0.5
      await asyncSleep(300)

      // upload fap to temp
      await props.flipper.RPC('storageWrite', { path: `${paths.tempDir}/${app.id}.fap`, buffer: fap })
        .then(() => {
          emit('log', {
            level: 'debug',
            message: `${componentName}: Installing app '${app.name}' (${app.alias}): uploaded .fap (temp)`
          })
        })
        .catch(error => rpcErrorHandler(error, 'storageWrite'))
      action.value.progress = 0.75
      await asyncSleep(300)

      // move manifest and fap
      let dirList = await props.flipper.RPC('storageList', { path: paths.manifestDir })
        .catch(error => rpcErrorHandler(error, 'storageList'))
      const oldManifest = dirList.find(e => e.name === `${app.alias}.fim`)
      if (oldManifest) {
        await props.flipper.RPC('storageRemove', { path: `${paths.manifestDir}/${app.alias}.fim` })
          .then(() => {
            emit('log', {
              level: 'debug',
              message: `${componentName}: Installing app '${app.name}' (${app.alias}): removed old manifest`
            })
          })
          .catch(error => rpcErrorHandler(error, 'storageRemove'))
      }

      await props.flipper.RPC('storageRename', { oldPath: `${paths.tempDir}/${app.id}.fim`, newPath: `${paths.manifestDir}/${app.alias}.fim` })
        .then(() => {
          emit('log', {
            level: 'debug',
            message: `${componentName}: Installing app '${app.name}' (${app.alias}): moved new manifest`
          })
        })
        .catch(error => rpcErrorHandler(error, 'storageRename'))
      action.value.progress = 0.8
      await asyncSleep(300)

      dirList = await props.flipper.RPC('storageList', { path: paths.appDir })
        .catch(error => rpcErrorHandler(error, 'storageList'))
      const oldFap = dirList.find(e => e.name === `${app.alias}.fap`)
      if (oldFap) {
        await props.flipper.RPC('storageRemove', { path: `${paths.appDir}/${app.alias}.fap` })
          .then(() => {
            emit('log', {
              level: 'debug',
              message: `${componentName}: Installing app '${app.name}' (${app.alias}): removed old .fap`
            })
          })
          .catch(error => rpcErrorHandler(error, 'storageRemove'))
      }

      await props.flipper.RPC('storageRename', { oldPath: `${paths.tempDir}/${app.id}.fap`, newPath: `${paths.appDir}/${app.alias}.fap` })
        .then(() => {
          emit('log', {
            level: 'debug',
            message: `${componentName}: Installing app '${app.name}' (${app.alias}): moved new .fap`
          })
        })
        .catch(error => rpcErrorHandler(error, 'storageRename'))
      action.value.progress = 1
      await asyncSleep(300)

      // post-install
      await updateInstalledApps()

      action.value.type = ''
      action.value.progress = 0
    }

    const updateApp = async (app) => {
      return installApp(app)
    }

    const deleteApp = async (app) => {
      const paths = {
        appDir: '',
        manifestDir: '/ext/apps_manifests'
      }
      if (app.categoryId) {
        paths.appDir = `/ext/apps/${categories.value.find(e => e.id === app.categoryId).name}`
      } else {
        paths.appDir = app.path.slice(0, app.path.lastIndexOf('/'))
        app.alias = app.path.slice(app.path.lastIndexOf('/') + 1, -4)
      }

      await ensureCategoryPaths()

      // remove .fap
      let dirList = await props.flipper.RPC('storageList', { path: paths.appDir })
        .catch(error => rpcErrorHandler(error, 'storageList'))
      const fap = dirList.find(e => e.name === `${app.alias}.fap`)
      if (fap) {
        await props.flipper.RPC('storageRemove', { path: `${paths.appDir}/${app.alias}.fap` })
          .then(() => {
            emit('log', {
              level: 'debug',
              message: `${componentName}: Deleting app '${app.name}' (${app.alias}): removed .fap`
            })
          })
          .catch(error => rpcErrorHandler(error, 'storageRemove'))
      }
      action.value.progress = 0.5

      // remove manifest
      dirList = await props.flipper.RPC('storageList', { path: paths.manifestDir })
        .catch(error => rpcErrorHandler(error, 'storageList'))
      const manifest = dirList.find(e => e.name === `${app.alias}.fim`)
      if (manifest) {
        await props.flipper.RPC('storageRemove', { path: `${paths.manifestDir}/${app.alias}.fim` })
          .then(() => {
            emit('log', {
              level: 'debug',
              message: `${componentName}: Deleting app '${app.name}' (${app.alias}): removed manifest`
            })
          })
          .catch(error => rpcErrorHandler(error, 'storageRemove'))
      }
      action.value.progress = 1

      // post-delete
      await updateInstalledApps()

      action.value.type = ''
      action.value.progress = 0
    }

    const batchUpdate = async (apps) => {
      batch.value.totalCount = apps.length
      batch.value.doneCount = 0
      action.value.type = 'update'

      for (const app of apps) {
        try {
          await updateApp(app)
          batch.value.doneCount++
        } catch (error) {
          console.error(error)
          batch.value.failed.push(app)
        }
      }
      batch.value.totalCount = 0
      batch.value.doneCount = 0
    }

    const setCategory = (name) => {
      const category = categories.value.find(e => e.name === name)
      let prefix = ''
      if (!location.pathname.startsWith('/apps/')) {
        prefix = 'apps/'
      }
      router.push(prefix + encodeURIComponent(category.name.toLowerCase().replaceAll(' ', '-')))
    }

    const startRpc = async () => {
      flags.value.rpcToggling = true
      await props.flipper.startRPCSession()
        .catch(error => {
          console.error(error)
          emit('log', {
            level: 'error',
            message: `${componentName}: Error while starting RPC: ${error.toString()}`
          })
        })
      flags.value.rpcActive = true
      emit('setRpcStatus', true)
      flags.value.rpcToggling = false
      emit('log', {
        level: 'info',
        message: `${componentName}: RPC started`
      })
    }

    const stopRpc = async () => {
      flags.value.rpcToggling = true
      await props.flipper.setReadingMode('text', 'promptBreak')
      flags.value.rpcActive = false
      emit('setRpcStatus', false)
      flags.value.rpcToggling = false
      emit('log', {
        level: 'info',
        message: `${componentName}: RPC stopped`
      })
    }

    const passNotif = (config) => {
      emit('showNotif', config)
    }
    const passLog = (config) => {
      emit('log', config)
    }

    const rpcErrorHandler = (error, command) => {
      error = error.toString()
      emit('showNotif', {
        message: `RPC error in command '${command}': ${error}`,
        color: 'negative'
      })
      emit('log', {
        level: 'error',
        message: `${componentName}: RPC error in command '${command}': ${error}`
      })
    }

    const toggleInstalled = () => {
      if (flags.value.installedPage) {
        flags.value.installedPage = false
        router.push('/apps')
      } else {
        router.push('/apps/installed')
      }
    }

    const ensureCommonPaths = async () => {
      if (flipperReady.value) {
        let dir = await props.flipper.RPC('storageStat', { path: '/ext/apps_manifests' })
          .catch(error => rpcErrorHandler(error, 'storageStat'))
        if (!dir) {
          await props.flipper.RPC('storageMkdir', { path: '/ext/apps_manifests' })
            .catch(error => rpcErrorHandler(error, 'storageMkdir'))
        }

        dir = await props.flipper.RPC('storageStat', { path: '/ext/.tmp' })
          .catch(error => rpcErrorHandler(error, 'storageStat'))
        if (!dir) {
          await props.flipper.RPC('storageMkdir', { path: '/ext/.tmp' })
            .catch(error => rpcErrorHandler(error, 'storageMkdir'))
        }

        dir = await props.flipper.RPC('storageStat', { path: '/ext/.tmp/lab' })
          .catch(error => rpcErrorHandler(error, 'storageStat'))
        if (!dir) {
          await props.flipper.RPC('storageMkdir', { path: '/ext/.tmp/lab' })
            .catch(error => rpcErrorHandler(error, 'storageMkdir'))
        }
      }
    }

    const ensureCategoryPaths = async () => {
      for (const category of categories.value) {
        const dir = await props.flipper.RPC('storageStat', { path: `/ext/apps/${category.name}` })
          .catch(error => rpcErrorHandler(error, 'storageStat'))
        if (!dir) {
          await props.flipper.RPC('storageMkdir', { path: `/ext/apps/${category.name}` })
            .catch(error => rpcErrorHandler(error, 'storageMkdir'))
        }
      }
    }

    const getInstalledApps = async () => {
      const installed = []
      if (flipperReady.value) {
        const manifestsList = await props.flipper.RPC('storageList', { path: '/ext/apps_manifests' })
          .catch(error => rpcErrorHandler(error, 'storageList'))
        const decoder = new TextDecoder()
        for (const file of manifestsList) {
          const manifestFile = await props.flipper.RPC('storageRead', { path: `/ext/apps_manifests/${file.name}` })
            .catch(error => rpcErrorHandler(error, 'storageRead'))
          const manifest = decoder.decode(manifestFile)
          const app = {
            id: '',
            name: '',
            icon: '',
            installedVersion: {
              id: '',
              api: ''
            },
            path: ''
          }
          for (const line of manifest.replaceAll('\r', '').split('\n')) {
            const key = line.slice(0, line.indexOf(': '))
            const value = line.slice(line.indexOf(': ') + 2)
            switch (key) {
              case 'UID':
                app.id = value
                break
              case 'Full Name':
                app.name = value
                break
              case 'Icon':
                app.icon = value
                break
              case 'Version UID':
                app.installedVersion.id = value
                break
              case 'Version Build API':
                app.installedVersion.api = value
                break
              case 'Path':
                app.path = value
                break
            }
          }
          installed.push(app)
        }
      }

      const versions = await fetchAppsVersions(installed.map(app => app.installedVersion.id))
      for (const version of versions) {
        const app = installed.find(app => app.id === version.applicationId)
        if (app) {
          app.installedVersion = { ...app.installedVersion, ...version }
        }
      }
      installedApps.value = installed
    }

    const updateInstalledApps = async (installed) => {
      if (!installed) {
        await getInstalledApps()
      }
      for (const app of apps.value) {
        const installed = installedApps.value.find(e => e.id === app.id)
        if (installed) {
          app.isInstalled = true
          app.installedVersion = installed.installedVersion

          app.installedVersion.isOutdated = app.currentVersion.id !== app.installedVersion.id
        } else {
          app.isInstalled = false
          app.installedVersion = null
        }

        app.actionButton = actionButton(app)

        if (currentApp.value && app.id === currentApp.value.id) {
          currentApp.value.isInstalled = app.isInstalled
          currentApp.value.installedVersion = app.installedVersion
        }
      }
      console.log('installed apps', installedApps.value)
    }

    const actionButton = (app) => {
      if (!sdk.value.api) {
        return { text: 'Install', class: 'bg-primary' }
      }
      if (app.isInstalled && app.installedVersion) {
        if (app.installedVersion.api !== sdk.value.api) {
          if (app.currentVersion.status === 'READY') {
            return { text: 'Update', class: 'bg-positive' }
          }
          return { text: 'Installed', class: 'bg-grey-6' }
        } else {
          if (app.installedVersion.isOutdated) {
            return { text: 'Update', class: 'bg-positive' }
          } else {
            return { text: 'Installed', class: 'bg-grey-6' }
          }
        }
      }
      return {
        text: 'Install',
        class: 'bg-primary'
      }
    }

    const watchParams = async () => {
      currentApp.value = null
      initialCategory.value = null
      const path = route.params.path
      if (!path) {
        return
      }
      if (path === 'installed') {
        flags.value.installedPage = true
        if (!props.connected) {
          flags.value.connectFlipperDialog = true
        }
        return
      }

      flags.value.installedPage = false
      const normalize = (string) => string.toLowerCase().replaceAll(' ', '-')
      const category = categories.value.find(e => normalize(e.name) === normalize(path))
      if (category) {
        initialCategory.value = category
      } else {
        try {
          const appFull = await fetchAppById(path, sdk.value)
          if (appFull.detail && appFull.detail.status === 'error') {
            router.push('/apps')
            return
          }
          currentApp.value = appFull

          const installed = installedApps.value.find(e => e.id === currentApp.value.id)
          if (installed) {
            currentApp.value.isInstalled = true
            currentApp.value.installedVersion = installed.installedVersion

            currentApp.value.installedVersion.isOutdated = currentApp.value.currentVersion.id !== currentApp.value.installedVersion.id
          }
          currentApp.value.actionButton = actionButton(currentApp.value)
          console.log('current app', currentApp.value)

          initialCategory.value = categories.value.find(e => e.id === appFull.categoryId)
        } catch (error) {
          console.error(error)
        }
      }
    }

    const start = async () => {
      flags.value.rpcActive = props.rpcActive
      flags.value.loadingInitial = true
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

      if (props.connected) {
        if (!flags.value.rpcActive) {
          // if flipper is connected without active RPC session (e.g. came from CLI app)
          await startRpc()
          return
        }
        if (flipperReady.value) {
          // when RPC session is up and device info retreived, get firmware API version and device target
          try {
            sdk.value.api = `${props.info.firmware.api.major}.${props.info.firmware.api.minor}`
            sdk.value.target = `f${props.info.firmware.target}`

            params.target = `f${props.info.firmware.target}`
            params.api = `${props.info.firmware.api.major}.${props.info.firmware.api.minor}`
            delete params.is_latest_release_version

            categoryParams.target = params.target
            categoryParams.api = params.api
          } catch (error) {
            flags.value.outdatedFirmwareDialogPersistent = true
          }

          await ensureCommonPaths()
          await getInstalledApps()
        } else {
          return
        }
      } else {
        installedApps.value = []
        emit('connect')
      }

      categories.value = await fetchCategories(categoryParams)

      await watchParams()
      flags.value.loadingInitial = false

      let newApps = [], allApps = []
      do {
        newApps = await fetchAppsShort(params)
        allApps = allApps.concat(newApps)
        if (newApps.length === params.limit) {
          params.offset += params.limit
        }
      } while (newApps.length === params.limit)
      apps.value = allApps
      await updateInstalledApps(props.installedApps)

      console.log('compatible apps', apps.value)
    }

    watch(flipperReady, () => {
      flags.value.connectFlipperDialog = false
      start()
    })

    watch(route, async (to, from) => {
      await watchParams()
    })

    const openApp = async (app) => {
      router.push({ name: 'AppsPath', params: { path: app.alias } })
    }

    return {
      componentName,

      flags,
      router,
      initialCategory,
      currentApp,
      apps,
      installedApps,
      categories,
      action,
      batch,
      sdk,

      updatableAppsAmount,

      handleAction,
      installApp,
      updateApp,
      deleteApp,
      batchUpdate,
      setCategory,
      startRpc,
      stopRpc,
      passNotif,
      passLog,
      rpcErrorHandler,
      toggleInstalled,
      ensureCommonPaths,
      ensureCategoryPaths,
      getInstalledApps,
      updateInstalledApps,
      actionButton,
      openApp
    }
  }
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
