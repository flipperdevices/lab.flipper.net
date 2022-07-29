<template>
  <q-layout view="hhh LpR fff">
    <q-header>
      <q-toolbar>
        <q-btn
          v-if="$q.screen.width <= 750"
          @click="leftDrawer = !leftDrawer"
          icon="menu"
          dense
          flat
          round
          class="q-mr-xs"
        ></q-btn>

        <img
          v-show="!$q.screen.xs"
          src="../assets/flipper-logo.svg"
          class="q-ml-sm"
          style="height: 18px;"
        />

        <q-space></q-space>

        <template v-if="flags.serialSupported">
          <q-btn
            v-if="flags.portSelectRequired || !flags.connected && !flags.portSelectRequired"
            @click="flags.portSelectRequired ? selectPort() : start(true)"
            outline
            class="q-mx-sm"
          >
            Connect
          </q-btn>
          <q-btn
            v-else-if="this.info"
            outline
            class="q-mx-sm"
            :label="info.hardware_name"
          >
          <q-menu :offset="[0, 10]">
            <div class="row no-wrap q-pa-md">
              <div class="column">
                <div class="text-h6 q-mb-md">Settings</div>
                <q-toggle
                  v-model="flags.connectOnStart"
                  @click="toggleConnectOnStart"
                  label="Connect on page load"
                ></q-toggle>
                <q-toggle
                  v-model="flags.autoReconnect"
                  @click="toggleAutoReconnect"
                  label="Auto-reconnect"
                ></q-toggle>
              </div>

              <q-separator vertical inset class="q-mx-lg"></q-separator>

              <div class="column items-center">
                <q-avatar size="72px" square>
                  <img v-if="info.hardware_color === '1'" src="../assets/flipper_black.svg"/>
                  <img v-else src="../assets/flipper_white.svg"/>
                </q-avatar>

                <div class="text-subtitle1 q-mb-sm">{{ info.hardware_name }}</div>

                <q-btn
                  color="primary"
                  label="Disconnect"
                  size="sm"
                  v-close-popup
                  @click="disconnect"
                ></q-btn>
              </div>
            </div>
          </q-menu>
          </q-btn>
          <div v-else style="margin: 0 0.85rem">{{ connectionStatus }}</div>
        </template>

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
          <q-separator v-if="flags.serialSupported" dark vertical inset class="q-mx-lg"></q-separator>
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
      show-if-above
      :mini="miniState"
      @mouseover="miniState = false"
      @mouseout="miniState = true"
      mini-to-overlay
      bordered
      :width="180"
      :breakpoint="750"
    >
      <q-list>
        <RouterLink
          v-for="link in routes"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view
        v-if="!flags.connectionRequired || flags.updateInProgress || (flags.serialSupported && info !== null && this.info.storage_databases_present)"
        :flipper="flipper"
        :rpcActive="flags.rpcActive"
        :connected="flags.connected"
        :info="info"
        @setRpcStatus="setRpcStatus"
        @setInfo="setInfo"
        @update="onUpdateStage"
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
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import ExternalLink from 'components/ExternalLink.vue'
import RouterLink from 'components/RouterLink.vue'
import * as flipper from '../flipper/core'
import asyncSleep from 'simple-async-sleep'

export default defineComponent({
  name: 'MainLayout',

  components: {
    ExternalLink,
    RouterLink
  },

  setup () {
    return {
      routes: [
        {
          title: 'Device',
          icon: 'memory',
          link: '/'
        },
        {
          title: 'Archive',
          icon: 'inventory',
          link: '/archive'
        },
        {
          title: 'CLI',
          icon: 'terminal',
          link: '/cli'
        },
        {
          title: 'Paint',
          icon: 'draw',
          link: '/paint'
        },
        {
          title: 'Pulse plotter',
          icon: 'equalizer',
          link: '/pulse-plotter'
        }
      ],
      extLinks: [
        {
          title: 'Home',
          icon: 'open_in_new',
          link: 'https://flipperzero.one/'
        },
        {
          title: 'Shop',
          icon: 'open_in_new',
          link: 'https://shop.flipperzero.one/'
        },
        {
          title: 'FAQ',
          icon: 'open_in_new',
          link: 'https://flipperzero.one/faq/'
        },
        {
          title: 'Blog',
          icon: 'open_in_new',
          link: 'https://blog.flipperzero.one/'
        },
        {
          title: 'Forum',
          icon: 'open_in_new',
          link: 'https://forum.flipperzero.one/'
        }
      ],
      canLoadWithoutFlipper: [
        'remote-cli',
        'pulse-plotter'
      ],
      leftDrawer: ref(false),
      linksMenu: ref(false),
      miniState: ref(true),

      flipper: ref(flipper),
      info: ref(null),
      flags: ref({
        serialSupported: true,
        connectionRequired: true,
        portSelectRequired: false,
        connected: false,
        rpcActive: false,
        connectOnStart: true,
        autoReconnect: false,
        updateInProgress: false
      }),
      reconnectLoop: ref(null),
      connectionStatus: ref('Ready to connect')
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
        })
        .catch((error) => {
          if (error.toString() === 'Error: No known ports') {
            this.flags.portSelectRequired = true
          } else {
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
        })
        .catch(async error => {
          if (error.toString().includes('Cannot cancel a locked stream')) {
            if (this.flags.rpcActive) {
              await this.stopRpc()
            } else {
              this.flipper.closeReader()
              await asyncSleep(300)
            }
            return this.disconnect()
          } else {
            this.connectionStatus = error.toString()
          }
        })
    },

    async startRpc () {
      this.flags.rpcToggling = true
      const ping = await this.flipper.commands.startRpcSession(this.flipper)
      if (!ping.resolved || ping.error) {
        throw new Error('Couldn\'t start rpc session')
      }
      this.flags.rpcActive = true
      this.flags.rpcToggling = false
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.commands.stopRpcSession()
      this.flags.rpcActive = false
      this.flags.rpcToggling = false
    },

    async readInfo () {
      this.info = {}
      let res = await this.flipper.commands.system.deviceInfo()
      for (const line of res) {
        this.info[line.key] = line.value
      }
      await asyncSleep(300)
      res = await this.flipper.commands.storage.list('/ext')
      if (res && typeof (res) === 'object' && res.length) {
        const manifest = res.find(e => e.name === 'Manifest')
        if (manifest) {
          this.info.storage_databases_present = 'installed'
        } else {
          this.info.storage_databases_present = 'missing'
        }

        res = await this.flipper.commands.storage.info('/ext')
        this.info.storage_sdcard_present = Math.floor(res.freeSpace / (res.totalSpace / 100)) + '% free'
      } else {
        this.info.storage_sdcard_present = 'missing'
        this.info.storage_databases_present = 'missing'
      }
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
    setRpcStatus (s) {
      this.flags.rpcActive = s
    },
    setInfo (info) {
      this.info = info
    },
    onUpdateStage (stage) {
      if (stage === 'start') {
        this.flags.updateInProgress = true
      } else if (stage === 'success') {
        this.flags.updateInProgress = false
      }
    },

    checkConnectionRequirement (path) {
      this.flags.connectionRequired = true
      for (const link of this.canLoadWithoutFlipper) {
        if ((path && path.includes(link)) || location.pathname.includes(link)) {
          this.flags.connectionRequired = false
          break
        }
      }
    },

    async start (manual) {
      const ports = await this.findKnownDevices()
      if (ports && ports.length > 0) {
        await this.connect()
        await this.startRpc()
        await this.readInfo()
      } else {
        this.flags.portSelectRequired = true
        if (manual) {
          return this.selectPort()
        }
      }
    }
  },

  async mounted () {
    this.checkConnectionRequirement()
    if ('serial' in navigator) {
      if (localStorage.getItem('connectOnStart') !== 'false' && this.flags.connectionRequired) {
        await this.start()
      } else {
        this.flags.connectOnStart = false
      }
      if (localStorage.getItem('autoReconnect') !== 'false') {
        this.flags.autoReconnect = true
      }
      navigator.serial.addEventListener('disconnect', e => {
        this.autoReconnect()
      })
    } else {
      this.flags.serialSupported = false
    }
  }
})
</script>
