<template>
  <q-page class="column items-center bg-black q-pl-sm">
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
        v-if="flags.sharingEnabled"
        @click="flags.sharePopup = true"
        outline
        color="white"
        class="absolute-top-right q-ma-sm z-top shadow-2"
        style="margin-right: 25px"
      >
        {{ flags.serverActive ? 'Session live' : 'Share session' }}
        <q-badge
          v-if="flags.serverActive"
          :label="clientsCount > 0 ? clientsCount : ''"
          rounded
          color="green"
          class="q-ml-md"
        />
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
import { io } from 'socket.io-client'

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
      flags: ref({
        rpcActive: false,
        rpcToggling: false,
        serverActive: false,
        serverToggling: false,
        sharePopup: false,
        allowPeerInput: false,
        sharingEnabled: false
      }),
      terminal: ref(undefined),
      readInterval: undefined,
      input: ref(''),
      unbind: ref(undefined),
      socket: ref(null),
      roomName: ref(''),
      clientsCount: ref(0),
      clientsPollingInterval: ref(null)
    }
  },

  methods: {
    init () {
      this.terminal = new Terminal({
        scrollback: 10_000
      })
      const fitAddon = new FitAddon()
      this.terminal.loadAddon(fitAddon)
      this.terminal.open(document.getElementById('terminal-container'))
      document.querySelector('.xterm').setAttribute('style', 'height:' + getComputedStyle(document.querySelector('.xterm')).height)
      this.terminal.focus()
      fitAddon.fit()

      this.write('\x01')
      this.read()

      this.terminal.onData(async data => {
        this.write(data)
      })
    },

    write (data) {
      this.flipper.write('cli', data)
    },

    read () {
      this.flipper.read('cli')
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.commands.stopRpcSession()
      this.flags.rpcActive = false
      this.flags.rpcToggling = false
      this.$emit('setRpcStatus', false)
      this.$emit('log', {
        level: 'info',
        message: 'CLI: RPC stopped'
      })
    },

    startServer () {
      this.flags.serverToggling = true
      this.roomName = this.info.hardware_name
      if (!this.socket) {
        this.socket = io('ws://my.flipp.dev:3000')
      }

      this.socket.on('connect', () => {
        this.$emit('log', {
          level: 'info',
          message: `CLI: Connected to cli server. My id: ${this.socket.id}, room name: ${this.roomName}`
        })

        this.socket.emit('claimRoomName', this.roomName, (res) => {
          if (res.error) {
            this.$emit('showNotif', {
              message: `Failed to claim room ${this.roomName}`,
              color: 'negative'
            })
            this.$emit('log', {
              level: 'error',
              message: `CLI: Failed to claim room ${this.roomName}: ${res.error.toString()}`
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
              message: `CLI: Failed to join room ${this.roomName}: ${res.error.toString()}`
            })
          } else {
            this.$emit('log', {
              level: 'info',
              message: `CLI: Hosting room ${this.roomName}`
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
          message: 'CLI: Disconnected from cli server'
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
            message: `Remote CLI: Failed to broadcast: ${res.error.toString()}`
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
      setTimeout(this.init, 500)

      let isUnicode = false,
        unicodeBytesLeft = 0,
        unicodeBuffer = []

      this.unbind = this.flipper.emitter.on('cli output', data => {
        if (data.byteLength === 1) {
          const byte = data[0]
          if (!isUnicode && byte >> 7 === 1) {
            isUnicode = true
            data = undefined
            unicodeBuffer.push(byte)
            for (let i = 6; i >= 4; i--) {
              if ((byte >> i) % 2 === 1) {
                unicodeBytesLeft++
              } else {
                break
              }
            }
          } else {
            if (unicodeBytesLeft > 0 && byte >> 6 === 2) {
              unicodeBuffer.push(byte)
              unicodeBytesLeft--
              if (unicodeBytesLeft === 0) {
                data = new Uint8Array(unicodeBuffer)
                isUnicode = false
                unicodeBuffer = []
              } else {
                data = undefined
              }
            } else {
              isUnicode = false
              unicodeBytesLeft = 0
              unicodeBuffer = []
            }
          }
        }
        if (data) {
          const text = new TextDecoder().decode(data).replaceAll('\x7F', '')
          this.terminal.write(text)
          if (this.flags.serverActive) {
            this.broadcast(text)
          }
        }
      })
    }
  },

  mounted () {
    if (this.connected) {
      setTimeout(this.start, 500)
    }

    if (new URLSearchParams(location.search).get('sharing') === 'true') {
      this.flags.sharingEnabled = true
    }
  },

  async beforeUnmount () {
    this.unbind()
    if (this.flags.serverActive) {
      this.stopServer()
    }
  }
})
</script>
