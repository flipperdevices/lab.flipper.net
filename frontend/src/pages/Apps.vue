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
        :style="$q.screen.width <= 353 ? 'margin-top: 16px; width: 100%' : 'max-width: 300px; min-width: 140px'"
      >
        <SearchBar
          :categories="categories"
          :apps="apps"
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
              v-if="$q.screen.width > 365 && outdatedAppsAmount > 0"
              color="positive"
              floating
              class="outdated-badge"
            >{{ outdatedAppsAmount }}</q-badge>
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
        :info="info"
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
        :info="info"
        :action="action"
        @showNotif="passNotif"
        @action="handleAction"
      />
    </template>

    <q-dialog v-model="flags.outdatedFirmwareDialog">
      <q-card class="dialog">
        <q-btn icon="close" flat round dense v-close-popup class="dialog-close-btn"/>

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
          ></q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="flags.outdatedAPIDialog">
      <q-card class="dialog">
        <q-btn icon="close" flat round dense v-close-popup class="dialog-close-btn"/>

        <q-card-section class="q-pa-none q-ma-md" align="center">
          <q-icon name="mdi-alert-circle" color="negative" size="64px" />
          <div class="text-h6 q-my-sm">Outdated API Version</div>
          <p>Firmware on your Flipper is outdated.<br />Click the link below to update your device.</p>
        </q-card-section>

        <q-card-section class="q-pt-none" align="center">
          <q-btn
            outline
            color="primary"
            label="Update"
          ></q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="flags.TOSDialog">
      <q-card class="dialog">
        <q-card-section>
          <div class="text-h6">Terms of Service</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p>You accept our full Terms of Service by pressing Agree button.<br />The main ideas and rules fot this platform are listed below:</p>
          <ul>
            <li>Adipiscing ut tellus nibh pulvinar massa blandit. Ut rhoncus mi pulvinar nec nibh tortor turpis turpis.</li>
            <li>Et diam nisl tempor morbi mattis turpis gravida congue nisi.  nibh euismod tristique. </li>
            <li>Id quisque enim dictum gravida non fames semper at.</li>
            <li>Adipiscing ut tellus nibh pulvinar massa blandit. Ut rhoncus mi pulvinar nec nibh tortor turpis turpis.</li>
            <li>Et diam nisl tempor morbi mattis turpis gravida congue nisi.  nibh euismod tristique.</li>
            <li>Id quisque enim dictum gravida non fames semper at.</li>
          </ul>
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
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from 'components/SearchBar.vue'
import AppList from 'components/AppList.vue'
import AppPage from 'components/AppPage.vue'
import InstalledApps from 'components/InstalledApps.vue'
import { fetchCategories, fetchAppsShort, fetchAppById, fetchAppFap } from '../util/util'
import semver from 'semver'
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
        outdatedFirmwareDialog: false,
        outdatedAPIDialog: false,
        TOSDialog: false,
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
      })
    }
  },

  watch: {
    flipperReady () {
      this.start()
    }
  },

  computed: {
    flipperReady () {
      return this.rpcActive && this.info !== null && this.info.doneReading
    },

    outdatedAppsAmount () {
      return this.apps.filter(e => {
        if (e.isInstalled === true && e.installedVersion) {
          const iv = e.installedVersion.version + '.0'
          const cv = e.currentVersion.version + '.0'
          if (semver.lt(iv, cv)) {
            return true
          } else if (semver.eq(iv, cv) && e.installedVersion.id !== e.currentVersion.id) {
            return true
          }
        }
        return false
      }).length
    }
  },

  methods: {
    async openApp (app) {
      this.currentApp = await fetchAppById(app.alias)
      let prefix = ''
      if (!location.pathname.startsWith('/apps/')) {
        prefix = 'apps/'
      }
      this.router.push(prefix + encodeURIComponent(app.alias))
    },

    handleAction (app, actionType) {
      if (actionType) {
        this.action.type = actionType
        this.action.progress = 0
        this.action.id = app.id
        return this[`${this.action.type}App`](app)
      }
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
        apiVersion: `${this.info.firmware.api.major}.${this.info.firmware.api.minor}`
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
      const manifestText = `Filetype: Flipper Application Installation Manifest\rVersion: ${app.currentVersion.version}\rUID: ${app.id}\rVersion UID: ${app.currentVersion.id}\rPath: ${paths.appDir}/${app.alias}.fap`
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
        appDir: `/ext/apps/${this.categories.find(e => e.id === app.categoryId).name}`,
        manifestDir: '/ext/apps_manifests'
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
            version: '',
            versionId: '',
            path: ''
          }
          for (const line of manifest.split('\r')) {
            const key = line.slice(0, line.indexOf(': '))
            const value = line.slice(line.indexOf(': ') + 2)
            switch (key) {
              case 'Version':
                app.version = value
                break
              case 'UID':
                app.id = value
                break
              case 'Version UID':
                app.versionId = value
                break
              case 'Path':
                app.path = value
                break
            }
          }
          installedApps.push(app)
        }
      }
      this.installedApps = installedApps
    },

    async updateInstalledApps () {
      await this.getInstalledApps()
      for (const app of this.apps) {
        const installed = this.installedApps.find(e => e.id === app.id)
        if (installed) {
          app.isInstalled = true
          app.installedVersion = {
            version: installed.version,
            id: installed.versionId
          }
          app.currentVersion.version = '0.2'
        } else {
          app.isInstalled = false
          app.installedVersion = null
        }

        if (this.currentApp && app.id === this.currentApp.id) {
          this.currentApp.isInstalled = app.isInstalled
          this.currentApp.installedVersion = app.installedVersion
        }
      }
    },

    async watchParams () {
      this.currentApp = null
      this.initialCategory = null
      const path = this.$route.params.path
      if (path) {
        if (path === 'installed') {
          this.flags.installedPage = true
        } else {
          const normalize = (string) => string.toLowerCase().replaceAll(' ', '-')
          this.flags.installedPage = false
          const category = this.categories.find(e => normalize(e.name) === normalize(path))
          if (category) {
            this.initialCategory = category
          } else {
            try {
              const appFull = await fetchAppById(path)
              this.currentApp = appFull

              const installed = this.installedApps.find(e => e.id === this.currentApp.id)
              if (installed) {
                this.currentApp.isInstalled = true
                this.currentApp.installedVersion = {
                  version: installed.version,
                  id: installed.versionId
                }
              }

              this.initialCategory = this.categories.find(e => e.id === appFull.categoryId)
            } catch (error) {
              console.error(error)
            }
          }
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
          await this.startRpc()
          return
        }
        if (this.flipperReady) {
          try {
            params.target = `f${this.info.firmware.target}`
            params.api = `${this.info.firmware.api.major}.${this.info.firmware.api.minor}`
            delete params.is_latest_release_version
            categoryParams.target = params.target
            categoryParams.api = params.api
          } catch (error) {
            this.flags.outdatedAPIDialog = true
          }

          await this.ensureCommonPaths()
          await this.getInstalledApps()
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

      for (const installed of this.installedApps) {
        const app = allApps.find(e => e.id === installed.id)
        if (app) {
          app.isInstalled = true
          app.installedVersion = {
            version: installed.version,
            id: installed.versionId
          }
        }
      }

      this.apps = allApps
      console.log(this.apps)
    }
  },

  async mounted () {
    if (localStorage.getItem('dev') !== 'true') {
      this.$router.push('/')
    }
    this.start()
  },

  updated () {
    this.watchParams()
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
