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
            console.error(res.message)
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
        console.log(`Connected to cli server. My id: ${this.socket.id}`)

        this.socket.emit('joinRoom', this.roomName, (res) => {
          if (res.error) {
            console.error(res.message)
          } else if (res.hostId) {
            console.log(`Connected to room ${this.roomName}. Host id: ${res.hostId}`)
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
        // console.log('cliText:', text)
        if (typeof (text) === 'string') {
          this.terminal.write(text)
        }
      })

      this.socket.on('disconnect', () => {
        console.log('Disconnected from cli server')
        this.flags.connected = true
        this.socket.disconnect()
        clearInterval(this.clientsPollingInterval)
      })

      /* this.p2pt.on('peerclose', (peer) => {
        if (peer.id === this.hostPeer.id) {
          this.flags.hostDisconnected = true
        }
      }) */
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
