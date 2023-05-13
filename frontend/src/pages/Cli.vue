<template>
  <q-page class="column items-center bg-black q-pl-sm full-width">
    <div
      v-if="!connected"
      class="column flex-center q-my-xl"
    >
      <q-spinner
        color="primary"
        size="3em"
        class="q-mb-md"
      ></q-spinner>
      <p class="text-white">Waiting for Flipper...</p>
    </div>
    <div v-if="connected && !flags.rpcActive" class="full-width" style="height: calc(100vh - 50px)">
      <div id="terminal-container" class="fit bg-black"></div>

      <q-btn
        color="black"
        icon="tune"
        class="absolute-top-right q-ma-sm z-top shadow-2"
      >
        <q-menu dark :offset="[0, 10]">
          <q-list dark bordered separator style="min-width: 100px; border-width: 2px;">
            <q-item v-if="flags.foundDumpOnStartup" clickable v-close-popup @click="terminal.write(dump)">
              <q-item-section avatar><q-icon name="mdi-history" /></q-item-section>
              <q-item-section>Restore history</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="downloadDump">
              <q-item-section avatar><q-icon name="mdi-download" /></q-item-section>
              <q-item-section>Download history</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="clearDump" class="text-negative">
              <q-item-section avatar><q-icon name="mdi-delete" /></q-item-section>
              <q-item-section>Clear history</q-item-section>
            </q-item>
            <q-item class="text-center">
              <q-item-section class="col-grow">Font size</q-item-section>
              <q-item-section>
                <q-btn dense color="black" icon="mdi-minus" @click="fontSize--"/>
              </q-item-section>
              <q-item-section>{{ fontSize }}</q-item-section>
              <q-item-section>
                <q-btn dense color="black" icon="mdi-plus" @click="fontSize++"/>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
    <q-dialog v-model="flags.sharePopup">
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 q-mr-xl">CLI session sharing</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <template v-if="flags.serverActive">
            <p>
              Room name: <code class="bg-grey-4 q-pa-xs rounded-borders">{{ roomName }}</code><br />
              <a :href="'/remote-cli#' + roomName" target="_blank">Sharelink</a>
            </p>

            <p>
              Clients connected: {{ clientsCount }}
            </p>

            <q-toggle v-model="flags.allowPeerInput" label="Allow peer input" />
          </template>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :loading="flags.serverToggling"
            :color="flags.serverActive ? 'negative' : 'black'"
            @click="flags.serverActive ? stopServer() : startServer()"
          >
            {{ flags.serverActive ? 'Stop server' : 'Start server' }}
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Terminal } from 'xterm'
import 'xterm/css/xterm.css'
import { FitAddon } from 'xterm-addon-fit'
import { SerializeAddon } from 'xterm-addon-serialize'
import { io } from 'socket.io-client'
import asyncSleep from 'simple-async-sleep'

export default defineComponent({
  name: 'PageCli',

  props: {
    flipper: Object,
    info: Object,
    connected: Boolean,
    rpcActive: Boolean
  },

  setup () {
    return {
      componentName: 'CLI',

      flags: ref({
        rpcActive: false,
        rpcToggling: false,
        serverActive: false,
        serverToggling: false,
        sharePopup: false,
        allowPeerInput: false,
        sharingEnabled: false,
        foundDumpOnStartup: false
      }),
      terminal: ref(undefined),
      readInterval: undefined,
      input: ref(''),
      unbind: ref(undefined),
      socket: ref(null),
      roomName: ref(''),
      clientsCount: ref(0),
      clientsPollingInterval: ref(null),
      fontSize: ref(14),
      serializeAddon: null,
      dump: ref('')
    }
  },

  watch: {
    async fontSize (newSize, oldInfo) {
      if (this.terminal) {
        this.terminal.options.fontSize = Number(newSize)
        localStorage.setItem('cli-fontSize', newSize)
      }
    }
  },

  methods: {
    init () {
      this.terminal = new Terminal({
        scrollback: 10_000,
        fontSize: this.fontSize,
        allowProposedApi: true
      })
      const fitAddon = new FitAddon()
      this.terminal.loadAddon(fitAddon)
      this.serializeAddon = new SerializeAddon()
      this.terminal.loadAddon(this.serializeAddon)
      if (this.dump) {
        this.flags.foundDumpOnStartup = true
      }
      this.terminal.open(document.getElementById('terminal-container'))
      document.querySelector('.xterm').setAttribute('style', 'height:' + getComputedStyle(document.querySelector('.xterm')).height)
      this.terminal.focus()
      fitAddon.fit()

      this.write('\r\n\x01\r\n')
      // this.read()

      let dumpTimeout
      this.terminal.onData(async data => {
        if (!dumpTimeout) {
          clearTimeout(dumpTimeout)
        }
        dumpTimeout = setTimeout(() => {
          this.dump = localStorage.getItem('cli-dump')
        }, 500)
        this.write(data)
      })
    },

    write (data) {
      this.flipper.write(data)
    },

    downloadDump () {
      const text = this.serializeAddon.serialize()
      const dl = document.createElement('a')
      dl.setAttribute('download', 'cli-dump.txt')
      dl.setAttribute('href', 'data:text/plain,' + text)
      dl.style.visibility = 'hidden'
      document.body.append(dl)
      dl.click()
      dl.remove()
    },

    clearDump () {
      this.dump = ''
      localStorage.setItem('cli-dump', '')
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

    startServer () {
      this.flags.serverToggling = true
      this.roomName = this.info.hardware.name
      if (!this.socket) {
        this.socket = io('ws://lab.flipper.net:3000')
      }

      this.socket.on('connect', () => {
        this.$emit('log', {
          level: 'info',
          message: `${this.componentName}: Connected to cli server. My id: ${this.socket.id}, room name: ${this.roomName}`
        })

        this.socket.emit('claimRoomName', this.roomName, (res) => {
          if (res.error) {
            this.$emit('showNotif', {
              message: `Failed to claim room ${this.roomName}`,
              color: 'negative'
            })
            this.$emit('log', {
              level: 'error',
              message: `${this.componentName}: Failed to claim room ${this.roomName}: ${res.error.toString()}`
            })
          }
        })

        this.socket.emit('joinRoom', this.roomName, (res) => {
          if (res.error) {
            this.$emit('showNotif', {
              message: `Failed to join room ${this.roomName}`,
              color: 'negative'
            })
            this.$emit('log', {
              level: 'error',
              message: `${this.componentName}: Failed to join room ${this.roomName}: ${res.error.toString()}`
            })
          } else {
            this.$emit('log', {
              level: 'info',
              message: `${this.componentName}: Hosting room ${this.roomName}`
            })

            this.clientsPollingInterval = setInterval(() => {
              this.socket.emit('pollClients', this.roomName, (res) => {
                if (res.clientsCount) {
                  this.clientsCount = res.clientsCount - 1
                }
              })
            }, 3000)
          }
        })
      })

      this.socket.on('dm', (id, text) => {
        if (typeof (text) === 'string' && this.flags.allowPeerInput) {
          this.write(text)
        }
      })

      this.socket.on('disconnect', () => {
        this.$emit('showNotif', {
          message: 'Disconnected from cli server'
        })
        this.$emit('log', {
          level: 'warn',
          message: `${this.componentName}: Disconnected from CLI server`
        })
        if (this.flags.serverActive !== false) {
          this.stopServer()
        }
      })

      this.flags.serverToggling = false
      this.flags.serverActive = true
    },

    stopServer () {
      this.flags.serverToggling = true
      this.socket.disconnect()
      clearInterval(this.clientsPollingInterval)
      this.clientsCount = 0
      this.roomName = ''
      this.flags.serverToggling = false
      this.flags.serverActive = false
      this.flags.sharePopup = false
    },

    broadcast (msg) {
      this.socket.emit('broadcast', this.roomName, msg, (res) => {
        if (res.error) {
          this.$emit('log', {
            level: 'error',
            message: `${this.componentName}: Failed to broadcast: ${res.error.toString()}`
          })
          console.error(res.message)
        }
      })
    },

    async start () {
      this.flags.rpcActive = this.rpcActive
      if (this.rpcActive) {
        await this.stopRpc()
      }
      if (window.innerWidth < 381) {
        this.fontSize = 9
      } else if (window.innerWidth < 463) {
        this.fontSize = 11
      }

      setTimeout(this.init, 500)
      await asyncSleep(1000)
      await this.flipper.setReadingMode('text')

      this.unbind = this.flipper.emitter.on('cli/output', data => {
        this.terminal.write(data)
      })
    }
  },

  mounted () {
    this.dump = localStorage.getItem('cli-dump')
    if (this.connected) {
      setTimeout(this.start, 500)
    }

    const savedFontSize = localStorage.getItem('cli-fontSize')
    if (savedFontSize) {
      this.fontSize = Number(savedFontSize)
    }

    if (new URLSearchParams(location.search).get('sharing') === 'true') {
      this.flags.sharingEnabled = true
    }
  },

  async beforeUnmount () {
    localStorage.setItem('cli-dump', this.serializeAddon.serialize())
    this.unbind()
    if (this.flags.serverActive) {
      this.stopServer()
    }
  }
})
</script>
