<template>
  <q-page class="column items-center bg-black q-pl-sm">
    <div class="full-width" style="height: calc(100vh - 50px)">
      <q-card
        class="absolute-top-right z-top"
        style="margin-right: 25px"
      >
        <q-card-section
          v-if="flags.connected"
          class="bg-black text-white"
        >
          <div class="text-h6">Remote session</div>
          <p>
            Room name: {{ roomName }}<br />
            My id: {{ socket.id }}<br />
            Host id: {{ hostId }}<br />
            Clients connected: {{ clientsCount }}
          </p>
        </q-card-section>
      </q-card>
      <div id="terminal-container" class="fit bg-black"></div>
    </div>
    <q-dialog v-model="flags.roomNameRequired">
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6 q-mr-xl">Enter room name</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="roomName"
            :style="$q.screen.width > 380 ? 'width: 300px;' : ''"
          >
            <template v-slot:after>
              <q-btn round flat icon="send" @click="flags.roomNameRequired = false; startClient(roomName)"/>
            </template>
          </q-input>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="flags.hostDisconnected">
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6 q-mr-xl">Host disconnected</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
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
  name: 'PageRemoteCli',

  setup () {
    return {
      flags: ref({
        connected: false,
        roomNameRequired: false,
        hostDisconnected: false
      }),
      terminal: ref(undefined),
      readInterval: undefined,
      input: ref(''),
      unbind: ref(undefined),
      socket: ref(null),
      roomName: ref(''),
      hostId: ref(null),
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

      this.terminal.onData(data => {
        this.socket.emit('dmToHost', this.hostId, data, (res) => {
          if (res.error) {
            this.$emit('showNotif', {
              message: 'Failed to send message to host',
              color: 'negative'
            })
            this.$emit('log', {
              level: 'error',
              message: `Remote CLI: Failed to send message to host: ${res.error.toString()}`
            })
          }
        })
      })

      this.startClient()
    },

    startClient (roomName) {
      this.roomName = roomName || window.location.hash.substr(1)
      if (!this.roomName) {
        this.flags.roomNameRequired = true
        return
      }

      this.socket = io('ws://localhost:3000')
      this.socket.on('connect', () => {
        this.flags.connected = true
        this.$emit('log', {
          level: 'info',
          message: `Remote CLI: Connected to cli server. My id: ${this.socket.id}`
        })

        this.socket.emit('joinRoom', this.roomName, (res) => {
          if (res.error) {
            this.$emit('showNotif', {
              message: `Failed to connect to room ${this.roomName}`,
              color: 'negative'
            })
            this.$emit('log', {
              level: 'error',
              message: `Remote CLI: Failed to connect to room ${this.roomName}: ${res.error.toString()}`
            })
          } else if (res.hostId) {
            this.$emit('log', {
              level: 'info',
              message: `Remote CLI: Connected to room ${this.roomName}. Host id: ${res.hostId}`
            })
            this.hostId = res.hostId

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

      this.socket.on('cliText', (text) => {
        if (typeof (text) === 'string') {
          this.terminal.write(text)
        }
      })

      this.socket.on('disconnect', () => {
        this.$emit('showNotif', {
          message: 'Disconnected from cli server'
        })
        this.$emit('log', {
          level: 'warn',
          message: 'Remote CLI: Disconnected from cli server'
        })
        this.flags.connected = true
        this.socket.disconnect()
        clearInterval(this.clientsPollingInterval)
      })
    }
  },

  mounted () {
    this.init()
  },

  async beforeUnmount () {
    this.socket.disconnect()
    clearInterval(this.clientsPollingInterval)
  }
})
</script>
