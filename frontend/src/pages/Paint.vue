<template>
  <q-page class="column items-center q-pa-md">
    <div
      v-if="!connected || !flags.rpcActive || flags.rpcToggling"
      class="column flex-center q-my-xl"
    >
      <q-spinner
        color="primary"
        size="3em"
        class="q-mb-md"
      ></q-spinner>
      <p>Waiting for Flipper...</p>
    </div>
    <div v-if="connected && flags.rpcActive" id="paint-wrapper" class="fit flex justify-center items-center bg-white">
      <div class="flex column full-width items-center">
        <div class="flex column q-mb-md">
          <div class="flex flex-center q-ma-sm">
            <q-toggle
              v-model="autoStreaming.enabled"
              label="Auto-streaming"
              class="q-mr-md"
              @click="toggleAutoStreaming"
            ></q-toggle>
            <q-btn
              v-if="!autoStreaming.enabled"
              @click="sendFrame"
            >Send frame</q-btn>
            <q-input
              v-else
              v-model="autoStreaming.delay"
              label="Delay, ms"
              dense
              class="inline-block"
              style="width: 50px;"
            />
          </div>

          <div>
            <input type="file" id="file-upload" @change="upload" class="hidden"/>
            <q-btn
              @click="triggerUpload"
              icon="mdi-file-image-outline"
            ></q-btn>

            <q-btn-group
              class="q-ma-sm"
            >
              <q-btn
                :disabled="this.saveState.length < 2"
                icon="undo"
                @click="undo"
              ></q-btn>
              <q-btn
                :disabled="this.restoreState.length === 0"
                icon="redo"
                @click="redo"
              ></q-btn>
              <q-btn
                icon="delete_outline"
                @click="clear"
              ></q-btn>
            </q-btn-group>

            <q-btn-toggle
              v-model="tool"
              @click="toggleTool"
              toggle-color="primary"
              :options="[
                {value: 'pencil', slot: 'pencil'},
                {value: 'eraser', slot: 'eraser'}
              ]"
            >
              <template v-slot:pencil>
                <q-icon name="edit" />
              </template>

              <template v-slot:eraser>
                <q-icon name="mdi-eraser" />
              </template>
            </q-btn-toggle>

            <q-btn-toggle
              v-model="scaling"
              toggle-color="primary"
              :options="[
                {label: '1x', value: 1},
                {label: '2x', value: 2},
                {label: '4x', value: 4}
              ]"
              class="q-ma-sm"
            />
          </div>

          <div>
            <q-item>
              <q-item-section side>
                <q-icon name="mdi-pencil-minus" />
              </q-item-section>
              <q-item-section>
                <q-slider
                  v-model="ctx.lineWidth"
                  :min="1"
                  :max="10"
                  :step="1"
                  label
                  label-always
                  class="q-mt-lg"
                />
              </q-item-section>
              <q-item-section side>
                <q-icon name="mdi-pencil-plus" />
              </q-item-section>
              <q-checkbox v-model="flags.pixelGrid" class="q-ml-md" label="Pixel grid" />
            </q-item>
          </div>
        </div>

        <div
          class="canvas-container"
          :style="'transform: scale(' + scaling + '); top:' + (scaling - 1) * 64 + 'px;'"
        >
          <div
            v-if="flags.pixelGrid"
            class="pixel-grid"
            @mousedown="mouseDown"
            @mouseup="mouseUp"
            @mousemove="mouseMove"
          ></div>
          <canvas
            width="256"
            height="128"
            ref="mainCanvas"
            @mousedown="mouseDown"
            @mouseup="mouseUp"
            @mousemove="mouseMove"
          ></canvas>
        </div>
      </div>

      <canvas
        class="hidden"
        width="128"
        height="64"
        ref="resizeCanvas"
      ></canvas>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import asyncSleep from 'simple-async-sleep'
import { xbmValues } from '../util/xbm-values'

export default defineComponent({
  name: 'Paint',

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
        painting: false,
        pixelGrid: false
      }),
      ctx: ref({
        lineWidth: 1
      }),
      tool: ref('pencil'),
      saveState: ref([]),
      restoreState: ref([]),
      autoStreaming: ref({
        enabled: false,
        interval: undefined,
        delay: 500
      }),
      backlightInterval: ref(undefined),
      file: ref(undefined),
      scaling: ref(1)
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
    },
    async stopSession () {
      await this.flipper.commands.gui.stopVirtualDisplay()
        .catch(error => this.rpcErrorHandler(error, 'gui.stopVirtualDisplay'))
    },
    async sendFrame () {
      const resized = this.resize()
      const filtered = this.filter('monochrome', resized)
      const data = filtered.data

      let pixel = 0
      let atualRow = 1
      const xbmBytes = []
      for (let c = 0; c < 64; c++) {
        for (let c2 = 0; c2 < 128 / 8; c2++) {
          const hexBits = []
          for (let c3 = 0; c3 < 8; c3++) {
            const pixelIsBlack = !(data[pixel * 4])
            if (pixelIsBlack) { hexBits.push(c3) }
            pixel++
            const isNewRow = pixel / (128 * atualRow) === 1
            if (isNewRow) {
              atualRow++
              break
            }
          }
          for (let c4 = 0; c4 < 256; c4++) {
            if (JSON.stringify(xbmValues[String(c4)]) === JSON.stringify(hexBits)) {
              xbmBytes.push(c4)
            }
          }
        }
      }

      this.flipper.commands.gui.screenFrame(new Uint8Array(xbmBytes))
        .catch(error => this.rpcErrorHandler(error, 'gui.screenFrame'))
    },
    toggleAutoStreaming () {
      if (this.autoStreaming.enabled) {
        if (this.autoStreaming.interval) {
          clearInterval(this.autoStreaming.interval)
        }
        this.autoStreaming.interval = setInterval(this.sendFrame, this.autoStreaming.delay)
      } else {
        clearInterval(this.autoStreaming.interval)
      }
    },
    async enableBacklight () {
      await this.flipper.commands.gui.sendInputEvent(4, 0)
        .catch(error => this.rpcErrorHandler(error, 'gui.sendInputEvent'))
      await this.flipper.commands.gui.sendInputEvent(4, 2)
        .catch(error => this.rpcErrorHandler(error, 'gui.sendInputEvent'))
      await this.flipper.commands.gui.sendInputEvent(4, 1)
        .catch(error => this.rpcErrorHandler(error, 'gui.sendInputEvent'))
    },

    clear () {
      this.save()
      this.ctx.clearRect(0, 0, this.$refs.mainCanvas.width, this.$refs.mainCanvas.height)
      this.ctx.fillRect(0, 0, 256, 128)
    },
    save () {
      const imageData = this.filter('orange')
      this.ctx.putImageData(imageData, 0, 0)
      this.saveState.push(this.ctx.getImageData(0, 0, 256, 128))
      if (this.restoreState.length > 0) {
        this.restoreState = []
      }
      if (this.saveState.length === 30) {
        this.saveState.shift()
      }
    },
    undo () {
      this.restoreState.push(this.saveState.pop())
      if (this.restoreState.length === 30) {
        this.restoreState.shift()
      }
      this.ctx.putImageData(this.saveState[this.saveState.length - 1], 0, 0)
    },
    redo () {
      this.saveState.push(this.restoreState.pop())
      if (this.saveState.length === 30) {
        this.saveState.shift()
      }
      this.ctx.putImageData(this.saveState[this.saveState.length - 1], 0, 0)
    },
    triggerUpload () {
      document.getElementById('file-upload').click()
    },
    upload (event) {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.readAsDataURL(file)

        const img = new Image()
        reader.onload = event => {
          if (event.target.readyState !== FileReader.DONE) {
            return
          }
          img.onload = () => {
            this.ctx.drawImage(img, 0, 0, 256, 128)
            this.save()
          }
          img.src = event.target.result
        }
      }
    },

    mouseDown (e) {
      this.flags.painting = true
      this.ctx.beginPath()
    },
    mouseUp (e) {
      this.stroke(e)
      this.flags.painting = false
      this.save()
    },
    mouseMove (e) {
      if (this.flags.painting) {
        this.stroke(e)
        this.ctx.beginPath()
        this.ctx.moveTo(e.offsetX + e.offsetX % 2 - 1, e.offsetY + e.offsetY % 2 - 1)
      }
    },
    stroke (e) {
      this.ctx.lineTo(e.offsetX + e.offsetX % 2 - 1, e.offsetY + e.offsetY % 2 - 1)
      this.ctx.stroke()
    },
    filter (type, imageData) {
      if (!imageData) {
        imageData = this.ctx.getImageData(0, 0, 256, 128)
      }
      const data = imageData.data
      const pixelsLength = imageData.width * imageData.height
      for (let pixel = 0; pixel < pixelsLength; pixel++) {
        const pixelRed = data[pixel * 4]
        const pixelGreen = data[pixel * 4 + 1]
        const pixelBlue = data[pixel * 4 + 2]
        const pixelAlpha = data[pixel * 4 + 3]
        if (!pixelAlpha) {
          data[pixel * 4] = 255
          data[pixel * 4 + 1] = 255
          data[pixel * 4 + 2] = 255
          data[pixel * 4 + 3] = 1
        } else {
          const allThem = (pixelRed + pixelGreen + pixelBlue) / 3
          if (allThem <= 128) {
            data[pixel * 4] = 0
            data[pixel * 4 + 1] = 0
            data[pixel * 4 + 2] = 0
          } else {
            if (type === 'orange') {
              data[pixel * 4] = 254
              data[pixel * 4 + 1] = 138
              data[pixel * 4 + 2] = 44
            } else if (type === 'monochrome') {
              data[pixel * 4] = 255
              data[pixel * 4 + 1] = 255
              data[pixel * 4 + 2] = 255
            }
          }
        }
      }
      return imageData
    },
    resize () {
      const resizeCtx = this.$refs.resizeCanvas.getContext('2d')
      resizeCtx.scale(0.5, 0.5)
      resizeCtx.drawImage(this.$refs.mainCanvas, 0, 0)
      const resized = resizeCtx.getImageData(0, 0, 128, 64)
      resizeCtx.scale(2, 2)
      resizeCtx.fillStyle = '#ffff'
      resizeCtx.fillRect(0, 0, 128, 64)
      return resized
    },
    toggleTool () {
      this.ctx.strokeStyle = this.tool === 'pencil' ? 'black' : '#fe8a2c'
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

    this.ctx = this.$refs.mainCanvas.getContext('2d')
    this.ctx.lineWidth = 1
    this.ctx.lineCap = 'square'
    this.ctx.strokeStyle = 'black'
    this.ctx.imageSmoothingEnabled = false
    this.ctx.globalCompositeOperation = 'new content'

    this.ctx.fillStyle = '#fe8a2c'
    this.ctx.fillRect(0, 0, 256, 128)
    this.save()
  },

  beforeUnmount () {
    if (this.autoStreaming.interval) {
      clearInterval(this.autoStreaming.interval)
    }
    clearInterval(this.backlightInterval)
    this.stopSession()
  }
})
</script>

<style lang="scss" scoped>
#paint-wrapper {
  border-radius: 10px;
}
canvas {
  image-rendering: pixelated;
}
.canvas-container {
  width: 258px;
  height: 130px;
  position: relative;
  border: 1px transparent solid;
}
.pixel-grid {
  position: absolute;
  width: 256px;
  height: 128px;
  background-size: 4px 4px;
  background-position: 0px 0px;
  background-image: repeating-conic-gradient( #fff0 0deg 90deg, #00000017 0 180deg);
}
</style>
