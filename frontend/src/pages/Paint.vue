<template>
  <q-page class="column items-center full-width">
    <PixelEditor ref="editor"/>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import PixelEditor from 'src/components/PixelEditor.vue'
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
      componentName: 'Paint',

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
      await this.flipper.startRPCSession()
        .catch(error => {
          console.error(error)
          this.$emit('log', {
            level: 'error',
            message: `${this.componentName}: Error while starting RPC: ${error.toString()}`
          })
        })
      this.flags.rpcActive = true
      this.$emit('setRpcStatus', true)
      this.flags.rpcToggling = false
      this.$emit('log', {
        level: 'info',
        message: `${this.componentName}: RPC started`
      })
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.setReadingMode('text', 'promptBreak')
      this.flags.rpcActive = false
      this.$emit('setRpcStatus', false)
      this.flags.rpcToggling = false
      this.$emit('log', {
        level: 'info',
        message: `${this.componentName}: RPC stopped`
      })
    },

    async startVirtualDisplay () {
      await this.flipper.RPC('guiStartVirtualDisplay')
        .catch(error => {
          this.rpcErrorHandler(error, 'guiStartVirtualDisplay')
          this.$emit('showNotif', {
            message: 'Couldn\'t start virtual display session',
            color: 'negative'
          })
        })

      await this.enableBacklight()
      this.backlightInterval = setInterval(this.enableBacklight, 15000)

      if (this.autoStreaming.enabled) {
        this.autoStream()
      }
    },
    async stopVirtualDisplay () {
      await this.flipper.RPC('guiStopVirtualDisplay')
        .catch(error => this.rpcErrorHandler(error, 'guiStopVirtualDisplay'))
    },
    async enableBacklight () {
      await this.flipper.RPC('guiSendInputEvent', { key: 'OK', type: 'PRESS' })
        .catch(error => this.rpcErrorHandler(error, 'guiSendInputEvent'))
      await this.flipper.RPC('guiSendInputEvent', { key: 'OK', type: 'SHORT' })
        .catch(error => this.rpcErrorHandler(error, 'guiSendInputEvent'))
      await this.flipper.RPC('guiSendInputEvent', { key: 'OK', type: 'RELEASE' })
        .catch(error => this.rpcErrorHandler(error, 'guiSendInputEvent'))
    },
    async sendFrame () {
      const imageData = this.$refs.editor.pe.toImageData()
      const xbmBytes = imageDataToXBM(imageData)
      await this.flipper.RPC('guiScreenFrame', { data: new Uint8Array(xbmBytes) })
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
        message: `${this.componentName}: RPC error in command '${command}': ${error}`
      })
    },

    async start () {
      this.flags.rpcActive = this.rpcActive
      if (!this.rpcActive) {
        await this.startRpc()
      }
    }
  },

  async mounted () {
    if (this.connected && this.info !== null && this.info.doneReading) {
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
