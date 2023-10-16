<template>
  <q-layout view="hhh LpR fff">
    <q-header>
      <q-toolbar>
        <q-btn
          v-if="$q.screen.width <= 900"
          @click="leftDrawer = !leftDrawer"
          icon="menu"
          dense
          flat
          round
          class="q-mr-xs"
        ></q-btn>

        <img
          v-show="!$q.screen.xs"
          src="../assets/flipper_lab_logo_monochrome.svg"
          class="q-ml-xs"
          style="height: 36px;"
        />

        <q-space />

        <q-btn
          v-if="$q.screen.width <= 750"
          @click="linksMenu = !linksMenu"
          icon="open_in_new"
          dense
          flat
          round
          class="q-ml-sm"
        >
          <q-menu fit>
            <q-list class="nav-links">
              <ExternalLink
                v-for="link in extLinks"
                :key="link.title"
                v-bind="link"
              />
            </q-list>
          </q-menu>
        </q-btn>
        <template v-else>
          <div class="nav-links">
            <a v-for="link in extLinks"
              :key="link.title"
              v-bind="link"
              :href="link.link"
            >{{ link.title }}</a>
          </div>
        </template>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawer"
      class="bg-grey-2"
      style="overflow-x: hidden"
      :width="175"
      :breakpoint="900"
    >
      <div
        class="full-height relative-position"
        style="width: 200%; display: grid; grid-template-rows: 1fr; grid-template-columns: 175px 175px; transition-duration: 300ms;"
        :style="`left: ${flags.settingsView ? '-175px' : '0'}`"
      >
        <q-list style="width: 175px">
          <RouterLink
            v-for="link in routes"
            :key="link.title"
            v-bind="link"
            class="q-px-lg q-py-md"
          />

          <div :class="$q.screen.height > 545 ? 'absolute-bottom' : ''" style="width: 175px">
            <q-item
              clickable
              class="q-px-lg q-py-md"
              @click="flags.settingsView = true"
            >
              <q-item-section avatar style="min-width: initial;">
                <q-icon name="svguse:common-icons.svg#settings"/>
              </q-item-section>

              <q-item-section>
                <q-item-label>Settings</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator style="width: 85%; margin: auto;"/>
            <q-item
              v-if="flags.portSelectRequired || !flags.connected && !flags.portSelectRequired"
              clickable
              class="q-px-md q-py-sm"
              @click="flags.portSelectRequired ? selectPort() : start(true)"
            >
              <q-item-section avatar style="min-width: initial; position: relative; right: -3px;">
                <q-icon name="svguse:common-icons.svg#connect" size="32px"/>
              </q-item-section>

              <q-item-section>
                <q-item-label>Connect</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              v-else-if="this.info"
              clickable
              class="q-px-md q-py-sm"
              @click="disconnect"
            >
              <q-item-section avatar style="min-width: initial; position: relative; right: -3px;">
                <q-icon name="svguse:common-icons.svg#connected" size="32px"/>
              </q-item-section>

              <q-item-section>
                <q-item-label>Connected</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              v-else
              clickable
              class="q-px-md q-py-sm"
              @click="flags.portSelectRequired ? selectPort() : start(true)"
            >
              <q-item-section avatar style="min-width: initial; position: relative; right: -3px;">
                <q-icon name="svguse:common-icons.svg#connect" size="32px"/>
              </q-item-section>

              <q-item-section>
                <q-item-label>Connecting...</q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </q-list>
        <div class="relative-position flex justify-end" style="width: 175px">
          <div class="column justify-end no-wrap">
            <div class="column items-center">
              <div v-if="info && info.hardware && info.power" class="flex justify-center q-px-md">
                <img v-if="info.hardware.color === '1'" src="../assets/flipper_black.svg" style="width: 100%"/>
                <img v-else src="../assets/flipper_white.svg" style="width: 100%"/>
                <div class="flex full-width justify-between items-center q-mt-md q-mb-sm">
                  <div style="font-size: 1rem; font-weight: 600;">{{ info.hardware.name }}</div>
                  <div class="flex flex-center">
                    <q-icon
                      :name="batteryIcon"
                      size="22px"
                      class="rotate-90"
                      :color="batteryColor"
                    ></q-icon>
                    <div class="q-ml-xs text-caption">{{ info.power.charge.level }}%</div>
                  </div>
                </div>

                <div class="flex full-width justify-between items-center q-mt-sm q-mb-xs">
                  <div>Internal used:</div>
                  <div class="text-bold">{{ internalUsed }}%</div>
                </div>
                <q-linear-progress style="height: 8px; border-radius: 8px;" :value="internalUsed / 100" class="q-mb-sm"/>

                <div class="flex full-width justify-between items-center q-mt-xs">
                  <div>SD card used:</div>
                  <div class="text-bold">{{ sdCardUsed }}%</div>
                </div>
                <q-linear-progress style="height: 8px; border-radius: 8px;" :value="Math.ceil(sdCardUsed/2)*2 / 100" class="q-mb-sm"/>
              </div>

              <div class="q-my-md q-px-md">
                <q-toggle
                  size="2.25rem"
                  dense
                  class="q-my-sm"
                  v-model="flags.connectOnStart"
                  @click="toggleConnectOnStart"
                  label="Connect on load"
                ></q-toggle>
                <q-toggle
                  size="2.25rem"
                  dense
                  class="q-my-sm"
                  v-model="flags.autoReconnect"
                  @click="toggleAutoReconnect"
                  label="Auto reconnect"
                ></q-toggle>
                <q-toggle
                  size="2.25rem"
                  dense
                  class="q-my-sm"
                  v-model="flags.installFromFile"
                  @click="toggleInstallFromFile"
                  label="Third-party FW"
                ></q-toggle>

                <q-toggle
                  v-if="flags.catalogCanBeEnabled"
                  size="2.25rem"
                  dense
                  class="q-mt-lg q-mb-sm"
                  v-model="flags.catalogEnabled"
                  @click="toggleCatalogEnabled"
                  label="Enable Apps"
                ></q-toggle>
                <q-toggle
                  v-if="flags.catalogCanSwitchChannel && flags.catalogEnabled"
                  size="2.25rem"
                  dense
                  class="q-my-sm"
                  v-model="flags.catalogChannelProduction"
                  @click="toggleCatalogChannel"
                  label="Production Apps"
                ></q-toggle>
              </div>
            </div>
            <q-item
              clickable
              class="q-px-lg q-py-sm"
              @click="flags.logsPopup = true"
            >
              <q-item-section avatar style="min-width: initial;">
                <q-icon name="svguse:common-icons.svg#logs"/>
              </q-item-section>

              <q-item-section>
                <q-item-label>View logs</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              class="q-px-lg q-py-sm"
              @click="flags.settingsView = false"
            >
              <q-item-section avatar style="min-width: initial;">
                <q-icon name="mdi-chevron-left" size="2rem" style="margin-left: -4px; margin-right: -4px;"/>
              </q-item-section>

              <q-item-section>
                <q-item-label>Back</q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </div>
    </q-drawer>

    <q-page-container class="flex justify-center">
      <router-view
        v-if="!flags.connectionRequired || flags.updateInProgress || (flags.serialSupported && info !== null && info.doneReading)"
        :flipper="flipper"
        :rpcActive="flags.rpcActive"
        :connected="flags.connected"
        :info="info"
        :installFromFile="flags.installFromFile"
        :passedFile="fileToPass"
        @setRpcStatus="setRpcStatus"
        @setInfo="setInfo"
        @update="onUpdateStage"
        @openFileIn="openFileIn"
        @showNotif="showNotif"
        @log="log"
        @connect="start"
      />
      <q-page v-else class="flex-center column">
        <div
          v-if="flags.serialSupported && (!flags.connected || info == null || !flags.rpcActive || flags.rpcToggling)"
          class="flex-center column q-my-xl"
        >
          <q-btn
            v-if="flags.portSelectRequired || !flags.connected && !flags.portSelectRequired"
            @click="flags.portSelectRequired ? selectPort() : start(true)"
            outline
            class="q-mt-md"
          >
            Connect
          </q-btn>
          <template v-else>
            <q-spinner
              color="primary"
              size="3em"
              class="q-mb-md"
            ></q-spinner>
            <p>Waiting for Flipper...</p>
          </template>
        </div>
        <div v-if="!flags.serialSupported" class="column text-center q-px-lg q-py-lg">
          <h5>Unsupported browser</h5>
          <p>
            Your browser doesn't support WebSerial API.
            For better experience we recommend using Chrome for desktop.<br />
            <a href="https://caniuse.com/web-serial">Full list of supported browsers</a>
          </p>
        </div>
      </q-page>
      <q-dialog v-model="flags.logsPopup">
        <q-card>
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">Logs</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <p>You can report bugs <a href="https://forum.flipperzero.one/c/web-app/22" target="blank_">here</a>. Attached logs may be helpful.</p>
            <q-scroll-area
              style="height: 300px; min-width: 280px; width: calc(min(80vw, 500px));"
              class="bg-grey-12 q-px-sm q-py-xs rounded-borders"
            >
              <code>
                <span v-if="!history.length">Logs will appear here...</span>
                <span v-for="line in history" :key="line.timestamp">
                  {{ `${line.time.padEnd(8)} [${line.level.toUpperCase()}] ${line.message}` }}
                  <br />
                </span>
              </code>
            </q-scroll-area>
          </q-card-section>

          <q-card-section align="right" class="q-pt-none">
            <q-btn
              flat
              label="Download"
              @click="downloadLogs"
            ></q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>

      <q-dialog v-model="flags.flipperOccupiedDialog">
        <q-card class="dialog">
          <q-btn icon="close" flat round dense v-close-popup class="dialog-close-btn"/>

          <q-card-section class="q-pa-none q-ma-md" align="center">
            <q-icon name="mdi-alert-circle" color="primary" size="64px" />
            <div class="text-h6 q-my-sm">Can't connect to Flipper</div>
            <p>It seems that the serial port is occupied. Close any other app (e.g. qFlipper) connected to Flipper and try again.</p>
          </q-card-section>

          <q-card-section class="q-pt-none" align="center">
            <q-btn
              outline
              color="primary"
              label="Try again"
              @click="start"
            ></q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useQuasar } from 'quasar'
import ExternalLink from 'components/ExternalLink.vue'
import RouterLink from 'components/RouterLink.vue'
import Flipper from 'src/flipper-js/flipper'
import log from 'loglevel'

let dismissNotif

export default defineComponent({
  name: 'MainLayout',

  components: {
    ExternalLink,
    RouterLink
  },

  setup () {
    const $q = useQuasar()
    return {
      componentName: 'Main',

      flags: ref({
        serialSupported: true,
        connectionRequired: true,
        portSelectRequired: false,
        connected: false,
        rpcActive: false,
        connectOnStart: true,
        autoReconnect: false,
        updateInProgress: false,
        installFromFile: false,
        logsPopup: false,
        settingsView: false,
        flipperOccupiedDialog: false,

        catalogCanBeEnabled: false,
        catalogCanSwitchChannel: false,
        catalogEnabled: true,
        catalogChannelProduction: true
      }),
      routes: [
        {
          title: 'My Flipper',
          icon: 'svguse:common-icons.svg#device',
          link: '/'
        },
        {
          title: 'Apps',
          icon: 'svguse:common-icons.svg#apps',
          link: '/apps'
        },
        {
          title: 'Files',
          icon: 'svguse:common-icons.svg#files',
          link: '/archive'
        },
        {
          title: 'CLI',
          icon: 'svguse:common-icons.svg#cli',
          link: '/cli'
        },
        {
          title: 'NFC tools',
          icon: 'svguse:common-icons.svg#nfctools',
          link: '/nfc-tools'
        },
        {
          title: 'Paint',
          icon: 'svguse:common-icons.svg#paint',
          link: '/paint'
        },
        {
          title: 'Pulse plotter',
          icon: 'svguse:common-icons.svg#subtools',
          link: '/pulse-plotter'
        }
      ],
      extLinks: [
        {
          title: 'Home',
          icon: 'mdi-home-outline',
          link: 'https://flipperzero.one/'
        },
        {
          title: 'Shop',
          icon: 'mdi-cart-outline',
          link: 'https://shop.flipperzero.one/'
        },
        {
          title: 'Docs',
          icon: 'mdi-book-open-variant',
          link: 'https://docs.flipperzero.one/'
        },
        {
          title: 'Blog',
          icon: 'mdi-newspaper-variant-outline',
          link: 'https://blog.flipperzero.one/'
        },
        {
          title: 'Forum',
          icon: 'mdi-forum-outline',
          link: 'https://forum.flipperzero.one/'
        }
      ],
      canLoadWithoutFlipper: [
        'remote-cli',
        'pulse-plotter',
        'apps'
      ],
      leftDrawer: ref(true),
      linksMenu: ref(false),
      flipper: new Flipper(),
      info: ref(null),
      reconnectLoop: ref(null),
      connectionStatus: ref('Ready to connect'),
      logger: log,
      history: ref([]),
      notify: $q.notify,
      fileToPass: ref(null)
    }
  },

  computed: {
    batteryIcon () {
      const roundedCharge = Math.round(Number(this.info.power.charge.level) / 10) * 10
      if (roundedCharge === 0) {
        return 'mdi-battery-outline'
      } else if (roundedCharge === 100) {
        return 'mdi-battery'
      }
      return 'mdi-battery-' + roundedCharge
    },
    batteryColor () {
      const charge = Number(this.info.power.charge.level)
      if (charge >= 75) {
        return 'positive'
      } else if (charge >= 30) {
        return 'warning'
      }
      return 'negative'
    },
    sdCardUsed () {
      if (this.info.storage.sdcard.freeSpace) {
        return 100 - Math.floor(this.info.storage.sdcard.freeSpace / (this.info.storage.sdcard.totalSpace / 100))
      } else {
        return 1
      }
    },
    internalUsed () {
      if (this.info.storage.internal.freeSpace) {
        return 100 - Math.floor(this.info.storage.internal.freeSpace / (this.info.storage.internal.totalSpace / 100))
      } else {
        return 1
      }
    }
  },

  watch: {
    $route (to, from) {
      this.checkConnectionRequirement(to.path)
    }
  },

  methods: {
    async connect () {
      await this.flipper.connect()
        .then(() => {
          this.flags.portSelectRequired = false
          this.connectionStatus = 'Flipper connected'
          this.flags.connected = true
          this.flags.flipperOccupiedDialog = false
          this.log({
            level: 'info',
            message: `${this.componentName}: Flipper connected`
          })
          if (dismissNotif) {
            dismissNotif()
          }
        })
        .catch((error) => {
          if (error.toString() === 'Error: No known ports') {
            this.flags.portSelectRequired = true
          } else if (error.toString().includes('Failed to open serial port')) {
            this.flags.portSelectRequired = true
            this.flags.flipperOccupiedDialog = true
          } else {
            this.log({
              level: 'error',
              message: `${this.componentName}: Failed to connect: ${error}`
            })
            this.connectionStatus = error.toString()
          }
        })
    },

    async selectPort () {
      const filters = [
        { usbVendorId: 0x0483, usbProductId: 0x5740 }
      ]
      await navigator.serial.requestPort({ filters })
      return this.start(true)
    },

    async disconnect () {
      await this.flipper.disconnect()
        .then(() => {
          this.connectionStatus = 'Disconnected'
          this.flags.connected = false
          this.info = null
          this.textInfo = ''
          this.fileToPass = null
        })
        .catch(error => {
          this.log({
            level: 'error',
            message: `${this.componentName}: Error while disconnecting ${error}`
          })
          this.connectionStatus = error.toString()
        })
      this.log({
        level: 'info',
        message: `${this.componentName}: Flipper disconnected`
      })
    },

    async startRpc () {
      if (!this.flags.connected) {
        return
      }
      this.flags.rpcToggling = true
      await this.flipper.startRPCSession()
        .catch(error => {
          console.error(error)
          this.log({
            level: 'error',
            message: `${this.componentName}: Error while starting RPC: ${error.toString()}`
          })
        })
      this.flags.rpcActive = true
      this.flags.rpcToggling = false
      this.log({
        level: 'info',
        message: `${this.componentName}: RPC started`
      })
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.setReadingMode('text', 'promptBreak')
      this.flags.rpcActive = false
      this.flags.rpcToggling = false
      this.log({
        level: 'info',
        message: `${this.componentName}: RPC stopped`
      })
    },

    async readInfo () {
      if (!this.flags.connected) {
        return
      }
      this.info = {
        doneReading: false,
        storage: {
          sdcard: {},
          databases: {},
          internal: {}
        }
      }
      const devInfo = await this.flipper.RPC('propertyGet', { key: 'devinfo' })
        .catch(error => this.rpcErrorHandler(error, 'propertyGet'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: propertyGet: OK`
          })
        })
      this.info = { ...this.info, ...devInfo }

      const powerInfo = await this.flipper.RPC('propertyGet', { key: 'pwrinfo' })
        .catch(error => this.rpcErrorHandler(error, 'propertyGet'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: propertyGet: OK`
          })
        })
      this.info.power = powerInfo

      const ext = await this.flipper.RPC('storageList', { path: '/ext' })
        .catch(error => this.rpcErrorHandler(error, 'storageList'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: storageList: /ext`
          })
        })

      if (ext && ext.length) {
        const manifest = ext.find(e => e.name === 'Manifest')
        if (manifest) {
          this.info.storage.databases.status = 'installed'
        } else {
          this.info.storage.databases.status = 'missing'
        }

        const extInfo = await this.flipper.RPC('storageInfo', { path: '/ext' })
          .catch(error => this.rpcErrorHandler(error, 'storageInfo'))
          .finally(() => {
            this.$emit('log', {
              level: 'debug',
              message: `${this.componentName}: storageInfo: /ext`
            })
          })
        this.info.storage.sdcard.status = 'installed'
        this.info.storage.sdcard.totalSpace = extInfo.totalSpace
        this.info.storage.sdcard.freeSpace = extInfo.freeSpace
      } else {
        this.info.storage.sdcard.status = 'missing'
        this.info.storage.databases.status = 'missing'
      }

      const intInfo = await this.flipper.RPC('storageInfo', { path: '/int' })
        .catch(error => this.rpcErrorHandler(error, 'storageInfo'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: storageInfo: /int`
          })
        })
      this.info.storage.internal.totalSpace = intInfo.totalSpace
      this.info.storage.internal.freeSpace = intInfo.freeSpace
      this.log({
        level: 'info',
        message: `${this.componentName}: Fetched device info`
      })

      this.info.doneReading = true
    },

    async setTime () {
      if (!this.flags.connected) {
        return
      }
      await this.flipper.RPC('systemSetDatetime', { date: new Date() })
        .catch(error => this.rpcErrorHandler(error, 'systemSetDatetime'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: systemSetDatetime: OK`
          })
        })
    },

    findKnownDevices () {
      const filters = [
        { usbVendorId: 0x0483, usbProductId: 0x5740 }
      ]
      return navigator.serial.getPorts({ filters })
    },

    autoReconnect () {
      if (this.reconnectLoop) {
        clearInterval(this.reconnectLoop)
        this.reconnectLoop = null
      }
      if (this.flags.autoReconnect) {
        this.reconnectLoop = setInterval(async () => {
          if (this.flags.autoReconnect) {
            const ports = await this.findKnownDevices()
            if (ports && ports.length > 0) {
              clearInterval(this.reconnectLoop)
              this.reconnectLoop = null
              return await this.start()
            }
          } else {
            clearInterval(this.reconnectLoop)
            this.reconnectLoop = null
          }
        }, 3000)
      }
    },

    toggleConnectOnStart () {
      localStorage.setItem('connectOnStart', this.flags.connectOnStart)
    },
    toggleAutoReconnect () {
      localStorage.setItem('autoReconnect', this.flags.autoReconnect)
    },
    toggleInstallFromFile () {
      localStorage.setItem('installFromFile', this.flags.installFromFile)
    },
    toggleCatalogEnabled () {
      localStorage.setItem('catalogEnabled', this.flags.catalogEnabled)
      location.reload()
    },
    toggleCatalogChannel () {
      localStorage.setItem('catalogChannel', this.flags.catalogChannelProduction ? 'production' : 'dev')
      location.reload()
    },
    setRpcStatus (s) {
      this.flags.rpcActive = s
    },
    setInfo (info) {
      this.info = info
    },
    onUpdateStage (stage) {
      if (stage === 'start') {
        this.flags.updateInProgress = true
      } else if (stage === 'end') {
        this.flags.updateInProgress = false
      }
    },
    openFileIn ({ path, file }) {
      this.log({
        level: 'info',
        message: `${this.componentName}: Passing file ${file.name} to ${path}`
      })
      this.fileToPass = file
      this.$router.push(path)
    },

    checkConnectionRequirement (path) {
      this.flags.connectionRequired = true
      for (const link of this.canLoadWithoutFlipper) {
        if ((path && path.includes(link)) || location.pathname.includes(link)) {
          this.flags.connectionRequired = false
          break
        }
      }

      if (this.flags.catalogEnabled !== true) {
        this.routes = this.routes.filter(e => e.link !== '/apps')
        if (location.pathname === '/apps') {
          this.$router.push('/')
        }
      }
    },

    showNotif ({ message, color, reloadBtn }) {
      const actions = []

      if (reloadBtn) {
        actions.push({ label: 'Reload', color: 'white', handler: () => { location.reload() } })
      }
      if (actions.length === 0) {
        actions.push({ icon: 'close', color: 'white', class: 'q-px-sm' })
      } else {
        actions.push({ label: 'Dismiss', color: 'white' })
      }

      dismissNotif = this.notify({
        message: message,
        color: color,
        textColor: 'white',
        position: 'bottom-right',
        timeout: 0,
        group: true,
        actions: actions
      })
    },

    log ({ level, message }) {
      const timestamp = Date.now()
      const t = new Date(timestamp)
      this.history.push({
        level,
        timestamp,
        time: `${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}`,
        message
      })
      switch (level) {
        case 'error':
          this.logger.error(message)
          break
        case 'warn':
          this.logger.warn(message)
          break
        case 'info':
          this.logger.info(message)
          break
        case 'debug':
          this.logger.debug(message)
          break
      }
    },

    rpcErrorHandler (error, command) {
      error = error.toString()
      this.showNotif({
        message: `RPC error in command '${command}': ${error}`,
        color: 'negative'
      })
      this.log({
        level: 'error',
        message: `${this.componentName}: RPC error in command '${command}': ${error}`
      })
    },

    downloadLogs () {
      let text = ''
      for (const line of this.history) {
        text += `${line.time} [${line.level}] ${line.message}\n`
      }
      const dl = document.createElement('a')
      dl.setAttribute('download', 'logs.txt')
      dl.setAttribute('href', 'data:text/plain,' + text)
      dl.style.visibility = 'hidden'
      document.body.append(dl)
      dl.click()
      dl.remove()
    },

    async start (manual) {
      const ports = await this.findKnownDevices()
      if (ports && ports.length > 0) {
        await this.connect()
        setTimeout(async () => {
          await this.startRpc()
          await this.readInfo()
          await this.setTime()
        }, 500)
      } else {
        this.flags.portSelectRequired = true
        if (manual) {
          return this.selectPort()
        }
      }
    }
  },

  async mounted () {
    if (this.$q.screen.width < 900) {
      this.leftDrawer = false
    }
    if ('serial' in navigator) {
      if (localStorage.getItem('connectOnStart') !== 'false') {
        this.flags.connectOnStart = true
        if (this.flags.connectionRequired) {
          await this.start()
        }
      } else {
        this.flags.connectOnStart = false
      }
      if (localStorage.getItem('autoReconnect') !== 'false') {
        this.flags.autoReconnect = true
      }
      if (localStorage.getItem('installFromFile') === 'true') {
        this.flags.installFromFile = true
      }

      const isProd = process.env.PRODUCTION
      const savedChannel = localStorage.getItem('catalogChannel')
      if (savedChannel) {
        if (savedChannel !== 'production') {
          this.flags.catalogChannelProduction = false
        } else {
          this.flags.catalogCanSwitchChannel = true
        }
      } else {
        if (isProd) {
          localStorage.setItem('catalogChannel', 'production')
        } else {
          localStorage.setItem('catalogChannel', 'dev')
          this.flags.catalogChannelProduction = false
          this.flags.catalogCanSwitchChannel = true
        }
      }

      navigator.serial.addEventListener('disconnect', e => {
        this.autoReconnect()
      })
    } else {
      this.flags.serialSupported = false
    }
    this.checkConnectionRequirement()

    navigator.serial.addEventListener('disconnect', (e) => {
      if (!this.flags.updateInProgress) {
        this.showNotif({
          message: 'Flipper has been disconnected'
        })
        this.flags.connected = false
        this.flags.portSelectRequired = true
      }
      this.log({
        level: 'info',
        message: `${this.componentName}: Flipper has been disconnected`
      })
    })

    this.logger.setLevel('info', true)
    const originalFactory = this.logger.methodFactory
    this.logger.methodFactory = function (methodName, logLevel, loggerName) {
      const rawMethod = originalFactory(methodName, logLevel, loggerName)

      return function (message) {
        if (methodName !== 'debug') {
          rawMethod(message)
        }
      }
    }
    this.logger.setLevel(log.getLevel())
  }
})
</script>
