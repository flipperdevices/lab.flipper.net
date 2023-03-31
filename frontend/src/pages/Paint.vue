<template>
  <q-page class="column items-center full-width">
    <PixelEditor ref="editor" />
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import PixelEditor from 'src/components/PixelEditor.vue'
import asyncSleep from 'simple-async-sleep'
import { imageDataToXBM } from '../util/pixeleditor/xbm'

export default defineComponent({
  name: 'Paint',

  props: {
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean,
    info: Object
  },

  components: {
    PixelEditor
  },

  setup () {
    return {
      flags: ref({
        restarting: false,
        rpcActive: false,
        rpcToggling: false,
        pixelGrid: false
      }),
      autoStreaming: ref({
        enabled: true,
        interval: null,
        delay: 500
      }),
      backlightInterval: null
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
        message: 'Paint: RPC started'
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
        message: 'Paint: RPC stopped'
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
      }
    },

    async startVirtualDisplay () {
      const response = await this.flipper.commands.gui.startVirtualDisplay()
        .catch(error => this.rpcErrorHandler(error, 'gui.startVirtualDisplay'))
      if (!response.resolved || response.error) {
        this.$emit('showNotif', {
          message: 'Couldn\'t start virtual display session: ' + response.error,
          color: 'negative'
        })
        this.$emit('log', {
          level: 'error',
          message: 'Paint: Couldn\'t start virtual display session: ' + response.error
        })
      }

      await this.enableBacklight()
      this.backlightInterval = setInterval(this.enableBacklight, 15000)

      if (this.autoStreaming.enabled) {
        this.autoStream()
      }
    },
    async stopVirtualDisplay () {
      await this.flipper.commands.gui.stopVirtualDisplay()
        .catch(error => this.rpcErrorHandler(error, 'gui.stopVirtualDisplay'))
    },
    async enableBacklight () {
      await this.flipper.commands.gui.sendInputEvent(4, 0)
        .catch(error => this.rpcErrorHandler(error, 'gui.sendInputEvent'))
      await this.flipper.commands.gui.sendInputEvent(4, 2)
        .catch(error => this.rpcErrorHandler(error, 'gui.sendInputEvent'))
      await this.flipper.commands.gui.sendInputEvent(4, 1)
        .catch(error => this.rpcErrorHandler(error, 'gui.sendInputEvent'))
    },
    async sendFrame () {
      const imageData = this.$refs.editor.pe.toImageData()
      const xbmBytes = imageDataToXBM(imageData)
      this.flipper.commands.gui.screenFrame(new Uint8Array(xbmBytes))
        .catch(error => this.rpcErrorHandler(error, 'gui.screenFrame'))
    },
    autoStream () {
      if (this.autoStreaming.enabled) {
        if (this.autoStreaming.interval) {
          clearInterval(this.autoStreaming.interval)
        }
        this.autoStreaming.interval = setInterval(this.sendFrame, this.autoStreaming.delay)
      } else {
        clearInterval(this.autoStreaming.interval)
      }
    },

    rpcErrorHandler (error, command) {
      error = error.toString()
      this.$emit('showNotif', {
        message: `RPC error in command '${command}': ${error}`,
        color: 'negative'
      })
      this.$emit('log', {
        level: 'error',
        message: `Paint: RPC error in command '${command}': ${error}`
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
    }
  },

  async mounted () {
    if (this.connected && this.info !== null && this.info.storage_databases_present) {
      await this.start()
    }

    this.startVirtualDisplay()
  },

  beforeUnmount () {
    if (this.autoStreaming.interval) {
      clearInterval(this.autoStreaming.interval)
    }
    clearInterval(this.backlightInterval)
    this.stopVirtualDisplay()
  }
})
</script>
