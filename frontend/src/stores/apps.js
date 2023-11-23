import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAppsVersions, fetchAppFap } from 'util/fetch'
import asyncSleep from 'simple-async-sleep'
import { log } from 'composables/useLog'
import showNotif from 'composables/useShowNotif'
import useSetProperty from 'composables/useSetProperty'
import { rpcErrorHandler } from 'composables/useRpcUtils'
import promiseQueue from 'composables/usePromiseQueue'
const actionQueue = promiseQueue()
import { axios } from 'boot/axios'

import { useMainStore } from 'stores/main'

const componentName = 'Apps'

export const useAppsStore = defineStore('apps', () => {
  const mainStore = useMainStore()
  const mainFlags = computed(() => mainStore.flags)
  const flipper = computed(() => mainStore.flipper)
  const info = computed(() => mainStore.info)

  const router = useRouter()

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

  const flipperReady = computed(() => mainFlags.value.rpcActive && info.value !== null && info.value.doneReading)

  const actionColors = (app) => {
    switch (app.action.type) {
      case 'delete':
        return {
          bar: 'negative',
          track: 'deep-orange-5'
        }
      case 'install':
        return {
          bar: 'primary',
          track: 'orange-6'
        }
      default:
        return {
          bar: 'positive',
          track: 'green-6'
        }
    }
  }
  const onAction = (app, value) => {
    const actionType = value === 'Installed' ? '' : value.toLowerCase()
    if (!mainFlags.value.connected) {
      flags.value.connectFlipperDialog = true
      return
    }

    app.action.type = actionType
    app.action.progress = 0
    app.action.id = app.id

    const action = async (app, actionType) => {
      await handleAction(app, actionType)

      return Promise.resolve()
    }

    actionQueue.addToQueue(action, [app, actionType])
  }
  const handleAction = (app, actionType) => {
    if (!info.value.storage.sdcard.status.isInstalled) {
      app.action.type = actionType
      mainStore.toggleFlag('microSDcardMissingDialog', true)
      setTimeout(() => {
        app.action.type = ''
      }, 300)
      return
    }
    if (!actionType) {
      return
    }

    switch (app.action.type) {
      case 'install':
        return installApp(app)
      case 'update':
        return updateApp(app)
      case 'delete':
        return deleteApp(app)
    }
  }

  const batch = ref({
    totalCount: 0,
    doneCount: 0,
    failed: [],
    action: {
      type: '',
      progress: 0
    }
  })
  const batchUpdate = async (apps) => {
    batch.value.totalCount = apps.length
    batch.value.doneCount = 0

    batch.value.action.type = 'update'

    for (const app of apps) {
      try {
        app.action.type = 'update'
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

  const sdk = ref({
    target: null,
    api: null
  })
  const setPropertySdk = (options) => {
    sdk.value = useSetProperty(sdk.value, options)
  }

  const initialCategory = ref(null)
  const setInitalCategory = (category) => {
    initialCategory.value = category
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
        return { text: 'Installed', class: 'bg-grey-6', disabled: true }
      } else {
        if (app.installedVersion.isOutdated) {
          return { text: 'Update', class: 'bg-positive' }
        } else {
          return { text: 'Installed', class: 'bg-grey-6', disabled: true }
        }
      }
    }
    return {
      text: 'Install',
      class: 'bg-primary'
    }
  }

  const loadingInstalledApps = ref(true)
  const toggleLoadingInstalledApps = (condition) => {
    loadingInstalledApps.value = condition
  }
  const getInstalledApps = async () => {
    const installed = []
    if (flipperReady.value) {
      const manifestsList = await flipper.value.RPC('storageList', { path: '/ext/apps_manifests' })
        .catch(error => rpcErrorHandler(componentName, error, 'storageList'))
      const decoder = new TextDecoder()
      for (const file of manifestsList) {
        const manifestFile = await flipper.value.RPC('storageRead', { path: `/ext/apps_manifests/${file.name}` })
          .catch(error => rpcErrorHandler(componentName, error, 'storageRead'))
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

      toggleLoadingInstalledApps(false)
    }

    const versions = await fetchAppsVersions(installed.map(app => app.installedVersion.id))
    for (const version of versions) {
      const app = installed.find(app => app.id === version.applicationId)
      if (app) {
        app.action = {
          type: '',
          progress: 0,
          id: app.id
        }
        app.installedVersion = { ...app.installedVersion, ...version }
      }
    }
    setInstalledApps(installed)
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
        const newCurrentApp = currentApp.value
        newCurrentApp.isInstalled = app.isInstalled
        newCurrentApp.installedVersion = app.installedVersion
        newCurrentApp.actionButton = app.actionButton

        setCurrentApp(newCurrentApp)
      }
    }
  }

  const openApp = async (app) => {
    router.push({ name: 'AppsPath', params: { path: app.alias } })
  }
  const updateApp = async (app) => {
    return installApp(app)
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
      target: `f${info.value.firmware.target}`,
      api: `${info.value.firmware.api.major}.${info.value.firmware.api.minor}`
    }).catch(error => {
      showNotif({
        message: error.toString(),
        color: 'negative'
      })
      log({
        level: 'error',
        message: `${componentName}: Installing app '${app.name}' (${app.alias}): ${error}`
      })
    })
    if (!fap) {
      app.action.type = ''
      batch.value.progress = 0
      app.action.progress = 0
      return
    }
    app.action.progress = 0.33
    if (app.action.type === 'update') {
      batch.value.progress = 0.33
    }
    await asyncSleep(300)
    log({
      level: 'debug',
      message: `${componentName}: Installing app '${app.name}' (${app.alias}): fetched .fap`
    })

    // generate manifest
    async function urlContentToDataUri (url) {
      return await axios.get(url, { responseType: 'blob' })
        .then(({ data }) => new Promise(resolve => {
          const reader = new FileReader()
          reader.onload = function () { resolve(this.result) }
          reader.readAsDataURL(data)
        }))
    }
    const dataUri = await urlContentToDataUri(app.currentVersion.iconUri)
    const base64Icon = dataUri.split(',')[1]
    const manifestText = `Filetype: Flipper Application Installation Manifest\r\nVersion: 1\r\nFull Name: ${app.currentVersion.name}\r\nIcon: ${base64Icon}\r\nVersion Build API: ${info.value.firmware.api.major}.${info.value.firmware.api.minor}\r\nUID: ${app.id}\r\nVersion UID: ${app.currentVersion.id}\r\nPath: ${paths.appDir}/${app.alias}.fap`
    const manifestFile = new TextEncoder().encode(manifestText)
    app.action.progress = 0.45
    if (app.action.type === 'update') {
      batch.value.progress = 0.45
    }
    await asyncSleep(300)

    // upload manifest to temp
    await flipper.value.RPC('storageWrite', { path: `${paths.tempDir}/${app.id}.fim`, buffer: manifestFile })
      .then(() => {
        log({
          level: 'debug',
          message: `${componentName}: Installing app '${app.name}' (${app.alias}): uploaded manifest (temp)`
        })
      })
      .catch(error => rpcErrorHandler(componentName, error, 'storageWrite'))
    app.action.progress = 0.5
    if (app.action.type === 'update') {
      batch.value.progress = 0.5
    }
    await asyncSleep(300)

    // upload fap to temp
    await flipper.value.RPC('storageWrite', { path: `${paths.tempDir}/${app.id}.fap`, buffer: fap })
      .then(() => {
        log({
          level: 'debug',
          message: `${componentName}: Installing app '${app.name}' (${app.alias}): uploaded .fap (temp)`
        })
      })
      .catch(error => rpcErrorHandler(componentName, error, 'storageWrite'))
    app.action.progress = 0.75
    if (app.action.type === 'update') {
      batch.value.progress = 0.75
    }
    await asyncSleep(300)

    // move manifest and fap
    let dirList = await flipper.value.RPC('storageList', { path: paths.manifestDir })
      .catch(error => rpcErrorHandler(componentName, error, 'storageList'))
    const oldManifest = dirList.find(e => e.name === `${app.alias}.fim`)
    if (oldManifest) {
      await flipper.value.RPC('storageRemove', { path: `${paths.manifestDir}/${app.alias}.fim` })
        .then(() => {
          log({
            level: 'debug',
            message: `${componentName}: Installing app '${app.name}' (${app.alias}): removed old manifest`
          })
        })
        .catch(error => rpcErrorHandler(componentName, error, 'storageRemove'))
    }

    await flipper.value.RPC('storageRename', { oldPath: `${paths.tempDir}/${app.id}.fim`, newPath: `${paths.manifestDir}/${app.alias}.fim` })
      .then(() => {
        log({
          level: 'debug',
          message: `${componentName}: Installing app '${app.name}' (${app.alias}): moved new manifest`
        })
      })
      .catch(error => rpcErrorHandler(componentName, error, 'storageRename'))
    app.action.progress = 0.8
    if (app.action.type === 'update') {
      batch.value.progress = 0.8
    }
    await asyncSleep(300)

    dirList = await flipper.value.RPC('storageList', { path: paths.appDir })
      .catch(error => rpcErrorHandler(componentName, error, 'storageList'))
    const oldFap = dirList.find(e => e.name === `${app.alias}.fap`)
    if (oldFap) {
      await flipper.value.RPC('storageRemove', { path: `${paths.appDir}/${app.alias}.fap` })
        .then(() => {
          log({
            level: 'debug',
            message: `${componentName}: Installing app '${app.name}' (${app.alias}): removed old .fap`
          })
        })
        .catch(error => rpcErrorHandler(componentName, error, 'storageRemove'))
    }

    await flipper.value.RPC('storageRename', { oldPath: `${paths.tempDir}/${app.id}.fap`, newPath: `${paths.appDir}/${app.alias}.fap` })
      .then(() => {
        log({
          level: 'debug',
          message: `${componentName}: Installing app '${app.name}' (${app.alias}): moved new .fap`
        })
      })
      .catch(error => rpcErrorHandler(componentName, error, 'storageRename'))
    app.action.progress = 1
    if (app.action.type === 'update') {
      batch.value.progress = 1
    }
    await asyncSleep(300)

    // post-install
    await updateInstalledApps()

    app.action.type = ''
    app.action.progress = 0
    if (app.action.type === 'update') {
      batch.value.progress = 0
    }
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
    let dirList = await flipper.value.RPC('storageList', { path: paths.appDir })
      .catch(error => rpcErrorHandler(componentName, error, 'storageList'))
    const fap = dirList.find(e => e.name === `${app.alias}.fap`)
    if (fap) {
      await flipper.value.RPC('storageRemove', { path: `${paths.appDir}/${app.alias}.fap` })
        .then(() => {
          log({
            level: 'debug',
            message: `${componentName}: Deleting app '${app.name}' (${app.alias}): removed .fap`
          })
        })
        .catch(error => rpcErrorHandler(componentName, error, 'storageRemove'))
    }
    app.action.progress = 0.5

    // remove manifest
    dirList = await flipper.value.RPC('storageList', { path: paths.manifestDir })
      .catch(error => rpcErrorHandler(componentName, error, 'storageList'))
    const manifest = dirList.find(e => e.name === `${app.alias}.fim`)
    if (manifest) {
      await flipper.value.RPC('storageRemove', { path: `${paths.manifestDir}/${app.alias}.fim` })
        .then(() => {
          log({
            level: 'debug',
            message: `${componentName}: Deleting app '${app.name}' (${app.alias}): removed manifest`
          })
        })
        .catch(error => rpcErrorHandler(componentName, error, 'storageRemove'))
    }
    app.action.progress = 1

    // post-delete
    await updateInstalledApps()

    app.action.type = ''
    app.action.progress = 0
  }

  const currentApp = ref(null)
  const setCurrentApp = (app) => {
    currentApp.value = app
  }

  const apps = ref([])
  const setApps = (newApps) => {
    apps.value = newApps
  }

  const installedApps = ref([])
  const setInstalledApps = (newInstalledApps) => {
    installedApps.value = newInstalledApps
  }

  const categories = ref([])
  const setCategories = (newCategories) => {
    categories.value = newCategories
  }
  const setCategory = (name) => {
    const category = categories.value.find(e => e.name === name)
    let prefix = ''
    if (!location.pathname.startsWith('/apps/')) {
      prefix = 'apps/'
    }
    router.push(prefix + encodeURIComponent(category.name.toLowerCase().replaceAll(' ', '-')))
  }
  const ensureCategoryPaths = async () => {
    for (const category of categories.value) {
      const dir = await flipper.value.RPC('storageStat', { path: `/ext/apps/${category.name}` })
        .catch(error => rpcErrorHandler(componentName, error, 'storageStat'))
      if (!dir) {
        await flipper.value.RPC('storageMkdir', { path: `/ext/apps/${category.name}` })
          .catch(error => rpcErrorHandler(componentName, error, 'storageMkdir'))
      }
    }
  }

  return {
    flags,
    flipperReady,

    actionColors,
    handleAction,
    onAction,

    batch,
    batchUpdate,

    sdk,
    setPropertySdk,

    initialCategory,
    setInitalCategory,

    loadingInstalledApps,
    toggleLoadingInstalledApps,
    getInstalledApps,
    updateInstalledApps,

    actionButton,

    openApp,
    installApp,
    updateApp,
    deleteApp,

    currentApp,
    setCurrentApp,

    apps,
    setApps,

    installedApps,
    setInstalledApps,

    categories,
    setCategory,
    setCategories
  }
})
