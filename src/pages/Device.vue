<template>
  <q-page class="flex-center column">
    <div class="flex-center column">
      <div
        v-if="!connected || info == null || !flags.rpcActive || flags.rpcToggling"
        class="flex-center column q-my-xl"
      >
        <q-spinner
          color="primary"
          size="3em"
          class="q-mb-md"
        ></q-spinner>
        <p>Waiting for Flipper...</p>
      </div>
      <div v-show="connected && info !== null && this.info.storage_databases_present && flags.rpcActive && info.hardware_name" class="device-screen column">
        <div class="flex">
          <div class="info">
            <p>
              <span>Firmware:</span>
              <span>{{ info.firmware_version !== 'unknown' ? info.firmware_version : info.firmware_commit }}</span>
            </p>
            <p>
              <span>Build date:</span>
              <span>{{ info.firmware_build_date }}</span>
            </p>
            <p>
              <span>SD card:</span>
              <span>{{ info.storage_sdcard_present }}</span>
            </p>
            <p>
              <span>Databases:</span>
              <span>{{ info.storage_databases_present }}</span>
            </p>
            <p>
              <span>Hardware:</span>
              <span>{{ info.hardware_ver + '.F' + info.hardware_target + 'B' + info.hardware_body + 'C' + info.hardware_connect }}</span>
            </p>
            <p>
              <span>Radio FW:</span>
              <span>{{ info.radio_alive !== false ? info.radio_stack_major + '.' + info.radio_stack_minor + '.' + info.radio_stack_sub : 'corrupt' }}</span>
            </p>
          </div>
          <div class="column items-center">
            <h5>{{ info.hardware_name }}</h5>
            <div
              class="flipper"
              :class="info.hardware_color === '1' ? 'body-black' : 'body-white'"
            >
              <canvas
                v-show="flags.screenStream"
                :width="128 * screenScale"
                :height="64 * screenScale"
                style="image-rendering: pixelated;"
                ref="screenStreamCanvas"
              ></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import asyncSleep from 'simple-async-sleep'

export default defineComponent({
  name: 'PageDevice',

  props: {
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean,
    info: Object
  },

  setup () {
    return {
      flags: ref({
        restarting: false,
        rpcActive: false,
        rpcToggling: false,
        screenStream: false
      }),
      screenScale: ref(1)
    }
  },

  watch: {
    async info (newInfo, oldInfo) {
      if (newInfo !== null && newInfo.storage_databases_present && this.connected) {
        await this.start()
      }
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
      this.$emit('setRpcStatus', true)
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.commands.stopRpcSession()
      this.flags.rpcActive = false
      this.flags.rpcToggling = false
      this.$emit('setRpcStatus', false)
    },

    async restartRpc () {
      if (this.connected && this.rpcActive && !this.flags.restarting) {
        this.flags.restarting = true
        await this.flipper.closeReader()
        await asyncSleep(300)
        await this.flipper.disconnect()
        await asyncSleep(300)
        await this.flipper.connect()
        await this.startRpc()
        await this.readInfo()
        return this.startScreenStream()
      }
    },

    async startScreenStream () {
      await this.flipper.commands.gui.startScreenStreamRequest()
      this.flags.screenStream = true

      const ctx = this.$refs.screenStreamCanvas.getContext('2d')
      ctx.lineWidth = 1
      ctx.lineCap = 'square'
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = '#fe8a2b'
      ctx.fillRect(0, 0, 128 * this.screenScale, 64 * this.screenScale)
      ctx.fillStyle = 'black'

      const unbind = this.flipper.emitter.on('screen frame', data => {
        for (let x = 0; x < 128; x++) {
          for (let y = 0; y < 64; y++) {
            const i = Math.floor(y / 8) * 128 + x
            const z = y & 7
            if (data.at(i) & (1 << z)) {
              ctx.fillStyle = 'black'
              ctx.fillRect(x * this.screenScale, y * this.screenScale, 1 * this.screenScale, 1 * this.screenScale)
            } else {
              ctx.fillStyle = '#fe8a2b'
              ctx.fillRect(x * this.screenScale, y * this.screenScale, 1 * this.screenScale, 1 * this.screenScale)
            }
          }
        }

        const unbindStop = this.flipper.emitter.on('stop screen streaming', () => {
          this.flags.screenStream = false
          unbind()
          unbindStop()
        })
      })

      const unbindRestart = this.flipper.emitter.on('restart session', () => {
        this.flags.screenStream = false
        unbindRestart()
        return this.restartRpc()
      })
    },

    async stopScreenStream () {
      await this.flipper.commands.gui.stopScreenStreamRequest()
      this.flags.screenStream = false
    },

    async start () {
      this.flags.rpcActive = this.rpcActive
      if (!this.rpcActive) {
        await this.startRpc()
      }
      await this.startScreenStream()
    }
  },

  async mounted () {
    if (this.connected && this.info !== null && this.info.storage_databases_present) {
      await this.start()
    }
  }
})
</script>
