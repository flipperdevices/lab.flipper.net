<template>
  <q-page class="flex flex-center column">
    <div class="flex flex-center column">
      <div>
        <q-btn
          @click="flags.rpcActive ? stopRpc() : startRpc()"
          :loading="flags.rpcToggling"
          :color="flags.rpcActive ? 'negative' : 'positive'"
          class="q-ma-sm"
        >
          {{ flags.rpcActive ? 'Stop rpc' : 'Start rpc' }}
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
        <q-btn
          @click="list('/ext')"
          class="q-ma-sm"
        >
          List /ext
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

    <canvas
      v-show="flags.screenStream"
      width="128"
      height="64"
      style="transform: scale(4);image-rendering: pixelated;position: relative;top: 128px;"
      ref="screenStreamCanvas"
    ></canvas>

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
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'PageDevice',

  props: {
    flipper: Object
  },

  setup () {
    return {
      info: ref({}),
      textInfo: ref(''),
      flags: ref({
        rpcActive: false,
        rpcToggling: false,
        screenStream: false
      })
    }
  },

  methods: {
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
      await this.flipper.commands.gui.startScreenStreamRequest()
      this.flags.screenStream = true

      const ctx = this.$refs.screenStreamCanvas.getContext('2d')
      ctx.lineWidth = 1
      ctx.lineCap = 'square'
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = 'orange'
      ctx.fillRect(0, 0, 128, 64)
      ctx.fillStyle = 'black'

      const unbind = this.flipper.emitter.on('screen frame', data => {
        for (let x = 0; x < 128; x++) {
          for (let y = 0; y < 64; y++) {
            const i = Math.floor(y / 8) * 128 + x
            const z = y & 7
            if (data.at(i) & (1 << z)) {
              ctx.fillStyle = 'black'
              ctx.fillRect(x, y, 1, 1)
            } else {
              ctx.fillStyle = 'orange'
              ctx.fillRect(x, y, 1, 1)
            }
          }
        }

        const unbindStop = this.flipper.emitter.on('stop screen streaming', () => {
          unbind()
          unbindStop()
        })
      })
    },

    async stopScreenStream () {
      await this.flipper.commands.gui.stopScreenStreamRequest()
      this.flags.screenStream = false
    },

    async list (path) {
      const res = await this.flipper.commands.storage.list(path)
      console.log(res)
    }
  },

  mounted () {
    this.startRpc()
  }
})
</script>
