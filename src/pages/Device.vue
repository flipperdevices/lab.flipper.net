<template>
  <q-page class="flex flex-center column">
    <p>{{ connectionStatus }}</p>

    <q-btn
      v-if="flags.portSelectRequired || !flags.connected && !flags.portSelectRequired"
      @click="flags.portSelectRequired ? selectPort() : connect()"
      color="positive"
    >
      {{ flags.portSelectRequired ? 'Select port' : 'Connect' }}
    </q-btn>

    <div v-if="flags.connected" class="flex flex-center column">
      <div>
        <q-btn
          @click="flags.rpcActive ? stopRpc() : startRpc()"
          :loading="flags.rpcToggling"
          :color="flags.rpcActive ? 'negative' : 'positive'"
          class="q-ma-sm"
        >
          {{ flags.rpcActive ? 'Stop rpc' : 'Start rpc' }}
        </q-btn>

        <q-btn
          @click="disconnect"
          color="negative"
          class="q-ma-sm"
        >
          Disconnect
        </q-btn>
      </div>

      <div v-if="flags.rpcActive">
        <q-btn
          @click="rpcReadInfo"
          class="q-ma-sm"
        >
          Read info (RPC)
        </q-btn>
        <q-btn
          @click="flags.screenStream ? stopScreenStream() : startScreenStream()"
          :color="flags.screenStream ? 'negative' : 'positive'"
          class="q-ma-sm"
        >
          {{ flags.screenStream ? 'Stop screen streaming' : 'Start screen streaming' }}
        </q-btn>
      </div>
      <div v-else>
        <q-btn
          @click="cliReadInfo"
          class="q-ma-sm"
        >
          Read info (CLI)
        </q-btn>
      </div>
    </div>

    <pre
      v-if="this.textInfo.length"
      style="white-space: pre-line;"
    >
      {{ this.textInfo }}
    </pre>

    <pre
      v-if="this.info.device_info_major"
      style="white-space: pre-line;"
    >
      {{ this.info }}
    </pre>

    <canvas
      v-show="flags.screenStream"
      width="128"
      height="64"
      style="transform: scale(1);image-rendering: pixelated;"
      ref="screenStreamCanvas"
    ></canvas>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import * as flipper from '../flipper/core'
import asyncSleep from 'simple-async-sleep'

const filters = [
  { usbVendorId: 0x0483, usbProductId: 0x5740 }
]

export default defineComponent({
  name: 'PageDevice',

  setup () {
    return {
      flipper: ref(flipper),
      info: ref({}),
      textInfo: ref(''),
      flags: ref({
        portSelectRequired: false,
        connected: false,
        rpcActive: false,
        rpcToggling: false,
        screenStream: false
      }),
      connectionStatus: ref('Ready to connect')
    }
  },

  methods: {
    async connect () {
      await this.flipper.connect()
        .then(() => {
          this.flags.portSelectRequired = false
          this.connectionStatus = 'Connected'
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
      await navigator.serial.requestPort({ filters })
      return this.connect()
    },

    async disconnect () {
      await this.flipper.disconnect()
        .then(() => {
          this.connectionStatus = 'Disconnected'
          this.flags.connected = false
          this.info = {}
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

    // Test buttons
    async rpcReadInfo () {
      const res = await this.flipper.commands.system.deviceInfo()
      for (const line of res) {
        this.info[line.key] = line.value
      }
    },

    async cliReadInfo () {
      await this.flipper.write('cli', '!\r\n')
      this.flipper.read('cli')
      const unbind = this.flipper.emitter.on('cli output', data => {
        const chunk = new TextDecoder().decode(data)
        this.textInfo += chunk
        if (chunk.includes('\x07')) {
          this.flipper.closeReader()
          unbind()
        }
      })
    },

    async startScreenStream () {
      this.flipper.commands.gui.startScreenStreamRequest()
      this.flags.screenStream = true

      const ctx = this.$refs.screenStreamCanvas.getContext('2d')
      ctx.lineWidth = 1
      ctx.lineCap = 'square'
      ctx.strokeStyle = 'black'
      ctx.imageSmoothingEnabled = false

      const unbind = this.flipper.emitter.on('screen frame', data => {
        console.log(data)
        let binary = []
        for (let i = 0; i < 1024; i++) {
          binary = binary.concat(data[i].toString(2).padStart(8, '0').split('').reverse().map(e => parseInt(e)))
        }
        const pixels = new Array(32768)
        for (let i = 0; i < 8192; i++) {
          pixels[i * 4] = binary[i]
          pixels[i * 4 + 1] = binary[i]
          pixels[i * 4 + 2] = binary[i]
          pixels[i * 4 + 3] = binary[i] * 255
        }
        const imageData = new ImageData(new Uint8ClampedArray(pixels), 128, 64)
        ctx.putImageData(imageData, 0, 0)

        const unbindStop = this.flipper.emitter.on('stop screen streaming', () => {
          unbind()
          unbindStop()
        })
      })
    },

    async stopScreenStream () {
      await this.flipper.commands.gui.stopScreenStreamRequest()
      this.flags.screenStream = false
    }
  },

  mounted () {
    this.connect()

    navigator.serial.addEventListener('disconnect', async () => {
      await this.disconnect()
    })
  }
})
</script>
