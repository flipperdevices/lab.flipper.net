<template>
  <q-page class="flex-center column">
    <div class="flex-center column">
      <div v-show="flags.updateInProgress || (connected && info !== null && this.info.storage_databases_present && flags.rpcActive && info.hardware_name)" class="device-screen column">
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
            <p>
              <span>Radio stack:</span>
              <span>{{ radioStackType }}</span>
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
              <img v-if="flags.updateInProgress" src="../assets/flipper-screen-updating.png"/>
            </div>
          </div>
        </div>
        <Updater
          :flipper="flipper"
          :rpcActive="rpcActive"
          :info="info"
          :installFromFile="installFromFile"
          @update="onUpdateStage"
          @showNotif="passNotif"
          @log="passLog"
        />
      </div>
      <div
        v-if="!flags.updateInProgress && (!connected || info == null || !flags.rpcActive || flags.rpcToggling)"
        class="flex-center column q-my-xl"
      >
        <q-spinner
          color="primary"
          size="3em"
          class="q-mb-md"
        ></q-spinner>
        <p>Waiting for Flipper...</p>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import Updater from 'components/Updater.vue'
import asyncSleep from 'simple-async-sleep'

export default defineComponent({
  name: 'PageDevice',

  props: {
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean,
    info: Object,
    installFromFile: Boolean
  },

  components: {
    Updater
  },

  setup () {
    return {
      flags: ref({
        restarting: false,
        rpcActive: false,
        rpcToggling: false,
        screenStream: false,
        updateInProgress: false
      }),
      screenScale: ref(1),
      channels: ref({})
    }
  },

  computed: {
    radioStackType () {
      switch (parseInt(this.info.radio_stack_type)) {
        case 0x01:
          return 'full'
        case 0x02:
          return 'BLE_HCI'
        case 0x03:
          return 'light'
        case 0x04:
          return 'BLE_BEACON'
        case 0x05:
          return 'BLE_BASIC'
        case 0x06:
          return 'BLE_FULL_EXT_ADV'
        case 0x07:
          return 'BLE_HCI_EXT_ADV'
        case 0x10:
          return 'THREAD_FTD'
        case 0x11:
          return 'THREAD_MTD'
        case 0x30:
          return 'ZIGBEE_FFD'
        case 0x31:
          return 'ZIGBEE_RFD'
        case 0x40:
          return 'MAC'
        case 0x50:
          return 'BLE_THREAD_FTD_STATIC'
        case 0x51:
          return 'BLE_THREAD_FTD_DYAMIC'
        case 0x60:
          return '802154_LLD_TESTS'
        case 0x61:
          return '802154_PHY_VALID'
        case 0x62:
          return 'BLE_PHY_VALID'
        case 0x63:
          return 'BLE_LLD_TESTS'
        case 0x64:
          return 'BLE_RLV'
        case 0x65:
          return '802154_RLV'
        case 0x70:
          return 'BLE_ZIGBEE_FFD_STATIC'
        case 0x71:
          return 'BLE_ZIGBEE_RFD_STATIC'
        case 0x78:
          return 'BLE_ZIGBEE_FFD_DYNAMIC'
        case 0x79:
          return 'BLE_ZIGBEE_RFD_DYNAMIC'
        case 0x80:
          return 'RLV'
        case 0x90:
          return 'BLE_MAC_STATIC'
        default:
          return this.info.radio_stack_type
      }
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
        this.$emit('showNotif', {
          message: 'Unable to start RPC session. Reload the page or reconnect Flipper manually.',
          color: 'negative',
          reloadBtn: true
        })
        this.$emit('log', {
          level: 'error',
          message: 'Device: Couldn\'t start rpc session'
        })
        throw new Error('Couldn\'t start rpc session')
      }
      this.flags.rpcActive = true
      this.flags.rpcToggling = false
      this.$emit('setRpcStatus', true)
      this.$emit('log', {
        level: 'info',
        message: 'Device: RPC started'
      })
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.commands.stopRpcSession()
      this.flags.rpcActive = false
      this.flags.rpcToggling = false
      this.$emit('setRpcStatus', false)
      this.$emit('log', {
        level: 'info',
        message: 'Device: RPC stopped'
      })
    },

    async restartRpc (force) {
      if ((this.connected && this.flags.rpcActive && !this.flags.restarting) || force) {
        this.flags.restarting = true
        await this.flipper.closeReader()
        await asyncSleep(300)
        await this.flipper.disconnect()
        await asyncSleep(300)
        await this.flipper.connect()
        await this.startRpc()
        this.$emit('log', {
          level: 'info',
          message: 'Device: Restarted RPC'
        })
        return this.startScreenStream()
      }
    },

    async startScreenStream () {
      await this.flipper.commands.gui.startScreenStreamRequest()
        .catch(error => this.rpcErrorHandler(error, 'gui.startScreenStreamRequest'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: 'Device: gui.startScreenStreamRequest: OK'
          })
        })
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

      this.unbindRestart = this.flipper.emitter.on('restart session', () => {
        this.flags.screenStream = false
        this.unbindRestart()
        return this.restartRpc()
      })
    },

    async stopScreenStream () {
      await this.flipper.commands.gui.stopScreenStreamRequest()
        .catch(error => this.rpcErrorHandler(error, 'gui.stopScreenStreamRequest'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: 'Device: gui.stopScreenStreamRequest: OK'
          })
        })
      this.flags.screenStream = false
    },

    onUpdateStage (stage) {
      this.$emit(stage)
      if (stage === 'start') {
        this.flags.updateInProgress = true
        this.stopScreenStream()
      } else if (stage === 'end') {
        this.flags.updateInProgress = false
        this.startScreenStream()
      }
    },

    passNotif (config) {
      this.$emit('showNotif', config)
    },
    passLog (config) {
      this.$emit('log', config)
    },

    rpcErrorHandler (error, command) {
      error = error.toString()
      this.$emit('showNotif', {
        message: `RPC error in command '${command}': ${error}`,
        color: 'negative'
      })
      this.$emit('log', {
        level: 'error',
        message: `Device: RPC error in command '${command}': ${error}`
      })
    },

    async start () {
      this.flags.rpcActive = this.rpcActive
      if (!this.rpcActive) {
        setTimeout(() => {
          if (!this.rpcActive) {
            return this.restartRpc(true)
          }
        }, 1000)
        await this.startRpc()
      }
      if (!this.flags.screenStream) {
        await this.startScreenStream()
      }
    }
  },

  async mounted () {
    if (this.connected && this.info !== null && this.info.storage_databases_present) {
      await this.start()
    }
    navigator.serial.addEventListener('disconnect', e => {
      this.flags.rpcActive = false
      this.flags.rpcToggling = false
      this.$emit('setRpcStatus', false)
      this.flags.screenStream = false
    })
  },

  async beforeUnmount () {
    this.unbindRestart()
    await this.stopScreenStream()
    await asyncSleep(3000)
  }
})
</script>
