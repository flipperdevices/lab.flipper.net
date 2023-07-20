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
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from 'components/SearchBar.vue'
import AppList from 'components/AppList.vue'
import AppPage from 'components/AppPage.vue'
import InstalledApps from 'components/InstalledApps.vue'
import { fetchCategories, fetchAppsShort, fetchAppById, fetchAppFap, fetchAppsVersions } from '../util/util'
import asyncSleep from 'simple-async-sleep'

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

  setup () {
    const router = useRouter()
    return {
      componentName: 'Apps',

      flags: ref({
        restarting: false,
        rpcActive: false,
        rpcToggling: false,
        installedPage: false,
        outdatedFirmwareDialogPersistent: false,
        outdatedFirmwareDialog: false,
        outdatedAppDialog: false,
        connectFlipperDialog: false,
        mobileAppDialog: false,
        // TOSDialog: true,
        loadingInitial: true
      }),
      router,
      initialCategory: ref(null),
      currentApp: ref(null),
      apps: ref([]),
      installedApps: ref([]),
      categories: ref([]),
      action: ref({
        type: '',
        progress: 0,
        id: ''
      }),
      batch: ref({
        totalCount: 0,
        doneCount: 0,
        failed: []
      }),
      sdk: ref({
        target: null,
        api: null
      })
    }
  },

  watch: {
    flipperReady () {
      this.start()
    },

    async $route (to, from) {
      await this.watchParams()
    }
  },

  computed: {
    flipperReady () {
      return this.rpcActive && this.info !== null && this.info.doneReading
    },

    updatableAppsAmount () {
      return this.apps.filter(app => {
        if (app.isInstalled === true && app.installedVersion && app.currentVersion.status === 'READY') {
          if (this.sdk.api && app.installedVersion.api !== this.sdk.api) {
            return true
          }
          if (app.installedVersion.isOutdated) {
            return true
          }
        }
        return false
      }).length
    }
  },

  methods: {
    log (e) {
      console.log(e)
    },
    async openApp (app) {
      let prefix = ''
      if (!location.pathname.startsWith('/apps/')) {
        prefix = 'apps/'
      }
      this.router.push(prefix + encodeURIComponent(app.alias))
    },

    handleAction (app, actionType) {
      if (!this.connected) {
        this.action.type = actionType
        this.flags.connectFlipperDialog = true
        setTimeout(() => {
          this.action.type = ''
        }, 300)
        return
      }
      if (!actionType) {
        return
      }
      this.action.type = actionType
      this.action.progress = 0
      this.action.id = app.id
      return this[`${this.action.type}App`](app)
    },

    async installApp (app) {
      const paths = {
        appDir: `/ext/apps/${this.categories.find(e => e.id === app.categoryId).name}`,
        manifestDir: '/ext/apps_manifests',
        tempDir: '/ext/.tmp/lab/'
      }
      await this.ensureCategoryPaths()

      // fetch fap
      const fap = await fetchAppFap({
        versionId: app.currentVersion.id,
        target: `f${this.info.firmware.target}`,
        api: `${this.info.firmware.api.major}.${this.info.firmware.api.minor}`
      }).catch(error => {
        this.$emit('showNotif', {
          message: error.toString(),
          color: 'negative'
        })
        this.$emit('log', {
          level: 'error',
          message: `${this.componentName}: Installing app '${app.name}' (${app.alias}): ${error}`
        })
      })
      if (!fap) {
        this.action.type = ''
        this.action.progress = 0
        return
      }
      this.action.progress = 0.33
      await asyncSleep(300)
      this.$emit('log', {
        level: 'debug',
        message: `${this.componentName}: Installing app '${app.name}' (${app.alias}): fetched .fap`
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
      const manifestText = `Filetype: Flipper Application Installation Manifest\r\nVersion: 1\r\nFull Name: ${app.currentVersion.name}\r\nIcon: ${base64Icon}\r\nVersion Build API: ${this.info.firmware.api.major}.${this.info.firmware.api.minor}\r\nUID: ${app.id}\r\nVersion UID: ${app.currentVersion.id}\r\nPath: ${paths.appDir}/${app.alias}.fap`
      const manifestFile = new TextEncoder().encode(manifestText)
      this.action.progress = 0.45
      await asyncSleep(300)

      // upload manifest to temp
      await this.flipper.RPC('storageWrite', { path: `${paths.tempDir}/${app.id}.fim`, buffer: manifestFile })
        .then(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: Installing app '${app.name}' (${app.alias}): uploaded manifest (temp)`
          })
        })
        .catch(error => this.rpcErrorHandler(error, 'storageWrite'))
      this.action.progress = 0.5
      await asyncSleep(300)

      // upload fap to temp
      await this.flipper.RPC('storageWrite', { path: `${paths.tempDir}/${app.id}.fap`, buffer: fap })
        .then(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: Installing app '${app.name}' (${app.alias}): uploaded .fap (temp)`
          })
        })
        .catch(error => this.rpcErrorHandler(error, 'storageWrite'))
      this.action.progress = 0.75
      await asyncSleep(300)

      // move manifest and fap
      let dirList = await this.flipper.RPC('storageList', { path: paths.manifestDir })
        .catch(error => this.rpcErrorHandler(error, 'storageList'))
      const oldManifest = dirList.find(e => e.name === `${app.alias}.fim`)
      if (oldManifest) {
        await this.flipper.RPC('storageRemove', { path: `${paths.manifestDir}/${app.alias}.fim` })
          .then(() => {
            this.$emit('log', {
              level: 'debug',
              message: `${this.componentName}: Installing app '${app.name}' (${app.alias}): removed old manifest`
            })
          })
          .catch(error => this.rpcErrorHandler(error, 'storageRemove'))
      }

      await this.flipper.RPC('storageRename', { oldPath: `${paths.tempDir}/${app.id}.fim`, newPath: `${paths.manifestDir}/${app.alias}.fim` })
        .then(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: Installing app '${app.name}' (${app.alias}): moved new manifest`
          })
        })
        .catch(error => this.rpcErrorHandler(error, 'storageRename'))
      this.action.progress = 0.8
      await asyncSleep(300)

      dirList = await this.flipper.RPC('storageList', { path: paths.appDir })
        .catch(error => this.rpcErrorHandler(error, 'storageList'))
      const oldFap = dirList.find(e => e.name === `${app.alias}.fap`)
      if (oldFap) {
        await this.flipper.RPC('storageRemove', { path: `${paths.appDir}/${app.alias}.fap` })
          .then(() => {
            this.$emit('log', {
              level: 'debug',
              message: `${this.componentName}: Installing app '${app.name}' (${app.alias}): removed old .fap`
            })
          })
          .catch(error => this.rpcErrorHandler(error, 'storageRemove'))
      }

      await this.flipper.RPC('storageRename', { oldPath: `${paths.tempDir}/${app.id}.fap`, newPath: `${paths.appDir}/${app.alias}.fap` })
        .then(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: Installing app '${app.name}' (${app.alias}): moved new .fap`
          })
        })
        .catch(error => this.rpcErrorHandler(error, 'storageRename'))
      this.action.progress = 1
      await asyncSleep(300)

      // post-install
      await this.updateInstalledApps()

      this.action.type = ''
      this.action.progress = 0
    },

    async updateApp (app) {
      return this.installApp(app)
    },

    async deleteApp (app) {
      const paths = {
        appDir: '',
        manifestDir: '/ext/apps_manifests'
      }
      if (app.categoryId) {
        paths.appDir = `/ext/apps/${this.categories.find(e => e.id === app.categoryId).name}`
      } else {
        paths.appDir = app.path.slice(0, app.path.lastIndexOf('/'))
        app.alias = app.path.slice(app.path.lastIndexOf('/') + 1, -4)
      }

      await this.ensureCategoryPaths()

      // remove .fap
      let dirList = await this.flipper.RPC('storageList', { path: paths.appDir })
        .catch(error => this.rpcErrorHandler(error, 'storageList'))
      const fap = dirList.find(e => e.name === `${app.alias}.fap`)
      if (fap) {
        await this.flipper.RPC('storageRemove', { path: `${paths.appDir}/${app.alias}.fap` })
          .then(() => {
            this.$emit('log', {
              level: 'debug',
              message: `${this.componentName}: Deleting app '${app.name}' (${app.alias}): removed .fap`
            })
          })
          .catch(error => this.rpcErrorHandler(error, 'storageRemove'))
      }
      this.action.progress = 0.5

      // remove manifest
      dirList = await this.flipper.RPC('storageList', { path: paths.manifestDir })
        .catch(error => this.rpcErrorHandler(error, 'storageList'))
      const manifest = dirList.find(e => e.name === `${app.alias}.fim`)
      if (manifest) {
        await this.flipper.RPC('storageRemove', { path: `${paths.manifestDir}/${app.alias}.fim` })
          .then(() => {
            this.$emit('log', {
              level: 'debug',
              message: `${this.componentName}: Deleting app '${app.name}' (${app.alias}): removed manifest`
            })
          })
          .catch(error => this.rpcErrorHandler(error, 'storageRemove'))
      }
      this.action.progress = 1

      // post-delete
      await this.updateInstalledApps()

      this.action.type = ''
      this.action.progress = 0
    },

    async batchUpdate (apps) {
      this.batch.totalCount = apps.length
      this.batch.doneCount = 0
      this.action.type = 'update'

      for (const app of apps) {
        try {
          await this.updateApp(app)
          this.batch.doneCount++
        } catch (error) {
          console.error(error)
          this.batch.failed.push(app)
        }
      }
      this.batch.totalCount = 0
      this.batch.doneCount = 0
    },

    setCategory (name) {
      const category = this.categories.find(e => e.name === name)
      let prefix = ''
      if (!location.pathname.startsWith('/apps/')) {
        prefix = 'apps/'
      }
      this.router.push(prefix + encodeURIComponent(category.name.toLowerCase().replaceAll(' ', '-')))
    },

    async startRpc () {
      this.flags.rpcToggling = true
      await this.flipper.startRPCSession()
        .catch(error => {
          console.error(error)
          this.$emit('log', {
            level: 'error',
            message: `${this.componentName}: Error while starting RPC: ${error.toString()}`
          })
        })
      this.flags.rpcActive = true
      this.$emit('setRpcStatus', true)
      this.flags.rpcToggling = false
      this.$emit('log', {
        level: 'info',
        message: `${this.componentName}: RPC started`
      })
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.setReadingMode('text', 'promptBreak')
      this.flags.rpcActive = false
      this.$emit('setRpcStatus', false)
      this.flags.rpcToggling = false
      this.$emit('log', {
        level: 'info',
        message: `${this.componentName}: RPC stopped`
      })
    },

    passNotif (config) {
      this.$emit('showNotif', config)
    },
    passLog (config) {
      this.$emit('log', config)
    },

    rpcErrorHandler (error, command) {
      error = error.toString()
      this.$emit('showNotif', {
        message: `RPC error in command '${command}': ${error}`,
        color: 'negative'
      })
      this.$emit('log', {
        level: 'error',
        message: `${this.componentName}: RPC error in command '${command}': ${error}`
      })
    },

    toggleInstalled () {
      if (this.flags.installedPage) {
        this.flags.installedPage = false
        this.router.push('/apps')
      } else {
        this.router.push('/apps/installed')
      }
    },

    async ensureCommonPaths () {
      if (this.flipperReady) {
        let dir = await this.flipper.RPC('storageStat', { path: '/ext/apps_manifests' })
          .catch(error => this.rpcErrorHandler(error, 'storageStat'))
        if (!dir) {
          await this.flipper.RPC('storageMkdir', { path: '/ext/apps_manifests' })
            .catch(error => this.rpcErrorHandler(error, 'storageMkdir'))
        }

        dir = await this.flipper.RPC('storageStat', { path: '/ext/.tmp' })
          .catch(error => this.rpcErrorHandler(error, 'storageStat'))
        if (!dir) {
          await this.flipper.RPC('storageMkdir', { path: '/ext/.tmp' })
            .catch(error => this.rpcErrorHandler(error, 'storageMkdir'))
        }

        dir = await this.flipper.RPC('storageStat', { path: '/ext/.tmp/lab' })
          .catch(error => this.rpcErrorHandler(error, 'storageStat'))
        if (!dir) {
          await this.flipper.RPC('storageMkdir', { path: '/ext/.tmp/lab' })
            .catch(error => this.rpcErrorHandler(error, 'storageMkdir'))
        }
      }
    },

    async ensureCategoryPaths () {
      for (const category of this.categories) {
        const dir = await this.flipper.RPC('storageStat', { path: `/ext/apps/${category.name}` })
          .catch(error => this.rpcErrorHandler(error, 'storageStat'))
        if (!dir) {
          await this.flipper.RPC('storageMkdir', { path: `/ext/apps/${category.name}` })
            .catch(error => this.rpcErrorHandler(error, 'storageMkdir'))
        }
      }
    },

    async getInstalledApps () {
      const installedApps = []
      if (this.flipperReady) {
        const manifestsList = await this.flipper.RPC('storageList', { path: '/ext/apps_manifests' })
          .catch(error => this.rpcErrorHandler(error, 'storageList'))
        const decoder = new TextDecoder()
        for (const file of manifestsList) {
          const manifestFile = await this.flipper.RPC('storageRead', { path: `/ext/apps_manifests/${file.name}` })
            .catch(error => this.rpcErrorHandler(error, 'storageRead'))
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
          installedApps.push(app)
        }
      }

      const versions = await fetchAppsVersions(installedApps.map(app => app.installedVersion.id))
      for (const version of versions) {
        const app = installedApps.find(app => app.id === version.applicationId)
        if (app) {
          app.installedVersion = { ...app.installedVersion, ...version }
        }
      }
      this.installedApps = installedApps
    },

    async updateInstalledApps (installed) {
      if (!installed) {
        await this.getInstalledApps()
      }
      for (const app of this.apps) {
        const installed = this.installedApps.find(e => e.id === app.id)
        if (installed) {
          app.isInstalled = true
          app.installedVersion = installed.installedVersion

          app.installedVersion.isOutdated = app.currentVersion.id !== app.installedVersion.id
        } else {
          app.isInstalled = false
          app.installedVersion = null
        }

        app.actionButton = this.actionButton(app)

        if (this.currentApp && app.id === this.currentApp.id) {
          this.currentApp.isInstalled = app.isInstalled
          this.currentApp.installedVersion = app.installedVersion
        }
      }
      console.log('installed apps', this.installedApps)
    },

    actionButton (app) {
      if (!this.sdk.api) {
        return { text: 'Install', class: 'bg-primary' }
      }
      if (app.isInstalled && app.installedVersion) {
        if (app.installedVersion.api !== this.sdk.api) {
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
    },

    async watchParams () {
      this.currentApp = null
      this.initialCategory = null
      const path = this.$route.params.path
      if (!path) {
        return
      }
      if (path === 'installed') {
        this.flags.installedPage = true
        if (!this.connected) {
          this.flags.connectFlipperDialog = true
        }
        return
      }

      this.flags.installedPage = false
      const normalize = (string) => string.toLowerCase().replaceAll(' ', '-')
      const category = this.categories.find(e => normalize(e.name) === normalize(path))
      if (category) {
        this.initialCategory = category
      } else {
        try {
          const appFull = await fetchAppById(path, this.sdk)
          if (appFull.detail && appFull.detail.status === 'error') {
            this.$router.push('/apps')
            return
          }
          this.currentApp = appFull

          const installed = this.installedApps.find(e => e.id === this.currentApp.id)
          if (installed) {
            this.currentApp.isInstalled = true
            this.currentApp.installedVersion = installed.installedVersion

            this.currentApp.installedVersion.isOutdated = this.currentApp.currentVersion.id !== this.currentApp.installedVersion.id
          }
          this.currentApp.actionButton = this.actionButton(this.currentApp)
          console.log('current app', this.currentApp)

          this.initialCategory = this.categories.find(e => e.id === appFull.categoryId)
        } catch (error) {
          console.error(error)
        }
      }
    },

    async start () {
      this.flags.rpcActive = this.rpcActive
      this.flags.loadingInitial = true
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

      if (this.connected) {
        if (!this.flags.rpcActive) {
          // if flipper is connected without active RPC session (e.g. came from CLI app)
          await this.startRpc()
          return
        }
        if (this.flipperReady) {
          // when RPC session is up and device info retreived, get firmware API version and device target
          try {
            this.sdk.api = `${this.info.firmware.api.major}.${this.info.firmware.api.minor}`
            this.sdk.target = `f${this.info.firmware.target}`

            params.target = `f${this.info.firmware.target}`
            params.api = `${this.info.firmware.api.major}.${this.info.firmware.api.minor}`
            delete params.is_latest_release_version

            categoryParams.target = params.target
            categoryParams.api = params.api
          } catch (error) {
            this.flags.outdatedFirmwareDialogPersistent = true
          }

          await this.ensureCommonPaths()
          await this.getInstalledApps()
        } else {
          return
        }
      } else {
        this.installedApps = []
        this.$emit('connect')
      }

      this.categories = await fetchCategories(categoryParams)

      await this.watchParams()
      this.flags.loadingInitial = false

      let newApps = [], allApps = []
      do {
        newApps = await fetchAppsShort(params)
        allApps = allApps.concat(newApps)
        if (newApps.length === params.limit) {
          params.offset += params.limit
        }
      } while (newApps.length === params.limit)
      this.apps = allApps

      await this.updateInstalledApps(this.installedApps)
      console.log('compatible apps', this.apps)
    }
  },

  async mounted () {
    this.start()
    if (this.$q.platform.is.mobile) {
      this.flags.mobileAppDialog = true
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

// Dialogs
.dialog
  border-radius: 20px
  padding: 16px
.dialog-close-btn
  position: absolute
  top: 0.5rem
  right: 0.5rem
</style>
