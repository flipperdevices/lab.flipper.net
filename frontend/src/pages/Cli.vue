<template>
  <q-page class="column items-center bg-black">
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
      <div id="terminal-container" class="fit bg-black q-pl-sm"></div>
      <q-btn
        @click="flags.sharePopup = true"
        outline
        color="white"
        class="absolute-top-right q-ma-sm z-top"
      >
        {{ flags.serverActive ? 'Session live' : 'Share session' }}
        <q-badge
          v-if="flags.serverActive"
          :label="peers.length > 0 ? peers.length.toString() : ''"
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
              Active trackers: {{ activeTrackers }}<br/>
              Peers connected: {{ peers.length }}
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
import P2PT from 'p2pt'

const trackersAnnounceURLs = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.sloppyta.co:443/announce',
  'wss://tracker.novage.com.ua:443/announce',
  'wss://tracker.btorrent.xyz:443/announce',
  'wss://tracker.files.fm:7073/announce',
  'wss://tracker.btorrent.xyz',
  'wss://spacetradersapi-chatbox.herokuapp.com:443/announce'
]

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
        allowPeerInput: false
      }),
      terminal: ref(undefined),
      readInterval: undefined,
      input: ref(''),
      unbind: ref(undefined),
      p2pt: ref(null),
      roomName: ref(''),
      peers: ref([]),
      activeTrackers: ref(0)
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
    },

    startServer () {
      this.flags.serverToggling = true
      this.roomName = 'frc-' + this.info.hardware_name + '-' + Math.floor(Date.now() / 3600000)
      this.p2pt = new P2PT(trackersAnnounceURLs, this.roomName)

      this.p2pt.on('trackerconnect', (tracker, stats) => {
        this.activeTrackers = stats.connected
      })

      this.p2pt.on('peerconnect', (peer) => {
        this.peers.push(peer)
        // console.log('New peer: ' + peer.id)
        // console.log('Current peers: ', this.peers)
        this.p2pt.send(peer, { host: true })
        for (let i = this.terminal.buffer.active.baseY; i <= this.terminal.buffer.active.length - 1; i++) {
          this.p2pt.send(peer, this.terminal.buffer.active.getLine(i)?.translateToString())
        }
      })

      this.p2pt.on('peerclose', (peer) => {
        this.peers = this.peers.filter(p => p.id !== peer.id)
        // console.log('Peer left: ' + peer.id)
        // console.log('Current peers: ', this.peers)
      })

      this.p2pt.on('msg', (peer, msg) => {
        if (typeof (msg) === 'string' && this.flags.allowPeerInput) {
          this.write(msg)
        }
        // console.log(`Message from ${peer.id}:`, msg)
      })

      // console.log(`P2PT starting. My peer id: ${this.p2pt._peerId}, room name: ${this.roomName}`)
      this.p2pt.start()
      this.flags.serverToggling = false
      this.flags.serverActive = true
    },

    stopServer () {
      this.flags.serverToggling = true
      this.p2pt.destroy()
      this.p2pt = null
      this.peers = []
      this.roomName = ''
      this.flags.serverToggling = false
      this.flags.serverActive = false
      this.flags.sharePopup = false
    },

    broadcast (msg) {
      for (const peer of this.peers) {
        this.p2pt.send(peer, msg)
      }
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
  },

  async beforeUnmount () {
    this.unbind()
  }
})
</script>
