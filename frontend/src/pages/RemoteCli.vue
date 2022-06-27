<template>
  <q-page class="column items-center bg-black">
    <div class="full-width" style="height: calc(100vh - 50px)">
      <div id="terminal-container" class="fit bg-black q-pl-sm"></div>
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
            :label="'frc-xxx-yyy'"
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
import P2PT from 'p2pt'

const trackersAnnounceURLs = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.sloppyta.co:443/announce',
  'wss://tracker.novage.com.ua:443/announce',
  'wss://tracker.btorrent.xyz:443/announce',
  'wss://tracker.files.fm:7073/announce',
  'wss://tracker.btorrent.xyz',
  'wss://spacetradersapi-chatbox.herokuapp.com:443/announce',
  'ws://tracker.files.fm:7072/announce'
]

export default defineComponent({
  name: 'PageRemoteCli',

  setup () {
    return {
      flags: ref({
        roomNameRequired: false,
        hostDisconnected: false
      }),
      terminal: ref(undefined),
      readInterval: undefined,
      input: ref(''),
      unbind: ref(undefined),
      p2pt: ref(null),
      peers: ref([]),
      roomName: ref(''),
      hostPeer: ref(null)
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
        this.p2pt.send(this.hostPeer, data)
      })

      this.startClient()
    },

    startClient (roomName) {
      this.roomName = roomName || window.location.hash.substr(1)
      if (!this.roomName) {
        this.flags.roomNameRequired = true
        return
      }

      this.p2pt = new P2PT(trackersAnnounceURLs, this.roomName)

      this.p2pt.on('trackerconnect', (tracker, stats) => {
        // console.log('Connected to tracker: ' + tracker.announceUrl)
        // console.log('Tracker stats:', stats)
      })

      this.p2pt.on('peerconnect', (peer) => {
        this.peers.push(peer)
        // console.log('New peer: ' + peer.id)
        // console.log('Current peers: ', this.peers)
      })

      this.p2pt.on('peerclose', (peer) => {
        if (peer.id === this.hostPeer.id) {
          this.flags.hostDisconnected = true
        }
      })

      this.p2pt.on('msg', (peer, msg) => {
        // console.log(`Message from ${peer.id}:`, msg)
        if (typeof (msg) === 'object' && msg.host) {
          this.hostPeer = this.peers.find(p => p.id === peer.id)
          // console.log('Connected to host: ' + peer.id)
        } else if (typeof (msg) === 'string') {
          this.terminal.write(msg)
        }
      })

      // console.log(`P2PT starting. My peer id: ${this.p2pt._peerId}, room name: ${this.roomName}`)
      this.p2pt.start()
    }
  },

  mounted () {
    this.init()
  }
})
</script>
